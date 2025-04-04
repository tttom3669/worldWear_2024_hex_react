import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  fetchProducts,
  sortProducts,
  setCurrentPage,
  resetFilters,
  setCurrentCategory,
} from '../../slice/productsListSlice';
import FrontHeader from '../../components/front/FrontHeader';
import Pagination from '../../components/layouts/Pagination';
import ProductCard from '../../components/front/ProductCard';
import ScreenLoading from '../../components/front/ScreenLoading';

import ProductAside, {
  FilterSortButton,
  SortFilter,
} from '../../components/front/ProductAside';
import { getFavorites } from '../../slice/favoritesSlice';

export default function ProductsList() {
  const dispatch = useDispatch();
  const { category, gender, subcategory } = useParams(); // 從 URL 獲取性別和分類參數
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // 從 Redux 獲取狀態
  const {
    filteredItems = [],
    items = [],
    status = 'idle',
    error = null,
    sortOption = '最新上架',
    currentPage = 1,
    currentCategory = null,
  } = useSelector((state) => state.productsList || {});

  const dataLimit = 9;
  const pageLimit = 10;

  // 處理來自不同路由格式的分類參數
  const getActualCategory = useCallback(() => {
    // 處理 hash 路由格式 (例如 /#/products/women/dress/long-dress)
    const hashPath = location.hash;
    if (hashPath) {
      const path = hashPath.replace('#', '');
      const pathSegments = path.split('/').filter(Boolean);

      if (pathSegments.length >= 2 && pathSegments[0] === 'products') {
        // 處理三層結構: /products/women/jacket/long-jacket
        if (pathSegments.length >= 4) {
          return `${pathSegments[1]}/${pathSegments[2]}/${pathSegments[3]}`;
        }
        // 處理兩層結構: /products/women/jacket
        else if (pathSegments.length >= 3) {
          return `${pathSegments[1]}/${pathSegments[2]}`;
        }
        // 處理單層結構: /products/women
        else if (pathSegments.length === 2) {
          return pathSegments[1];
        }
      }
    }

    // 處理 /products/:gender/:category/:subcategory 格式的路由
    if (gender && category && subcategory) {
      return `${gender}/${category}/${subcategory}`;
    }

    // 處理 /products/:gender/:category 格式的路由
    if (gender && category) {
      return `${gender}/${category}`;
    }

    // 處理 /products/:gender 格式的路由
    if (gender && !category) {
      return gender;
    }

    return null;
  }, [gender, category, subcategory, location.hash]);

  // 處理頁面標題顯示
  const getPageTitle = useMemo(() => {
    // 使用 currentCategory 來決定標題
    if (currentCategory) {
      // 檢查是否為頂層性別類別
      if (currentCategory === 'men') {
        return '男裝 商品一覽';
      } else if (currentCategory === 'women') {
        return '女裝 商品一覽';
      }

      // 處理包含路徑的類別
      const pathParts = currentCategory.split('/');
      if (pathParts.length > 0) {
        // 顯示性別類別
        const gender = pathParts[0] === 'men' ? '男裝' : '女裝';

        if (pathParts.length > 1) {
          // 有子類別，但仍只顯示主類別
          return `${gender} 商品一覽`;
        }
        return `${gender} 商品一覽`;
      }
    }

    // 預設顯示
    return '商品一覽';
  }, [currentCategory]);

  // 使用 useEffect 獲取產品數據，根據實際路徑參數
  useEffect(() => {
    // 獲取實際分類（從各種可能的路由格式）
    const actualCategory = getActualCategory();

    if (actualCategory) {
      dispatch(setCurrentCategory(actualCategory));
    } else {
      // 如果沒有分類參數，設置為 null 顯示所有商品
      dispatch(setCurrentCategory(null));
    }

    // 調試日誌
    console.log('路由參數:', { gender, category, subcategory });
    console.log('hash 路徑:', location.hash);
    console.log('提取的實際分類:', actualCategory);
  }, [
    gender,
    category,
    subcategory,
    location.hash,
    dispatch,
    getActualCategory,
  ]);

  // 在組件初始化時，從 URL 查詢參數讀取頁碼
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber >= 1) {
        dispatch(setCurrentPage(pageNumber));
      }
    }
  }, [searchParams, dispatch]);

  // 當 currentCategory 改變時，重新獲取產品數據
  useEffect(() => {
    // 在獲取新數據前先重置篩選條件，但保留頁碼
    dispatch(resetFilters());

    // 如果 URL 中沒有 page 參數，重置頁碼到第 1 頁
    const pageParam = searchParams.get('page');
    if (!pageParam) {
      dispatch(setCurrentPage(1));
    }

    // 新增延遲，確保頁面顯示「載入中」狀態，避免閃現舊數據
    const timer = setTimeout(() => {
      if (currentCategory !== undefined) {
        dispatch(fetchProducts(currentCategory));
      }
    }, 50);

    return () => clearTimeout(timer); // 清除計時器，避免記憶體洩漏
  }, [currentCategory, dispatch, searchParams]);

  // 使用 useCallback 優化性能
  const handleSortChange = useCallback(
    (option) => {
      dispatch(sortProducts(option));
    },
    [dispatch]
  );

  const handlePageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
    },
    [dispatch]
  );

  // 處理Offcanvas開關，使用 useCallback 優化
  const toggleOffcanvas = useCallback(() => {
    setShowOffcanvas((prev) => !prev);
    setShowHeader((prev) => !prev);

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.style.display = showOffcanvas ? 'block' : 'none';
    }

    // 控制 body 的滾動
    document.body.style.overflow = showOffcanvas ? '' : 'hidden';
  }, [showOffcanvas]);

  // 在組件被卸載時確保header可見和body滾動恢復
  useEffect(() => {
    return () => {
      const headerContainer = document.getElementById('header-container');
      if (headerContainer) {
        headerContainer.style.display = 'block';
      }
      document.body.style.overflow = '';
    };
  }, []);

  // 渲染內容
  const renderContent = () => {
    if (status === 'failed') {
      return (
        <div className="alert alert-danger" role="alert">
          {error || '載入產品時發生錯誤'}
        </div>
      );
    }

    if (filteredItems.length === 0 && items.length > 0) {
      return (
        <div className="alert alert-info" role="alert">
          沒有符合篩選條件的商品，請嘗試其他篩選條件。
        </div>
      );
    }

    return (
      <Pagination
        data={filteredItems}
        RenderComponent={ProductCard}
        pageLimit={pageLimit}
        dataLimit={dataLimit}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
      />
    );
  };

  useEffect(() => {
    dispatch(getFavorites());
  }, []);

  return (
    <>
      <title>
        {`${gender === 'women' ? '女裝' : '男裝'}  商品一覽 - WorldWear`}
      </title>
      {showHeader && <FrontHeader defaultType="light" />}
      <main className="mt-17 bg-nature-99">
        <section className="productList-section bg-nature-99">
          <div className="container">
            <div className="row">
              {/* 類別篩選選單 - 桌面版 */}
              <div className="col-md-3 d-none d-md-block ps-3 mb-20">
                <div className="filterMenu-wrap">
                  <ProductAside isOffcanvas={false} />
                </div>
              </div>
              <div className="col-12 col-md-9 d-block infoTitle">
                <div className="mb-10 mb-md-10 d-flex justify-content-between align-items-start flex-column flex-md-row">
                  <div className="d-flex align-items-center gap-3">
                    <h3 id="product-title">{getPageTitle}</h3>
                  </div>
                  {/* 電腦版排序選單 */}
                  <SortFilter
                    sortOption={sortOption}
                    handleSortChange={handleSortChange}
                  />
                </div>

                {/* 使用合併後的手機版篩選按鈕與排序選單 */}
                <FilterSortButton
                  toggleOffcanvas={toggleOffcanvas}
                  sortOption={sortOption}
                  handleSortChange={handleSortChange}
                />

                {/* 顯示載入狀態或錯誤訊息 */}
                <div className="mb-10">{renderContent()}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Offcanvas */}
        <div className={`offcanvas-wrapper ${showOffcanvas ? 'show' : ''}`}>
          <div
            className={`offcanvas offcanvas-fullscreen ${
              showOffcanvas ? 'show' : ''
            }`}
            tabIndex="-1"
            id="offcanvasCategoryMenu"
            aria-labelledby="offcanvasCategoryMenuLabel"
          >
            <div className="offcanvas-header position-relative">
              <h5
                className="offcanvas-title"
                id="offcanvasCategoryMenuLabel"
              ></h5>
              <button
                type="button"
                className="btn offcanvas-cancel-btn position-absolute top-0 end-0 mt-3 me-3"
                onClick={toggleOffcanvas}
                aria-label="Close"
              >
                取消
              </button>
            </div>
            <div className="offcanvas-body">
              <div className="filterMenu-wrap">
                <ProductAside
                  isOffcanvas={true}
                  toggleOffcanvas={toggleOffcanvas}
                />
              </div>
              {/* 原有的"查看品項"按鈕由 ProductAside 組件內部提供，此處移除 */}
            </div>
          </div>

          {/* Backdrop for offcanvas */}
          <div
            className={`offcanvas-backdrop fade ${showOffcanvas ? 'show' : ''}`}
            onClick={toggleOffcanvas}
          ></div>
        </div>
      </main>
      <ScreenLoading
        isLoading={
          status === 'loading' || (status === 'idle' && currentCategory)
        }
      />
    </>
  );
}
