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
} from "../../../slice/favoritesSlice";
// 導入 cookieUtils
import cookieUtils, {
  isUserLoggedIn,
  getJWTToken,
  getUserIdFromCookie,
} from "../../../components/tools/cookieUtils";

export default function UserFavorites() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();
  const hasNavigated = useRef(false);
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
        color: "紅色",
        size: "XL",
      },
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
        size: "XL",
      },
    },
  ];

  // 加入購物車
  const handleAddToCart = async (favorite) => {
    try {
      // 檢查登入狀態
      if (!isUserLoggedIn()) {
        toastAlert({ icon: "warning", title: "請先登入" });
        navigate("/login");
        return;
      }

      // 處理預設商品的情況
      if (favorite.id.startsWith("default_")) {
        handleDemoAction("add-to-cart");
        return;
      }

      // 使用 Redux action 加入購物車
      await dispatch(addFavoriteToCart(favorite)).unwrap();

      toastAlert({ icon: "success", title: "已加入購物車" });
    } catch (error) {
      console.error("Error adding to cart:", error);

      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "加入購物車失敗，請稍後再試";

      if (
        errorMessage.includes("請先登入") ||
        errorMessage.includes("未登入")
      ) {
        toastAlert({ icon: "warning", title: "請先登入" });
        navigate("/login");
      } else {
        toastAlert({ icon: "error", title: "加入購物車失敗，請稍後再試" });
      }
    }
  };

  // 刪除收藏項目
  const handleDeleteItem = async (favoriteId) => {
    try {
      // 處理預設商品的情況
      if (favoriteId.startsWith("default_")) {
        handleDemoAction("delete");
        return;
      }

      if (!window.confirm("確定要移除此收藏項目嗎？")) {
        return;
      }

      // 使用 Redux action 刪除收藏項目
      await dispatch(removeFromFavorites(favoriteId)).unwrap();

      toastAlert({ icon: "success", title: "已從收藏列表中移除" });
    } catch (error) {
      console.error("Error deleting favorite:", error);

      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "移除失敗，請稍後再試";

      if (
        errorMessage.includes("請先登入") ||
        errorMessage.includes("未登入")
      ) {
        toastAlert({ icon: "warning", title: "請先登入" });
        navigate("/login");
      } else {
        toastAlert({ icon: "error", title: "移除失敗，請稍後再試" });
      }
    }
  };

  // 更新收藏數量
  const handleUpdateQuantity = async (favoriteId, productId, newQty) => {
    // 確保數量不小於 1
    if (newQty < 1) return;

    try {
      // 處理預設商品的情況
      if (favoriteId.startsWith("default_")) {
        handleDemoAction("update");
        return;
      }

      // 使用 Redux action 更新收藏數量
      await dispatch(
        updateFavoriteItemQuantity({ id: favoriteId, qty: newQty })
      ).unwrap();
    } catch (error) {
      console.error("Error updating quantity:", error);

      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "更新數量失敗，請稍後再試";

      if (
        errorMessage.includes("請先登入") ||
        errorMessage.includes("未登入")
      ) {
        toastAlert({ icon: "warning", title: "請先登入" });
        navigate("/login");
      } else {
        toastAlert({ icon: "error", title: "更新數量失敗，請稍後再試" });
      }
    }
  };

  // 添加 token 調試函數
  const debugTokenInfo = () => {
    try {
      const token = cookieUtils.getJWTToken();
      const userId = cookieUtils.getUserIdFromCookie();
      const isLogged = cookieUtils.isUserLoggedIn();

      console.log(
        "當前 JWT Token:",
        token ? token.substring(0, 20) + "..." : "無"
      );
      console.log("Cookie 中的用戶 ID:", userId || "無");
      console.log("是否已登入:", isLogged ? "是" : "否");

      return !!token && !!userId; // 返回是否有有效 token 和 userId
    } catch (error) {
      console.error("檢查 token 時出錯:", error);
      return false;
    }
  };

  // 組件初始化時檢查登入狀態並獲取收藏列表
  useEffect(() => {
    console.log("UserFavorites 組件初始化");

    try {
      // 調試 token 信息
      const hasTokenAndUserId = debugTokenInfo();
      console.log("是否有有效 token 和 userId:", hasTokenAndUserId);

      // 使用 cookieUtils 直接檢查登入狀態
      const loggedIn = isUserLoggedIn();
      console.log("用戶登入狀態:", loggedIn);

      // 嘗試設置 axios 的全局標頭 - 首先嘗試從不同來源獲取 token
      const token = getJWTToken();
      if (token) {
        // 嘗試直接設置全局 axios 標頭
        axios.defaults.headers.common["Authorization"] = token;
        console.log("已設置 axios 全局標頭:", token.substring(0, 15) + "...");

        // 額外嘗試：檢查 token 格式是否需要特殊處理
        const rawToken = token.startsWith("Bearer ")
          ? token.substring(7)
          : token;
        console.log("原始 token 值:", rawToken.substring(0, 10) + "...");
      } else {
        console.warn("未找到有效的 token，無法設置 axios 標頭");
      }

      // 直接檢查 cookie 中的 userId 是否與預期的 ID 匹配
      const currentUserId = getUserIdFromCookie();
      console.log("當前用戶 ID:", currentUserId);
      console.log(
        "是否匹配目標 ID (Ct5HXrUgBSgTZnal_qJdU):",
        currentUserId === "Ct5HXrUgBSgTZnal_qJdU"
      );

      // 如果已登入或有 token，嘗試獲取收藏列表
      if ((loggedIn || token) && !hasFetchedFavorites.current) {
        hasFetchedFavorites.current = true;
        console.log("開始獲取收藏列表...");

        dispatch(getFavorites())
          .unwrap()
          .then((result) => {
            console.log("成功獲取收藏列表:", result);
            setIsAuthenticated(true);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error("獲取收藏列表失敗:", error);

            // 詳細記錄錯誤信息
            if (error.details) {
              console.error("詳細錯誤信息:", error.details);
            }

            // 顯示預設資料而不是跳轉
            setIsAuthenticated(true);
            setIsLoading(false);
          });
      } else {
        // 用戶未登入或已嘗試過獲取列表，顯示預設資料
        console.log(
          loggedIn ? "已嘗試過獲取列表" : "用戶未登入",
          "，將顯示預設資料"
        );
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("初始化時出錯:", error);
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

  // 處理預設商品的演示動作
  const handleDemoAction = (action) => {
    switch (action) {
      case "add-to-cart":
        toastAlert({ icon: "success", title: "演示：已加入購物車" });
        break;
      case "delete":
        toastAlert({ icon: "success", title: "演示：已從收藏列表中移除" });
        break;
      case "update":
        toastAlert({ icon: "success", title: "演示：已更新數量" });
        break;
      default:
        toastAlert({ icon: "info", title: "演示操作" });
    }
  };

  // 準備要顯示的收藏數據 - 如果用戶沒有收藏，則使用預設資料
  const displayItems =
    isAuthenticated && favoritesData.length === 0
      ? defaultItems
      : favoritesData;

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
                                      handleUpdateQuantity(
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
                                      handleUpdateQuantity(
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