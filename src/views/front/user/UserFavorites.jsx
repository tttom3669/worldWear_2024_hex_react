import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useImgUrl from "../../../hooks/useImgUrl";
import UserAside from "../../../components/front/UserAside";
import useSwal from '../../../hooks/useSwal';

const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function UserFavorites() {
  const getImgUrl = useImgUrl();
  const navigate = useNavigate();
  const { toastAlert } = useSwal();
  const hasNavigated = useRef(false);
  
  const [favoritesData, setFavoritesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 簡化的檢查用戶登入狀態函數 - 只檢查 cookie 存在，不做 API 請求
  const checkUserLogin = () => {
    // 從 cookie 中獲取 token
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)myToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (!token) {
      // 未找到 token，重新導向登入頁面
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        toastAlert({ icon: 'warning', title: '請先登入' });
        navigate("/login");
      }
      setIsAuthenticated(false);
      return false;
    }

    // 設定 Authorization header
    axios.defaults.headers.common["Authorization"] = token;
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

      // 獲取 userId（可以從登入後存儲的位置獲取，這裡假設為 1）
      const userId = "O_I-1uqWlmYqk_hSlENyS"; // 暫時使用靜態值，實際使用時應替換為真實的 userId

      // 獲取收藏列表
      const res = await axios.get(
        `${API_PATH}/favorites/?userId=${userId}`
      );

      setFavoritesData(res.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toastAlert({ icon: 'error', title: '無法取得收藏列表，請稍後再試' });
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

      // 獲取 userId（可以從登入後存儲的位置獲取，這裡假設為 1）
      const userId = "1"; // 暫時使用靜態值，實際使用時應替換為真實的 userId

      // 創建購物車項目
      const cartItem = {
        userId,
        productId: favorite.productId,
        qty: favorite.qty || 1,
        color: favorite.color || favorite.product?.color,
        size: favorite.size || favorite.product?.size
      };

      // 發送請求
      await axios.post(`${API_PATH}/carts`, cartItem);
      
      toastAlert({ icon: 'success', title: '已加入購物車' });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastAlert({ icon: 'error', title: '加入購物車失敗，請稍後再試' });
    }
  };

  // 刪除收藏項目
  const handleDeleteItem = async (favoriteId) => {
    if (!window.confirm("確定要移除此收藏項目嗎？")) {
      return;
    }

    try {
      await axios.delete(`${API_PATH}/favorites/${favoriteId}`);
      
      // 更新狀態
      setFavoritesData(prev => prev.filter(item => item.id !== favoriteId));
      
      toastAlert({ icon: 'success', title: '已從收藏列表中移除' });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toastAlert({ icon: 'error', title: '移除失敗，請稍後再試' });
    }
  };

  // 更新收藏數量
  const handleUpdateQuantity = async (favoriteId, productId, newQty) => {
    // 確保數量不小於 1
    if (newQty < 1) return;

    try {
      await axios.patch(`${API_PATH}/favorites/${favoriteId}`, { qty: newQty });
      
      // 更新狀態
      setFavoritesData(prev => 
        prev.map(item => 
          item.id === favoriteId ? { ...item, qty: newQty } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toastAlert({ icon: 'error', title: '更新數量失敗，請稍後再試' });
    }
  };

  // 組件初始化時檢查登入狀態並獲取收藏列表
  useEffect(() => {
    // 檢查登入狀態
    if (checkUserLogin()) {
      // 如果已登入，獲取收藏列表
      getFavorites();
    }
  }, []);

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
                    
                    {/* 列表內容 - 保留無資料時顯示的預設資料 */}
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



//------------------------------
// import { useEffect, useState } from "react";
// import axios from "axios"; // 需要添加這個引入
// import useImgUrl from "../../../hooks/useImgUrl";
// import FormTitle from "../../../components/front/FormTitle";
// import UserAside from "../../../components/front/UserAside";

// const { VITE_API_PATH: API_PATH } = import.meta.env;

// export default function UserFavorites() {
//   const getImgUrl = useImgUrl();
//   const [favoritesData, setFavoritesData] = useState([]);
//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     const getFavorites = async () => {

//       try {
//         // 測試用
//         const res = await axios.get(
//           `http://localhost:3000/favorites/?userId=${userId}&_expand=product`
//         );

//         setFavoritesData(res.data);
//       } catch (error) {
//         console.error("Error fetching favorites:", error);
//         setFavoritesData([]);
//       }
//     };

//     getFavorites();
//   }, []);

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
//                 <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
//                   收藏列表
//                 </h1>
//                 <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95">
//                   {/* 表格標題列（灰色背景） */}
//                   <div className="d-flex p-3 bg-nature-90">
//                     <div style={{ width: "500px" }} className="fw-bold">
//                       產品資料
//                     </div>
//                     <div style={{ width: "140px" }} className="fw-bold">
//                       規格
//                     </div>
//                     <div style={{ width: "140px" }} className="fw-bold">
//                       數量
//                     </div>
//                     <div style={{ width: "140px" }} className="fw-bold">
//                       單價
//                     </div>
//                     <div style={{ width: "140px" }} className="fw-bold">
//                       變更
//                     </div>
//                   </div>
//                   {/* 列表內容 */}
//                   {favoritesData.length === 0 ? (
//                     <ul className="list-unstyled m-0">
//                       <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
//                         <div style={{ width: "500px" }}>
//                           <div className="d-flex align-items-center">
//                             <img
//                               className="img-fluid me-3"
//                               src="https://i.meee.com.tw/wEzHrAc.jpeg"
//                               alt="法蘭絨短版襯衫"
//                               style={{ width: "108px" }}
//                             />
//                             <div className="product-title">法蘭絨短版襯衫</div>
//                           </div>
//                         </div>
//                         <div style={{ width: "130px" }}>
//                           <div className="product-spec">
//                             <div>白色</div>
//                             <div>XL</div>
//                           </div>
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div className="product-qty">
//                             <div className="product-qty py-1.5 py-lg-0">
//                               <div className="d-flex align-items-center">
//                                 <div className="btn-group me-2" role="group">
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
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
//                                     1
//                                   </span>
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
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
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div className="product-price">NT$1,280</div>
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div
//                             className="d-flex flex-column"
//                             style={{ gap: "10px" }}
//                           >
//                             <button
//                               type="button"
//                               className="btn btn-primary w-100 text-center"
//                             >
//                               加入購物車
//                             </button>
//                             <button
//                               type="button"
//                               className="btn btn-nature-90 w-100 text-center"
//                             >
//                               刪除
//                             </button>
//                           </div>
//                         </div>
//                       </li>
//                       <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
//                         <div style={{ width: "500px" }}>
//                           <div className="d-flex align-items-center">
//                             <div
//                               className="me-3"
//                               style={{
//                                 width: "108px",
//                                 height: "108px",
//                                 overflow: "hidden",
//                               }}
//                             >
//                               <img
//                                 className="img-fluid w-100 h-100 object-fit-cover"
//                                 src="https://i.meee.com.tw/m6YmbY2.jpg"
//                                 alt="寬版工裝短褲"
//                               />
//                             </div>
//                             <div className="product-title">寬版工裝短褲</div>
//                           </div>
//                         </div>
//                         <div style={{ width: "130px" }}>
//                           <div className="product-spec">
//                             <div>軍綠色</div>
//                             <div>XL</div>
//                           </div>
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div className="product-qty">
//                             <div className="product-qty py-1.5 py-lg-0">
//                               <div className="d-flex align-items-center">
//                                 <div className="btn-group me-2" role="group">
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
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
//                                     1
//                                   </span>
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
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
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div className="product-price">NT$650</div>
//                         </div>
//                         <div style={{ width: "140px" }}>
//                           <div
//                             className="d-flex flex-column"
//                             style={{ gap: "10px" }}
//                           >
//                             <button
//                               type="button"
//                               className="btn btn-primary w-100 text-center"
//                             >
//                               加入購物車
//                             </button>
//                             <button
//                               type="button"
//                               className="btn btn-nature-90 w-100 text-center"
//                             >
//                               刪除
//                             </button>
//                           </div>
//                         </div>
//                       </li>
//                     </ul>
//                   ) : (
//                     <ul className="list-unstyled m-0">
//                       {favoritesData.map((favorite) => (
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

//                           {/* 數量欄 - 優化的部分 */}
//                           <div style={{ width: "140px" }}>
//                             <div className="product-qty py-1.5 py-lg-0">
//                               <div className="d-flex align-items-center">
//                                 <div className="btn-group me-2" role="group">
//                                   <button
//                                     type="button"
//                                     className="btn btn-outline-dark btn-sm p-1"
//                                     disabled={favorite.qty <= 1}
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
//                               >
//                                 加入購物車
//                               </button>
//                               <button
//                                 type="button"
//                                 className="btn btn-nature-90 w-100 text-center"
//                               >
//                                 刪除
//                               </button>
//                             </div>
//                           </div>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </>
//   );
// }

// // import { useEffect, useState } from "react";
// // import useImgUrl from "../../../hooks/useImgUrl";
// // import FormTitle from "../../../components/front/FormTitle";
// // import UserAside from "../../../components/front/UserAside";

// // const { VITE_API_PATH: API_PATH } = import.meta.env;

// // export default function UserFavorites() {
// //   const getImgUrl = useImgUrl();
// //   const [favoritesData, setFavoritesData] = useState([]);
// //   const [products, setProducts] = useState([]);

// //   useEffect(() => {
// //   const getFavorites = async () => {
// //     const userId = document.cookie.replace(
// //       /(?:(?:^|.*;\s*)worldWearUserId\s*\=\s*([^;]*).*$)|^.*$/,
// //       '$1'
// //     );
// //     const res = await axios.get(
// //       `${API_PATH}/favorites/?userId=${userId}&_expand=user&_expand=product`
// //     );
// //     setFavoritesData(res.data)
// //   //   const res = await axios.get(
// //   //     `${API_PATH}/favorites/?userId=${userId}&_expand=user&_expand=product`
// //   //   );
// //   //   // setTempFavoritesData(res.data);
// //   };

// //     getFavorites();
// //   }, []);

// //   return (
// //     <>
// //       <main>
// //         <div className="pt-3 pb-3 pt-md-10 pb-md-25">
// //           <div className="container px-0 px-sm-3">
// //             <div className="row mx-0 mx-sm-n3">
// //               <div className="d-none col-lg-2 d-lg-block">
// //                 <UserAside />
// //               </div>
// //               <div className="col-lg-10 px-0 px-sm-3">
// //                 <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
// //                   收藏列表
// //                 </h1>
// //                 <div className="bg-white border-opacity-0 border-opacity-sm-100 border border-nature-95">
// //                   {/* 表格標題列（灰色背景） */}
// //                   <div className="d-flex p-3 bg-nature-90">
// //                     <div style={{ width: "500px" }} className="fw-bold">
// //                       產品資料
// //                     </div>
// //                     <div style={{ width: "140px" }} className="fw-bold">
// //                       規格
// //                     </div>
// //                     <div style={{ width: "140px" }} className="fw-bold">
// //                       數量
// //                     </div>
// //                     <div style={{ width: "140px" }} className="fw-bold">
// //                       單價
// //                     </div>
// //                     <div style={{ width: "140px" }} className="fw-bold">
// //                       變更
// //                     </div>
// //                   </div>
// //                   {/* 列表內容 */}
// //                   {favoritesData.length === 0 ? (
// //                   <ul className="list-unstyled m-0">
// //                     <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
// //                       <div style={{ width: "500px" }}>
// //                         <div className="d-flex align-items-center">
// //                           <img
// //                             className="img-fluid me-3"
// //                             src="https://i.meee.com.tw/wEzHrAc.jpeg"
// //                             alt="法蘭絨短版襯衫"
// //                             style={{ width: "108px" }}
// //                           />
// //                           <div className="product-title">法蘭絨短版襯衫</div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "130px" }}>
// //                         <div className="product-spec">
// //                           <div>白</div>
// //                           <div>XL</div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div className="product-qty">
// //                           <div className="product-qty py-1.5 py-lg-0">
// //                             <div className="d-flex align-items-center">
// //                               <div className="btn-group me-2" role="group">
// //                                 <button
// //                                   type="button"
// //                                   className="btn btn-outline-dark btn-sm p-1"
// //                                   // onClick={() => {
// //                                   //   updateCart(
// //                                   //     cartItem.id,
// //                                   //     cartItem.product_id,
// //                                   //     cartItem.qty - 1
// //                                   //   );
// //                                   // }}
// //                                   // disabled={cartItem.qty === 1}
// //                                 >
// //                                   <svg
// //                                     className="pe-none"
// //                                     width="24"
// //                                     height="24"
// //                                   >
// //                                     <use
// //                                       href={getImgUrl("/icons/minus.svg#minus")}
// //                                     />
// //                                   </svg>
// //                                 </button>
// //                                 <span
// //                                   className="btn border border-dark"
// //                                   style={{ width: "42px", cursor: "auto" }}
// //                                 >
// //                                   1{/* {cartItem.qty} */}
// //                                 </span>
// //                                 <button
// //                                   type="button"
// //                                   className="btn btn-outline-dark btn-sm p-1"
// //                                   // onClick={() => {
// //                                   //   updateCart(
// //                                   //     cartItem.id,
// //                                   //     cartItem.product_id,
// //                                   //     cartItem.qty + 1
// //                                   //   );
// //                                   // }}
// //                                 >
// //                                   <svg
// //                                     className="pe-none"
// //                                     width="24"
// //                                     height="24"
// //                                   >
// //                                     <use
// //                                       href={getImgUrl("/icons/plus.svg#plus")}
// //                                     />
// //                                   </svg>
// //                                 </button>
// //                               </div>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div className="product-price">NT$1,280</div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div
// //                           className="d-flex flex-column"
// //                           style={{ gap: "10px" }}
// //                         >
// //                           <button
// //                             type="button"
// //                             className="btn btn-primary w-100 text-center"
// //                           >
// //                             加入購物車
// //                           </button>
// //                           <button
// //                             type="button"
// //                             className="btn btn-nature-90 w-100 text-center"
// //                           >
// //                             刪除
// //                           </button>
// //                         </div>
// //                       </div>
// //                     </li>
// //                     <li className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3">
// //                       <div style={{ width: "500px" }}>
// //                         {/* <div className="d-flex align-items-center"> */}
// //                         <div className="d-flex align-items-center">
// //                           <div
// //                             className="me-3"
// //                             style={{
// //                               width: "108px",
// //                               height: "108px",
// //                               overflow: "hidden",
// //                             }}
// //                           >
// //                             <img
// //                               className="img-fluid w-100 h-100 object-fit-cover"
// //                               src="https://i.meee.com.tw/m6YmbY2.jpg"
// //                               alt="寬版工裝短褲"
// //                             />
// //                           </div>
// //                           <div className="product-title">寬版工裝短褲</div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "130px" }}>
// //                         <div className="product-spec">
// //                           <div>軍綠色</div>
// //                           <div>XL</div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div className="product-qty">
// //                           <div className="product-qty py-1.5 py-lg-0">
// //                             <div className="d-flex align-items-center">
// //                               <div className="btn-group me-2" role="group">
// //                                 <button
// //                                   type="button"
// //                                   className="btn btn-outline-dark btn-sm p-1"
// //                                   // onClick={() => {
// //                                   //   updateFavoriteItem(
// //                                   //     favoriteItem.id,
// //                                   //     favoriteItem.product_id,
// //                                   //     favoriteItem.qty - 1
// //                                   //   );
// //                                   // }}
// //                                   // disabled={favoriteItem.qty === 1}
// //                                 >
// //                                   <svg
// //                                     className="pe-none"
// //                                     width="24"
// //                                     height="24"
// //                                   >
// //                                     <use
// //                                       href={getImgUrl("/icons/minus.svg#minus")}
// //                                     />
// //                                   </svg>
// //                                 </button>
// //                                 <span
// //                                   className="btn border border-dark"
// //                                   style={{ width: "42px", cursor: "auto" }}
// //                                 >
// //                                   1
// //                                 </span>
// //                                 <button
// //                                   type="button"
// //                                   className="btn btn-outline-dark btn-sm p-1"
// //                                   // onClick={() => {
// //                                   //   updateFavoriteItem(
// //                                   //     favoriteItem.id,
// //                                   //     favoriteItem.product_id,
// //                                   //     favoriteItem.qty - 1
// //                                   //   );
// //                                   // }}
// //                                 >
// //                                   <svg
// //                                     className="pe-none"
// //                                     width="24"
// //                                     height="24"
// //                                   >
// //                                     <use
// //                                       href={getImgUrl("/icons/plus.svg#plus")}
// //                                     />
// //                                   </svg>
// //                                 </button>
// //                               </div>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div className="product-price">NT$650</div>
// //                       </div>
// //                       <div style={{ width: "140px" }}>
// //                         <div
// //                           className="d-flex flex-column"
// //                           style={{ gap: "10px" }}
// //                         >
// //                           <button
// //                             type="button"
// //                             className="btn btn-primary w-100 text-center"
// //                           >
// //                             加入購物車
// //                           </button>
// //                           <button
// //                             type="button"
// //                             className="btn btn-nature-90 w-100 text-center"
// //                           >
// //                             刪除
// //                           </button>
// //                         </div>
// //                       </div>
// //                     </li>
// //                     {/* 可以添加更多收藏商品項目 */}
// //                   </ul>
// //                   ):(
// //                     <ul className="list-unstyled m-0">
// //                       {favoritesData.map((favorite) => (
// //                         <li
// //                           key={favorite.id}
// //                           className="d-flex align-items-center py-4 px-3 border-bottom border-nature-90 mt-3"
// //                         >
// //                           {/* 產品資料欄 */}
// //                           <div style={{ width: "500px" }}>
// //                             <div className="d-flex align-items-center">
// //                               <div
// //                                 className="me-3"
// //                                 style={{
// //                                   width: "108px",
// //                                   height: "108px",
// //                                   overflow: "hidden",
// //                                 }}
// //                               >
// //                                 <img
// //                                   className="img-fluid w-100 h-100 object-fit-cover"
// //                                   src={favorite.product?.image || "https://placehold.co/108x108?text=No+Image"}
// //                                   alt={favorite.product?.name || "產品圖片"}
// //                                 />
// //                               </div>
// //                               <div className="product-title">
// //                                 {favorite.product?.name || "未知產品"}
// //                               </div>
// //                             </div>
// //                           </div>

// //                           {/* 規格欄 */}
// //                           <div style={{ width: "130px" }}>
// //                             <div className="product-spec">
// //                               <div>{favorite.color || favorite.product?.color || "無顏色資訊"}</div>
// //                               <div>{favorite.size || favorite.product?.size || "無尺寸資訊"}</div>
// //                             </div>
// //                           </div>

// //                           {/* 數量欄 - 優化的部分 */}
// //                           <div style={{ width: "140px" }}>
// //                             <div className="product-qty py-1.5 py-lg-0">
// //                               <div className="d-flex align-items-center">
// //                                 <div className="btn-group me-2" role="group">
// //                                   <button
// //                                     type="button"
// //                                     className="btn btn-outline-dark btn-sm p-1"
// //                                     // onClick={() => handleUpdateQuantity(
// //                                     //   favorite.id,
// //                                     //   favorite.product_id,
// //                                     //   favorite.qty - 1
// //                                     // )}
// //                                     disabled={favorite.qty <= 1}
// //                                   >
// //                                     <svg
// //                                       className="pe-none"
// //                                       width="24"
// //                                       height="24"
// //                                     >
// //                                       <use
// //                                         href={getImgUrl("/icons/minus.svg#minus")}
// //                                       />
// //                                     </svg>
// //                                   </button>
// //                                   <span
// //                                     className="btn border border-dark"
// //                                     style={{ width: "42px", cursor: "auto" }}
// //                                   >
// //                                     {favorite.qty}
// //                                   </span>
// //                                   <button
// //                                     type="button"
// //                                     className="btn btn-outline-dark btn-sm p-1"
// //                                     // onClick={() => handleUpdateQuantity(
// //                                     //   favorite.id,
// //                                     //   favorite.product_id,
// //                                     //   favorite.qty + 1
// //                                     // )}
// //                                   >
// //                                     <svg
// //                                       className="pe-none"
// //                                       width="24"
// //                                       height="24"
// //                                     >
// //                                       <use
// //                                         href={getImgUrl("/icons/plus.svg#plus")}
// //                                       />
// //                                     </svg>
// //                                   </button>
// //                                 </div>
// //                               </div>
// //                             </div>
// //                           </div>

// //                           {/* 單價欄 */}
// //                           <div style={{ width: "140px" }}>
// //                             <div className="product-price">
// //                               {/* NT${favorite.product?.price?.toLocaleString() || "未知"} */}
// //                             </div>
// //                           </div>

// //                           {/* 變更欄 */}
// //                           <div style={{ width: "140px" }}>
// //                             <div
// //                               className="d-flex flex-column"
// //                               style={{ gap: "10px" }}
// //                             >
// //                               <button
// //                                 type="button"
// //                                 className="btn btn-primary w-100 text-center"
// //                                 // onClick={() => handleAddToCart(favorite)}
// //                               >
// //                                 加入購物車
// //                               </button>
// //                               <button
// //                                 type="button"
// //                                 className="btn btn-nature-90 w-100 text-center"
// //                                 // onClick={() => handleDeleteItem(favorite.id)}
// //                               >
// //                                 刪除
// //                               </button>
// //                             </div>
// //                           </div>
// //                         </li>
// //                       ))}
// //                     </ul>
// //                   )}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </main>
// //     </>
// //   );
// // }

// // <main>
// //   <div className="pt-3 pb-3 pt-md-10 pb-md-25">
// //     <div className="container px-0 px-sm-3">
// //       <div className="row mx-0 mx-sm-n3">
// //         <div className="d-none col-lg-2 d-lg-block">
// //           <UserAside />
// //         </div>
// //         <div className="col-lg-10 px-0 px-sm-3">
// //           <h1 className="fs-h5 fw-bold mb-3 px-3 px-sm-0 mb-md-5">
// //             收藏列表
// //           </h1>
// //           <div className="bg-white">
// //             <table className="table align-middle">
// //               <thead className="bg-muted">
// //                 <tr>
// //                   <th style={{ width: "515px" }}>產品資料</th>
// //                   <th style={{ width: "134px" }}>規格</th>
// //                   <th style={{ width: "134px" }}>數量</th>
// //                   <th style={{ width: "134px" }}>單價</th>
// //                   <th style={{ width: "134px" }}>變更</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 <tr>
// //                   <div>
// //                     <td style={{ width: "515px" }}>
// //                       <div className="product-quantity d-flex align-items-center">
// //                         <img
// //                           className="img-fluid"
// //                           src="https://i.meee.com.tw/wEzHrAc.jpeg"
// //                           alt="法蘭絨短版襯衫"
// //                           style={{ width: "132px" }}
// //                         />
// //                         <div className="product-title">
// //                           法蘭絨短版襯衫
// //                         </div>
// //                       </div>
// //                     </td>
// //                     {/* <td className="product-title">法蘭絨短版襯衫</td> */}
// //                     <td style={{ width: "134px" }}>
// //                       <div className="product-spec">
// //                         <div className="h5">白</div>
// //                         <div className="h5">XL</div>
// //                       </div>
// //                     </td>
// //                     <td style={{ width: "134px" }}>
// //                       <div className="product-quantity">1</div>
// //                     </td>
// //                     <td style={{ width: "134px" }}>
// //                       <div className="product-price">$1,280</div>
// //                     </td>
// //                     <td>
// //                       <div className="btn-group btn-group-sm">
// //                         <button
// //                           type="button"
// //                           className="btn btn-primary d-flex align-items-center gap-2"
// //                         >
// //                           加入購物車
// //                         </button>
// //                         <button
// //                           type="button"
// //                           className="btn btn-outline-danger d-flex align-items-center gap-2"
// //                         >
// //                           刪除
// //                         </button>
// //                       </div>
// //                     </td>
// //                   </div>
// //                 </tr>
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   </div>
// // </main>
