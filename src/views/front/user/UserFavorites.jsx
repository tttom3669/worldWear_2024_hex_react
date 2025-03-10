import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useImgUrl from "../../../hooks/useImgUrl";
import UserAside from "../../../components/front/UserAside";
import useSwal from '../../../hooks/useSwal';

const { VITE_API_PATH: API_PATH } = import.meta.env;

// 獲取cookie的輔助函數
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// 建立包含Auth Token的axios實例
const axiosWithAuth = axios.create();

// 攔截器，自動添加token到每個請求
axiosWithAuth.interceptors.request.use(
  (config) => {
    const token = getCookie('myToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function UserFavorites() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const { toastAlert } = useSwal();
  const hasNavigated = useRef(false);
  
  const [favoritesData, setFavoritesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  // 改進的檢查用戶登入狀態函數 - 檢查正確的cookie名稱
  const checkUserLogin = () => {
    // 嘗試從不同可能的cookie名稱中獲取token
    const token = getCookie('myToken') || getCookie('worldWearToken');
    const userIdFromCookie = getCookie('worldWearUserId');

    if (!token) {
      // 未找到token，重新導向登入頁面
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      }
      setIsAuthenticated(false);
      return false;
    }

    // 設定全局 Authorization header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    // 如果找到了userId，設置它
    if (userIdFromCookie) {
      setUserId(userIdFromCookie);
    }
    
    setIsAuthenticated(true);
    return true;
  };

  // 取得收藏列表
  const getFavorites = async () => {
    setIsLoading(true);
    
    try {
      // 先檢查登入狀態
      if (!checkUserLogin()) {
        setIsLoading(false);
        return;
      }

      // 使用登入頁面設置的userId，或嘗試從localStorage獲取
      const currentUserId = userId || 
                           localStorage.getItem('userId') || 
                           getCookie('worldWearUserId');
      
      // 如果仍然沒有userId，嘗試從API獲取當前用戶信息
      let apiUserId = currentUserId;
      
      if (!apiUserId) {
        try {
          // 嘗試獲取當前用戶信息
          const userResponse = await axiosWithAuth.get(`${API_PATH}/user/profile`);
          if (userResponse.data && userResponse.data.id) {
            apiUserId = userResponse.data.id;
            // 保存userId以供將來使用
            setUserId(apiUserId);
            localStorage.setItem('userId', apiUserId);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }

      // 如果有userId，使用它；否則使用通用請求
      let response;
      if (apiUserId) {
        response = await axiosWithAuth.get(`${API_PATH}/favorites/?userId=${apiUserId}`);
      } else {
        // 不指定userId，讓後端根據token識別用戶
        response = await axiosWithAuth.get(`${API_PATH}/favorites`);
      }

      if (response && response.data) {
        // 確認我們有有效的數據格式
        const dataArray = Array.isArray(response.data) ? response.data : 
                        (response.data.favorites || []);
        
        setFavoritesData(dataArray);
      } else {
        setFavoritesData([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      
      // 檢查是否是授權問題
      if (error.response && error.response.status === 401) {
        toastAlert({ icon: 'warning', title: '請重新登入' });
        // 清除可能過期的token
        document.cookie = "myToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "worldWearToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // 重新導向到登錄頁面
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          navigate("/login");
        }
      } else {
        toastAlert({ icon: 'error', title: '無法取得收藏列表，請稍後再試' });
      }
      
      // 發生錯誤時保持收藏列表為空陣列
      setFavoritesData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 加入購物車
  const handleAddToCart = async (favorite) => {
    try {
      // 檢查登入狀態
      if (!checkUserLogin()) {
        return;
      }

      // 使用當前userId或從favorite中獲取
      const currentUserId = userId || 
                           localStorage.getItem('userId') || 
                           getCookie('worldWearUserId') ||
                           favorite.userId;

      if (!currentUserId) {
        toastAlert({ icon: 'error', title: '無法識別用戶，請重新登入' });
        navigate("/login");
        return;
      }

      // 創建購物車項目
      const cartItem = {
        userId: currentUserId,
        productId: favorite.productId,
        qty: favorite.qty || 1,
        color: favorite.color || favorite.product?.color,
        size: favorite.size || favorite.product?.size
      };

      // 發送請求，使用帶有授權的axios實例
      await axiosWithAuth.post(`${API_PATH}/carts`, cartItem);
      
      toastAlert({ icon: 'success', title: '已加入購物車' });
    } catch (error) {
      console.error("Error adding to cart:", error);
      
      if (error.response && error.response.status === 401) {
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      } else {
        toastAlert({ icon: 'error', title: '加入購物車失敗，請稍後再試' });
      }
    }
  };

  // 刪除收藏項目
  const handleDeleteItem = async (favoriteId) => {
    if (!window.confirm("確定要移除此收藏項目嗎？")) {
      return;
    }

    try {
      // 使用帶有授權的axios實例
      await axiosWithAuth.delete(`${API_PATH}/favorites/${favoriteId}`);
      
      // 更新狀態
      setFavoritesData(prev => prev.filter(item => item.id !== favoriteId));
      
      toastAlert({ icon: 'success', title: '已從收藏列表中移除' });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      
      if (error.response && error.response.status === 401) {
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
      // 使用帶有授權的axios實例
      await axiosWithAuth.patch(`${API_PATH}/favorites/${favoriteId}`, { qty: newQty });
      
      // 更新狀態
      setFavoritesData(prev => 
        prev.map(item => 
          item.id === favoriteId ? { ...item, qty: newQty } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      
      if (error.response && error.response.status === 401) {
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      } else {
        toastAlert({ icon: 'error', title: '更新數量失敗，請稍後再試' });
      }
    }
  };

  // 組件初始化時檢查登入狀態並獲取收藏列表
  useEffect(() => {
    // 檢查登入狀態
    const isUserLoggedIn = checkUserLogin();
    
    if (isUserLoggedIn) {
      // 如果已登入，獲取收藏列表
      getFavorites();
    }
  }, []); // 依賴數組為空，僅在組件掛載時執行一次

  // 當userId變更時重新獲取收藏列表
  useEffect(() => {
    if (userId && isAuthenticated) {
      getFavorites();
    }
  }, [userId]);

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
                <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
                  收藏列表
                </h1>
                
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
                ) : (
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
                    
                    {/* 列表內容 */}
                    {favoritesData.length === 0 ? (
                      <ul className="list-unstyled m-0">
                        <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
                          <div style={{ width: "500px" }}>
                            <div className="d-flex align-items-center">
                              <img
                                className="img-fluid me-3"
                                src="https://i.meee.com.tw/wEzHrAc.jpeg"
                                alt="法蘭絨短版襯衫"
                                style={{ width: "108px" }}
                              />
                              <div className="product-title">法蘭絨短版襯衫</div>
                            </div>
                          </div>
                          <div style={{ width: "130px" }}>
                            <div className="product-spec">
                              <div>白色</div>
                              <div>XL</div>
                            </div>
                          </div>
                          <div style={{ width: "140px" }}>
                            <div className="product-qty">
                              <div className="product-qty py-1.5 py-lg-0">
                                <div className="d-flex align-items-center">
                                  <div className="btn-group me-2" role="group">
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm p-1"
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
                                      1
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm p-1"
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
                          </div>
                          <div style={{ width: "140px" }}>
                            <div className="product-price">NT$1,280</div>
                          </div>
                          <div style={{ width: "140px" }}>
                            <div
                              className="d-flex flex-column"
                              style={{ gap: "10px" }}
                            >
                              <button
                                type="button"
                                className="btn btn-primary w-100 text-center"
                              >
                                加入購物車
                              </button>
                              <button
                                type="button"
                                className="btn btn-nature-90 w-100 text-center"
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        </li>
                        <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
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
                                  src="https://i.meee.com.tw/m6YmbY2.jpg"
                                  alt="寬版工裝短褲"
                                />
                              </div>
                              <div className="product-title">寬版工裝短褲</div>
                            </div>
                          </div>
                          <div style={{ width: "130px" }}>
                            <div className="product-spec">
                              <div>軍綠色</div>
                              <div>XL</div>
                            </div>
                          </div>
                          <div style={{ width: "140px" }}>
                            <div className="product-qty">
                              <div className="product-qty py-1.5 py-lg-0">
                                <div className="d-flex align-items-center">
                                  <div className="btn-group me-2" role="group">
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm p-1"
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
                                      1
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-outline-dark btn-sm p-1"
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
                          </div>
                          <div style={{ width: "140px" }}>
                            <div className="product-price">NT$650</div>
                          </div>
                          <div style={{ width: "140px" }}>
                            <div
                              className="d-flex flex-column"
                              style={{ gap: "10px" }}
                            >
                              <button
                                type="button"
                                className="btn btn-primary w-100 text-center"
                              >
                                加入購物車
                              </button>
                              <button
                                type="button"
                                className="btn btn-nature-90 w-100 text-center"
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        </li>
                      </ul>
                    ) : (
                      <ul className="list-unstyled m-0">
                        {favoritesData.map((favorite) => (
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
                                      favorite.product?.image ||
                                      "https://placehold.co/108x108?text=No+Image"
                                    }
                                    alt={favorite.product?.name || "產品圖片"}
                                  />
                                </div>
                                <div className="product-title">
                                  {favorite.product?.name || "未知產品"}
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
                                      onClick={() => handleUpdateQuantity(
                                        favorite.id,
                                        favorite.productId,
                                        (favorite.qty || 1) - 1
                                      )}
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
                                      onClick={() => handleUpdateQuantity(
                                        favorite.id,
                                        favorite.productId,
                                        (favorite.qty || 1) + 1
                                      )}
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
                    )}
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