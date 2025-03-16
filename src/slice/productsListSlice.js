import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 狀態優先級映射
const STATUS_PRIORITY = {
  現貨: 3,
  預購: 2,
  補貨中: 1,
};

// slug 到資料庫值的映射
const STATUS_SLUG_TO_DB = {
  "in-stock": "現貨",
  "pre-order": "預購",
  "restocking": "補貨中"
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

// 篩選函數 - 修正過濾邏輯，支援多選和 slug 轉換為資料庫值
const filterProductsByCategories = (products, filters) => {
  // 沒有篩選條件，返回所有產品
  if (Object.keys(filters).length === 0) {
    return products;
  }

  const filteredProducts = products.filter((product) =>
    Object.entries(filters).every(([category, selectedLabels]) => {
      const isSelectAll = selectedLabels.includes("全部");

      // 特殊處理狀態篩選 - 將 slug 轉換為資料庫值
      if (category === "productStatus") {
        // 如果選擇了「全部」或沒有選擇任何狀態，不進行過濾
        if (isSelectAll || selectedLabels.length === 0) {
          return true;
        }
        
        // 將 slug 轉換為資料庫值再進行比較
        const dbValues = selectedLabels.map(slug => STATUS_SLUG_TO_DB[slug] || slug);
        
        // 檢查產品狀態是否在所選狀態中
        return dbValues.includes(product.status);
      }

      // 處理類別篩選 - 檢查是否是類別篩選
      if (category === "categoryItems") {
        // 如果選擇了「全部」或沒有選擇任何類別項目，不進行過濾
        if (isSelectAll || selectedLabels.length === 0) {
          return true;
        }
        
        // 檢查產品的類別項目是否在所選類別項目中
        return selectedLabels.includes(product.categoryItems);
      }

      // 動態處理產品類別
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

  // 篩選結果為空，仍返回篩選後的結果
  return filteredProducts;
};

// 排序函數
const sortProductsBy = (products, sortOption) => {
  const SORTING_STRATEGIES = createSortingStrategies();
  const defaultSort = (items) => [...items].sort(compareByStatusPriority);

  // 使用對應的排序策略，默認返回狀態排序
  const sorter = SORTING_STRATEGIES[sortOption] || defaultSort;
  return sorter(products);
};

// 解析類別路徑，支持多選細項類別
const parseCategoryPath = (categoryPath, productCategories) => {
  if (!categoryPath || !categoryPath.includes('/')) {
    return null;
  }
  
  const pathParts = categoryPath.split('/');
  const params = new URLSearchParams();
  
  // 處理性別 (men/women)
  if (pathParts[0] === 'men' || pathParts[0] === 'women') {
    const genderType = pathParts[0];
    const classValue = genderType === 'men' ? '男裝' : '女裝';
    params.append('class', classValue);
    
    // 處理主類別
    if (pathParts.length >= 2) {
      const categoryType = pathParts[1];
      const genderCategory = productCategories.find(cat => cat.slug === genderType);
      
      if (genderCategory) {
        const mainCategory = genderCategory.categories.find(cat => cat.slug === categoryType);
        
        if (mainCategory) {
          params.append('category', mainCategory.title);
          
          // 處理子類別 (可能有多個，用逗號分隔)
          if (pathParts.length >= 3) {
            const subCategoryTypes = pathParts[2].split(',');
            
            // 如果只有一個子類別，直接添加
            if (subCategoryTypes.length === 1) {
              const subCategory = mainCategory.subCategories.find(
                sub => sub.slug === subCategoryTypes[0]
              );
              
              if (subCategory) {
                params.append('categoryItems', subCategory.title);
              }
            } 
            // 如果有多個子類別，將它們作為過濾條件添加
            else if (subCategoryTypes.length > 1) {
              // 找出所有子類別的標題
              const subCategoryTitles = subCategoryTypes
                .map(slug => {
                  const subCat = mainCategory.subCategories.find(sub => sub.slug === slug);
                  return subCat ? subCat.title : null;
                })
                .filter(title => title !== null);
              
              // 先添加主類別，稍後在請求處理中處理多個子類別
              if (subCategoryTitles.length > 0) {
                params.append('category', mainCategory.title);
                // 使用自定義參數傳遞多個子類別標題
                params.append('multiSubCategories', JSON.stringify(subCategoryTitles));
              }
            }
          }
        }
      }
    }
  }
  
  return params;
};

// 異步獲取產品 Thunk
export const fetchProducts = createAsyncThunk(
  "productsList/fetchProducts",
  async (categoryParams, { rejectWithValue, getState }) => {
    try {
      // 從 Redux 狀態中獲取分類數據
      const productCategories = getState().products.productCategories;
      let params = new URLSearchParams();
      
      // 如果有傳入分類參數
      if (categoryParams) {
        console.log('傳入的分類參數:', categoryParams); // 輸出除錯用
        
        // 處理包含子類別的路徑，包括多選的情況
        if (categoryParams.includes('/')) {
          const parsedParams = parseCategoryPath(categoryParams, productCategories);
          
          if (parsedParams) {
            params = parsedParams;
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
      
      // 發送請求獲取資料
      const { data } = await axios.get(apiUrl);
      
      // 如果有多個子類別，在前端進行過濾
      const multiSubCategories = params.get('multiSubCategories');
      if (multiSubCategories) {
        const subCategoryTitles = JSON.parse(multiSubCategories);
        
        // 過濾出符合任一子類別的產品
        return data.filter(product => 
          subCategoryTitles.includes(product.categoryItems)
        );
      }
      
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