import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import cookieUtils from '../components/tools/cookieUtils';

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 獲取收藏列表
export const getFavorites = createAsyncThunk(
  'favorites/getFavorites',
  async (_, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 獲取 userId
      const userId = cookieUtils.getUserIdFromCookie();
      const token = cookieUtils.getJWTToken();
      if (!userId) {
        return {
          total: 0,
          products: [],
        };
      }

      // 發送 API 請求獲取收藏列表
      const response = await axios.get(
        `${API_PATH}/favorites?userId=${userId}&_expand=product`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      // 對每個收藏項目添加完整的產品信息
      const favoritesWithProducts = await Promise.all(
        response.data.map(async (item) => {
          try {
            // 如果沒有自動擴展的產品，嘗試單獨獲取
            const productResponse = await axios.get(
              `${API_PATH}/products/${item.productId}`
            );
            return {
              ...item,
              product: productResponse.data,
            };
          } catch (error) {
            console.error(`獲取產品 ${item.productId} 失敗:`, error);
            return {
              ...item,
              product: null,
            };
          }
        })
      );

      return {
        total: favoritesWithProducts.length,
        products: favoritesWithProducts,
      };
    } catch (error) {
      console.error('獲取收藏列表失敗:', error);

      return rejectWithValue({
        message: '獲取收藏列表失敗，請檢查網絡連接',
        details: error.message,
      });
    }
  }
);

// 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { rejectWithValue }) => {
//     try {
//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!cookieUtils.isUserLoggedIn()) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       const userId = cookieUtils.getUserIdFromCookie();

//       if (!userId) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       // 檢查是否已收藏該產品
//       const response = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&productId=${productId}`
//       );

//       const isInFavorites = response.data.length > 0;
//       const favoriteItem = isInFavorites ? response.data[0] : null;

//       return {
//         productId,
//         isInFavorites,
//         favoriteItem: favoriteItem || null,
//       };
//     } catch (error) {
//       console.error("檢查收藏狀態失敗:", error);
//       return rejectWithValue({
//         message: "檢查收藏狀態失敗",
//         details: error.message,
//       });
//     }
//   }
// );

// 新增收藏項目
export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (favoriteItem, { rejectWithValue }) => {
    try {
      const userId = cookieUtils.getUserIdFromCookie();

      if (!userId) {
        return rejectWithValue('無法獲取用戶ID');
      }

      // 準備要發送的數據
      const favoriteData = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || '',
        size: favoriteItem.size || '',
      };
      const token = cookieUtils.getJWTToken();
      // 發送 API 請求添加收藏
      const response = await axios.post(`${API_PATH}/favorites`, favoriteData, {
        headers: {
          Authorization: token,
        },
      });

      console.log('新增收藏結果:', response.data);

      // 嘗試獲取完整的產品資訊
      const productResponse = await axios.get(
        `${API_PATH}/products/${favoriteItem.productId}`
      );

      return {
        ...response.data,
        product: productResponse.data,
      };
    } catch (error) {
      console.error('添加收藏失敗:', error);
      return rejectWithValue({
        message: '添加收藏失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 移除收藏項目
export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (id, { rejectWithValue }) => {
    try {
      const token = cookieUtils.getJWTToken();
      // 發送 API 請求刪除收藏
      await axios.delete(`${API_PATH}/favorites/${id}`,{
        headers: {
          Authorization: token,
        },
      });

      return { id };
    } catch (error) {
      console.error('移除收藏失敗:', error);
      return rejectWithValue({
        message: '移除收藏失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 更新收藏項目數量
export const updateFavoriteItemQuantity = createAsyncThunk(
  'favorites/updateFavoriteItemQuantity',
  async ({ id, qty }, { rejectWithValue }) => {
    try {
      // 確保數量至少為1
      const validQty = Math.max(1, qty);

      // 發送 API 請求更新數量
      const response = await axios.patch(`${API_PATH}/favorites/${id}`, {
        qty: validQty,
      });

      return {
        id,
        qty: validQty,
        ...response.data,
      };
    } catch (error) {
      console.error('更新收藏項目數量失敗:', error);
      return rejectWithValue({
        message: '更新收藏項目數量失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 將收藏項目加入購物車
export const addFavoriteToCart = createAsyncThunk(
  'favorites/addFavoriteToCart',
  async (favoriteItem, { rejectWithValue }) => {
    try {
      const userId = cookieUtils.getUserIdFromCookie();

      if (!userId) {
        return rejectWithValue('無法獲取用戶ID');
      }

      // 準備要發送的數據
      const cartItem = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || favoriteItem.product?.color || '',
        size: favoriteItem.size || favoriteItem.product?.size || '',
      };

      // 發送 API 請求添加到購物車
      const response = await axios.post(`${API_PATH}/carts`, cartItem);

      return {
        success: true,
        productId: cartItem.productId,
        cartItem: response.data,
      };
    } catch (error) {
      console.error('加入購物車失敗:', error);
      return rejectWithValue({
        message: '加入購物車失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 更新收藏項目顏色
export const updateFavoriteItemColor = createAsyncThunk(
  'favorites/updateFavoriteItemColor',
  async ({ id, color }, { rejectWithValue }) => {
    try {
      // 發送 API 請求更新顏色
      const response = await axios.patch(`${API_PATH}/favorites/${id}`, {
        color: color,
      });

      return {
        id,
        color,
        ...response.data,
      };
    } catch (error) {
      console.error('更新收藏項目顏色失敗:', error);
      return rejectWithValue({
        message: '更新收藏項目顏色失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 更新收藏項目尺寸
export const updateFavoriteItemSize = createAsyncThunk(
  'favorites/updateFavoriteItemSize',
  async ({ id, size }, { rejectWithValue }) => {
    try {
      // 發送 API 請求更新尺寸
      const response = await axios.patch(`${API_PATH}/favorites/${id}`, {
        size: size,
      });

      return {
        id,
        size,
        ...response.data,
      };
    } catch (error) {
      console.error('更新收藏項目尺寸失敗:', error);
      return rejectWithValue({
        message: '更新收藏項目尺寸失敗，請稍後再試',
        details: error.message,
      });
    }
  }
);

// 初始狀態
const initialState = {
  favoritesData: {
    total: 0,
    products: [],
  },
  status: 'idle',
  error: null,
  recentlyAddedProductIds: [],
  productFavoriteStatus: {},
};

// 創建slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // 清空收藏列表
    clearFavorites(state) {
      state.favoritesData = {
        total: 0,
        products: [],
      };
      state.recentlyAddedProductIds = [];
      state.productFavoriteStatus = {};
    },
    // 重置錯誤狀態
    resetFavoritesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 獲取收藏列表
      .addCase(getFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.favoritesData = action.payload;
        state.error = null;

        // 更新產品收藏狀態
        action.payload.products.forEach((item) => {
          if (item.productId) {
            state.productFavoriteStatus[item.productId] = {
              isInFavorites: true,
              favoriteItem: item,
            };
          }
        });
      })
      .addCase(getFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '獲取收藏列表失敗' };
      })

      // 檢查收藏狀態
      // .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
      //   const { productId, isInFavorites, favoriteItem } = action.payload;
      //   state.productFavoriteStatus[productId] = {
      //     isInFavorites,
      //     favoriteItem,
      //   };
      // })

      // 新增收藏
      .addCase(addToFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const productId = action.payload.productId;

        // 添加到收藏列表
        state.favoritesData.products.push(action.payload);
        state.favoritesData.total = state.favoritesData.products.length;

        // 更新收藏狀態
        if (productId) {
          state.productFavoriteStatus[productId] = {
            isInFavorites: true,
            favoriteItem: action.payload,
          };

          // 添加到最近添加的產品列表
          if (!state.recentlyAddedProductIds.includes(productId)) {
            state.recentlyAddedProductIds.push(productId);
          }
        }

        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '添加收藏失敗' };
      })

      // 移除收藏
      .addCase(removeFromFavorites.pending, (state) => {
        state.status = 'loading';
      })
      // .addCase(removeFromFavorites.fulfilled, (state, action) => {
      //   const { id } = action.payload;

      //   // 從收藏列表移除
      //   state.favoritesData.products = state.favoritesData.products.filter(
      //     (product) => product.id !== id
      //   );
      //   state.favoritesData.total = state.favoritesData.products.length;

      //   // 更新產品收藏狀態
      //   const removedProduct = state.favoritesData.products.find(
      //     (product) => product.id === id
      //   );
      //   if (removedProduct && removedProduct.productId) {
      //     state.productFavoriteStatus[removedProduct.productId] = {
      //       isInFavorites: false,
      //       favoriteItem: null,
      //     };

      //     // 從最近添加的列表移除
      //     state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
      //       (productId) => productId !== removedProduct.productId
      //     );
      //   }

      //   state.status = "succeeded";
      //   state.error = null;
      // })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const { id } = action.payload;

        // 先找到要移除的項目，以獲取 productId
        const removedProduct = state.favoritesData.products.find(
          (product) => product.id === id
        );

        // 保存 productId 供後續使用
        const productId = removedProduct ? removedProduct.productId : null;

        // 從收藏列表移除
        state.favoritesData.products = state.favoritesData.products.filter(
          (product) => product.id !== id
        );
        state.favoritesData.total = state.favoritesData.products.length;

        // 如果有獲取到 productId，更新收藏狀態
        if (productId) {
          state.productFavoriteStatus[productId] = {
            isInFavorites: false,
            favoriteItem: null,
          };

          // 從最近添加的列表移除
          state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
            (pid) => pid !== productId
          );
        }

        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '移除收藏失敗' };
      })

      // 更新收藏數量
      .addCase(updateFavoriteItemQuantity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFavoriteItemQuantity.fulfilled, (state, action) => {
        const { id, qty } = action.payload;

        // 更新收藏列表中的數量
        const productIndex = state.favoritesData.products.findIndex(
          (product) => product.id === id
        );

        if (productIndex !== -1) {
          state.favoritesData.products[productIndex].qty = qty;

          // 更新 productFavoriteStatus 中的數據
          const product = state.favoritesData.products[productIndex];
          if (
            product.productId &&
            state.productFavoriteStatus[product.productId]
          ) {
            state.productFavoriteStatus[product.productId].favoriteItem = {
              ...state.productFavoriteStatus[product.productId].favoriteItem,
              qty,
            };
          }
        }

        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(updateFavoriteItemQuantity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '更新收藏數量失敗' };
      })

      // 加入購物車
      .addCase(addFavoriteToCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addFavoriteToCart.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(addFavoriteToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '加入購物車失敗' };
      })

      // 更新收藏顏色
      .addCase(updateFavoriteItemColor.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFavoriteItemColor.fulfilled, (state, action) => {
        const { id, color } = action.payload;

        // 更新收藏列表中的顏色
        const productIndex = state.favoritesData.products.findIndex(
          (product) => product.id === id
        );

        if (productIndex !== -1) {
          state.favoritesData.products[productIndex].color = color;

          // 更新 productFavoriteStatus 中的數據
          const product = state.favoritesData.products[productIndex];
          if (
            product.productId &&
            state.productFavoriteStatus[product.productId]
          ) {
            state.productFavoriteStatus[product.productId].favoriteItem = {
              ...state.productFavoriteStatus[product.productId].favoriteItem,
              color,
            };
          }
        }

        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(updateFavoriteItemColor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '更新收藏顏色失敗' };
      })

      // 更新收藏尺寸
      .addCase(updateFavoriteItemSize.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFavoriteItemSize.fulfilled, (state, action) => {
        const { id, size } = action.payload;

        // 更新收藏列表中的尺寸
        const productIndex = state.favoritesData.products.findIndex(
          (product) => product.id === id
        );

        if (productIndex !== -1) {
          state.favoritesData.products[productIndex].size = size;

          // 更新 productFavoriteStatus 中的數據
          const product = state.favoritesData.products[productIndex];
          if (
            product.productId &&
            state.productFavoriteStatus[product.productId]
          ) {
            state.productFavoriteStatus[product.productId].favoriteItem = {
              ...state.productFavoriteStatus[product.productId].favoriteItem,
              size,
            };
          }
        }

        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(updateFavoriteItemSize.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: '更新收藏尺寸失敗' };
      });
  },
});

// 選擇器
export const selectFavoritesData = (state) =>
  state.favorites?.favoritesData || { total: 0, products: [] };

export const selectFavoritesStatus = (state) =>
  state.favorites?.status || 'idle';

export const selectFavoritesError = (state) => state.favorites?.error || null;

export const selectRecentlyAddedProductIds = (state) =>
  state.favorites?.recentlyAddedProductIds || [];

export const selectIsFavoriteProduct = (state, productId) => {
  // 如果用戶未登入，直接返回 false
  if (!cookieUtils.isUserLoggedIn()) return false;

  // 從 productFavoriteStatus 查找
  return !!state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites;
};

export const selectFavoriteItem = (state, productId) => {
  // 如果用戶未登入，直接返回 null
  if (!cookieUtils.isUserLoggedIn()) return null;

  // 首先從 productFavoriteStatus 查找
  return (
    state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem || null
  );
};

// 獲取產品的收藏狀態詳細信息
export const selectProductFavoriteStatus = (state, productId) => {
  // 如果用戶未登入，直接返回未收藏狀態
  if (!cookieUtils.isUserLoggedIn()) {
    return {
      isInFavorites: false,
      favoriteItem: null,
    };
  }

  // 從 productFavoriteStatus 獲取狀態信息
  return (
    state.favorites?.productFavoriteStatus?.[productId] || {
      isInFavorites: false,
      favoriteItem: null,
    }
  );
};

// Action creators
export const { clearFavorites, resetFavoritesError } = favoritesSlice.actions;

export default favoritesSlice.reducer;
