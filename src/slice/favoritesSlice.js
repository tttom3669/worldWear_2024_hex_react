// favoritesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { 
  getUserId, 
  isUserLoggedIn, 
  getWorldWearTokenFromCookie, 
  COOKIE_NAMES, 
  getCookie 
} from "../components/tools/cookieUtils";

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 設置 API 的基本 URL
const API_URL = API_PATH || 'http://localhost:3000';

// 設置和獲取 axios 請求頭中的 Authorization 
const ensureAuthHeader = () => {
  // 優先從 localStorage 獲取 token
  const token = localStorage.getItem('token');
  
  // 如果 localStorage 中沒有找到，則從 cookie 獲取
  const cookieToken = token || getWorldWearTokenFromCookie();
  
  if (cookieToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${cookieToken}`;
    console.log('favoritesSlice: 已設置 Authorization header');
    return cookieToken;
  }
  
  console.log('favoritesSlice: 未找到 token，無法設置 Authorization header');
  delete axios.defaults.headers.common['Authorization'];
  return null;
};

// 獲取用戶 ID 的多重檢查函數 - 優先從 Redux 狀態獲取
const getSecureUserId = (getState) => {
  const state = getState();
  // 使用 cookieUtils 的 getUserId 函數從多個來源獲取用戶 ID
  return getUserId(state);
};

// 獲取收藏列表數據 - 使用新的 API 端點
export const getFavorites = createAsyncThunk(
  "favorites/getFavorites",
  async (_, { getState, rejectWithValue }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
      if (!isUserLoggedIn()) {
        console.log("用戶未登入，無法獲取收藏列表");
        return {
          total: 0,
          products: [],
        };
      }

      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      // 如果仍然沒有獲取到用戶 ID，返回空數據
      if (!userId) {
        console.log("未找到用戶 ID，無法獲取收藏列表");
        return {
          total: 0,
          products: [],
        };
      }

      console.log("獲取收藏列表，使用者ID:", userId);
      
      // 使用新的 API 端點，添加 _expand 參數
      const response = await axios.get(
        `${API_URL}/favorites/?userId=${userId}&_expand=user&_expand=product`,
        {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : undefined
        }
      );
      
      console.log("API 返回收藏數據:", response.data);
      
      // 處理 API 返回的數據
      const favoritesWithProducts = response.data.map(item => ({
        ...item,
        // 確保有基本的產品信息
        product: item.product || null
      }));
      
      return {
        total: favoritesWithProducts.length,
        products: favoritesWithProducts,
      };
    } catch (error) {
      console.error("獲取收藏列表失敗:", error);
      
      // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
      if (error.response) {
        return rejectWithValue(error.response.data.message || "獲取收藏列表失敗");
      }
      
      // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
      return rejectWithValue("獲取收藏列表失敗，請檢查網絡連接");
    }
  }
);

// 新增收藏項目
export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (favoriteItem, { getState, rejectWithValue, dispatch }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再加入收藏");
      }

      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      if (!userId) {
        return rejectWithValue("無法獲取用戶ID，請重新登入");
      }

      // 準備要發送的數據
      const favoriteData = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || "",
        size: favoriteItem.size || ""
      };
      
      // 發送 API 請求添加收藏
      const response = await axios.post(`${API_URL}/favorites`, favoriteData, {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      });
      
      console.log("API 返回新增收藏結果:", response.data);
      
      // 更新產品收藏狀態
      dispatch(updateProductFavoriteStatus({
        productId: favoriteItem.productId,
        isInFavorites: true,
        favoriteItem: response.data
      }));
      
      // 由於使用新的 API，直接返回響應數據
      return {
        ...response.data,
        product: response.data.product || null
      };
    } catch (error) {
      console.error("添加收藏失敗:", error);
      
      // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
      if (error.response) {
        return rejectWithValue(error.response.data.message || "添加收藏失敗");
      }
      
      // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
      return rejectWithValue(error.message || "添加收藏失敗，請檢查網絡連接");
    }
  }
);

// 移除收藏項目
export const removeFromFavorites = createAsyncThunk(
  "favorites/removeFromFavorites",
  async (id, { getState, rejectWithValue, dispatch }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再操作收藏");
      }
      
      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      if (!userId) {
        return rejectWithValue("無法獲取用戶ID，請重新登入");
      }
      
      // 找到要刪除的收藏項目，以獲取其產品 ID
      const favoriteItem = getState().favorites.favoritesData.products.find(
        item => item.id === id
      );
      
      // 發送 API 請求刪除收藏
      await axios.delete(`${API_URL}/favorites/${id}`, {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined,
        params: { userId } // 確保刪除操作是針對當前用戶的
      });
      
      console.log("成功刪除收藏項目:", id);
      
      // 如果找到相應的收藏項目，更新其產品的收藏狀態
      if (favoriteItem && favoriteItem.productId) {
        dispatch(updateProductFavoriteStatus({
          productId: favoriteItem.productId,
          isInFavorites: false,
          favoriteItem: null
        }));
      }
      
      // 返回被刪除的收藏項ID
      return { id, productId: favoriteItem?.productId };
    } catch (error) {
      console.error("移除收藏失敗:", error);
      
      // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
      if (error.response) {
        return rejectWithValue(error.response.data.message || "移除收藏失敗");
      }
      
      // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
      return rejectWithValue(error.message || "移除收藏失敗，請檢查網絡連接");
    }
  }
);

// 更新收藏項目數量
export const updateFavoriteItemQuantity = createAsyncThunk(
  "favorites/updateFavoriteItemQuantity",
  async ({ id, qty }, { getState, rejectWithValue }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再操作收藏");
      }

      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      if (!userId) {
        return rejectWithValue("無法獲取用戶ID，請重新登入");
      }
      
      // 確保數量至少為1
      const validQty = Math.max(1, qty);
      
      // 發送 API 請求更新數量
      const response = await axios.patch(`${API_URL}/favorites/${id}`, 
        { qty: validQty }, 
        {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : undefined,
          params: { userId } // 確保更新操作是針對當前用戶的
        }
      );
      
      console.log("API 返回更新數量結果:", response.data);
      
      return { id, qty: validQty };
    } catch (error) {
      console.error("更新收藏項目數量失敗:", error);
      
      // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
      if (error.response) {
        return rejectWithValue(error.response.data.message || "更新收藏項目數量失敗");
      }
      
      // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
      return rejectWithValue(error.message || "更新收藏項目數量失敗，請檢查網絡連接");
    }
  }
);

// 將收藏項目加入購物車
export const addFavoriteToCart = createAsyncThunk(
  "favorites/addFavoriteToCart",
  async (favoriteItem, { getState, rejectWithValue }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再加入購物車");
      }

      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      if (!userId) {
        return rejectWithValue("無法獲取用戶ID，請重新登入");
      }

      // 準備要發送的數據
      const cartItem = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || favoriteItem.product?.color || "",
        size: favoriteItem.size || favoriteItem.product?.size || "",
      };

      // 發送 API 請求添加到購物車
      const response = await axios.post(`${API_URL}/cart`, cartItem, {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      });
      
      console.log("API 返回添加購物車結果:", response.data);
      
      return { success: true, productId: cartItem.productId };
    } catch (error) {
      console.error("加入購物車失敗:", error);
      
      // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
      if (error.response) {
        return rejectWithValue(error.response.data.message || "加入購物車失敗");
      }
      
      // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
      return rejectWithValue(error.message || "加入購物車失敗，請檢查網絡連接");
    }
  }
);

// 檢查特定產品是否已收藏
export const checkProductFavoriteStatus = createAsyncThunk(
  "favorites/checkProductFavoriteStatus",
  async (productId, { getState, dispatch }) => {
    try {
      // 確保設置 Authorization header，並獲取可能使用的 token
      const token = ensureAuthHeader();
      
      // 如果用戶未登入，直接返回未收藏狀態
      if (!isUserLoggedIn()) {
        return { 
          productId,
          isInFavorites: false, 
          favoriteItem: null
        };
      }

      // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
      const userId = getSecureUserId(getState);
      
      if (!userId) {
        return { 
          productId,
          isInFavorites: false, 
          favoriteItem: null
        };
      }
      
      // 發送 API 請求檢查收藏狀態
      const response = await axios.get(`${API_URL}/favorites/check`, {
        params: { userId, productId },
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      });
      
      console.log(`API 返回產品 ${productId} 的收藏狀態:`, response.data);
      
      // 假設 API 返回 { isInFavorites: true/false, favoriteItem: {...} }
      const result = response.data;
      
      // 更新 UI 狀態
      if (result.isInFavorites && result.favoriteItem) {
        dispatch(updateProductFavoriteStatus({
          productId,
          isInFavorites: true,
          favoriteItem: result.favoriteItem
        }));
      }
      
      return { 
        productId,
        isInFavorites: result.isInFavorites, 
        favoriteItem: result.favoriteItem || null
      };
    } catch (error) {
      console.error("檢查收藏狀態失敗:", error);
      // 返回默認值而不是錯誤
      return { 
        productId,
        isInFavorites: false, 
        favoriteItem: null
      };
    }
  }
);

// 初始狀態
const initialState = {
  favoritesData: {
    total: 0,
    products: [],
  },
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  recentlyAddedProductIds: [], // 追蹤最近添加到收藏的產品ID
  productFavoriteStatus: {}, // 存儲產品 ID 到收藏狀態的映射
};

// 創建slice
const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    // 直接設置收藏數據
    setFavoritesData(state, action) {
      state.favoritesData = { ...action.payload };
    },
    resetFavoritesError(state) {
      state.error = null;
    },
    clearRecentlyAddedProducts(state) {
      state.recentlyAddedProductIds = [];
    },
    // 更新產品的收藏狀態
    updateProductFavoriteStatus(state, action) {
      const { productId, isInFavorites, favoriteItem } = action.payload;
      
      // 將產品收藏狀態存儲到 productFavoriteStatus
      state.productFavoriteStatus[productId] = {
        isInFavorites,
        favoriteItem: favoriteItem || null
      };
      
      // 將產品 ID 添加到最近收藏的列表中
      if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
        state.recentlyAddedProductIds.push(productId);
      } else if (!isInFavorites) {
        // 如果移除收藏，則從最近添加的產品列表中移除
        state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
          pid => pid !== productId
        );
      }
    },
    // 清空收藏列表
    clearFavorites(state) {
      state.favoritesData = {
        total: 0,
        products: [],
      };
      state.recentlyAddedProductIds = [];
      state.productFavoriteStatus = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // 處理 getFavorites
      .addCase(getFavorites.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.favoritesData = action.payload;
        state.error = null;
        
        // 更新產品收藏狀態
        action.payload.products.forEach(item => {
          if (item.productId) {
            state.productFavoriteStatus[item.productId] = {
              isInFavorites: true,
              favoriteItem: item
            };
          }
        });
      })
      .addCase(getFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 addToFavorites
      .addCase(addToFavorites.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        // 添加到最近添加的產品列表
        const productId = action.payload.productId;
        if (productId && !state.recentlyAddedProductIds.includes(productId)) {
          state.recentlyAddedProductIds.push(productId);
        }
        
        // 更新收藏列表
        const existingProductIndex = state.favoritesData.products.findIndex(
          product => product.id === action.payload.id
        );
        
        if (existingProductIndex === -1) {
          state.favoritesData.products.push(action.payload);
          state.favoritesData.total = state.favoritesData.products.length;
        }
        
        // 更新產品收藏狀態
        if (productId) {
          state.productFavoriteStatus[productId] = {
            isInFavorites: true,
            favoriteItem: action.payload
          };
        }
        
        state.status = "succeeded";
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 removeFromFavorites
      .addCase(removeFromFavorites.pending, (state) => {
        state.status = "loading";
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        // 從最近添加的產品列表中移除
        if (action.payload) {
          // 移除收藏項目
          if (action.payload.id) {
            state.favoritesData.products = state.favoritesData.products.filter(
              product => product.id !== action.payload.id
            );
            state.favoritesData.total = state.favoritesData.products.length;
          }
          
          // 更新產品收藏狀態
          if (action.payload.productId) {
            if (state.productFavoriteStatus[action.payload.productId]) {
              state.productFavoriteStatus[action.payload.productId] = {
                isInFavorites: false,
                favoriteItem: null
              };
            }
            
            // 從最近添加的列表中移除
            state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
              id => id !== action.payload.productId
            );
          }
        }
        
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 updateFavoriteItemQuantity
      .addCase(updateFavoriteItemQuantity.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateFavoriteItemQuantity.fulfilled, (state, action) => {
        const { id, qty } = action.payload;
        const productIndex = state.favoritesData.products.findIndex(
          (product) => product.id === id
        );

        if (productIndex !== -1) {
          state.favoritesData.products[productIndex].qty = qty;
          
          // 同時更新 productFavoriteStatus 中的數據
          const product = state.favoritesData.products[productIndex];
          if (product.productId && state.productFavoriteStatus[product.productId]) {
            state.productFavoriteStatus[product.productId].favoriteItem = {
              ...state.productFavoriteStatus[product.productId].favoriteItem,
              qty
            };
          }
        }
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(updateFavoriteItemQuantity.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 addFavoriteToCart
      .addCase(addFavoriteToCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addFavoriteToCart.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(addFavoriteToCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 checkProductFavoriteStatus
      .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
        // 更新產品收藏狀態
        if (action.payload && action.payload.productId) {
          state.productFavoriteStatus[action.payload.productId] = {
            isInFavorites: action.payload.isInFavorites,
            favoriteItem: action.payload.favoriteItem
          };
        }
      });
  },
});

// 選擇器 - 添加安全檢查
export const favoritesData = (state) => 
  state.favorites?.favoritesData || { total: 0, products: [] };

export const favoritesStatus = (state) => 
  state.favorites?.status || "idle";

export const favoritesError = (state) => 
  state.favorites?.error || null;

export const recentlyAddedProductIds = (state) => 
  state.favorites?.recentlyAddedProductIds || [];

export const isFavoriteProduct = (state, productId) => {
  // 如果用戶未登入，直接返回 false
  if (!isUserLoggedIn()) return false;
  
  // 首先從 productFavoriteStatus 查找，這是最精確的
  if (state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites) {
    return true;
  }
  
  // 如果沒有在狀態中找到，則查詢收藏列表
  return state.favorites?.favoritesData?.products?.some(item => 
    item.productId === productId
  ) || false;
};

export const getFavoriteItem = (state, productId) => {
  // 如果用戶未登入，直接返回 null
  if (!isUserLoggedIn()) return null;
  
  // 首先從 productFavoriteStatus 查找，這是最精確的
  if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
    return state.favorites.productFavoriteStatus[productId].favoriteItem;
  }
  
  // 如果沒有在狀態中找到，則查詢收藏列表
  return state.favorites?.favoritesData?.products?.find(item => 
    item.productId === productId
  ) || null;
};

// 獲取產品的收藏狀態詳細信息
export const getProductFavoriteStatus = (state, productId) => {
  // 如果用戶未登入，直接返回未收藏狀態
  if (!isUserLoggedIn()) {
    return { isInFavorites: false, favoriteItem: null };
  }
  
  // 從 productFavoriteStatus 獲取狀態信息
  return state.favorites?.productFavoriteStatus?.[productId] || 
    { isInFavorites: false, favoriteItem: null };
};

// Action creators
export const { 
  setFavoritesData, 
  resetFavoritesError, 
  clearRecentlyAddedProducts,
  updateProductFavoriteStatus,
  clearFavorites
} = favoritesSlice.actions;

export default favoritesSlice.reducer;