// favoritesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 獲取用戶ID的輔助函數
const getUserId = () => {
  return document.cookie.replace(
    /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );
};

// 檢查用戶是否已登入
const isUserLoggedIn = () => {
  const userId = getUserId();
  return !!userId && userId.length > 0;
};

// 獲取收藏列表數據
export const getFavorites = createAsyncThunk(
  "favorites/getFavorites",
  async (_, { rejectWithValue }) => {
    try {
      // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
      if (!isUserLoggedIn()) {
        return {
          total: 0,
          products: [],
        };
      }

      const userId = getUserId();
      // 使用 _expand 查詢參數獲取相關聯的產品信息
      const res = await axios.get(
        `${API_PATH}/favorites?userId=${userId}&_expand=product`
      );

      // 將API響應轉換為需要的格式
      return {
        total: res.data.length,
        products: res.data,
      };
    } catch (error) {
      console.error("獲取收藏列表失敗:", error);
      // 返回空數據而不是拋出錯誤
      return {
        total: 0,
        products: [],
      };
    }
  }
);

// 新增收藏項目
export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (favoriteItem, { rejectWithValue }) => {
    try {
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再加入收藏");
      }

      // 確保 userId 存在
      const userId = favoriteItem.userId || getUserId();

      // 檢查並確保必要字段的存在
      const item = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || "",
        size: favoriteItem.size || "",
      };
      
      // 檢查是否已經收藏過該產品
      const checkRes = await axios.get(
        `${API_PATH}/favorites?userId=${userId}&productId=${item.productId}`
      );
      
      // 如果已經收藏過，則返回現有記錄而不是創建新記錄
      if (checkRes.data.length > 0) {
        return checkRes.data[0];
      }
      
      // 發送 API 請求添加收藏
      const response = await axios.post(`${API_PATH}/favorites`, item);
      
      return response.data;
    } catch (error) {
      console.error("添加收藏失敗:", error);
      return rejectWithValue(error.response?.data || error.message || "添加收藏失敗");
    }
  }
);

// 移除收藏項目
export const removeFromFavorites = createAsyncThunk(
  "favorites/removeFromFavorites",
  async (id, { rejectWithValue }) => {
    try {
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再操作收藏");
      }
      
      // 使用 DELETE 方法刪除
      await axios.delete(`${API_PATH}/favorites/${id}`);
      
      // 返回被刪除的收藏項ID
      return { id };
    } catch (error) {
      console.error("移除收藏失敗:", error);
      return rejectWithValue(error.response?.data || error.message || "移除收藏失敗");
    }
  }
);

// 更新收藏項目數量
export const updateFavoriteItemQuantity = createAsyncThunk(
  "favorites/updateFavoriteItemQuantity",
  async ({ id, qty }, { rejectWithValue }) => {
    try {
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再操作收藏");
      }

      // 確保數量至少為1
      const validQty = Math.max(1, qty);

      // 使用 PATCH 方法更新數量
      await axios.patch(`${API_PATH}/favorites/${id}`, { qty: validQty });

      return { id, qty: validQty };
    } catch (error) {
      console.error("更新收藏項目數量失敗:", error);
      return rejectWithValue(error.response?.data || error.message || "更新收藏項目數量失敗");
    }
  }
);

// 將收藏項目加入購物車
export const addFavoriteToCart = createAsyncThunk(
  "favorites/addFavoriteToCart",
  async (favoriteItem, { rejectWithValue }) => {
    try {
      // 確保用戶已登入
      if (!isUserLoggedIn()) {
        return rejectWithValue("請先登入再加入購物車");
      }

      const userId = getUserId();

      const cartItem = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || favoriteItem.product?.color || "",
        size: favoriteItem.size || favoriteItem.product?.size || "",
      };

      // 使用 POST 方法添加項目
      await axios.post(`${API_PATH}/carts`, cartItem);
      return { success: true, productId: cartItem.productId };
    } catch (error) {
      console.error("加入購物車失敗:", error);
      return rejectWithValue(error.response?.data || error.message || "加入購物車失敗");
    }
  }
);

// 檢查特定產品是否已收藏
export const checkProductFavoriteStatus = createAsyncThunk(
  "favorites/checkProductFavoriteStatus",
  async (productId, { dispatch }) => {
    try {
      // 如果用戶未登入，直接返回未收藏狀態
      if (!isUserLoggedIn()) {
        return { 
          productId,
          isInFavorites: false, 
          favoriteItem: null
        };
      }

      const userId = getUserId();
      
      // 檢查產品是否已在收藏列表中
      const response = await axios.get(
        `${API_PATH}/favorites?userId=${userId}&productId=${productId}`
      );
      
      const isInFavorites = response.data.length > 0;
      const favoriteItem = isInFavorites ? response.data[0] : null;
      
      // 更新 UI 狀態
      if (isInFavorites && favoriteItem) {
        dispatch(updateProductFavoriteStatus({
          productId,
          isInFavorites: true,
          favoriteItem
        }));
      }
      
      return { 
        productId,
        isInFavorites, 
        favoriteItem: favoriteItem || null
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
};

// 創建slice
export const favoritesSlice = createSlice({
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
      
      // 將產品 ID 添加到最近收藏的列表中
      if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
        state.recentlyAddedProductIds.push(productId);
      } else if (!isInFavorites) {
        // 如果移除收藏，則從最近添加的產品列表中移除
        state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
          pid => pid !== productId
        );
      }
    }
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
        if (action.payload && action.payload.id) {
          const favoriteItem = state.favoritesData.products.find(
            item => item.id === action.payload.id
          );
          if (favoriteItem) {
            state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
              pid => pid !== favoriteItem.productId
            );
          }
        }
        state.status = "succeeded";
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
        }
        state.status = "succeeded";
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
      })
      .addCase(addFavoriteToCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // 處理 checkProductFavoriteStatus
      .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
        // 不需要特別處理，因為我們使用單獨的 action 來更新產品收藏狀態
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
  
  return state.favorites?.favoritesData?.products?.some(item => 
    item.productId === productId
  ) || false;
};

export const getFavoriteItem = (state, productId) => {
  // 如果用戶未登入，直接返回 null
  if (!isUserLoggedIn()) return null;
  
  return state.favorites?.favoritesData?.products?.find(item => 
    item.productId === productId
  ) || null;
};

// Action creators
export const { 
  setFavoritesData, 
  resetFavoritesError, 
  clearRecentlyAddedProducts,
  updateProductFavoriteStatus
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 獲取用戶ID的輔助函數
// const getUserId = () => {
//   return document.cookie.replace(
//     /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
//     "$1"
//   );
// };

// // 獲取認證 token
// const getAuthToken = () => {
//   return document.cookie.replace(
//     /(?:(?:^|.*;\s*)worldWearToken\s*\=\s*([^;]*).*$)|^.*$/,
//     "$1"
//   );
// };

// // 檢查用戶是否已登入
// const isUserLoggedIn = () => {
//   const userId = getUserId();
//   const token = getAuthToken();
//   return !!userId && userId.length > 0 && !!token && token.length > 0;
// };

// // 配置 axios 請求頭部
// const configureAxiosHeaders = () => {
//   const token = getAuthToken();
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     }
//   };
// };

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
//       if (!isUserLoggedIn()) {
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       const userId = getUserId();
//       const config = configureAxiosHeaders();
      
//       // 添加認證頭
//       const res = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}`,
//         config
//       );

//       // 獲取收藏列表產品詳細資訊
//       const productsWithDetails = await Promise.all(
//         res.data.map(async (item) => {
//           try {
//             // 使用 productId 來獲取產品資訊 (產品資訊可能不需要認證)
//             const productRes = await axios.get(`${API_PATH}/products/${item.productId}`);
//             return {
//               ...item,
//               product: productRes.data
//             };
//           } catch (error) {
//             console.error(`獲取產品 ${item.productId} 詳細資訊失敗:`, error);
//             return {
//               ...item,
//               product: null
//             };
//           }
//         })
//       );

//       // 將API響應轉換為需要的格式
//       return {
//         total: productsWithDetails.length,
//         products: productsWithDetails,
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);
//       // 在控制台記錄錯誤，但不拋出錯誤
//       return {
//         total: 0,
//         products: [],
//       };
//     }
//   }
// );

// // 新增收藏項目
// export const addToFavorites = createAsyncThunk(
//   "favorites/addToFavorites",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 確保 userId 存在
//       const userId = favoriteItem.userId || getUserId();
//       const config = configureAxiosHeaders();

//       // 檢查並確保必要字段的存在
//       const item = {
//         userId: userId,
//         productId: favoriteItem.productId, // 使用 productId
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//       };
      
//       // 檢查是否已經收藏過該產品
//       const checkRes = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&productId=${item.productId}`,
//         config
//       );
      
//       // 如果已經收藏過，則返回現有記錄而不是創建新記錄
//       if (checkRes.data.length > 0) {
//         return checkRes.data[0];
//       }
      
//       // 發送 API 請求添加收藏
//       const response = await axios.post(`${API_PATH}/favorites`, item, config);
      
//       return response.data;
//     } catch (error) {
//       console.error("添加收藏失敗:", error);
//       return rejectWithValue(error.message || "添加收藏失敗");
//     }
//   }
// );

// // 移除收藏項目
// export const removeFromFavorites = createAsyncThunk(
//   "favorites/removeFromFavorites",
//   async (id, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }
      
//       const config = configureAxiosHeaders();
      
//       // 發送 API 請求刪除收藏
//       await axios.delete(`${API_PATH}/favorites/${id}`, config);
      
//       // 返回被刪除的收藏項ID
//       return { id };
//     } catch (error) {
//       console.error("移除收藏失敗:", error);
//       return rejectWithValue(error.message || "移除收藏失敗");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, qty }, { dispatch, rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);
//       const config = configureAxiosHeaders();

//       // 發送API請求
//       await axios.patch(`${API_PATH}/favorites/${id}`, { qty: validQty }, config);

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error("更新收藏項目數量失敗:", error);
//       return rejectWithValue(error.message || "更新收藏項目數量失敗");
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       const userId = getUserId();
//       const config = configureAxiosHeaders();

//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       await axios.post(`${API_PATH}/cart`, cartItem, config);
//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);
//       return rejectWithValue(error.message || "加入購物車失敗");
//     }
//   }
// );

// // 檢查特定產品是否已收藏 - 這只會在使用者明確請求檢查時使用
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch, rejectWithValue }) => {
//     try {
//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!isUserLoggedIn()) {
//         return { 
//           productId,
//           isInFavorites: false, 
//           favoriteItem: null
//         };
//       }

//       const userId = getUserId();
//       const config = configureAxiosHeaders();
      
//       // 檢查產品是否已在收藏列表中
//       const response = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&productId=${productId}`,
//         config
//       );
      
//       const isInFavorites = response.data.length > 0;
//       const favoriteItem = isInFavorites ? response.data[0] : null;
      
//       // 更新 UI 狀態
//       if (isInFavorites && favoriteItem) {
//         dispatch(updateProductFavoriteStatus({
//           productId,
//           isInFavorites: true,
//           favoriteItem
//         }));
//       }
      
//       return { 
//         productId,
//         isInFavorites, 
//         favoriteItem: favoriteItem || null
//       };
//     } catch (error) {
//       console.error("檢查收藏狀態失敗:", error);
//       // 返回默認值而不是錯誤
//       return { 
//         productId,
//         isInFavorites: false, 
//         favoriteItem: null
//       };
//     }
//   }
// );

// // 初始狀態
// const initialState = {
//   favoritesData: {
//     total: 0,
//     products: [],
//   },
//   status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
//   error: null,
//   recentlyAddedProductIds: [], // 追蹤最近添加到收藏的產品ID
// };

// // 創建slice
// export const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據 (如果需要)
//     setFavoritesData(state, action) {
//       state.favoritesData = { ...action.payload };
//     },
//     resetFavoritesError(state) {
//       state.error = null;
//     },
//     clearRecentlyAddedProducts(state) {
//       state.recentlyAddedProductIds = [];
//     },
//     // 更新產品的收藏狀態
//     updateProductFavoriteStatus(state, action) {
//       const { productId, isInFavorites, favoriteItem } = action.payload;
      
//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           pid => pid !== productId
//         );
//       }
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // 處理 getFavorites
//       .addCase(getFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(getFavorites.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.favoritesData = action.payload;
//         state.error = null;
//       })
//       .addCase(getFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 addToFavorites
//       .addCase(addToFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(addToFavorites.fulfilled, (state, action) => {
//         // 添加到最近添加的產品列表
//         const productId = action.payload.productId;
//         if (productId && !state.recentlyAddedProductIds.includes(productId)) {
//           state.recentlyAddedProductIds.push(productId);
//         }
//         state.status = "succeeded";
//       })
//       .addCase(addToFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 removeFromFavorites
//       .addCase(removeFromFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(removeFromFavorites.fulfilled, (state, action) => {
//         // 從最近添加的產品列表中移除
//         if (action.payload && action.payload.id) {
//           const favoriteItem = state.favoritesData.products.find(
//             item => item.id === action.payload.id
//           );
//           if (favoriteItem) {
//             state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//               pid => pid !== favoriteItem.productId
//             );
//           }
//         }
//         state.status = "succeeded";
//       })
//       .addCase(removeFromFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 updateFavoriteItemQuantity
//       .addCase(updateFavoriteItemQuantity.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(updateFavoriteItemQuantity.fulfilled, (state, action) => {
//         const { id, qty } = action.payload;
//         const productIndex = state.favoritesData.products.findIndex(
//           (product) => product.id === id
//         );

//         if (productIndex !== -1) {
//           state.favoritesData.products[productIndex].qty = qty;
//         }
//         state.status = "succeeded";
//       })
//       .addCase(updateFavoriteItemQuantity.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 addFavoriteToCart
//       .addCase(addFavoriteToCart.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(addFavoriteToCart.fulfilled, (state) => {
//         state.status = "succeeded";
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state) => {
//         // 不需要特別處理，因為我們使用單獨的 action 來更新產品收藏狀態
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };
// export const favoritesStatus = (state) => state.favorites?.status || "idle";
// export const favoritesError = (state) => state.favorites?.error || null;
// export const recentlyAddedProductIds = (state) => 
//   state.favorites?.recentlyAddedProductIds || [];
// export const isFavoriteProduct = (state, productId) => {
//   // 如果用戶未登入，直接返回 false
//   if (!isUserLoggedIn()) return false;
  
//   return state.favorites?.favoritesData?.products?.some(item => 
//     item.productId === productId
//   ) || false;
// };
// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;
  
//   return state.favorites?.favoritesData?.products?.find(item => 
//     item.productId === productId
//   ) || null;
// };

// // Action creators
// export const { 
//   setFavoritesData, 
//   resetFavoritesError, 
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;




// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 獲取用戶ID的輔助函數
// const getUserId = () => {
//   return document.cookie.replace(
//     /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
//     "$1"
//   );
// };

// // 檢查用戶是否已登入
// const isUserLoggedIn = () => {
//   const userId = getUserId();
//   return !!userId && userId.length > 0;
// };

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
//       if (!isUserLoggedIn()) {
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       const userId = getUserId();
//       const res = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}`
//       );

//       // 獲取收藏列表產品詳細資訊
//       const productsWithDetails = await Promise.all(
//         res.data.map(async (item) => {
//           try {
//             // 使用 productId 來獲取產品資訊
//             const productRes = await axios.get(`${API_PATH}/products/${item.productId}`);
//             return {
//               ...item,
//               product: productRes.data
//             };
//           } catch (error) {
//             console.error(`獲取產品 ${item.productId} 詳細資訊失敗:`, error);
//             return {
//               ...item,
//               product: null
//             };
//           }
//         })
//       );

//       // 將API響應轉換為需要的格式
//       return {
//         total: productsWithDetails.length,
//         products: productsWithDetails,
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);
//       // 在控制台記錄錯誤，但不拋出錯誤
//       return {
//         total: 0,
//         products: [],
//       };
//     }
//   }
// );

// // 新增收藏項目
// export const addToFavorites = createAsyncThunk(
//   "favorites/addToFavorites",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 確保 userId 存在
//       const userId = favoriteItem.userId || getUserId();

//       // 檢查並確保必要字段的存在
//       const item = {
//         userId: userId,
//         productId: favoriteItem.productId, // 使用 productId
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//       };
      
//       // 檢查是否已經收藏過該產品
//       const checkRes = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&productId=${item.productId}`
//       );
      
//       // 如果已經收藏過，則返回現有記錄而不是創建新記錄
//       if (checkRes.data.length > 0) {
//         return checkRes.data[0];
//       }
      
//       // 發送 API 請求添加收藏
//       const response = await axios.post(`${API_PATH}/favorites`, item);
      
//       return response.data;
//     } catch (error) {
//       console.error("添加收藏失敗:", error);
//       return rejectWithValue(error.message || "添加收藏失敗");
//     }
//   }
// );

// // 移除收藏項目
// export const removeFromFavorites = createAsyncThunk(
//   "favorites/removeFromFavorites",
//   async (id, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }
      
//       // 發送 API 請求刪除收藏
//       await axios.delete(`${API_PATH}/favorites/${id}`);
      
//       // 返回被刪除的收藏項ID
//       return { id };
//     } catch (error) {
//       console.error("移除收藏失敗:", error);
//       return rejectWithValue(error.message || "移除收藏失敗");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, qty }, { dispatch, rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 發送API請求
//       await axios.patch(`${API_PATH}/favorites/${id}`, { qty: validQty });

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error("更新收藏項目數量失敗:", error);
//       return rejectWithValue(error.message || "更新收藏項目數量失敗");
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       const userId = getUserId();

//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       await axios.post(`${API_PATH}/cart`, cartItem);
//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);
//       return rejectWithValue(error.message || "加入購物車失敗");
//     }
//   }
// );

// // 檢查特定產品是否已收藏 - 這只會在使用者明確請求檢查時使用
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch, rejectWithValue }) => {
//     try {
//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!isUserLoggedIn()) {
//         return { 
//           productId,
//           isInFavorites: false, 
//           favoriteItem: null
//         };
//       }

//       const userId = getUserId();
      
//       // 檢查產品是否已在收藏列表中
//       const response = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&productId=${productId}`
//       );
      
//       const isInFavorites = response.data.length > 0;
//       const favoriteItem = isInFavorites ? response.data[0] : null;
      
//       // 更新 UI 狀態
//       if (isInFavorites && favoriteItem) {
//         dispatch(updateProductFavoriteStatus({
//           productId,
//           isInFavorites: true,
//           favoriteItem
//         }));
//       }
      
//       return { 
//         productId,
//         isInFavorites, 
//         favoriteItem: favoriteItem || null
//       };
//     } catch (error) {
//       console.error("檢查收藏狀態失敗:", error);
//       // 返回默認值而不是錯誤
//       return { 
//         productId,
//         isInFavorites: false, 
//         favoriteItem: null
//       };
//     }
//   }
// );

// // 初始狀態
// const initialState = {
//   favoritesData: {
//     total: 0,
//     products: [],
//   },
//   status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
//   error: null,
//   recentlyAddedProductIds: [], // 追蹤最近添加到收藏的產品ID
// };

// // 創建slice
// export const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據 (如果需要)
//     setFavoritesData(state, action) {
//       state.favoritesData = { ...action.payload };
//     },
//     resetFavoritesError(state) {
//       state.error = null;
//     },
//     clearRecentlyAddedProducts(state) {
//       state.recentlyAddedProductIds = [];
//     },
//     // 更新產品的收藏狀態
//     updateProductFavoriteStatus(state, action) {
//       const { productId, isInFavorites, favoriteItem } = action.payload;
      
//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           pid => pid !== productId
//         );
//       }
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // 處理 getFavorites
//       .addCase(getFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(getFavorites.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.favoritesData = action.payload;
//         state.error = null;
//       })
//       .addCase(getFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 addToFavorites
//       .addCase(addToFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(addToFavorites.fulfilled, (state, action) => {
//         // 添加到最近添加的產品列表
//         const productId = action.payload.productId;
//         if (productId && !state.recentlyAddedProductIds.includes(productId)) {
//           state.recentlyAddedProductIds.push(productId);
//         }
//         state.status = "succeeded";
//       })
//       .addCase(addToFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 removeFromFavorites
//       .addCase(removeFromFavorites.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(removeFromFavorites.fulfilled, (state, action) => {
//         // 從最近添加的產品列表中移除
//         if (action.payload && action.payload.id) {
//           const favoriteItem = state.favoritesData.products.find(
//             item => item.id === action.payload.id
//           );
//           if (favoriteItem) {
//             state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//               pid => pid !== favoriteItem.productId
//             );
//           }
//         }
//         state.status = "succeeded";
//       })
//       .addCase(removeFromFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 updateFavoriteItemQuantity
//       .addCase(updateFavoriteItemQuantity.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(updateFavoriteItemQuantity.fulfilled, (state, action) => {
//         const { id, qty } = action.payload;
//         const productIndex = state.favoritesData.products.findIndex(
//           (product) => product.id === id
//         );

//         if (productIndex !== -1) {
//           state.favoritesData.products[productIndex].qty = qty;
//         }
//         state.status = "succeeded";
//       })
//       .addCase(updateFavoriteItemQuantity.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 addFavoriteToCart
//       .addCase(addFavoriteToCart.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(addFavoriteToCart.fulfilled, (state) => {
//         state.status = "succeeded";
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state) => {
//         // 不需要特別處理，因為我們使用單獨的 action 來更新產品收藏狀態
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };
// export const favoritesStatus = (state) => state.favorites?.status || "idle";
// export const favoritesError = (state) => state.favorites?.error || null;
// export const recentlyAddedProductIds = (state) => 
//   state.favorites?.recentlyAddedProductIds || [];
// export const isFavoriteProduct = (state, productId) => {
//   // 如果用戶未登入，直接返回 false
//   if (!isUserLoggedIn()) return false;
  
//   return state.favorites?.favoritesData?.products?.some(item => 
//     item.productId === productId
//   ) || false;
// };
// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;
  
//   return state.favorites?.favoritesData?.products?.find(item => 
//     item.productId === productId
//   ) || null;
// };

// // Action creators
// export const { 
//   setFavoritesData, 
//   resetFavoritesError, 
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;




// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       const userId = document.cookie.replace(
//         /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
//         "$1"
//       );

//       if (!userId) {
//         return rejectWithValue("未登入或無法獲取用戶ID");
//       }

//       const res = await axios.get(
//         `${API_PATH}/favorites/?userId=${userId}&_expand=user&_expand=product`
//       );

//       // 將API響應轉換為需要的格式
//       return {
//         total: res.data.length,
//         products: res.data.map((item) => ({
//           ...item,
//           id: item.id,
//           product_id: item.product_id,
//           qty: item.qty || 1, // 確保每個項目都有數量，默認為1
//           product: item.product,
//         })),
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);
//       return rejectWithValue(error.message || "獲取收藏列表失敗");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, productId, qty }, { dispatch, rejectWithValue }) => {
//     try {
//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 發送API請求
//       await axios.patch(`${API_PATH}/favorites/${id}`, { qty: validQty });

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error("更新收藏項目數量失敗:", error);
//       return rejectWithValue(error.message || "更新收藏項目數量失敗");
//     }
//   }
// );

// // 刪除收藏項目
// export const deleteFavoriteItem = createAsyncThunk(
//   "favorites/deleteFavoriteItem",
//   async (id, { rejectWithValue }) => {
//     try {
//       // 發送API請求
//       await axios.delete(`${API_PATH}/favorites/${id}`);
//       return id;
//     } catch (error) {
//       console.error("刪除收藏項目失敗:", error);
//       return rejectWithValue(error.message || "刪除收藏項目失敗");
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       const userId = document.cookie.replace(
//         /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
//         "$1"
//       );

//       if (!userId) {
//         return rejectWithValue("未登入或無法獲取用戶ID");
//       }

//       const cartItem = {
//         userId: parseInt(userId),
//         product_id: favoriteItem.product_id,
//         qty: favoriteItem.qty,
//         color: favoriteItem.color || favoriteItem.product?.color,
//         size: favoriteItem.size || favoriteItem.product?.size,
//       };

//       await axios.post(`${API_PATH}/cart`, cartItem);
//       return { success: true };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);
//       return rejectWithValue(error.message || "加入購物車失敗");
//     }
//   }
// );

// // 初始狀態
// const initialState = {
//   favoritesData: {
//     total: 0,
//     products: [],
//   },
//   status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
//   error: null,
// };

// // 創建slice
// export const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據 (如果需要)
//     setFavoritesData(state, action) {
//       state.favoritesData = { ...action.payload };
//     },
//     resetFavoritesError(state) {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // 處理 getFavorites
//       .addCase(getFavorites.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(getFavorites.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.favoritesData = action.payload;
//         state.error = null;
//       })
//       .addCase(getFavorites.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 updateFavoriteItemQuantity
//       .addCase(updateFavoriteItemQuantity.pending, (state) => {
//         // 可以設置loading狀態 (如果需要)
//       })
//       .addCase(updateFavoriteItemQuantity.fulfilled, (state, action) => {
//         const { id, qty } = action.payload;
//         const productIndex = state.favoritesData.products.findIndex(
//           (product) => product.id === id
//         );

//         if (productIndex !== -1) {
//           state.favoritesData.products[productIndex].qty = qty;
//         }
//       })
//       .addCase(updateFavoriteItemQuantity.rejected, (state, action) => {
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 deleteFavoriteItem
//       .addCase(deleteFavoriteItem.fulfilled, (state, action) => {
//         const id = action.payload;
//         state.favoritesData.products = state.favoritesData.products.filter(
//           (product) => product.id !== id
//         );
//         state.favoritesData.total = state.favoritesData.products.length;
//       })
//       .addCase(deleteFavoriteItem.rejected, (state, action) => {
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 addFavoriteToCart
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.error = action.payload || action.error.message;
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };
// export const favoritesStatus = (state) => state.favorites?.status || "idle";
// export const favoritesError = (state) => state.favorites?.error || null;

// // Action creators
// export const { setFavoritesData, resetFavoritesError } = favoritesSlice.actions;

// export default favoritesSlice.reducer;

// // // favoritesSlice.js
// // import { createSlice } from '@reduxjs/toolkit';

// // export const favoritesSlice = createSlice({
// //   name: 'favorites',
// //   initialState: {
// //     favoritesData: {
// //       total: 0,
// //       products: [],
// //     },
// //   },
// //   reducers: {
// //     setFavoritesData(state, action) {
// //       state.favoritesData = { ...action.payload };
// //     },
// //     updateFavoriteQuantity(state, action) {
// //       const { id, qty } = action.payload;
// //       const productIndex = state.favoritesData.products.findIndex(
// //         (product) => product.id === id
// //       );

// //       if (productIndex !== -1) {
// //         // 確保數量至少為1
// //         const newQty = Math.max(1, qty);
// //         state.favoritesData.products[productIndex].qty = newQty;
// //       }
// //     },
// //     removeFavoriteItem(state, action) {
// //       const productId = action.payload;
// //       state.favoritesData.products = state.favoritesData.products.filter(
// //         (product) => product.id !== productId
// //       );
// //       state.favoritesData.total = state.favoritesData.products.length;
// //     },
// //   },
// // });

// // // 選擇器
// // export const favoritesData = (state) => state.favorites.favoritesData;

// // // Action creators
// // export const {
// //   setFavoritesData,
// //   updateFavoriteQuantity,
// //   removeFavoriteItem
// // } = favoritesSlice.actions;

// // export default favoritesSlice.reducer;
