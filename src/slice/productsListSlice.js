import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

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

// 篩選函數
const filterProductsByCategories = (products, filters) => {
  // 沒有篩選條件，返回所有產品
  if (Object.keys(filters).length === 0) {
    return products;
  }

  const filteredProducts = products.filter((product) =>
    Object.entries(filters).every(([category, selectedLabels]) => {
      const isSelectAll = selectedLabels.includes("全部");

      // 特殊處理狀態篩選
      if (category === "狀態") {
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
  async (categoryParams, { rejectWithValue }) => {
    try {
      const baseUrl = 'http://localhost:3000/products';
      const params = new URLSearchParams();
      
      // 定義類別對應表
      const categoryMappings = {
        'women': {
          'top': '上衣',
          'jacket': '外套',
          'dress': '洋裝',
          'pants': '褲子',
          'skirts': '裙子',
          'accessories': '服飾配件'
        },
        'men': {
          'top': '上衣',
          'jacket': '外套',
          'pants': '褲子',
          'accessories': '服飾配件'
        }
      };
      
      // 如果有傳入分類參數
      if (categoryParams) {
        // 檢查是否是複合路徑 (例如: men/top)
        if (categoryParams.includes('/')) {
          const [genderType, productType] = categoryParams.split('/');
          // 將 men/women 轉換為對應的 "男裝"/"女裝"
          const classValue = genderType === 'men' ? '男裝' : genderType === 'women' ? '女裝' : genderType;
          params.append('class', classValue);
          
          // 如果存在對應的 category 映射，則使用映射值
          if (categoryMappings[genderType] && categoryMappings[genderType][productType]) {
            params.append('category', categoryMappings[genderType][productType]);
          } else {
            params.append('category', productType);
          }
        } 
        // 檢查是否為主分類 (men 或 women)
        else if (categoryParams === 'men' || categoryParams === 'women') {
          // 將 men/women 轉換為對應的 "男裝"/"女裝"
          const classValue = categoryParams === 'men' ? '男裝' : '女裝';
          params.append('class', classValue);
        } 
        // 否則當作商品分類處理，但需要檢查是否為已知的 slug
        else {
          // 嘗試在男裝和女裝中查找匹配的 slug
          let found = false;
          for (const gender in categoryMappings) {
            if (categoryMappings[gender][categoryParams]) {
              params.append('category', categoryMappings[gender][categoryParams]);
              found = true;
              break;
            }
          }
          
          // 如果沒有找到對應的映射，則直接使用原始參數
          if (!found) {
            params.append('category', categoryParams);
          }
        }
      }
      
      // 構建完整 URL
      const apiUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      
      
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "取得產品失敗";
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