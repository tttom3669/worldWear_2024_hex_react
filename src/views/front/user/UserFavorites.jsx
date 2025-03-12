import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useImgUrl from "../../../hooks/useImgUrl";
import UserAside from "../../../components/front/UserAside";
import useSwal from '../../../hooks/useSwal';
import { 
  getFavorites, 
  removeFromFavorites, 
  updateFavoriteItemQuantity, 
  addFavoriteToCart
} from "../../../slice/favoritesSlice";
import { isUserLoggedIn } from "../../../components/tools/cookieUtils";

export default function UserFavorites() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();
  const hasNavigated = useRef(false);
  const hasFetchedFavorites = useRef(false);
  
  // 從 Redux store 中獲取收藏數據
  const favoritesData = useSelector(state => state.favorites?.favoritesData?.products || []);
  const favoritesStatus = useSelector(state => state.favorites?.status || 'idle');
  const favoritesError = useSelector(state => state.favorites?.error || null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 預設商品資料 - 只在沒有實際收藏時顯示
  const defaultItems = [
    {
      id: "default_001",
      productId: "product001",
      qty: 1,
      color: "白色",
      size: "XL",
      product: {
        id: "product001",
        name: "法蘭絨短版襯衫",
        price: 1280,
        image: "https://i.meee.com.tw/wEzHrAc.jpeg",
        color: "白色",
        size: "XL"
      }
    },
    {
      id: "default_002",
      productId: "product002",
      qty: 1,
      color: "軍綠色",
      size: "XL",
      product: {
        id: "product002",
        name: "寬版工裝短褲",
        price: 650,
        image: "https://i.meee.com.tw/m6YmbY2.jpg",
        color: "軍綠色",
        size: "XL"
      }
    }
  ];
  
  // 檢查用戶登入狀態函數
  const checkUserLogin = () => {
    try {
      if (isUserLoggedIn()) {
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error("檢查登入狀態時出錯:", error);
    }

    // 如果未登入，導向登入頁面
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      toastAlert({ icon: 'warning', title: '請先登入' });
      navigate("/login");
    }
    
    setIsAuthenticated(false);
    return false;
  };
  
  // 加入購物車
  const handleAddToCart = async (favorite) => {
    try {
      // 檢查登入狀態
      if (!checkUserLogin()) {
        return;
      }

      // 處理預設商品的情況
      if (favorite.id.startsWith('default_')) {
        handleDemoAction('add-to-cart');
        return;
      }

      // 使用 Redux action 加入購物車
      await dispatch(addFavoriteToCart(favorite)).unwrap();
      
      toastAlert({ icon: 'success', title: '已加入購物車' });
    } catch (error) {
      console.error("Error adding to cart:", error);
      
      const errorMessage = typeof error === 'string' ? error : (error?.message || '加入購物車失敗，請稍後再試');
      
      if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      } else {
        toastAlert({ icon: 'error', title: '加入購物車失敗，請稍後再試' });
      }
    }
  };

  // 刪除收藏項目
  const handleDeleteItem = async (favoriteId) => {
    try {
      // 處理預設商品的情況
      if (favoriteId.startsWith('default_')) {
        handleDemoAction('delete');
        return;
      }

      if (!window.confirm("確定要移除此收藏項目嗎？")) {
        return;
      }

      // 使用 Redux action 刪除收藏項目
      await dispatch(removeFromFavorites(favoriteId)).unwrap();
      
      toastAlert({ icon: 'success', title: '已從收藏列表中移除' });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      
      const errorMessage = typeof error === 'string' ? error : (error?.message || '移除失敗，請稍後再試');
      
      if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      } else {
        toastAlert({ icon: 'error', title: '移除失敗，請稍後再試' });
      }
    }
  };

  // 更新收藏數量
  const handleUpdateQuantity = async (favoriteId, productId, newQty) => {
    // 確保數量不小於 1
    if (newQty < 1) return;

    try {
      // 處理預設商品的情況
      if (favoriteId.startsWith('default_')) {
        handleDemoAction('update');
        return;
      }

      // 使用 Redux action 更新收藏數量
      await dispatch(updateFavoriteItemQuantity({ id: favoriteId, qty: newQty })).unwrap();
    } catch (error) {
      console.error("Error updating quantity:", error);
      
      const errorMessage = typeof error === 'string' ? error : (error?.message || '更新數量失敗，請稍後再試');
      
      if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      } else {
        toastAlert({ icon: 'error', title: '更新數量失敗，請稍後再試' });
      }
    }
  };

  // 模擬加入購物車和刪除按鈕功能 - 用於預設畫面
  const handleDemoAction = (actionType) => {
    toastAlert({ 
      icon: 'info', 
      title: '這是模擬功能', 
      text: '此操作僅用於演示目的。請先登入以使用實際功能。' 
    });
  };
  
  // 組件初始化時檢查登入狀態並獲取收藏列表 - 只執行一次
  useEffect(() => {
    console.log("UserFavorites 組件初始化");
    
    try {
      // 檢查登入狀態
      const loggedIn = checkUserLogin();
      
      if (loggedIn && !hasFetchedFavorites.current) {
        // 如果已登入，獲取收藏列表
        console.log("用戶已登入，獲取收藏列表");
        hasFetchedFavorites.current = true;
        dispatch(getFavorites());
      }
    } catch (error) {
      console.error("初始化時出錯:", error);
    }
  }, [dispatch]); // 只依賴 dispatch，組件掛載時執行一次

  // 監聽 favoritesStatus 變化
  useEffect(() => {
    try {
      setIsLoading(favoritesStatus === 'loading');
      
      // 如果收藏列表獲取失敗且是因為未登入，跳轉到登入頁面
      if (favoritesStatus === 'failed' && favoritesError) {
        const errorMessage = typeof favoritesError === 'string' ? favoritesError : '';
        
        if (errorMessage.includes('未登入') || errorMessage.includes('請先登入')) {
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            toastAlert({ icon: 'warning', title: '請先登入' });
            navigate("/login");
          }
        }
      }
    } catch (error) {
      console.error("處理狀態變化時出錯:", error);
    }
  }, [favoritesStatus, favoritesError, navigate, toastAlert]);

  // 準備要顯示的收藏數據 - 如果用戶沒有收藏，則使用預設資料
  const displayItems = isAuthenticated && favoritesData.length === 0 
    ? defaultItems 
    : favoritesData;
  
  return (
    <>
      <main>
        <div className="pt-3 pb-3 pt-md-10 pb-md-25">
          <div className="container px-0 px-sm-3">
            <div className="row mx-0 mx-sm-n3">
              <div className="d-none col-lg-2 d-lg-block">
                <UserAside />
              </div>
              <div className="col-lg-10 px-0 px-sm-3">
                <div className="d-flex justify-content-between align-items-center mb-3 px-3 px-sm-0 mb-md-5">
                  <h1 className="fs-h5 fw-bold m-0">
                    收藏列表
                  </h1>
                </div>
                
                {isLoading ? (
                  <div className="bg-white p-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">載入中...</p>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="bg-white p-5 text-center">
                    <div className="alert alert-warning">
                      請先登入以查看您的收藏列表
                    </div>
                    <button 
                      onClick={() => navigate("/login")}
                      className="btn btn-primary mt-3"
                    >
                      前往登入
                    </button>
                  </div>
                ) : displayItems.length > 0 ? (
                  <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95">
                    {/* 表格標題列（灰色背景） */}
                    <div className="d-flex p-3 bg-nature-90">
                      <div style={{ width: "500px" }} className="fw-bold">
                        產品資料
                      </div>
                      <div style={{ width: "140px" }} className="fw-bold">
                        規格
                      </div>
                      <div style={{ width: "140px" }} className="fw-bold">
                        數量
                      </div>
                      <div style={{ width: "140px" }} className="fw-bold">
                        單價
                      </div>
                      <div style={{ width: "140px" }} className="fw-bold">
                        變更
                      </div>
                    </div>
                    
                    {/* 列表內容 - 使用 displayItems 包含預設資料 */}
                    <ul className="list-unstyled m-0">
                      {displayItems.map((favorite) => (
                        <li
                          key={favorite.id}
                          className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3"
                        >
                          {/* 產品資料欄 */}
                          <div style={{ width: "500px" }}>
                            <div className="d-flex align-items-center">
                              <div
                                className="me-3"
                                style={{
                                  width: "108px",
                                  height: "108px",
                                  overflow: "hidden",
                                }}
                              >
                                <img
                                  className="img-fluid w-100 h-100 object-fit-cover"
                                  src={
                                    favorite.product?.imageUrl ||
                                    "https://placehold.co/108x108?text=No+Image"
                                  }
                                  alt={favorite.product?.title || "產品圖片"}
                                />
                              </div>
                              <div className="product-title">
                                {favorite.product?.title || "未知產品"}
                              </div>
                            </div>
                          </div>

                          {/* 規格欄 */}
                          <div style={{ width: "130px" }}>
                            <div className="product-spec">
                              <div>
                                {favorite.color ||
                                  favorite.product?.color ||
                                  "無顏色資訊"}
                              </div>
                              <div>
                                {favorite.size ||
                                  favorite.product?.size ||
                                  "無尺寸資訊"}
                              </div>
                            </div>
                          </div>

                          {/* 數量欄 */}
                          <div style={{ width: "140px" }}>
                            <div className="product-qty py-1.5 py-lg-0">
                              <div className="d-flex align-items-center">
                                <div className="btn-group me-2" role="group">
                                  <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm p-1"
                                    onClick={() => 
                                      favorite.id.startsWith('default_') 
                                        ? handleDemoAction('update') 
                                        : handleUpdateQuantity(
                                            favorite.id,
                                            favorite.productId,
                                            (favorite.qty || 1) - 1
                                          )
                                    }
                                    disabled={(favorite.qty || 1) <= 1}
                                  >
                                    <svg
                                      className="pe-none"
                                      width="24"
                                      height="24"
                                    >
                                      <use
                                        href={getImgUrl(
                                          "/icons/minus.svg#minus"
                                        )}
                                      />
                                    </svg>
                                  </button>
                                  <span
                                    className="btn border border-dark"
                                    style={{ width: "42px", cursor: "auto" }}
                                  >
                                    {favorite.qty || 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm p-1"
                                    onClick={() => 
                                      favorite.id.startsWith('default_') 
                                        ? handleDemoAction('update') 
                                        : handleUpdateQuantity(
                                            favorite.id,
                                            favorite.productId,
                                            (favorite.qty || 1) + 1
                                          )
                                    }
                                  >
                                    <svg
                                      className="pe-none"
                                      width="24"
                                      height="24"
                                    >
                                      <use
                                        href={getImgUrl("/icons/plus.svg#plus")}
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 單價欄 */}
                          <div style={{ width: "140px" }}>
                            <div className="product-price">
                              NT$
                              {favorite.product?.price?.toLocaleString() ||
                                "未知"}
                            </div>
                          </div>

                          {/* 變更欄 */}
                          <div style={{ width: "140px" }}>
                            <div
                              className="d-flex flex-column"
                              style={{ gap: "10px" }}
                            >
                              <button
                                type="button"
                                className="btn btn-primary w-100 text-center"
                                onClick={() => handleAddToCart(favorite)}
                              >
                                加入購物車
                              </button>
                              <button
                                type="button"
                                className="btn btn-nature-90 w-100 text-center"
                                onClick={() => handleDeleteItem(favorite.id)}
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white p-5 text-center">
                    <div className="alert alert-info">
                      您的收藏列表目前沒有商品
                    </div>
                    <button 
                      onClick={() => navigate("/")}
                      className="btn btn-primary mt-3"
                    >
                      繼續購物
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}



// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import useImgUrl from "../../../hooks/useImgUrl";
// import UserAside from "../../../components/front/UserAside";
// import useSwal from '../../../hooks/useSwal';
// import { 
//   getFavorites, 
//   removeFromFavorites, 
//   updateFavoriteItemQuantity, 
//   addFavoriteToCart,
//   isFavoriteProduct,
//   getFavoriteItem 
// } from "../../../slice/favoritesSlice";
// import { 
//   isUserLoggedIn, 
//   isUserLoggedInByCookie,
//   getUserId
// } from "../../../components/tools/cookieUtils";

// export default function UserFavorites() {
//   const getImgUrl = useImgUrl();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { toastAlert } = useSwal();
//   const hasNavigated = useRef(false);
//   const hasFetchedFavorites = useRef(false);
  
//   // 從 Redux store 中獲取收藏數據和用戶信息
//   const favoritesData = useSelector(state => state.favorites?.favoritesData?.products || []);
//   const favoritesStatus = useSelector(state => state.favorites?.status || 'idle');
//   const favoritesError = useSelector(state => state.favorites?.error || null);
  
//   // 從不同可能的 Redux 路徑獲取用戶信息
//   const currentUser = useSelector(state => state.auth?.user || state.authSlice?.user || null);
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
  
//   // 預設商品資料 - 只在沒有實際收藏時顯示
//   const defaultItems = [
//     {
//       id: "default_001",
//       productId: "product001",
//       qty: 1,
//       color: "白色",
//       size: "XL",
//       product: {
//         id: "product001",
//         name: "法蘭絨短版襯衫",
//         price: 1280,
//         image: "https://i.meee.com.tw/wEzHrAc.jpeg",
//         color: "白色",
//         size: "XL"
//       }
//     },
//     {
//       id: "default_002",
//       productId: "product002",
//       qty: 1,
//       color: "軍綠色",
//       size: "XL",
//       product: {
//         id: "product002",
//         name: "寬版工裝短褲",
//         price: 650,
//         image: "https://i.meee.com.tw/m6YmbY2.jpg",
//         color: "軍綠色",
//         size: "XL"
//       }
//     }
//   ];
  
//   // 檢查用戶登入狀態函數 - 使用 cookieUtils 提供的函數
//   const checkUserLogin = () => {
//     try {
//       // 使用 cookieUtils 中的 isUserLoggedIn 函數檢查多重來源
//       if (isUserLoggedIn()) {
//         setIsAuthenticated(true);
//         return true;
//       }
//     } catch (error) {
//       console.error("檢查登入狀態時出錯:", error);
//     }

//     // 如果未登入，導向登入頁面
//     if (!hasNavigated.current) {
//       hasNavigated.current = true;
//       toastAlert({ icon: 'warning', title: '請先登入' });
//       navigate("/login");
//     }
    
//     setIsAuthenticated(false);
//     return false;
//   };
  
//   // 加入購物車
//   const handleAddToCart = async (favorite) => {
//     try {
//       // 檢查登入狀態
//       if (!checkUserLogin()) {
//         return;
//       }

//       // 處理預設商品的情況
//       if (favorite.id.startsWith('default_')) {
//         handleDemoAction('add-to-cart');
//         return;
//       }

//       // 使用 Redux action 加入購物車
//       await dispatch(addFavoriteToCart(favorite)).unwrap();
      
//       toastAlert({ icon: 'success', title: '已加入購物車' });
//     } catch (error) {
//       console.error("Error adding to cart:", error);
      
//       const errorMessage = typeof error === 'string' ? error : (error?.message || '加入購物車失敗，請稍後再試');
      
//       if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
//         toastAlert({ icon: 'warning', title: '請先登入' });
//         navigate("/login");
//       } else {
//         toastAlert({ icon: 'error', title: '加入購物車失敗，請稍後再試' });
//       }
//     }
//   };

//   // 刪除收藏項目
//   const handleDeleteItem = async (favoriteId) => {
//     try {
//       // 處理預設商品的情況
//       if (favoriteId.startsWith('default_')) {
//         handleDemoAction('delete');
//         return;
//       }

//       if (!window.confirm("確定要移除此收藏項目嗎？")) {
//         return;
//       }

//       // 使用 Redux action 刪除收藏項目
//       await dispatch(removeFromFavorites(favoriteId)).unwrap();
      
//       toastAlert({ icon: 'success', title: '已從收藏列表中移除' });
//     } catch (error) {
//       console.error("Error deleting favorite:", error);
      
//       const errorMessage = typeof error === 'string' ? error : (error?.message || '移除失敗，請稍後再試');
      
//       if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
//         toastAlert({ icon: 'warning', title: '請先登入' });
//         navigate("/login");
//       } else {
//         toastAlert({ icon: 'error', title: '移除失敗，請稍後再試' });
//       }
//     }
//   };

//   // 更新收藏數量
//   const handleUpdateQuantity = async (favoriteId, productId, newQty) => {
//     // 確保數量不小於 1
//     if (newQty < 1) return;

//     try {
//       // 處理預設商品的情況
//       if (favoriteId.startsWith('default_')) {
//         handleDemoAction('update');
//         return;
//       }

//       // 使用 Redux action 更新收藏數量
//       await dispatch(updateFavoriteItemQuantity({ id: favoriteId, qty: newQty })).unwrap();
//     } catch (error) {
//       console.error("Error updating quantity:", error);
      
//       const errorMessage = typeof error === 'string' ? error : (error?.message || '更新數量失敗，請稍後再試');
      
//       if (errorMessage.includes('請先登入') || errorMessage.includes('未登入')) {
//         toastAlert({ icon: 'warning', title: '請先登入' });
//         navigate("/login");
//       } else {
//         toastAlert({ icon: 'error', title: '更新數量失敗，請稍後再試' });
//       }
//     }
//   };

//   // 模擬加入購物車和刪除按鈕功能 - 用於預設畫面
//   const handleDemoAction = (actionType) => {
//     toastAlert({ 
//       icon: 'info', 
//       title: '這是模擬功能', 
//       text: '此操作僅用於演示目的。請先登入以使用實際功能。' 
//     });
//   };
  
//   // 組件初始化時檢查登入狀態並獲取收藏列表 - 只執行一次
//   useEffect(() => {
//     console.log("UserFavorites 組件初始化");
    
//     try {
//       // 檢查登入狀態
//       const loggedIn = checkUserLogin();
      
//       if (loggedIn && !hasFetchedFavorites.current) {
//         // 如果已登入，獲取收藏列表
//         console.log("用戶已登入，獲取收藏列表");
//         hasFetchedFavorites.current = true;
//         dispatch(getFavorites());
//       }
//     } catch (error) {
//       console.error("初始化時出錯:", error);
//     }
//   }, [dispatch]); // 只依賴 dispatch，組件掛載時執行一次

//   // 監聽 favoritesStatus 變化
//   useEffect(() => {
//     try {
//       setIsLoading(favoritesStatus === 'loading');
      
//       // 如果收藏列表獲取失敗且是因為未登入，跳轉到登入頁面
//       if (favoritesStatus === 'failed' && favoritesError) {
//         const errorMessage = typeof favoritesError === 'string' ? favoritesError : '';
        
//         if (errorMessage.includes('未登入') || errorMessage.includes('請先登入')) {
//           if (!hasNavigated.current) {
//             hasNavigated.current = true;
//             toastAlert({ icon: 'warning', title: '請先登入' });
//             navigate("/login");
//           }
//         }
//       }
//     } catch (error) {
//       console.error("處理狀態變化時出錯:", error);
//     }
//   }, [favoritesStatus, favoritesError, navigate, toastAlert]);

//   // 當用戶信息變化時檢查登入狀態，但不自動獲取收藏列表
//   useEffect(() => {
//     try {
//       const loggedIn = isUserLoggedIn();
//       setIsAuthenticated(loggedIn);
      
//       // 注意：這裡不再調用 getFavorites 以避免無限循環
//     } catch (error) {
//       console.error("處理用戶信息變化時出錯:", error);
//     }
//   }, [currentUser]);

//   // 檢查並過濾收藏數據
//   const userFavorites = useMemo(() => {
//     try {
//       // 如果有收藏數據，返回全部收藏 (已在 getFavorites 中按用戶 ID 過濾)
//       if (Array.isArray(favoritesData) && favoritesData.length > 0) {
//         return favoritesData;
//       }
//     } catch (error) {
//       console.error("處理收藏數據時出錯:", error);
//     }
//     return [];
//   }, [favoritesData]);

//   // 準備要顯示的收藏數據 - 如果用戶沒有收藏，則使用預設資料
//   const displayItems = useMemo(() => {
//     if (isAuthenticated && userFavorites.length === 0) {
//       // 若已登入但沒有收藏資料，顯示預設資料
//       return defaultItems;
//     }
//     return userFavorites;
//   }, [userFavorites, isAuthenticated]);
  
//   // 計算總價值
//   const totalValue = useMemo(() => {
//     try {
//       if (!Array.isArray(displayItems)) return 0;
      
//       return displayItems.reduce((sum, item) => {
//         const price = item?.product?.price || 0;
//         const qty = item?.qty || 1;
//         return sum + (price * qty);
//       }, 0);
//     } catch (error) {
//       console.error("計算總價值時出錯:", error);
//       return 0;
//     }
//   }, [displayItems]);
  
//   // 手動獲取收藏列表的函數
//   const handleRefreshFavorites = () => {
//     if (isAuthenticated) {
//       dispatch(getFavorites());
//     }
//   };
  
//   return (
//     <>
//       <main>
//         <div className="pt-3 pb-3 pt-md-10 pb-md-25">
//           <div className="container px-0 px-sm-3">
//             <div className="row mx-0 mx-sm-n3">
//               <div className="d-none col-lg-2 d-lg-block">
//                 <UserAside />
//               </div>
//               <div className="col-lg-10 px-0 px-sm-3">
//                 <div className="d-flex justify-content-between align-items-center mb-3 px-3 px-sm-0 mb-md-5">
//                   <h1 className="fs-h5 fw-bold m-0">
//                     收藏列表
//                   </h1>
//                   {isAuthenticated && (
//                     <div className="d-flex align-items-center">
//                       {!isLoading && displayItems.length > 0 && (
//                         <div className="text-end me-3">
//                           <div className="fs-6">
//                             共 <span className="fw-bold">{displayItems.length}</span> 項商品
//                           </div>
//                           <div className="fs-6">
//                             總值 <span className="fw-bold text-primary">NT$ {totalValue.toLocaleString()}</span>
//                           </div>
//                         </div>
//                       )}
//                       <button 
//                         onClick={handleRefreshFavorites}
//                         className="btn btn-sm btn-outline-primary"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? '載入中...' : '重新整理'}
//                       </button>
//                     </div>
//                   )}
//                 </div>
                
//                 {isLoading ? (
//                   <div className="bg-white p-5 text-center">
//                     <div className="spinner-border text-primary" role="status">
//                       <span className="visually-hidden">Loading...</span>
//                     </div>
//                     <p className="mt-2">載入中...</p>
//                   </div>
//                 ) : !isAuthenticated ? (
//                   <div className="bg-white p-5 text-center">
//                     <div className="alert alert-warning">
//                       請先登入以查看您的收藏列表
//                     </div>
//                     <button 
//                       onClick={() => navigate("/login")}
//                       className="btn btn-primary mt-3"
//                     >
//                       前往登入
//                     </button>
//                   </div>
//                 ) : displayItems.length > 0 ? (
//                   <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95">
//                     {/* 表格標題列（灰色背景） */}
//                     <div className="d-flex p-3 bg-nature-90">
//                       <div style={{ width: "500px" }} className="fw-bold">
//                         產品資料
//                       </div>
//                       <div style={{ width: "140px" }} className="fw-bold">
//                         規格
//                       </div>
//                       <div style={{ width: "140px" }} className="fw-bold">
//                         數量
//                       </div>
//                       <div style={{ width: "140px" }} className="fw-bold">
//                         單價
//                       </div>
//                       <div style={{ width: "140px" }} className="fw-bold">
//                         變更
//                       </div>
//                     </div>
                    
//                     {/* 列表內容 - 使用 displayItems 包含預設資料 */}
//                     <ul className="list-unstyled m-0">
//                       {displayItems.map((favorite) => (
//                         <li
//                           key={favorite.id}
//                           className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3"
//                         >
//                           {/* 產品資料欄 */}
//                           <div style={{ width: "500px" }}>
//                             <div className="d-flex align-items-center">
//                               <div
//                                 className="me-3"
//                                 style={{
//                                   width: "108px",
//                                   height: "108px",
//                                   overflow: "hidden",
//                                 }}
//                               >
//                                 <img
//                                   className="img-fluid w-100 h-100 object-fit-cover"
//                                   src={
//                                     favorite.product?.image ||
//                                     "https://placehold.co/108x108?text=No+Image"
//                                   }
//                                   alt={favorite.product?.name || "產品圖片"}
//                                 />
//                               </div>
//                               <div className="product-title">
//                                 {favorite.product?.name || "未知產品"}
//                               </div>
//                             </div>
//                           </div>

//                           {/* 規格欄 */}
//                           <div style={{ width: "130px" }}>
//                             <div className="product-spec">
//                               <div>
//                                 {favorite.color ||
//                                   favorite.product?.color ||
//                                   "無顏色資訊"}
//                               </div>
//                               <div>
//                                 {favorite.size ||
//                                   favorite.product?.size ||
//                                   "無尺寸資訊"}
//                               </div>
//                             </div>
//                           </div>

//                           {/* 數量欄 */}
//                           <div style={{ width: "140px" }}>
//                             <div className="product-qty py-1.5 py-lg-0">
//                               <div className="d-flex align-items-center">
//                                 <div className="btn-group me-2" role="group">
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
//                                     onClick={() => 
//                                       favorite.id.startsWith('default_') 
//                                         ? handleDemoAction('update') 
//                                         : handleUpdateQuantity(
//                                             favorite.id,
//                                             favorite.productId,
//                                             (favorite.qty || 1) - 1
//                                           )
//                                     }
//                                     disabled={(favorite.qty || 1) <= 1}
//                                   >
//                                     <svg
//                                       className="pe-none"
//                                       width="24"
//                                       height="24"
//                                     >
//                                       <use
//                                         href={getImgUrl(
//                                           "/icons/minus.svg#minus"
//                                         )}
//                                       />
//                                     </svg>
//                                   </button>
//                                   <span
//                                     className="btn border border-dark"
//                                     style={{ width: "42px", cursor: "auto" }}
//                                   >
//                                     {favorite.qty || 1}
//                                   </span>
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
//                                     onClick={() => 
//                                       favorite.id.startsWith('default_') 
//                                         ? handleDemoAction('update') 
//                                         : handleUpdateQuantity(
//                                             favorite.id,
//                                             favorite.productId,
//                                             (favorite.qty || 1) + 1
//                                           )
//                                     }
//                                   >
//                                     <svg
//                                       className="pe-none"
//                                       width="24"
//                                       height="24"
//                                     >
//                                       <use
//                                         href={getImgUrl("/icons/plus.svg#plus")}
//                                       />
//                                     </svg>
//                                   </button>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>

//                           {/* 單價欄 */}
//                           <div style={{ width: "140px" }}>
//                             <div className="product-price">
//                               NT$
//                               {favorite.product?.price?.toLocaleString() ||
//                                 "未知"}
//                             </div>
//                           </div>

//                           {/* 變更欄 */}
//                           <div style={{ width: "140px" }}>
//                             <div
//                               className="d-flex flex-column"
//                               style={{ gap: "10px" }}
//                             >
//                               <button
//                                 type="button"
//                                 className="btn btn-primary w-100 text-center"
//                                 onClick={() => handleAddToCart(favorite)}
//                               >
//                                 加入購物車
//                               </button>
//                               <button
//                                 type="button"
//                                 className="btn btn-nature-90 w-100 text-center"
//                                 onClick={() => handleDeleteItem(favorite.id)}
//                               >
//                                 刪除
//                               </button>
//                             </div>
//                           </div>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 ) : (
//                   <div className="bg-white p-5 text-center">
//                     <div className="spinner-border text-primary" role="status">
//                       <span className="visually-hidden">Loading...</span>
//                     </div>
//                     <p className="mt-2">載入中...</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </>
//   );
// }