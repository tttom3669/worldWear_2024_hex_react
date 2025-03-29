import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import useImgUrl from "../../../hooks/useImgUrl";
import UserAside from "../../../components/front/UserAside";
import useSwal from "../../../hooks/useSwal";
import {
  getFavorites,
  removeFromFavorites,
  updateFavoriteItemQuantity,
  addFavoriteToCart,
  updateFavoriteItemColor,
  updateFavoriteItemSize,
} from "../../../slice/favoritesSlice";
// 導入 cookieUtils
import cookieUtils, {
  isUserLoggedIn,
  getJWTToken,
  getUserIdFromCookie,
} from "../../../components/tools/cookieUtils";
import ScreenLoading from '../../../components/front/ScreenLoading';
import ColorSelect from "../../../components/front/ColorSelect";

export default function UserFavorites() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();
  const hasFetchedFavorites = useRef(false);

  // 從 Redux store 中獲取收藏數據
  const favoritesData = useSelector(
    (state) => state.favorites?.favoritesData?.products || []
  );
  const favoritesStatus = useSelector(
    (state) => state.favorites?.status || "idle"
  );
  const favoritesError = useSelector((state) => state.favorites?.error || null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 處理相同規格的產品統計
  const processGroupedFavorites = (items) => {
    const groupedItems = items.reduce((acc, item) => {
      const key = `${item.productId}-${item.color}-${item.size}`;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          qty: 0,
          originalItems: []
        };
      }
      acc[key].qty += item.qty || 1;
      acc[key].originalItems.push(item);
      return acc;
    }, {});

    return Object.values(groupedItems);
  };


  const displayItems = isAuthenticated && processGroupedFavorites(favoritesData);

  // 修改 handleUpdateQuantity 函數
  const handleUpdateQuantity = async (favoriteId, productId, newQty, favorite) => {
    // 確保數量不小於 1
    if (newQty < 1) return;
  
    try { 
      // 找到所有相同規格的項目
      const groupedItems = favoritesData.filter(
        item => item.productId === productId && 
                item.color === favorite.color && 
                item.size === favorite.size
      );
  
      // 計算需要更新的數量
      const totalQty = groupedItems.reduce((sum, item) => sum + (item.qty || 1), 0);
      const qtyDiff = newQty - totalQty;
  
      // 如果數量增加，更新第一個項目
      if (qtyDiff > 0) {
        await dispatch(
          updateFavoriteItemQuantity({ 
            id: favoriteId, 
            qty: (favorite.qty || 1) + qtyDiff 
          })
        ).unwrap();
      } 
      // 如果數量減少，從最後一個項目開始減少
      else if (qtyDiff < 0) {
        let remainingDiff = Math.abs(qtyDiff);
        for (let i = groupedItems.length - 1; i >= 0 && remainingDiff > 0; i--) {
          const item = groupedItems[i];
          const currentQty = item.qty || 1;
          const newItemQty = Math.max(1, currentQty - remainingDiff);
          remainingDiff -= (currentQty - newItemQty);
          
          await dispatch(
            updateFavoriteItemQuantity({ 
              id: item.id, 
              qty: newItemQty 
            })
          ).unwrap();
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toastAlert({ icon: "error", title: "更新數量失敗，請稍後再試" });
    }
  };

  // 修改 handleDeleteItem 函數
  const handleDeleteItem = async (favoriteId) => {
    try {
      if (!window.confirm("確定要移除此收藏項目嗎？")) {
        return;
      }

      // 找到要刪除的項目
      const favorite = favoritesData.find(item => item.id === favoriteId);
      if (!favorite) return;

      // 找到所有相同規格的項目
      const groupedItems = favoritesData.filter(
        item => item.productId === favorite.productId && 
                item.color === favorite.color && 
                item.size === favorite.size
      );

      // 刪除所有相同規格的項目
      for (const item of groupedItems) {
        await dispatch(removeFromFavorites(item.id)).unwrap();
      }

      toastAlert({ icon: "success", title: "已從收藏列表中移除" });
    } catch (error) {
      toastAlert({ icon: "error", title: "移除失敗，請稍後再試" });
    }
  };

  // 修改 handleAddToCart 函數
  const handleAddToCart = async (favorite) => {
    try {
      // 檢查登入狀態
      if (!isUserLoggedIn()) {
        toastAlert({ icon: "warning", title: "請先登入" });
        navigate("/login");
        return;
      }

      // 找到所有相同規格的項目
      const groupedItems = favoritesData.filter(
        item => item.productId === favorite.productId && 
                item.color === favorite.color && 
                item.size === favorite.size
      );

      // 計算總數量
      const totalQty = groupedItems.reduce((sum, item) => sum + (item.qty || 1), 0);

      // 創建一個新的購物車項目，包含總數量
      const cartItem = {
        ...favorite,
        qty: totalQty
      };

      // 使用 Redux action 加入購物車
      await dispatch(addFavoriteToCart(cartItem)).unwrap();

      toastAlert({ icon: "success", title: "已加入購物車" });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastAlert({ icon: "error", title: "加入購物車失敗，請稍後再試" });
    }
  };

  // 更新商品顏色
  const handleUpdateColor = async (favoriteId, newColor) => {
    try {
      // 使用 Redux action 更新收藏顏色
      await dispatch(
        updateFavoriteItemColor({ id: favoriteId, color: newColor })
      ).unwrap();
      
      toastAlert({ icon: "success", title: "已更新顏色" });
    } catch (error) {
      console.error("Error updating color:", error);
      toastAlert({ icon: "error", title: "更新顏色失敗，請稍後再試" });
    }
  };

  // 更新商品尺寸
  const handleUpdateSize = async (favoriteId, newSize) => {
    try {
      // 使用 Redux action 更新收藏尺寸
      await dispatch(
        updateFavoriteItemSize({ id: favoriteId, size: newSize })
      ).unwrap();
      
      toastAlert({ icon: "success", title: "已更新尺寸" });
    } catch (error) {
      console.error("Error updating size:", error);
      toastAlert({ icon: "error", title: "更新尺寸失敗，請稍後再試" });
    }
  };

  // 組件初始化時檢查登入狀態並獲取收藏列表
  useEffect(() => {
    setIsLoading(true);
    try {

      // 使用 cookieUtils 直接檢查登入狀態
      const loggedIn = isUserLoggedIn();
      // console.log("用戶登入狀態:", loggedIn);

      // 嘗試設置 axios 的全局標頭 - 首先嘗試從不同來源獲取 token
      const token = getJWTToken();
      if (token) {
        // 嘗試直接設置全局 axios 標頭
        axios.defaults.headers.common["Authorization"] = token;

        // 額外嘗試：檢查 token 格式是否需要特殊處理
        const rawToken = token.startsWith("Bearer ")
          ? token.substring(7)
          : token;
      } else {
        // console.warn("未找到有效的 token，無法設置 axios 標頭");
      }

      // 如果已登入或有 token，嘗試獲取收藏列表
      if ((loggedIn || token) && !hasFetchedFavorites.current) {
        hasFetchedFavorites.current = true;
        // console.log("開始獲取收藏列表...");

        dispatch(getFavorites())
          .unwrap()
          .then((result) => {
            console.log("成功獲取收藏列表:", result);
            setIsAuthenticated(true);
            setIsLoading(false);
          })
          .catch((error) => {
            // console.error("獲取收藏列表失敗:", error);

            // 顯示預設資料而不是跳轉
            setIsAuthenticated(true);
            setIsLoading(false);
          });
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      // console.error("初始化時出錯:", error);
      // 同樣在出錯時顯示預設資料
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [dispatch]); // 只依賴 dispatch

  // 監聽 favoritesStatus 變化
  useEffect(() => {
    try {
      setIsLoading(favoritesStatus === "loading");

      // 如果收藏列表獲取失敗，顯示預設資料而不跳轉
      if (favoritesStatus === "failed") {
        console.log("收藏列表獲取失敗，將顯示預設資料");
        setIsAuthenticated(true); // 設置為已認證以顯示預設資料
        setIsLoading(false);
      }
    } catch (error) {
      console.error("處理狀態變化時出錯:", error);
      // 同樣在出錯時顯示預設資料
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [favoritesStatus]);

  // 加強詳細日誌記錄
  useEffect(() => {
    console.log("當前收藏數據狀態:", {
      isAuthenticated,
      isLoading,
      favoritesDataLength: favoritesData.length,
      displayItemsLength: displayItems.length,
      favoritesStatus,
      favoritesError,
    });
  }, [
    isAuthenticated,
    isLoading,
    favoritesData,
    favoritesStatus,
    favoritesError,
  ]);

  return (
    <>
      <title>收藏列表 - WorldWear</title>
      <main>
        <div className="pt-3 pb-3 pt-md-10 pb-md-25">
          <div className="container px-0 px-sm-3">
            <div className="row mx-0 mx-sm-n3">
              <div className="d-none col-lg-2 d-lg-block">
                <UserAside />
              </div>
              <div className="col-lg-10 px-0 px-sm-3">
                <div className="d-flex justify-content-between align-items-center mb-3 px-3 px-sm-0 mb-md-5">
                  <h1 className="fs-h5 fw-bold m-0">收藏列表</h1>
                </div>

                {!isAuthenticated ? (
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
                      <div style={{ width: "480px" }} className="fw-bold">
                        產品資料
                      </div>
                      <div style={{ width: "180px" }} className="fw-bold">
                        規格
                      </div>
                      <div style={{ width: "180px" }} className="fw-bold ms-2">
                        數量
                      </div>
                      <div style={{ width: "180px" }} className="fw-bold">
                        單價
                      </div>
                      <div style={{ width: "180px" }} className="fw-bold">
                        變更
                      </div>
                    </div>

                    {/* 列表內容 - 使用 displayItems 包含預設資料 */}
                    <ul className="list-unstyled m-0">
                      {displayItems.map((favorite) => {
                        console.log("產品數據:", favorite.product);
                        return (
                          <li
                            key={favorite.id}
                            className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3"
                          >
                            {/* 產品資料欄 */}
                            <div style={{ width: "480px" }}>
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
                                      favorite.product?.image ||
                                      "https://placehold.co/108x108?text=No+Image"
                                    }
                                    alt={favorite.product?.title || "產品圖片"}
                                  />
                                </div>
                                <div className="product-title">
                                  {favorite.product?.title ||
                                    favorite.product?.name ||
                                    "未知產品"}
                                </div>
                              </div>
                            </div>

                            {/* 規格欄 */}
                            <div style={{ width: "180px" }}>
                              <div className="product-spec me-2">
                                <select
                                  className="form-select form-select-sm mb-2"
                                  value={favorite.color || ""}
                                  onChange={(e) => handleUpdateColor(favorite.id, e.target.value)}
                                  style={{ backgroundColor: "white" }}
                                  disabled={favorite.id.startsWith("default_")}
                                >
                                  <option value="" style={{ backgroundColor: "white" }}>選擇顏色</option>
                                  {favorite.product?.specs?.map((spec, index) => (
                                    <option 
                                      key={`${favorite.productId}-${spec.color}-${index}`} 
                                      value={spec.color} 
                                      style={{ backgroundColor: "white" }}
                                    >
                                      {spec.color}
                                    </option>
                                  ))}
                                  {Array.isArray(favorite.product?.color) && favorite.product.color.map((color, index) => (
                                    <option 
                                      key={`${favorite.productId}-${color}-${index}`} 
                                      value={color} 
                                      style={{ backgroundColor: "white" }}
                                    >
                                      {color}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="form-select form-select-sm"
                                  value={favorite.size || ""}
                                  onChange={(e) => handleUpdateSize(favorite.id, e.target.value)}
                                  style={{ backgroundColor: "white" }}
                                >
                                  <option value="" style={{ backgroundColor: "white" }}>選擇尺寸</option>
                                  <option value="XS" style={{ backgroundColor: "white" }}>XS</option>
                                  <option value="S" style={{ backgroundColor: "white" }}>S</option>
                                  <option value="M" style={{ backgroundColor: "white" }}>M</option>
                                  <option value="L" style={{ backgroundColor: "white" }}>L</option>
                                  <option value="XL" style={{ backgroundColor: "white" }}>XL</option>
                                  <option value="XXL" style={{ backgroundColor: "white" }}>XXL</option>
                                </select>
                              </div>
                            </div>

                            {/* 數量欄 */}
                            <div style={{ width: "180px" }}>
                              <div className="product-qty py-1.5 py-lg-0 ms-2">
                                <div className="d-flex align-items-center">
                                  <div className="btn-group me-2" role="group">
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm p-1"
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          favorite.id,
                                          favorite.productId,
                                          (favorite.qty || 1) - 1,
                                          favorite
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
                                        handleUpdateQuantity(
                                          favorite.id,
                                          favorite.productId,
                                          (favorite.qty || 1) + 1,
                                          favorite
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
                            <div style={{ width: "180px" }}>
                              <div className="product-price">
                                NT$
                                {favorite.product?.price?.toLocaleString() ||
                                  "未知"}
                              </div>
                            </div>

                            {/* 變更欄 */}
                            <div style={{ width: "180px" }}>
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
                        );
                      })}
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
      <ScreenLoading isLoading={isLoading} />
    </>
  );
}