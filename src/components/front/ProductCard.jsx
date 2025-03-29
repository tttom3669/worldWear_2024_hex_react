import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  // checkProductFavoriteStatus,
  // selectProductFavoriteStatus,
} from '../../slice/favoritesSlice';
import useSwal from '../../hooks/useSwal';
import cookieUtils from '../../components/tools/cookieUtils';
import { store } from '../../store';

const ProductCard = ({ data }) => {
  const dispatch = useDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const favoriteData = useSelector((state) => state.favorites.favoritesData);

  // 使用自定義的 SweetAlert2 提示
  const { toastAlert } = useSwal();

  const checkProductFavoriteStatus = (id) => {
    const foundProduct = favoriteData.products.find(
      (item) => item.productId === id
    );
    // 如果找到產品，則返回 true，否則返回 false
    return foundProduct ? true : false;
  };
  // 獲取該商品的收藏狀態
  // const favoriteStatus = useSelector((state) =>
  //   state.favorites?.favoritesData?.products?.find(
  //     (item) => item.productId === data.id
  //   )
  // );

  // // 判斷是否已收藏
  // const isFavorite = favoriteStatus !== undefined;

  // 組件加載時檢查產品的收藏狀態
  useEffect(() => {
    // 使用 cookieUtils 檢查登入狀態
    if (cookieUtils.isUserLoggedIn() && data.id) {
      const status = checkProductFavoriteStatus(data.id);
      setIsFavorite(status);
    }
  }, [dispatch, data.id, favoriteData]);

  // useEffect(() => {
  //   console.log("收藏狀態更新:", {
  //     productId: data.id,
  //     isFavorite,
  //     favoriteStatus
  //   });
  // }, [data.id, isFavorite, favoriteStatus]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // 停止事件冒泡，防止觸發父元素的連結

    // 使用 cookieUtils 檢查登入狀態，與 favoritesSlice.js 保持一致
    if (!cookieUtils.isUserLoggedIn()) {
      toastAlert({
        icon: 'error',
        title: '請先登入才能將商品加入收藏',
      });

      // 將當前頁面路徑儲存在本地存儲中，以便登入後返回
      localStorage.setItem('redirectAfterLogin', window.location.pathname);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

      return;
    }

    // 根據商品是否已收藏來決定執行的操作
    if (isFavorite) {
      try {
        // 從 Redux store 中獲取所有收藏項目
        const state = store.getState();
        const allFavorites = state.favorites.favoritesData.products || [];

        // 找到所有相同產品的收藏項目
        const sameProductFavorites = allFavorites.filter(
          (favorite) => favorite.productId === data.id
        );

        // 刪除所有相同產品的收藏項目
        for (const favorite of sameProductFavorites) {
          await dispatch(removeFromFavorites(favorite.id)).unwrap();
        }

        toastAlert({
          icon: 'success',
          title: '已從收藏中移除',
        });
      } catch (error) {
        console.error('移除收藏失敗:', error);
        toastAlert({
          icon: 'error',
          title: '移除收藏失敗，請稍後再試',
        });
      }
    } else {
      // 如果未收藏，則添加到收藏
      // 從商品數據中獲取顏色和尺寸
      const selectedColor = data.color?.[0] || ''; // 使用第一個可用顏色
      const selectedSize = data.size?.[0] || ''; // 使用第一個可用尺寸

      dispatch(
        addToFavorites({
          productId: data.id,
          qty: 1,
          color: selectedColor,
          size: selectedSize,
        })
      )
        .unwrap()
        .then(() => {
          toastAlert({
            icon: 'success',
            title: '已加入收藏',
          });
          dispatch(getFavorites());
        })
        .catch((error) => {
          console.error('加入收藏失敗:', error);
          toastAlert({
            icon: 'error',
            title: '加入收藏失敗，請稍後再試',
          });
        });
    }
  };

  const handleImageClick = (e) => {
    // 移除 e.preventDefault()，讓連結可以正常工作
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 400);
  };

  // 計算標籤類型
  const getStatusClass = () => {
    // 根據 status 值設定對應的標籤樣式
    switch (data.status) {
      case '預購':
        return 'status-preorder';
      case '現貨':
        return 'status-instock';
      case '補貨中':
        return 'status-restock';
      default:
        return 'status-default';
    }
  };

  // 判斷是否顯示狀態標籤
  const shouldShowStatus = () => {
    return !!data.status;
  };

  // 獲取顯示的狀態文字
  const getStatusText = () => {
    // 固定的狀態標籤內容
    switch (data.status) {
      case '預購':
      case '現貨':
      case '補貨中':
        return data.status;
      default:
        return '';
    }
  };

  return (
    <motion.div
      className="col-6 col-md-4 mb-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to={`/product/${data.id}`}
        className={`productList-card card h-100 ${isHovered ? 'hovered' : ''}`}
      >
        <div className="img-wrapper-container position-relative">
          <motion.div
            className={`img-wrapper position-relative ${
              data.status === '補貨中' ? 'mask' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={data.imageUrl}
              alt={data.title}
              className="card-img-top"
              animate={{ x: isClicked ? 40 : 0 }}
              transition={{ type: 'spring', stiffness: 150 }}
              onClick={handleImageClick} // 保留點擊動畫但不阻止導航
            />
            {data.status === '補貨中' && (
              <div className="card-img-overlay d-flex align-items-center justify-content-center mt-12">
                <h2 className="card-title fst-italic font-dm-serif text-white">
                  Sold Out
                </h2>
                <p className="card-text">
                  <h5 className="text-white">已售完</h5>
                </p>
              </div>
            )}
          </motion.div>

          {/* 產品狀態標籤 - 移至右上角 */}
          {shouldShowStatus() && (
            <div
              className={`productList-category-tag position-absolute 
              top-0 end-0 me-2 me-md-4 mt-2 mt-md-4 px-2 py-1 text-white 
              ${getStatusClass()}`}
            >
              {getStatusText()}
            </div>
          )}

          <div className="mobile-favorite-container">
            <button
              type="button"
              className={`btn favorite-button ${isFavorite ? 'isLike' : ''}`}
              onClick={handleToggleFavorite} // 這裡已包含 preventDefault 和 stopPropagation
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="currentColor"
                className="bi bi-heart heartIcon"
                viewBox="0 0 16 16"
              >
                <path
                  d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"
                  stroke="transparent"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="card-body p-2 mt-2">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title fs-sm fs-lg-base">{data.title}</h5>
            <button
              type="button"
              className={`btn favorite ${isFavorite ? 'isLike' : ''}`}
              onClick={handleToggleFavorite}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="currentColor"
                className="bi bi-heart heartIcon"
                viewBox="0 0 16 16"
              >
                <path
                  d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"
                  stroke="transparent"
                />
              </svg>
            </button>
          </div>
          <div className="d-flex justify-content-start align-items-center">
            <div>
              <small className="fs-sm fs-lg-base listPrice">
                <s>${data.origin_price}</s>
              </small>
            </div>
            <p className="fs-sm fs-lg-base fw-bold discountPrice ms-1">
              ${data.price}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
