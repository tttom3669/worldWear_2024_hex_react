import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getUserIdFromCookie,
  isUserLoggedIn,
  getJWTToken,
} from "../components/tools/cookieUtils";

const { VITE_API_PATH: API_PATH } = import.meta.env;

export const getFavorites = createAsyncThunk(
  "favorites/getFavorites",
  async (_, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 中的方法獲取 userId
      const userId = getUserIdFromCookie();

      // 獲取 JWT Token
      const token = getJWTToken();

      console.log("getFavorites - 使用者ID:", userId);
      console.log("getFavorites - Token:", token ? token : "無");

      // 如果沒有獲取到用戶 ID，返回空數據
      if (!userId) {
        console.log("未找到用戶 ID，無法獲取收藏列表");
        return {
          total: 0,
          products: [],
        };
      }

      // 使用手動構建的 headers
      // 嘗試方法 1: 使用標準 Bearer 授權標頭
      try {
        console.log("嘗試方法 1: 使用標準 Bearer 授權標頭");
        const headers = token ? { Authorization: token } : {};

        const response = await axios.get(
          `${API_PATH}/favorites?userId=${userId}&_expand=user&_expand=product`,
          { headers }
        );

        console.log("API 返回收藏數據 (方法1成功):", response.data);

        const favoritesWithProducts = response.data.map((item) => ({
          ...item,
          product: item.product || null,
        }));

        return {
          total: favoritesWithProducts.length,
          products: favoritesWithProducts,
        };
      } catch (error1) {
        console.error("方法 1 失敗:", error1.message);

        // 嘗試方法 2: 使用純 token（無 Bearer 前綴）
        try {
          console.log("嘗試方法 2: 使用純 token（無 Bearer 前綴）");

          // 獲取純 token
          const rawToken =
            token && token.startsWith("Bearer ")
              ? token.substring(7).trim()
              : token;

          const headers = rawToken ? { Authorization: rawToken } : {};

          const response = await axios.get(
            `${API_PATH}/favorites?userId=${userId}&_expand=user&_expand=product`,
            { headers }
          );

          console.log("API 返回收藏數據 (方法2成功):", response.data);

          const favoritesWithProducts = response.data.map((item) => ({
            ...item,
            product: item.product || null,
          }));

          return {
            total: favoritesWithProducts.length,
            products: favoritesWithProducts,
          };
        } catch (error2) {
          console.error("方法 2 失敗:", error2.message);

          // 嘗試方法 3: 直接使用 axios 預設標頭
          try {
            console.log("嘗試方法 3: 直接使用 axios 預設標頭");

            // 設置全局標頭
            if (token) {
              axios.defaults.headers.common["Authorization"] = token;
            }

            const response = await axios.get(
              `${API_PATH}/favorites?userId=${userId}&_expand=user&_expand=product`
            );

            console.log("API 返回收藏數據 (方法3成功):", response.data);

            const favoritesWithProducts = response.data.map((item) => ({
              ...item,
              product: item.product || null,
            }));

            return {
              total: favoritesWithProducts.length,
              products: favoritesWithProducts,
            };
          } catch (error3) {
            console.error("方法 3 失敗:", error3.message);

            // 嘗試方法 4: 不使用授權標頭，只靠 userId 參數
            try {
              console.log("嘗試方法 4: 不使用授權標頭，只靠 userId 參數");

              // 清除授權標頭
              delete axios.defaults.headers.common["Authorization"];

              const response = await axios.get(
                `${API_PATH}/favorites?userId=${userId}&_expand=user&_expand=product`
              );

              console.log("API 返回收藏數據 (方法4成功):", response.data);

              const favoritesWithProducts = response.data.map((item) => ({
                ...item,
                product: item.product || null,
              }));

              return {
                total: favoritesWithProducts.length,
                products: favoritesWithProducts,
              };
            } catch (error4) {
              console.error("所有方法都失敗");

              // 收集所有嘗試的錯誤信息
              const allErrors = [
                { method: "標準 Bearer", error: error1.message },
                { method: "純 token", error: error2.message },
                { method: "axios 預設標頭", error: error3.message },
                { method: "只用 userId", error: error4.message },
              ];

              throw { message: "所有授權方法都嘗試失敗", allErrors };
            }
          }
        }
      }
    } catch (error) {
      console.error("獲取收藏列表失敗:", error);

      // 準備詳細的錯誤信息
      let errorDetails = "";

      if (error.response) {
        errorDetails = `狀態碼: ${error.response.status}, 訊息: ${error.message}`;
        if (error.response.data) {
          errorDetails += `, 回應: ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.allErrors) {
        errorDetails = `嘗試了多種方法但都失敗: ${JSON.stringify(
          error.allErrors
        )}`;
      } else {
        errorDetails = error.message || "未知錯誤";
      }

      console.error("詳細錯誤信息:", errorDetails);

      return rejectWithValue({
        message: "獲取收藏列表失敗，請檢查網絡連接",
        details: errorDetails,
      });
    }
  }
);

// 新增收藏項目
export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (favoriteItem, { rejectWithValue, dispatch }) => {
    try {
      // 使用 cookieUtils 中的方法獲取 userId
      const userId = getUserIdFromCookie();

      // 獲取 JWT Token 並設置 Authorization 標頭
      const token = getJWTToken();
      const headers = token ? { Authorization: token } : {};

      if (!userId) {
        return rejectWithValue("無法獲取用戶ID");
      }

      // 準備要發送的數據
      const favoriteData = {
        userId: userId,
        productId: favoriteItem.productId,
        qty: favoriteItem.qty || 1,
        color: favoriteItem.color || "",
        size: favoriteItem.size || "",
      };

      // 發送 API 請求添加收藏
      const response = await axios.post(`${API_PATH}/favorites`, favoriteData, {
        headers,
      });

      console.log("API 返回新增收藏結果:", response.data);

      // 更新產品收藏狀態
      dispatch(
        updateProductFavoriteStatus({
          productId: favoriteItem.productId,
          isInFavorites: true,
          favoriteItem: response.data,
        })
      );

      // 發送額外請求獲取完整產品資訊
      try {
        const productResponse = await axios.get(
          `${API_PATH}/products/${favoriteItem.productId}`,
          { headers }
        );
        const updatedFavoriteItem = {
          ...response.data,
          product: productResponse.data,
        };

        return updatedFavoriteItem;
      } catch (productError) {
        console.error("獲取產品詳細信息失敗:", productError);
        // 即使獲取產品詳細信息失敗，仍然返回原始收藏項目數據
        return {
          ...response.data,
          product: favoriteItem.product || null,
        };
      }
    } catch (error) {
      console.error("添加收藏失敗:", error);
      return rejectWithValue("添加收藏失敗，請稍後再試");
    }
  }
);

// 移除收藏項目
export const removeFromFavorites = createAsyncThunk(
  "favorites/removeFromFavorites",
  async (id, { getState, rejectWithValue, dispatch }) => {
    try {
      // 獲取 JWT Token 並設置 Authorization 標頭
      const token = getJWTToken();
      const headers = token ? { Authorization: token } : {};

      // 找到要刪除的收藏項目，以獲取其產品 ID
      const favoriteItem = getState().favorites.favoritesData.products.find(
        (item) => item.id === id
      );

      if (!favoriteItem) {
        return rejectWithValue("未找到要刪除的收藏項");
      }

      // 發送 API 請求刪除收藏
      await axios.delete(`${API_PATH}/favorites/${id}`, { headers });

      console.log("成功刪除收藏項目:", id);

      // 如果找到相應的收藏項目，更新其產品的收藏狀態
      if (favoriteItem && favoriteItem.productId) {
        dispatch(
          updateProductFavoriteStatus({
            productId: favoriteItem.productId,
            isInFavorites: false,
            favoriteItem: null,
          })
        );
      }

      // 返回被刪除的收藏項ID
      return { id, productId: favoriteItem?.productId };
    } catch (error) {
      console.error("移除收藏失敗:", error);
      return rejectWithValue("移除收藏失敗，請稍後再試");
    }
  }
);

// 更新收藏項目數量
export const updateFavoriteItemQuantity = createAsyncThunk(
  "favorites/updateFavoriteItemQuantity",
  async ({ id, qty }, { rejectWithValue }) => {
    try {
      // 獲取 JWT Token 並設置 Authorization 標頭
      const token = getJWTToken();
      const headers = token ? { Authorization: token } : {};

      // 確保數量至少為1
      const validQty = Math.max(1, qty);

      // 發送 API 請求更新數量
      const response = await axios.patch(
        `${API_PATH}/favorites/${id}`,
        { qty: validQty },
        { headers }
      );

      console.log("API 返回更新數量結果:", response.data);

      return { id, qty: validQty };
    } catch (error) {
      console.error("更新收藏項目數量失敗:", error);
      return rejectWithValue("更新收藏項目數量失敗，請稍後再試");
    }
  }
);

// 將收藏項目加入購物車
export const addFavoriteToCart = createAsyncThunk(
  "favorites/addFavoriteToCart",
  async (favoriteItem, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 中的方法獲取 userId
      const userId = getUserIdFromCookie();

      // 獲取 JWT Token 並設置 Authorization 標頭
      const token = getJWTToken();
      const headers = token ? { Authorization: token } : {};

      if (!userId) {
        return rejectWithValue("無法獲取用戶ID");
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
      const response = await axios.post(`${API_PATH}/carts`, cartItem, {
        headers,
      });

      console.log("API 返回添加購物車結果:", response.data);

      return { success: true, productId: cartItem.productId };
    } catch (error) {
      console.error("加入購物車失敗:", error);
      return rejectWithValue("加入購物車失敗，請稍後再試");
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
          favoriteItem: null,
        };
      }

      // 使用 cookieUtils 中的方法獲取 userId
      const userId = getUserIdFromCookie();

      // 獲取 JWT Token 並設置 Authorization 標頭
      const token = getJWTToken();
      const headers = token ? { Authorization: token } : {};

      if (!userId) {
        return {
          productId,
          isInFavorites: false,
          favoriteItem: null,
        };
      }

      // 發送 API 請求檢查收藏狀態
      const response = await axios.get(
        `${API_PATH}/favorites?userId=${userId}&productId=${productId}`,
        { headers }
      );

      console.log(`API 返回產品 ${productId} 的收藏狀態:`, response.data);

      // 檢查是否有結果
      const isInFavorites = response.data.length > 0;
      const favoriteItem = isInFavorites ? response.data[0] : null;

      // 更新 UI 狀態
      if (isInFavorites && favoriteItem) {
        dispatch(
          updateProductFavoriteStatus({
            productId,
            isInFavorites: true,
            favoriteItem,
          })
        );
      }

      return {
        productId,
        isInFavorites,
        favoriteItem: favoriteItem || null,
      };
    } catch (error) {
      console.error("檢查收藏狀態失敗:", error);
      // 返回默認值而不是錯誤
      return {
        productId,
        isInFavorites: false,
        favoriteItem: null,
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
        favoriteItem: favoriteItem || null,
      };

      // 將產品 ID 添加到最近收藏的列表中
      if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
        state.recentlyAddedProductIds.push(productId);
      } else if (!isInFavorites) {
        // 如果移除收藏，則從最近添加的產品列表中移除
        state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
          (pid) => pid !== productId
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
          (product) => product.id === action.payload.id
        );

        if (existingProductIndex === -1) {
          state.favoritesData.products.push(action.payload);
          state.favoritesData.total = state.favoritesData.products.length;
        }

        // 更新產品收藏狀態
        if (productId) {
          state.productFavoriteStatus[productId] = {
            isInFavorites: true,
            favoriteItem: action.payload,
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
              (product) => product.id !== action.payload.id
            );
            state.favoritesData.total = state.favoritesData.products.length;
          }

          // 更新產品收藏狀態
          if (action.payload.productId) {
            if (state.productFavoriteStatus[action.payload.productId]) {
              state.productFavoriteStatus[action.payload.productId] = {
                isInFavorites: false,
                favoriteItem: null,
              };
            }

            // 從最近添加的列表中移除
            state.recentlyAddedProductIds =
              state.recentlyAddedProductIds.filter(
                (id) => id !== action.payload.productId
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
            favoriteItem: action.payload.favoriteItem,
          };
        }
      });
  },
});

// 選擇器 - 添加安全檢查
export const favoritesData = (state) =>
  state.favorites?.favoritesData || { total: 0, products: [] };

export const favoritesStatus = (state) => state.favorites?.status || "idle";

export const favoritesError = (state) => state.favorites?.error || null;

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
  return (
    state.favorites?.favoritesData?.products?.some(
      (item) => item.productId === productId
    ) || false
  );
};

export const getFavoriteItem = (state, productId) => {
  // 如果用戶未登入，直接返回 null
  if (!isUserLoggedIn()) return null;

  // 首先從 productFavoriteStatus 查找，這是最精確的
  if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
    return state.favorites.productFavoriteStatus[productId].favoriteItem;
  }

  // 如果沒有在狀態中找到，則查詢收藏列表
  return (
    state.favorites?.favoritesData?.products?.find(
      (item) => item.productId === productId
    ) || null
  );
};

// 獲取產品的收藏狀態詳細信息
export const getProductFavoriteStatus = (state, productId) => {
  // 如果用戶未登入，直接返回未收藏狀態
  if (!isUserLoggedIn()) {
    return { isInFavorites: false, favoriteItem: null };
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
export const {
  setFavoritesData,
  resetFavoritesError,
  clearRecentlyAddedProducts,
  updateProductFavoriteStatus,
  clearFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
// // 導入新的 cookieUtils
// import cookieUtils, {
//   getJWTToken,
//   getUserIdFromCookie,
//   isUserLoggedIn
// } from "../components/tools/cookieUtils";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 設置和獲取 axios 請求頭中的 Authorization
// const ensureAuthHeader = () => {
//   // 使用 cookieUtils 中的 getJWTToken 函數
//   const token = getJWTToken();

//   if (token) {
//     try {
//       // 設置 axios 默認請求頭
//       axios.defaults.headers.common["Authorization"] = token;
//       console.log(
//         "favoritesSlice: 已設置 Authorization header",
//         token.substring(0, 15) + "..."
//       );
//       return token;
//     } catch (error) {
//       console.error(
//         "favoritesSlice: 設置 Authorization header 時發生錯誤",
//         error
//       );
//       delete axios.defaults.headers.common["Authorization"];
//       return null;
//     }
//   }

//   console.log("favoritesSlice: 未找到 token，無法設置 Authorization header");
//   delete axios.defaults.headers.common["Authorization"];
//   return null;
// };

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       // 檢查用戶是否已登入，如果未登入，直接返回空數據
//       if (!isUserLoggedIn()) {
//         console.log("用戶未登入，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       // 如果沒有獲取到用戶 ID，返回空數據
//       if (!userId) {
//         console.log("未找到用戶 ID，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       // 每次請求前獲取最新的 token
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("無法獲取授權 token，請重新登入");
//       }

//       console.log("獲取收藏列表，使用者ID:", userId, "Token:", authToken.substring(0, 15) + "...");

//       // 使用 axios 發送請求，明確設置請求頭
//       const response = await axios.get(
//         `${API_PATH}/favorites`,
//         {
//           params: {
//             userId: userId,
//             _expand: 'user',
//             _expand: 'product'
//           },
//           headers: {
//             Authorization: authToken,
//             "Content-Type": "application/json"
//           }
//         }
//       );

//       console.log("API 返回收藏數據:", response.data);

//       // 處理 API 返回的數據
//       const favoritesWithProducts = response.data.map((item) => ({
//         ...item,
//         // 確保有基本的產品信息
//         product: item.product || null,
//       }));

//       return {
//         total: favoritesWithProducts.length,
//         products: favoritesWithProducts,
//       };
//     } catch (error) {
//       console.error(
//         "獲取收藏列表失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data.message || error.message,
//               config: {
//                 url: error.response.config.url,
//                 method: error.response.config.method,
//                 hasAuthHeader: !!error.response.config.headers.Authorization,
//               },
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           // 處理 401 錯誤 - 未授權
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(
//           error.response.data.message || "獲取收藏列表失敗"
//         );
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue("獲取收藏列表失敗，請檢查網絡連接");
//     }
//   }
// );
// // 新增收藏項目
// export const addToFavorites = createAsyncThunk(
//   "favorites/addToFavorites",
//   async (favoriteItem, { rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const favoriteData = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//       };

//       // 發送 API 請求添加收藏 - 使用正確的 URL 格式，並明確傳遞 headers
//       const response = await axios.post(`${API_PATH}/favorites`, favoriteData, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("API 返回新增收藏結果:", response.data);

//       // 更新產品收藏狀態
//       dispatch(
//         updateProductFavoriteStatus({
//           productId: favoriteItem.productId,
//           isInFavorites: true,
//           favoriteItem: response.data,
//         })
//       );

//       // 發送額外請求獲取完整產品資訊
//       try {
//         const productResponse = await axios.get(
//           `${API_PATH}/products/${favoriteItem.productId}`
//         );
//         const updatedFavoriteItem = {
//           ...response.data,
//           product: productResponse.data,
//         };

//         return updatedFavoriteItem;
//       } catch (productError) {
//         console.error("獲取產品詳細信息失敗:", productError);
//         // 即使獲取產品詳細信息失敗，仍然返回原始收藏項目數據
//         return {
//           ...response.data,
//           product: favoriteItem.product || null,
//         };
//       }
//     } catch (error) {
//       console.error(
//         "添加收藏失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "添加收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "添加收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 移除收藏項目
// export const removeFromFavorites = createAsyncThunk(
//   "favorites/removeFromFavorites",
//   async (id, { getState, rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 找到要刪除的收藏項目，以獲取其產品 ID
//       const favoriteItem = getState().favorites.favoritesData.products.find(
//         (item) => item.id === id
//       );

//       if (!favoriteItem) {
//         return rejectWithValue("未找到要刪除的收藏項");
//       }

//       // 發送 API 請求刪除收藏，明確傳遞 headers
//       await axios.delete(`${API_PATH}/favorites/${id}`, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("成功刪除收藏項目:", id);

//       // 如果找到相應的收藏項目，更新其產品的收藏狀態
//       if (favoriteItem && favoriteItem.productId) {
//         dispatch(
//           updateProductFavoriteStatus({
//             productId: favoriteItem.productId,
//             isInFavorites: false,
//             favoriteItem: null,
//           })
//         );
//       }

//       // 返回被刪除的收藏項ID
//       return { id, productId: favoriteItem?.productId };
//     } catch (error) {
//       console.error(
//         "移除收藏失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "移除收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "移除收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, qty }, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 發送 API 請求更新數量 - 使用 PATCH 方法和正確的 URL 格式，明確傳遞 headers
//       const response = await axios.patch(
//         `${API_PATH}/favorites/${id}`,
//         { qty: validQty },
//         {
//           headers: {
//             Authorization: authToken,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("API 返回更新數量結果:", response.data);

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error(
//         "更新收藏項目數量失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(
//           error.response.data.message || "更新收藏項目數量失敗"
//         );
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(
//         error.message || "更新收藏項目數量失敗，請檢查網絡連接"
//       );
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       // 發送 API 請求添加到購物車 - 確保使用正確的 URL 格式，明確傳遞 headers
//       const response = await axios.post(`${API_PATH}/carts`, cartItem, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("API 返回添加購物車結果:", response.data);

//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error(
//         "加入購物車失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "加入購物車失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "加入購物車失敗，請檢查網絡連接");
//     }
//   }
// );

// // 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       // 如果用戶未登入或無 token，直接返回未收藏狀態
//       if (!isUserLoggedIn() || !authToken) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       // 發送 API 請求檢查收藏狀態 - 使用正確的查詢參數格式，明確傳遞 headers
//       const response = await axios.get(`${API_PATH}/favorites`, {
//         params: {
//           userId: userId,
//           productId: productId,
//         },
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log(`API 返回產品 ${productId} 的收藏狀態:`, response.data);

//       // 檢查是否有結果
//       const isInFavorites = response.data.length > 0;
//       const favoriteItem = isInFavorites ? response.data[0] : null;

//       // 更新 UI 狀態
//       if (isInFavorites && favoriteItem) {
//         dispatch(
//           updateProductFavoriteStatus({
//             productId,
//             isInFavorites: true,
//             favoriteItem,
//           })
//         );
//       }

//       return {
//         productId,
//         isInFavorites,
//         favoriteItem: favoriteItem || null,
//       };
//     } catch (error) {
//       console.error(
//         "檢查收藏狀態失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 返回默認值而不是錯誤
//       return {
//         productId,
//         isInFavorites: false,
//         favoriteItem: null,
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
//   productFavoriteStatus: {}, // 存儲產品 ID 到收藏狀態的映射
// };

// // 創建slice
// const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據
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

//       // 將產品收藏狀態存儲到 productFavoriteStatus
//       state.productFavoriteStatus[productId] = {
//         isInFavorites,
//         favoriteItem: favoriteItem || null,
//       };

//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           (pid) => pid !== productId
//         );
//       }
//     },
//     // 清空收藏列表
//     clearFavorites(state) {
//       state.favoritesData = {
//         total: 0,
//         products: [],
//       };
//       state.recentlyAddedProductIds = [];
//       state.productFavoriteStatus = {};
//     },
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

//         // 更新產品收藏狀態
//         action.payload.products.forEach((item) => {
//           if (item.productId) {
//             state.productFavoriteStatus[item.productId] = {
//               isInFavorites: true,
//               favoriteItem: item,
//             };
//           }
//         });
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

//         // 更新收藏列表
//         const existingProductIndex = state.favoritesData.products.findIndex(
//           (product) => product.id === action.payload.id
//         );

//         if (existingProductIndex === -1) {
//           state.favoritesData.products.push(action.payload);
//           state.favoritesData.total = state.favoritesData.products.length;
//         }

//         // 更新產品收藏狀態
//         if (productId) {
//           state.productFavoriteStatus[productId] = {
//             isInFavorites: true,
//             favoriteItem: action.payload,
//           };
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
//         if (action.payload) {
//           // 移除收藏項目
//           if (action.payload.id) {
//             state.favoritesData.products = state.favoritesData.products.filter(
//               (product) => product.id !== action.payload.id
//             );
//             state.favoritesData.total = state.favoritesData.products.length;
//           }

//           // 更新產品收藏狀態
//           if (action.payload.productId) {
//             if (state.productFavoriteStatus[action.payload.productId]) {
//               state.productFavoriteStatus[action.payload.productId] = {
//                 isInFavorites: false,
//                 favoriteItem: null,
//               };
//             }

//             // 從最近添加的列表中移除
//             state.recentlyAddedProductIds =
//               state.recentlyAddedProductIds.filter(
//                 (id) => id !== action.payload.productId
//               );
//           }
//         }

//         state.status = "succeeded";
//         state.error = null;
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

//           // 同時更新 productFavoriteStatus 中的數據
//           const product = state.favoritesData.products[productIndex];
//           if (
//             product.productId &&
//             state.productFavoriteStatus[product.productId]
//           ) {
//             state.productFavoriteStatus[product.productId].favoriteItem = {
//               ...state.productFavoriteStatus[product.productId].favoriteItem,
//               qty,
//             };
//           }
//         }
//         state.status = "succeeded";
//         state.error = null;
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
//         state.error = null;
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
//         // 更新產品收藏狀態
//         if (action.payload && action.payload.productId) {
//           state.productFavoriteStatus[action.payload.productId] = {
//             isInFavorites: action.payload.isInFavorites,
//             favoriteItem: action.payload.favoriteItem,
//           };
//         }
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

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites) {
//     return true;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return (
//     state.favorites?.favoritesData?.products?.some(
//       (item) => item.productId === productId
//     ) || false
//   );
// };

// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
//     return state.favorites.productFavoriteStatus[productId].favoriteItem;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return (
//     state.favorites?.favoritesData?.products?.find(
//       (item) => item.productId === productId
//     ) || null
//   );
// };

// // 獲取產品的收藏狀態詳細信息
// export const getProductFavoriteStatus = (state, productId) => {
//   // 如果用戶未登入，直接返回未收藏狀態
//   if (!isUserLoggedIn()) {
//     return { isInFavorites: false, favoriteItem: null };
//   }

//   // 從 productFavoriteStatus 獲取狀態信息
//   return (
//     state.favorites?.productFavoriteStatus?.[productId] || {
//       isInFavorites: false,
//       favoriteItem: null,
//     }
//   );
// };

// // Action creators
// export const {
//   setFavoritesData,
//   resetFavoritesError,
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus,
//   clearFavorites,
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 從 Cookie 獲取 token - 使用與購物車相同的 regex 方式
// const getAuthToken = () => {
//   const token = document.cookie.replace(
//     /(?:(?:^|.*;\s*)worldWearToken\s*\=\s*([^;]*).*$)|^.*$/,
//     "$1"
//   );

//   // 新增：確保返回有效的 token，避免返回空字符串
//   return token || null;
// };

// // 從 Cookie 獲取用戶 ID - 使用與購物車相同的 regex 方式
// const getUserIdFromCookie = () => {
//   const userId = document.cookie.replace(
//     /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
//     "$1"
//   );

//   // 新增：確保返回有效的 userId，避免返回空字符串
//   return userId || null;
// };

// // 檢查用戶是否已登入 - 檢查 Cookie 中的 userId 和 token
// const isUserLoggedIn = () => {
//   const userId = getUserIdFromCookie();
//   const token = getAuthToken();
//   // 新增：同時檢查 userId 和 token 是否存在
//   return !!userId && !!token;
// };

// // 設置和獲取 axios 請求頭中的 Authorization
// const ensureAuthHeader = () => {
//   // 從 Cookie 獲取 token
//   const token = getAuthToken();

//   if (token) {
//     try {
//       // 確保 token 格式正確
//       const formattedToken = token.startsWith("Bearer ")
//         ? token
//         : `Bearer ${token}`;
//       axios.defaults.headers.common["Authorization"] = formattedToken;
//       console.log(
//         "favoritesSlice: 已設置 Authorization header",
//         formattedToken.substring(0, 15) + "..."
//       );
//       return formattedToken;
//     } catch (error) {
//       console.error(
//         "favoritesSlice: 設置 Authorization header 時發生錯誤",
//         error
//       );
//       delete axios.defaults.headers.common["Authorization"];
//       return null;
//     }
//   }

//   console.log("favoritesSlice: 未找到 token，無法設置 Authorization header");
//   delete axios.defaults.headers.common["Authorization"];
//   return null;
// };

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         console.log("未設置有效的 Authorization token，可能無法通過 API 驗證");
//       }

//       // 檢查用戶是否已登入，如果未登入，直接返回空數據
//       if (!isUserLoggedIn()) {
//         console.log("用戶未登入，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       // 如果沒有獲取到用戶 ID，返回空數據
//       if (!userId) {
//         console.log("未找到用戶 ID，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       console.log("獲取收藏列表，使用者ID:", userId);

//       // 使用與購物車相同的 API 請求方式獲取收藏列表
//       // 新增：使用單獨的 headers 參數，確保包含 Authorization
//       const response = await axios.get(
//         `${API_PATH}/favorites?userId=${userId}&_expand=user&_expand=product`,
//         {
//           headers: {
//             Authorization: authToken,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("API 返回收藏數據:", response.data);

//       // 處理 API 返回的數據
//       const favoritesWithProducts = response.data.map((item) => ({
//         ...item,
//         // 確保有基本的產品信息
//         product: item.product || null,
//       }));

//       return {
//         total: favoritesWithProducts.length,
//         products: favoritesWithProducts,
//       };
//     } catch (error) {
//       console.error(
//         "獲取收藏列表失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data.message || error.message,
//               config: {
//                 url: error.response.config.url,
//                 method: error.response.config.method,
//                 hasAuthHeader: !!error.response.config.headers.Authorization,
//               },
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           // 處理 401 錯誤 - 未授權
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(
//           error.response.data.message || "獲取收藏列表失敗"
//         );
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue("獲取收藏列表失敗，請檢查網絡連接");
//     }
//   }
// );

// // 新增收藏項目
// export const addToFavorites = createAsyncThunk(
//   "favorites/addToFavorites",
//   async (favoriteItem, { rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const favoriteData = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//       };

//       // 發送 API 請求添加收藏 - 使用正確的 URL 格式，並明確傳遞 headers
//       const response = await axios.post(`${API_PATH}/favorites`, favoriteData, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("API 返回新增收藏結果:", response.data);

//       // 更新產品收藏狀態
//       dispatch(
//         updateProductFavoriteStatus({
//           productId: favoriteItem.productId,
//           isInFavorites: true,
//           favoriteItem: response.data,
//         })
//       );

//       // 發送額外請求獲取完整產品資訊
//       try {
//         const productResponse = await axios.get(
//           `${API_PATH}/products/${favoriteItem.productId}`
//         );
//         const updatedFavoriteItem = {
//           ...response.data,
//           product: productResponse.data,
//         };

//         return updatedFavoriteItem;
//       } catch (productError) {
//         console.error("獲取產品詳細信息失敗:", productError);
//         // 即使獲取產品詳細信息失敗，仍然返回原始收藏項目數據
//         return {
//           ...response.data,
//           product: favoriteItem.product || null,
//         };
//       }
//     } catch (error) {
//       console.error(
//         "添加收藏失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "添加收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "添加收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 移除收藏項目
// export const removeFromFavorites = createAsyncThunk(
//   "favorites/removeFromFavorites",
//   async (id, { getState, rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 找到要刪除的收藏項目，以獲取其產品 ID
//       const favoriteItem = getState().favorites.favoritesData.products.find(
//         (item) => item.id === id
//       );

//       if (!favoriteItem) {
//         return rejectWithValue("未找到要刪除的收藏項");
//       }

//       // 發送 API 請求刪除收藏，明確傳遞 headers
//       await axios.delete(`${API_PATH}/favorites/${id}`, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("成功刪除收藏項目:", id);

//       // 如果找到相應的收藏項目，更新其產品的收藏狀態
//       if (favoriteItem && favoriteItem.productId) {
//         dispatch(
//           updateProductFavoriteStatus({
//             productId: favoriteItem.productId,
//             isInFavorites: false,
//             favoriteItem: null,
//           })
//         );
//       }

//       // 返回被刪除的收藏項ID
//       return { id, productId: favoriteItem?.productId };
//     } catch (error) {
//       console.error(
//         "移除收藏失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "移除收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "移除收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, qty }, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 發送 API 請求更新數量 - 使用 PATCH 方法和正確的 URL 格式，明確傳遞 headers
//       const response = await axios.patch(
//         `${API_PATH}/favorites/${id}`,
//         { qty: validQty },
//         {
//           headers: {
//             Authorization: authToken,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("API 返回更新數量結果:", response.data);

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error(
//         "更新收藏項目數量失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(
//           error.response.data.message || "更新收藏項目數量失敗"
//         );
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(
//         error.message || "更新收藏項目數量失敗，請檢查網絡連接"
//       );
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       if (!authToken) {
//         return rejectWithValue("身份驗證失敗，請重新登入");
//       }

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       // 發送 API 請求添加到購物車 - 確保使用正確的 URL 格式，明確傳遞 headers
//       const response = await axios.post(`${API_PATH}/carts`, cartItem, {
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("API 返回添加購物車結果:", response.data);

//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error(
//         "加入購物車失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         if (error.response.status === 401) {
//           return rejectWithValue("身份驗證失敗，請重新登入");
//         }
//         return rejectWithValue(error.response.data.message || "加入購物車失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "加入購物車失敗，請檢查網絡連接");
//     }
//   }
// );

// // 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       const authToken = ensureAuthHeader();

//       // 如果用戶未登入或無 token，直接返回未收藏狀態
//       if (!isUserLoggedIn() || !authToken) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       // 從 Cookie 獲取用戶 ID
//       const userId = getUserIdFromCookie();

//       if (!userId) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null,
//         };
//       }

//       // 發送 API 請求檢查收藏狀態 - 使用正確的查詢參數格式，明確傳遞 headers
//       const response = await axios.get(`${API_PATH}/favorites`, {
//         params: {
//           userId: userId,
//           productId: productId,
//         },
//         headers: {
//           Authorization: authToken,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log(`API 返回產品 ${productId} 的收藏狀態:`, response.data);

//       // 檢查是否有結果
//       const isInFavorites = response.data.length > 0;
//       const favoriteItem = isInFavorites ? response.data[0] : null;

//       // 更新 UI 狀態
//       if (isInFavorites && favoriteItem) {
//         dispatch(
//           updateProductFavoriteStatus({
//             productId,
//             isInFavorites: true,
//             favoriteItem,
//           })
//         );
//       }

//       return {
//         productId,
//         isInFavorites,
//         favoriteItem: favoriteItem || null,
//       };
//     } catch (error) {
//       console.error(
//         "檢查收藏狀態失敗:",
//         error.response
//           ? {
//               status: error.response.status,
//               message: error.response.data?.message || error.message,
//             }
//           : error.message
//       );

//       // 返回默認值而不是錯誤
//       return {
//         productId,
//         isInFavorites: false,
//         favoriteItem: null,
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
//   productFavoriteStatus: {}, // 存儲產品 ID 到收藏狀態的映射
// };

// // 創建slice
// const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據
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

//       // 將產品收藏狀態存儲到 productFavoriteStatus
//       state.productFavoriteStatus[productId] = {
//         isInFavorites,
//         favoriteItem: favoriteItem || null,
//       };

//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           (pid) => pid !== productId
//         );
//       }
//     },
//     // 清空收藏列表
//     clearFavorites(state) {
//       state.favoritesData = {
//         total: 0,
//         products: [],
//       };
//       state.recentlyAddedProductIds = [];
//       state.productFavoriteStatus = {};
//     },
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

//         // 更新產品收藏狀態
//         action.payload.products.forEach((item) => {
//           if (item.productId) {
//             state.productFavoriteStatus[item.productId] = {
//               isInFavorites: true,
//               favoriteItem: item,
//             };
//           }
//         });
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

//         // 更新收藏列表
//         const existingProductIndex = state.favoritesData.products.findIndex(
//           (product) => product.id === action.payload.id
//         );

//         if (existingProductIndex === -1) {
//           state.favoritesData.products.push(action.payload);
//           state.favoritesData.total = state.favoritesData.products.length;
//         }

//         // 更新產品收藏狀態
//         if (productId) {
//           state.productFavoriteStatus[productId] = {
//             isInFavorites: true,
//             favoriteItem: action.payload,
//           };
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
//         if (action.payload) {
//           // 移除收藏項目
//           if (action.payload.id) {
//             state.favoritesData.products = state.favoritesData.products.filter(
//               (product) => product.id !== action.payload.id
//             );
//             state.favoritesData.total = state.favoritesData.products.length;
//           }

//           // 更新產品收藏狀態
//           if (action.payload.productId) {
//             if (state.productFavoriteStatus[action.payload.productId]) {
//               state.productFavoriteStatus[action.payload.productId] = {
//                 isInFavorites: false,
//                 favoriteItem: null,
//               };
//             }

//             // 從最近添加的列表中移除
//             state.recentlyAddedProductIds =
//               state.recentlyAddedProductIds.filter(
//                 (id) => id !== action.payload.productId
//               );
//           }
//         }

//         state.status = "succeeded";
//         state.error = null;
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

//           // 同時更新 productFavoriteStatus 中的數據
//           const product = state.favoritesData.products[productIndex];
//           if (
//             product.productId &&
//             state.productFavoriteStatus[product.productId]
//           ) {
//             state.productFavoriteStatus[product.productId].favoriteItem = {
//               ...state.productFavoriteStatus[product.productId].favoriteItem,
//               qty,
//             };
//           }
//         }
//         state.status = "succeeded";
//         state.error = null;
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
//         state.error = null;
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
//         // 更新產品收藏狀態
//         if (action.payload && action.payload.productId) {
//           state.productFavoriteStatus[action.payload.productId] = {
//             isInFavorites: action.payload.isInFavorites,
//             favoriteItem: action.payload.favoriteItem,
//           };
//         }
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

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites) {
//     return true;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return (
//     state.favorites?.favoritesData?.products?.some(
//       (item) => item.productId === productId
//     ) || false
//   );
// };

// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
//     return state.favorites.productFavoriteStatus[productId].favoriteItem;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return (
//     state.favorites?.favoritesData?.products?.find(
//       (item) => item.productId === productId
//     ) || null
//   );
// };

// // 獲取產品的收藏狀態詳細信息
// export const getProductFavoriteStatus = (state, productId) => {
//   // 如果用戶未登入，直接返回未收藏狀態
//   if (!isUserLoggedIn()) {
//     return { isInFavorites: false, favoriteItem: null };
//   }

//   // 從 productFavoriteStatus 獲取狀態信息
//   return (
//     state.favorites?.productFavoriteStatus?.[productId] || {
//       isInFavorites: false,
//       favoriteItem: null,
//     }
//   );
// };

// // Action creators
// export const {
//   setFavoritesData,
//   resetFavoritesError,
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus,
//   clearFavorites,
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;

// ---------------------------------
// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 從 Cookie 獲取 token
// const getAuthToken = () => {
//   return document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("worldWearToken="))
//     ?.split("=")[1];
// };

// // 從 Cookie 獲取用戶 ID
// const getUserIdFromCookie = () => {
//   return document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("worldWearUserId="))
//     ?.split("=")[1];
// };

// // 獲取用戶ID的輔助函數 - 優先從 Cookie 獲取，其次從 localStorage 獲取
// const getUserId = () => {
//   // 優先從 Cookie 獲取
//   const userIdFromCookie = getUserIdFromCookie();
//   if (userIdFromCookie) {
//     return userIdFromCookie;
//   }

//   // 其次從本地存儲獲取用戶資訊
//   const userString = localStorage.getItem('user');
//   if (!userString) return '';

//   try {
//     const user = JSON.parse(userString);
//     return user.id || '';
//   } catch (e) {
//     console.error('解析用戶資訊失敗:', e);
//     return '';
//   }
// };

// // 檢查用戶是否已登入 - 優先使用 Cookie，其次使用本地存儲
// const isUserLoggedIn = () => {
//   // 檢查 Cookie 中的 token 和 userId
//   const tokenFromCookie = getAuthToken();
//   const userIdFromCookie = getUserIdFromCookie();

//   if (tokenFromCookie && userIdFromCookie) {
//     return true;
//   }

//   // 如果 Cookie 中沒有，則檢查 localStorage
//   const token = localStorage.getItem('token');
//   const user = localStorage.getItem('user');
//   return !!(token && user);
// };

// // 確保 Authorization 頭包含 token
// const ensureAuthHeader = () => {
//   // 優先從 Cookie 獲取 token
//   const tokenFromCookie = getAuthToken();

//   // 如果 Cookie 中沒有找到，則從 localStorage 獲取
//   const tokenFromStorage = tokenFromCookie || localStorage.getItem('token');

//   if (tokenFromStorage) {
//     // 確保 token 格式正確 (以 Bearer 開頭)
//     const formattedToken = tokenFromStorage.startsWith('Bearer ')
//       ? tokenFromStorage
//       : `Bearer ${tokenFromStorage}`;

//     axios.defaults.headers.common['Authorization'] = formattedToken;
//     console.log('favoritesSlice: 已設置 Authorization header');
//     return formattedToken;
//   }

//   console.log('favoritesSlice: 未找到 token，無法設置 Authorization header');
//   delete axios.defaults.headers.common['Authorization'];
//   return null;
// };

// // 模擬資料庫中的收藏列表數據
// // 這裡預先填充一些收藏資料，與資料庫中的用戶ID關聯
// let dbFavorites = [
//   {
//     id: "fav_001",
//     userId: "pqyfZ3sGxjTKmTSjmCAKa", // admin 用戶的ID (worldwear@gmail.com)
//     productId: "product001",
//     qty: 1,
//     color: "黑色",
//     size: "M",
//     product: {
//       id: "product001",
//       name: "經典棉質T恤",
//       price: 590,
//       image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//       color: "黑色",
//       size: "M"
//     }
//   },
//   {
//     id: "fav_002",
//     userId: "pqyfZ3sGxjTKmTSjmCAKa", // admin 用戶的ID (worldwear@gmail.com)
//     productId: "product002",
//     qty: 2,
//     color: "藍色",
//     size: "L",
//     product: {
//       id: "product002",
//       name: "休閒牛仔褲",
//       price: 1280,
//       image: "https://i.meee.com.tw/m6YmbY2.jpg",
//       color: "藍色",
//       size: "L"
//     }
//   },
//   {
//     id: "fav_003",
//     userId: "pbs5UHdZo7Th7_BStU-o9", // test 用戶的ID (test@gmail.com)
//     productId: "product003",
//     qty: 1,
//     color: "白色",
//     size: "XL",
//     product: {
//       id: "product003",
//       name: "法蘭絨短版襯衫",
//       price: 1280,
//       image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//       color: "白色",
//       size: "XL"
//     }
//   }
// ];

// // 為新註冊用戶初始化收藏列表數據的函數
// export const initUserFavorites = (userId) => {
//   // 檢查是否已經有此用戶的收藏數據
//   const existingUserFavorites = dbFavorites.some(fav => fav.userId === userId);

//   // 如果此用戶還沒有收藏數據，為他創建一個示例收藏項目
//   if (!existingUserFavorites) {
//     const newFavoriteItem = {
//       id: `fav_new_${Date.now()}`,
//       userId: userId,
//       productId: "product004",
//       qty: 1,
//       color: "綠色",
//       size: "M",
//       product: {
//         id: "product004",
//         name: "時尚連帽外套",
//         price: 1580,
//         image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//         color: "綠色",
//         size: "M"
//       }
//     };

//     dbFavorites.push(newFavoriteItem);
//     console.log("為新用戶創建示例收藏項目:", userId);
//   }
// };

// // 獲取收藏列表數據
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
//       if (!isUserLoggedIn()) {
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // 獲取當前登入用戶的ID
//       const userId = getUserId();
//       console.log("獲取收藏列表，使用者ID:", userId);

//       // 篩選出屬於當前用戶的收藏項目
//       const userFavorites = dbFavorites.filter(fav => fav.userId === userId);

//       return {
//         total: userFavorites.length,
//         products: userFavorites,
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);
//       // 返回空數據而不是拋出錯誤
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
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 檢查並確保必要字段的存在
//       const item = {
//         id: `fav_${Date.now()}`, // 生成唯一ID
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//         product: favoriteItem.product || null,
//       };

//       // 檢查是否已經收藏過該產品
//       const existingFavorite = dbFavorites.find(
//         fav => fav.userId === userId && fav.productId === item.productId
//       );

//       // 如果已經收藏過，則返回現有記錄而不是創建新記錄
//       if (existingFavorite) {
//         return existingFavorite;
//       }

//       // 添加到模擬資料庫收藏列表
//       dbFavorites.push(item);

//       console.log("新增收藏成功:", item);

//       return item;
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
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 查找要刪除的項目，確保它屬於當前用戶
//       const favoriteToRemove = dbFavorites.find(fav => fav.id === id && fav.userId === userId);
//       if (!favoriteToRemove) {
//         return rejectWithValue("未找到要刪除的收藏項");
//       }

//       // 從模擬資料庫中刪除
//       dbFavorites = dbFavorites.filter(fav => !(fav.id === id && fav.userId === userId));

//       console.log("刪除收藏成功:", id);

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
//   async ({ id, qty }, { rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 更新模擬數據，但僅限於當前用戶的收藏項
//       const favoriteToUpdate = dbFavorites.find(fav => fav.id === id && fav.userId === userId);
//       if (!favoriteToUpdate) {
//         return rejectWithValue("未找到要更新的收藏項");
//       }

//       favoriteToUpdate.qty = validQty;

//       console.log("更新收藏數量成功:", id, validQty);

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
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       // 這裡可以實現模擬加入購物車的邏輯
//       console.log("加入購物車成功:", cartItem);

//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);
//       return rejectWithValue(error.message || "加入購物車失敗");
//     }
//   }
// );

// // 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch }) => {
//     try {
//       // 確保設置 Authorization header
//       ensureAuthHeader();

//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!isUserLoggedIn()) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null
//         };
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 200));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 檢查產品是否已在當前用戶的收藏列表中
//       const favoriteItem = dbFavorites.find(
//         fav => fav.userId === userId && fav.productId === productId
//       );

//       const isInFavorites = !!favoriteItem;

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
//   productFavoriteStatus: {}, // 存儲產品 ID 到收藏狀態的映射
// };

// // 創建slice
// export const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據
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

//       // 將產品收藏狀態存儲到 productFavoriteStatus
//       state.productFavoriteStatus[productId] = {
//         isInFavorites,
//         favoriteItem: favoriteItem || null
//       };

//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           pid => pid !== productId
//         );
//       }
//     },
//     // 清空收藏列表（新增）
//     clearFavorites(state) {
//       state.favoritesData = {
//         total: 0,
//         products: [],
//       };
//       state.recentlyAddedProductIds = [];
//       state.productFavoriteStatus = {};
//       // 注意：這裡僅清空當前用戶在Redux狀態中的收藏列表，但不會影響模擬資料庫中的數據
//     },
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

//         // 更新產品收藏狀態
//         action.payload.products.forEach(item => {
//           if (item.productId) {
//             state.productFavoriteStatus[item.productId] = {
//               isInFavorites: true,
//               favoriteItem: item
//             };
//           }
//         });
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

//         // 更新收藏列表
//         const existingProductIndex = state.favoritesData.products.findIndex(
//           product => product.id === action.payload.id
//         );

//         if (existingProductIndex === -1) {
//           state.favoritesData.products.push(action.payload);
//           state.favoritesData.total = state.favoritesData.products.length;
//         }

//         // 更新產品收藏狀態
//         if (productId) {
//           state.productFavoriteStatus[productId] = {
//             isInFavorites: true,
//             favoriteItem: action.payload
//           };
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
//         // 找到要刪除的收藏項目以獲取其產品 ID
//         const favoriteToRemove = state.favoritesData.products.find(
//           item => item.id === action.payload.id
//         );

//         // 如果找到了該收藏項目
//         if (favoriteToRemove && favoriteToRemove.productId) {
//           // 更新產品收藏狀態
//           if (state.productFavoriteStatus[favoriteToRemove.productId]) {
//             state.productFavoriteStatus[favoriteToRemove.productId] = {
//               isInFavorites: false,
//               favoriteItem: null
//             };
//           }

//           // 從最近添加的列表中移除
//           state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//             id => id !== favoriteToRemove.productId
//           );
//         }

//         // 從收藏列表中移除
//         state.favoritesData.products = state.favoritesData.products.filter(
//           product => product.id !== action.payload.id
//         );
//         state.favoritesData.total = state.favoritesData.products.length;

//         state.status = "succeeded";
//         state.error = null;
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

//           // 同時更新 productFavoriteStatus 中的數據
//           const product = state.favoritesData.products[productIndex];
//           if (product.productId && state.productFavoriteStatus[product.productId]) {
//             state.productFavoriteStatus[product.productId].favoriteItem = {
//               ...state.productFavoriteStatus[product.productId].favoriteItem,
//               qty
//             };
//           }
//         }
//         state.status = "succeeded";
//         state.error = null;
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
//         state.error = null;
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
//         // 更新產品收藏狀態
//         if (action.payload && action.payload.productId) {
//           state.productFavoriteStatus[action.payload.productId] = {
//             isInFavorites: action.payload.isInFavorites,
//             favoriteItem: action.payload.favoriteItem
//           };
//         }
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };

// export const favoritesStatus = (state) =>
//   state.favorites?.status || "idle";

// export const favoritesError = (state) =>
//   state.favorites?.error || null;

// export const recentlyAddedProductIds = (state) =>
//   state.favorites?.recentlyAddedProductIds || [];

// export const isFavoriteProduct = (state, productId) => {
//   // 如果用戶未登入，直接返回 false
//   if (!isUserLoggedIn()) return false;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites) {
//     return true;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return state.favorites?.favoritesData?.products?.some(item =>
//     item.productId === productId
//   ) || false;
// };

// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
//     return state.favorites.productFavoriteStatus[productId].favoriteItem;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return state.favorites?.favoritesData?.products?.find(item =>
//     item.productId === productId
//   ) || null;
// };

// // 獲取產品的收藏狀態詳細信息
// export const getProductFavoriteStatus = (state, productId) => {
//   // 如果用戶未登入，直接返回未收藏狀態
//   if (!isUserLoggedIn()) {
//     return { isInFavorites: false, favoriteItem: null };
//   }

//   // 從 productFavoriteStatus 獲取狀態信息
//   return state.favorites?.productFavoriteStatus?.[productId] ||
//     { isInFavorites: false, favoriteItem: null };
// };

// // Action creators
// export const {
//   setFavoritesData,
//   resetFavoritesError,
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus,
//   clearFavorites
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;

// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 獲取用戶ID的輔助函數 - 從本地存儲而非 Cookie 獲取
// const getUserId = () => {
//   // 從本地存儲獲取用戶資訊
//   const userString = localStorage.getItem('user');
//   if (!userString) return '';

//   try {
//     const user = JSON.parse(userString);
//     return user.id || '';
//   } catch (e) {
//     console.error('解析用戶資訊失敗:', e);
//     return '';
//   }
// };

// // 檢查用戶是否已登入 - 使用本地存儲和 token 進行檢查
// const isUserLoggedIn = () => {
//   const token = localStorage.getItem('token');
//   const user = localStorage.getItem('user');
//   return !!(token && user);
// };

// // 模擬資料庫中的收藏列表數據
// // 這裡預先填充一些收藏資料，與資料庫中的用戶ID關聯
// let dbFavorites = [
//   {
//     id: "fav_001",
//     userId: "pqyfZ3sGxjTKmTSjmCAKa", // admin 用戶的ID (worldwear@gmail.com)
//     productId: "product001",
//     qty: 1,
//     color: "黑色",
//     size: "M",
//     product: {
//       id: "product001",
//       name: "經典棉質T恤",
//       price: 590,
//       image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//       color: "黑色",
//       size: "M"
//     }
//   },
//   {
//     id: "fav_002",
//     userId: "pqyfZ3sGxjTKmTSjmCAKa", // admin 用戶的ID (worldwear@gmail.com)
//     productId: "product002",
//     qty: 2,
//     color: "藍色",
//     size: "L",
//     product: {
//       id: "product002",
//       name: "休閒牛仔褲",
//       price: 1280,
//       image: "https://i.meee.com.tw/m6YmbY2.jpg",
//       color: "藍色",
//       size: "L"
//     }
//   },
//   {
//     id: "fav_003",
//     userId: "pbs5UHdZo7Th7_BStU-o9", // test 用戶的ID (test@gmail.com)
//     productId: "product003",
//     qty: 1,
//     color: "白色",
//     size: "XL",
//     product: {
//       id: "product003",
//       name: "法蘭絨短版襯衫",
//       price: 1280,
//       image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//       color: "白色",
//       size: "XL"
//     }
//   }
// ];

// // 為新註冊用戶初始化收藏列表數據的函數
// export const initUserFavorites = (userId) => {
//   // 檢查是否已經有此用戶的收藏數據
//   const existingUserFavorites = dbFavorites.some(fav => fav.userId === userId);

//   // 如果此用戶還沒有收藏數據，為他創建一個示例收藏項目
//   if (!existingUserFavorites) {
//     const newFavoriteItem = {
//       id: `fav_new_${Date.now()}`,
//       userId: userId,
//       productId: "product004",
//       qty: 1,
//       color: "綠色",
//       size: "M",
//       product: {
//         id: "product004",
//         name: "時尚連帽外套",
//         price: 1580,
//         image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//         color: "綠色",
//         size: "M"
//       }
//     };

//     dbFavorites.push(newFavoriteItem);
//     console.log("為新用戶創建示例收藏項目:", userId);
//   }
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

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // 獲取當前登入用戶的ID
//       const userId = getUserId();
//       console.log("獲取收藏列表，使用者ID:", userId);

//       // 篩選出屬於當前用戶的收藏項目
//       const userFavorites = dbFavorites.filter(fav => fav.userId === userId);

//       return {
//         total: userFavorites.length,
//         products: userFavorites,
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);
//       // 返回空數據而不是拋出錯誤
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

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 檢查並確保必要字段的存在
//       const item = {
//         id: `fav_${Date.now()}`, // 生成唯一ID
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || "",
//         product: favoriteItem.product || null,
//       };

//       // 檢查是否已經收藏過該產品
//       const existingFavorite = dbFavorites.find(
//         fav => fav.userId === userId && fav.productId === item.productId
//       );

//       // 如果已經收藏過，則返回現有記錄而不是創建新記錄
//       if (existingFavorite) {
//         return existingFavorite;
//       }

//       // 添加到模擬資料庫收藏列表
//       dbFavorites.push(item);

//       console.log("新增收藏成功:", item);

//       return item;
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

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 查找要刪除的項目，確保它屬於當前用戶
//       const favoriteToRemove = dbFavorites.find(fav => fav.id === id && fav.userId === userId);
//       if (!favoriteToRemove) {
//         return rejectWithValue("未找到要刪除的收藏項");
//       }

//       // 從模擬資料庫中刪除
//       dbFavorites = dbFavorites.filter(fav => !(fav.id === id && fav.userId === userId));

//       console.log("刪除收藏成功:", id);

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
//   async ({ id, qty }, { rejectWithValue }) => {
//     try {
//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 300));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 更新模擬數據，但僅限於當前用戶的收藏項
//       const favoriteToUpdate = dbFavorites.find(fav => fav.id === id && fav.userId === userId);
//       if (!favoriteToUpdate) {
//         return rejectWithValue("未找到要更新的收藏項");
//       }

//       favoriteToUpdate.qty = validQty;

//       console.log("更新收藏數量成功:", id, validQty);

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

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       // 這裡可以實現模擬加入購物車的邏輯
//       console.log("加入購物車成功:", cartItem);

//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);
//       return rejectWithValue(error.message || "加入購物車失敗");
//     }
//   }
// );

// // 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { dispatch }) => {
//     try {
//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!isUserLoggedIn()) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null
//         };
//       }

//       // 模擬 API 請求延遲
//       await new Promise(resolve => setTimeout(resolve, 200));

//       // 獲取當前用戶ID
//       const userId = getUserId();

//       // 檢查產品是否已在當前用戶的收藏列表中
//       const favoriteItem = dbFavorites.find(
//         fav => fav.userId === userId && fav.productId === productId
//       );

//       const isInFavorites = !!favoriteItem;

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
//     // 直接設置收藏數據
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
//     },
//     // 清空收藏列表（新增）
//     clearFavorites(state) {
//       state.favoritesData = {
//         total: 0,
//         products: [],
//       };
//       state.recentlyAddedProductIds = [];
//       // 注意：這裡僅清空當前用戶在Redux狀態中的收藏列表，但不會影響模擬資料庫中的數據
//     },
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

//         // 更新收藏列表
//         const existingProductIndex = state.favoritesData.products.findIndex(
//           product => product.id === action.payload.id
//         );

//         if (existingProductIndex === -1) {
//           state.favoritesData.products.push(action.payload);
//           state.favoritesData.total = state.favoritesData.products.length;
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

//             // 從收藏列表中移除
//             state.favoritesData.products = state.favoritesData.products.filter(
//               product => product.id !== action.payload.id
//             );
//             state.favoritesData.total = state.favoritesData.products.length;
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
//       .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
//         // 不需要特別處理，因為我們使用單獨的 action 來更新產品收藏狀態
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };

// export const favoritesStatus = (state) =>
//   state.favorites?.status || "idle";

// export const favoritesError = (state) =>
//   state.favorites?.error || null;

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
//   updateProductFavoriteStatus,
//   clearFavorites
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;

// // favoritesSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
// import {
//   getUserId,
//   isUserLoggedIn,
//   getWorldWearTokenFromCookie
// } from "../components/tools/cookieUtils";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// // 設置 API 的基本 URL
// const API_URL = API_PATH || 'http://localhost:3000';

// // 設置和獲取 axios 請求頭中的 Authorization
// const ensureAuthHeader = () => {
//   // 優先從 localStorage 獲取 token
//   const token = localStorage.getItem('token');

//   // 如果 localStorage 中沒有找到，則從 cookie 獲取
//   const cookieToken = token || getWorldWearTokenFromCookie();

//   if (cookieToken) {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${cookieToken}`;
//     console.log('favoritesSlice: 已設置 Authorization header');
//     return cookieToken;
//   }

//   console.log('favoritesSlice: 未找到 token，無法設置 Authorization header');
//   delete axios.defaults.headers.common['Authorization'];
//   return null;
// };

// // 獲取用戶 ID 的多重檢查函數 - 優先從 Redux 狀態獲取
// const getSecureUserId = (getState) => {
//   const state = getState();
//   // 使用 cookieUtils 的 getUserId 函數從多個來源獲取用戶 ID
//   return getUserId(state);
// };

// // 獲取收藏列表數據 - 使用新的 API 端點
// export const getFavorites = createAsyncThunk(
//   "favorites/getFavorites",
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 檢查用戶是否已登入，如果未登入，直接返回空數據而不是拋出錯誤
//       if (!isUserLoggedIn()) {
//         console.log("用戶未登入，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       // 如果仍然沒有獲取到用戶 ID，返回空數據
//       if (!userId) {
//         console.log("未找到用戶 ID，無法獲取收藏列表");
//         return {
//           total: 0,
//           products: [],
//         };
//       }

//       console.log("獲取收藏列表，使用者ID:", userId);

//       // 使用新的 API 端點，添加 _expand 參數
//       const response = await axios.get(
//         `${API_URL}/favorites/?userId=${userId}&_expand=user&_expand=product`,
//         {
//           headers: token ? {
//             Authorization: `Bearer ${token}`
//           } : undefined
//         }
//       );

//       console.log("API 返回收藏數據:", response.data);

//       // 處理 API 返回的數據
//       const favoritesWithProducts = response.data.map(item => ({
//         ...item,
//         // 確保有基本的產品信息
//         product: item.product || null
//       }));

//       return {
//         total: favoritesWithProducts.length,
//         products: favoritesWithProducts,
//       };
//     } catch (error) {
//       console.error("獲取收藏列表失敗:", error);

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         return rejectWithValue(error.response.data.message || "獲取收藏列表失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue("獲取收藏列表失敗，請檢查網絡連接");
//     }
//   }
// );

// // 新增收藏項目
// export const addToFavorites = createAsyncThunk(
//   "favorites/addToFavorites",
//   async (favoriteItem, { getState, rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入收藏");
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const favoriteData = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || "",
//         size: favoriteItem.size || ""
//       };

//       // 發送 API 請求添加收藏
//       const response = await axios.post(`${API_URL}/favorites`, favoriteData, {
//         headers: token ? {
//           Authorization: `Bearer ${token}`
//         } : undefined
//       });

//       console.log("API 返回新增收藏結果:", response.data);

//       // 更新產品收藏狀態
//       dispatch(updateProductFavoriteStatus({
//         productId: favoriteItem.productId,
//         isInFavorites: true,
//         favoriteItem: response.data
//       }));

//       // 由於使用新的 API，直接返回響應數據
//       return {
//         ...response.data,
//         product: response.data.product || null
//       };
//     } catch (error) {
//       console.error("添加收藏失敗:", error);

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         return rejectWithValue(error.response.data.message || "添加收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "添加收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 移除收藏項目
// export const removeFromFavorites = createAsyncThunk(
//   "favorites/removeFromFavorites",
//   async (id, { getState, rejectWithValue, dispatch }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 找到要刪除的收藏項目，以獲取其產品 ID
//       const favoriteItem = getState().favorites.favoritesData.products.find(
//         item => item.id === id
//       );

//       // 發送 API 請求刪除收藏
//       await axios.delete(`${API_URL}/favorites/${id}`, {
//         headers: token ? {
//           Authorization: `Bearer ${token}`
//         } : undefined,
//         params: { userId } // 確保刪除操作是針對當前用戶的
//       });

//       console.log("成功刪除收藏項目:", id);

//       // 如果找到相應的收藏項目，更新其產品的收藏狀態
//       if (favoriteItem && favoriteItem.productId) {
//         dispatch(updateProductFavoriteStatus({
//           productId: favoriteItem.productId,
//           isInFavorites: false,
//           favoriteItem: null
//         }));
//       }

//       // 返回被刪除的收藏項ID
//       return { id, productId: favoriteItem?.productId };
//     } catch (error) {
//       console.error("移除收藏失敗:", error);

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         return rejectWithValue(error.response.data.message || "移除收藏失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "移除收藏失敗，請檢查網絡連接");
//     }
//   }
// );

// // 更新收藏項目數量
// export const updateFavoriteItemQuantity = createAsyncThunk(
//   "favorites/updateFavoriteItemQuantity",
//   async ({ id, qty }, { getState, rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再操作收藏");
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 確保數量至少為1
//       const validQty = Math.max(1, qty);

//       // 發送 API 請求更新數量
//       const response = await axios.patch(`${API_URL}/favorites/${id}`,
//         { qty: validQty },
//         {
//           headers: token ? {
//             Authorization: `Bearer ${token}`
//           } : undefined,
//           params: { userId } // 確保更新操作是針對當前用戶的
//         }
//       );

//       console.log("API 返回更新數量結果:", response.data);

//       return { id, qty: validQty };
//     } catch (error) {
//       console.error("更新收藏項目數量失敗:", error);

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         return rejectWithValue(error.response.data.message || "更新收藏項目數量失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "更新收藏項目數量失敗，請檢查網絡連接");
//     }
//   }
// );

// // 將收藏項目加入購物車
// export const addFavoriteToCart = createAsyncThunk(
//   "favorites/addFavoriteToCart",
//   async (favoriteItem, { getState, rejectWithValue }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 確保用戶已登入
//       if (!isUserLoggedIn()) {
//         return rejectWithValue("請先登入再加入購物車");
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       if (!userId) {
//         return rejectWithValue("無法獲取用戶ID，請重新登入");
//       }

//       // 準備要發送的數據
//       const cartItem = {
//         userId: userId,
//         productId: favoriteItem.productId,
//         qty: favoriteItem.qty || 1,
//         color: favoriteItem.color || favoriteItem.product?.color || "",
//         size: favoriteItem.size || favoriteItem.product?.size || "",
//       };

//       // 發送 API 請求添加到購物車
//       const response = await axios.post(`${API_URL}/cart`, cartItem, {
//         headers: token ? {
//           Authorization: `Bearer ${token}`
//         } : undefined
//       });

//       console.log("API 返回添加購物車結果:", response.data);

//       return { success: true, productId: cartItem.productId };
//     } catch (error) {
//       console.error("加入購物車失敗:", error);

//       // 如果是 API 錯誤，嘗試返回更具體的錯誤信息
//       if (error.response) {
//         return rejectWithValue(error.response.data.message || "加入購物車失敗");
//       }

//       // 如果是網絡錯誤或其他錯誤，返回一般性錯誤
//       return rejectWithValue(error.message || "加入購物車失敗，請檢查網絡連接");
//     }
//   }
// );

// // 檢查特定產品是否已收藏
// export const checkProductFavoriteStatus = createAsyncThunk(
//   "favorites/checkProductFavoriteStatus",
//   async (productId, { getState, dispatch }) => {
//     try {
//       // 確保設置 Authorization header，並獲取可能使用的 token
//       const token = ensureAuthHeader();

//       // 如果用戶未登入，直接返回未收藏狀態
//       if (!isUserLoggedIn()) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null
//         };
//       }

//       // 從 state 中獲取用戶 ID (使用增強版的獲取函數)
//       const userId = getSecureUserId(getState);

//       if (!userId) {
//         return {
//           productId,
//           isInFavorites: false,
//           favoriteItem: null
//         };
//       }

//       // 發送 API 請求檢查收藏狀態
//       const response = await axios.get(`${API_URL}/favorites/check`, {
//         params: { userId, productId },
//         headers: token ? {
//           Authorization: `Bearer ${token}`
//         } : undefined
//       });

//       console.log(`API 返回產品 ${productId} 的收藏狀態:`, response.data);

//       // 假設 API 返回 { isInFavorites: true/false, favoriteItem: {...} }
//       const result = response.data;

//       // 更新 UI 狀態
//       if (result.isInFavorites && result.favoriteItem) {
//         dispatch(updateProductFavoriteStatus({
//           productId,
//           isInFavorites: true,
//           favoriteItem: result.favoriteItem
//         }));
//       }

//       return {
//         productId,
//         isInFavorites: result.isInFavorites,
//         favoriteItem: result.favoriteItem || null
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
//   productFavoriteStatus: {}, // 存儲產品 ID 到收藏狀態的映射
// };

// // 創建slice
// const favoritesSlice = createSlice({
//   name: "favorites",
//   initialState,
//   reducers: {
//     // 直接設置收藏數據
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

//       // 將產品收藏狀態存儲到 productFavoriteStatus
//       state.productFavoriteStatus[productId] = {
//         isInFavorites,
//         favoriteItem: favoriteItem || null
//       };

//       // 將產品 ID 添加到最近收藏的列表中
//       if (isInFavorites && !state.recentlyAddedProductIds.includes(productId)) {
//         state.recentlyAddedProductIds.push(productId);
//       } else if (!isInFavorites) {
//         // 如果移除收藏，則從最近添加的產品列表中移除
//         state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//           pid => pid !== productId
//         );
//       }
//     },
//     // 清空收藏列表
//     clearFavorites(state) {
//       state.favoritesData = {
//         total: 0,
//         products: [],
//       };
//       state.recentlyAddedProductIds = [];
//       state.productFavoriteStatus = {};
//     },
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

//         // 更新產品收藏狀態
//         action.payload.products.forEach(item => {
//           if (item.productId) {
//             state.productFavoriteStatus[item.productId] = {
//               isInFavorites: true,
//               favoriteItem: item
//             };
//           }
//         });
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

//         // 更新收藏列表
//         const existingProductIndex = state.favoritesData.products.findIndex(
//           product => product.id === action.payload.id
//         );

//         if (existingProductIndex === -1) {
//           state.favoritesData.products.push(action.payload);
//           state.favoritesData.total = state.favoritesData.products.length;
//         }

//         // 更新產品收藏狀態
//         if (productId) {
//           state.productFavoriteStatus[productId] = {
//             isInFavorites: true,
//             favoriteItem: action.payload
//           };
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
//         if (action.payload) {
//           // 移除收藏項目
//           if (action.payload.id) {
//             state.favoritesData.products = state.favoritesData.products.filter(
//               product => product.id !== action.payload.id
//             );
//             state.favoritesData.total = state.favoritesData.products.length;
//           }

//           // 更新產品收藏狀態
//           if (action.payload.productId) {
//             if (state.productFavoriteStatus[action.payload.productId]) {
//               state.productFavoriteStatus[action.payload.productId] = {
//                 isInFavorites: false,
//                 favoriteItem: null
//               };
//             }

//             // 從最近添加的列表中移除
//             state.recentlyAddedProductIds = state.recentlyAddedProductIds.filter(
//               id => id !== action.payload.productId
//             );
//           }
//         }

//         state.status = "succeeded";
//         state.error = null;
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

//           // 同時更新 productFavoriteStatus 中的數據
//           const product = state.favoritesData.products[productIndex];
//           if (product.productId && state.productFavoriteStatus[product.productId]) {
//             state.productFavoriteStatus[product.productId].favoriteItem = {
//               ...state.productFavoriteStatus[product.productId].favoriteItem,
//               qty
//             };
//           }
//         }
//         state.status = "succeeded";
//         state.error = null;
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
//         state.error = null;
//       })
//       .addCase(addFavoriteToCart.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload || action.error.message;
//       })

//       // 處理 checkProductFavoriteStatus
//       .addCase(checkProductFavoriteStatus.fulfilled, (state, action) => {
//         // 更新產品收藏狀態
//         if (action.payload && action.payload.productId) {
//           state.productFavoriteStatus[action.payload.productId] = {
//             isInFavorites: action.payload.isInFavorites,
//             favoriteItem: action.payload.favoriteItem
//           };
//         }
//       });
//   },
// });

// // 選擇器 - 添加安全檢查
// export const favoritesData = (state) =>
//   state.favorites?.favoritesData || { total: 0, products: [] };

// export const favoritesStatus = (state) =>
//   state.favorites?.status || "idle";

// export const favoritesError = (state) =>
//   state.favorites?.error || null;

// export const recentlyAddedProductIds = (state) =>
//   state.favorites?.recentlyAddedProductIds || [];

// export const isFavoriteProduct = (state, productId) => {
//   // 如果用戶未登入，直接返回 false
//   if (!isUserLoggedIn()) return false;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.isInFavorites) {
//     return true;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return state.favorites?.favoritesData?.products?.some(item =>
//     item.productId === productId
//   ) || false;
// };

// export const getFavoriteItem = (state, productId) => {
//   // 如果用戶未登入，直接返回 null
//   if (!isUserLoggedIn()) return null;

//   // 首先從 productFavoriteStatus 查找，這是最精確的
//   if (state.favorites?.productFavoriteStatus?.[productId]?.favoriteItem) {
//     return state.favorites.productFavoriteStatus[productId].favoriteItem;
//   }

//   // 如果沒有在狀態中找到，則查詢收藏列表
//   return state.favorites?.favoritesData?.products?.find(item =>
//     item.productId === productId
//   ) || null;
// };

// // 獲取產品的收藏狀態詳細信息
// export const getProductFavoriteStatus = (state, productId) => {
//   // 如果用戶未登入，直接返回未收藏狀態
//   if (!isUserLoggedIn()) {
//     return { isInFavorites: false, favoriteItem: null };
//   }

//   // 從 productFavoriteStatus 獲取狀態信息
//   return state.favorites?.productFavoriteStatus?.[productId] ||
//     { isInFavorites: false, favoriteItem: null };
// };

// // Action creators
// export const {
//   setFavoritesData,
//   resetFavoritesError,
//   clearRecentlyAddedProducts,
//   updateProductFavoriteStatus,
//   clearFavorites
// } = favoritesSlice.actions;

// export default favoritesSlice.reducer;
