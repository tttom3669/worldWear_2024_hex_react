import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 狀態優先級映射
const STATUS_PRIORITY = {
  現貨: 3,
  預購: 2,
  補貨中: 1,
};

// 通用的狀態優先排序比較器
const compareByStatusPriority = (a, b) => {
  const priorityA = STATUS_PRIORITY[a.status] || 0;
  const priorityB = STATUS_PRIORITY[b.status] || 0;
  return priorityB - priorityA;
};

// 排序策略集合
const createSortingStrategies = () => ({
  最新上架: (items) =>
    [...items].sort((a, b) => {
      const statusCompare = compareByStatusPriority(a, b);
      if (statusCompare !== 0) return statusCompare;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }),
  熱門商品: (items) =>
    [...items].sort((a, b) => {
      const statusCompare = compareByStatusPriority(a, b);
      if (statusCompare !== 0) return statusCompare;
      return (b.is_hot || 0) - (a.is_hot || 0);
    }),
  價格由低至高: (items) =>
    [...items].sort((a, b) => {
      const statusCompare = compareByStatusPriority(a, b);
      if (statusCompare !== 0) return statusCompare;
      return a.price - b.price;
    }),
  價格由高至低: (items) =>
    [...items].sort((a, b) => {
      const statusCompare = compareByStatusPriority(a, b);
      if (statusCompare !== 0) return statusCompare;
      return b.price - a.price;
    }),
});

// 篩選函數 - 修正過濾邏輯
const filterProductsByCategories = (products, filters) => {
  // 沒有篩選條件，返回所有產品
  if (Object.keys(filters).length === 0) {
    return products;
  }

  const filteredProducts = products.filter((product) =>
    Object.entries(filters).every(([category, selectedLabels]) => {
      const isSelectAll = selectedLabels.includes("全部");

      // 特殊處理狀態篩選 - 修正為使用 productStatus
      if (category === "productStatus") {
        return isSelectAll || selectedLabels.includes(product.status);
      }

      // 動態處理類別篩選
      const uniqueCategories = new Set(products.map((p) => p.category));
      if (uniqueCategories.has(category)) {
        return (
          isSelectAll ||
          (product.category === category &&
            (isSelectAll || selectedLabels.includes(product.categoryItems)))
        );
      }

      return true;
    })
  );

  // 篩選結果為空，返回所有商品
  return filteredProducts.length > 0 ? filteredProducts : products;
};

// 排序函數
const sortProductsBy = (products, sortOption) => {
  const SORTING_STRATEGIES = createSortingStrategies();
  const defaultSort = (items) => [...items].sort(compareByStatusPriority);

  // 使用對應的排序策略，默認返回狀態排序
  const sorter = SORTING_STRATEGIES[sortOption] || defaultSort;
  return sorter(products);
};

// 異步獲取產品 Thunk
export const fetchProducts = createAsyncThunk(
  "productsList/fetchProducts",
  async (categoryParams, { rejectWithValue, getState }) => {
    try {
      const params = new URLSearchParams();
      
      // 如果有傳入分類參數
      if (categoryParams) {
        console.log('傳入的分類參數:', categoryParams); // 輸出除錯用
        
        // 從 Redux 狀態中獲取分類數據
        const productCategories = getState().products.productCategories;
        
        // 處理包含子類別的三層結構路徑 (如: women/top/shirt)
        if (categoryParams.split('/').length === 3) {
          const [genderType, categoryType, subCategoryType] = categoryParams.split('/');
          
          // 設定性別 class (男裝/女裝)
          const classValue = genderType === 'men' ? '男裝' : '女裝';
          params.append('class', classValue);
          
          // 找到對應的產品類別
          const genderCategory = productCategories.find(cat => cat.slug === genderType);
          if (genderCategory) {
            // 找到主類別
            const mainCategory = genderCategory.categories.find(cat => cat.slug === categoryType);
            if (mainCategory) {
              // 設定主類別
              params.append('category', mainCategory.title);
              
              // 找到子類別
              const subCategory = mainCategory.subCategories.find(sub => sub.slug === subCategoryType);
              if (subCategory) {
                // 設定子類別
                params.append('categoryItems', subCategory.title);
              }
            }
          }
        }
        // 處理包含主類別的兩層結構 (如: women/top)
        else if (categoryParams.includes('/')) {
          const [genderType, categoryType] = categoryParams.split('/');
          
          // 設定性別 class (男裝/女裝)
          const classValue = genderType === 'men' ? '男裝' : '女裝';
          params.append('class', classValue);
          
          // 找到對應的產品類別
          const genderCategory = productCategories.find(cat => cat.slug === genderType);
          if (genderCategory) {
            // 找到主類別
            const mainCategory = genderCategory.categories.find(cat => cat.slug === categoryType);
            if (mainCategory) {
              // 設定主類別
              params.append('category', mainCategory.title);
            }
          }
        } 
        // 檢查是否為主分類 (men 或 women)
        else if (categoryParams === 'men' || categoryParams === 'women') {
          // 將 men/women 轉換為對應的 "男裝"/"女裝"
          const classValue = categoryParams === 'men' ? '男裝' : '女裝';
          params.append('class', classValue);
        }
      }
      
      // 構建完整 URL，使用環境變數
      const apiUrl = params.toString() ? `${API_PATH}/products?${params.toString()}` : `${API_PATH}/products`;
      console.log('API 請求 URL:', apiUrl); // 輸出除錯用
      
      const { data } = await axios.get(apiUrl);
      return data;
    } catch (error) {
      // 改進錯誤處理: 提供更詳細的錯誤信息
      const errorMsg = error.response?.data?.message || 
                        error.message || 
                        "取得產品失敗";
      console.error('取得產品錯誤:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// 初始狀態
const initialState = {
  items: [], // 原始產品列表
  filteredItems: [], // 篩選後的產品列表
  status: "idle", // 請求狀態
  error: null, // 錯誤信息
  sortOption: "最新上架", // 默認排序方式
  currentPage: 1, // 當前頁碼
  filters: {}, // 篩選條件
  currentCategory: null, // 當前分類
};

// 創建產品列表 Slice
const productsListSlice = createSlice({
  name: "productsList",
  initialState,
  reducers: {
    // 設置當前分類
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
      // 清空之前的商品列表，避免顯示上一次的資料
      state.items = [];
      state.filteredItems = [];
      state.status = "idle";
    },
    
    // 排序 Action
    sortProducts: (state, action) => {
      state.sortOption = action.payload;
      state.currentPage = 1;

      const filteredProducts = filterProductsByCategories(
        state.items,
        state.filters
      );
      state.filteredItems = sortProductsBy(filteredProducts, action.payload);
    },

    // 篩選 Action
    filterProducts: (state, action) => {
      state.filters = action.payload;
      state.currentPage = 1;

      const filteredProducts = filterProductsByCategories(
        state.items,
        action.payload
      );
      state.filteredItems = sortProductsBy(filteredProducts, state.sortOption);
    },

    // 重置篩選條件
    resetFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
      state.filteredItems = sortProductsBy([...state.items], state.sortOption);
    },

    // 設置當前頁碼
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    // 切換收藏狀態
    toggleFavorite: (state, action) => {
      const productId = action.payload;
      const updateFavoriteStatus = (items) => {
        const itemIndex = items.findIndex((item) => item.id === productId);
        if (itemIndex !== -1) {
          items[itemIndex].isFavorite = !items[itemIndex].isFavorite;
        }
      };

      updateFavoriteStatus(state.items);
      updateFavoriteStatus(state.filteredItems);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        // 重置錯誤信息
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        // 為每個產品添加收藏屬性
        state.items = action.payload.map((product) => ({
          ...product,
          isFavorite: false,
        }));
        // 初始化篩選列表，按默認排序方式排序
        state.filteredItems = sortProductsBy(
          [...state.items],
          state.sortOption
        );
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "發生未知錯誤";
        // 確保在錯誤情況下仍有有效的初始狀態
        if (!state.items.length) {
          state.items = [];
          state.filteredItems = [];
        }
      });
  },
});

// 導出 actions 和 reducer
export const {
  sortProducts,
  filterProducts,
  setCurrentPage,
  toggleFavorite,
  resetFilters,
  setCurrentCategory,
} = productsListSlice.actions;

export default productsListSlice.reducer;