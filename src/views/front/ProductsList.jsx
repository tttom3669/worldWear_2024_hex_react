import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import {
  fetchProducts,
  sortProducts,
  setCurrentPage,
  resetFilters,
  setCurrentCategory,
} from "../../slice/productsListSlice";
import FrontHeader from "../../components/front/FrontHeader";
import Pagination from "../../components/layouts/Pagination";
import ProductCard from "../../components/front/ProductCard";
import {
  FilterMenu,
  FilterSortButton,
  SortFilter,
} from "../../components/front/FilterMenu";

export default function ProductsList() {
  const dispatch = useDispatch();
  const { category, gender } = useParams(); // 從 URL 獲取性別和分類參數
  const location = useLocation();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // 從 Redux 獲取狀態
  const {
    filteredItems = [],
    items = [],
    status = "idle",
    error = null,
    sortOption = "最新上架",
    currentPage = 1,
    filters = {},
    currentCategory = null,
  } = useSelector((state) => state.productsList || {});

  const dataLimit = 9;
  const pageLimit = 10;

  // 處理來自不同路由格式的分類參數
  const getActualCategory = useCallback(() => {
    // 處理 /products/:gender/:category 格式的路由
    if (gender && category) {
      return `${gender}/${category}`;
    }
    
    // 處理 /products/:gender 格式的路由
    if (gender && !category) {
      return gender;
    }
    
    // 處理 /products/:category 格式的路由 (如果有)
    if (category && !gender) {
      return category;
    }
    
    // 處理 hash 路由格式 (例如 /#/products/women/top)
    const hashPath = location.hash;
    if (hashPath) {
      // 移除 # 符號並解析路徑
      const path = hashPath.replace('#', '');
      const pathSegments = path.split('/').filter(Boolean);
      
      // 檢查路徑是否包含 products 和分類信息
      if (pathSegments.length >= 2 && pathSegments[0] === 'products') {
        if (pathSegments.length >= 3) {
          // 返回 gender/category 格式 (例如 'women/top')
          return `${pathSegments[1]}/${pathSegments[2]}`;
        } else if (pathSegments.length === 2) {
          // 只有主分類 (例如 'women')
          return pathSegments[1];
        }
      }
    }
    
    return null;
  }, [gender, category, location.hash]);

  // 處理頁面標題顯示
  const getPageTitle = useMemo(() => {
    // 使用 currentCategory 來決定標題
    if (currentCategory === 'men') {
      return "男裝 商品一覽";
    } else if (currentCategory === 'women') {
      return "女裝 商品一覽";
    } else if (currentCategory) {
      // 處理子分類
      const pathParts = currentCategory.split('/');
      if (pathParts.length > 1) {
        // 只顯示性別類別，不顯示子類別
        const gender = pathParts[0] === 'men' ? '男裝' : '女裝';
        return `${gender} 商品一覽`;
      }
      return `${currentCategory} 商品一覽`;
    }
    // 預設顯示
    return "商品一覽";
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
    console.log("路由參數:", { gender, category });
    console.log("hash 路徑:", location.hash);
    console.log("提取的實際分類:", actualCategory);
  }, [gender, category, location.hash, dispatch, getActualCategory]);

  // 當 currentCategory 改變時，重新獲取產品數據
  useEffect(() => {
    // 在獲取新數據前先重置篩選條件和頁碼
    dispatch(resetFilters());
    dispatch(setCurrentPage(1));
    
    // 新增延遲，確保頁面顯示「載入中」狀態，避免閃現舊數據
    const timer = setTimeout(() => {
      if (currentCategory !== undefined) {
        dispatch(fetchProducts(currentCategory));
      }
    }, 50);
    
    return () => clearTimeout(timer); // 清除計時器，避免記憶體洩漏
  }, [currentCategory, dispatch]);

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

    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
      headerContainer.style.display = showOffcanvas ? "block" : "none";
    }

    // 控制 body 的滾動
    document.body.style.overflow = showOffcanvas ? "" : "hidden";
  }, [showOffcanvas]);

  // 使用 useCallback 優化重置篩選邏輯
  const handleResetFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  // 計算總篩選數量
  const totalFilterCount = useMemo(() =>
    Object.values(filters).reduce(
      (count, labels) => count + (labels.includes("全部") ? 0 : labels.length),
      0
    ),
    [filters]
  );

  // 調試用日誌
  useEffect(() => {
    console.log('當前分類:', currentCategory);
    console.log('當前 URL 路徑:', location.pathname);
    console.log('當前 URL 參數:', { gender, category });
    console.log('當前篩選條件:', filters);
    console.log('篩選後產品數量:', filteredItems.length);
    console.log('原始產品數量:', items.length);
  }, [currentCategory, location, gender, category, filters, filteredItems, items]);

  // 在組件被卸載時確保header可見和body滾動恢復
  useEffect(() => {
    return () => {
      const headerContainer = document.getElementById("header-container");
      if (headerContainer) {
        headerContainer.style.display = "block";
      }
      document.body.style.overflow = "";
    };
  }, []);

  // 渲染內容
  const renderContent = () => {
    if (status === "loading" || status === "idle" && currentCategory) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      );
    }

    if (status === "failed") {
      return (
        <div className="alert alert-danger" role="alert">
          {error || "載入產品時發生錯誤"}
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

  return (
    <>
      {showHeader && <FrontHeader defaultType="light" />}
      <main className="mt-17 bg-nature-99">
        <section className="productList-section bg-nature-99">
          <div className="container">
            <div className="row">
              {/* 類別篩選選單 - 桌面版 */}
              <div className="col-md-3 d-none d-md-block ps-3 mb-20">
                <div className="filterMenu-wrap">
                  <FilterMenu isOffcanvas={false} />
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
        <div className={`offcanvas-wrapper ${showOffcanvas ? "show" : ""}`}>
          <div
            className={`offcanvas offcanvas-fullscreen ${
              showOffcanvas ? "show" : ""
            }`}
            tabIndex="-1"
            id="offcanvasCategoryMenu"
            aria-labelledby="offcanvasCategoryMenuLabel"
          >
            <div className="offcanvas-header position-relative">
              <h5 className="offcanvas-title" id="offcanvasCategoryMenuLabel">
              </h5>
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
                <FilterMenu isOffcanvas={true} />
              </div>
              <div>
                <button className="checkItem" onClick={toggleOffcanvas}>
                  <h6>
                    查看品項{" "}
                    {filteredItems.length > 0 || !filteredItems.length
                      ? `(${totalFilterCount})`
                      : ""}
                  </h6>
                </button>
              </div>
            </div>
          </div>

          {/* Backdrop for offcanvas */}
          <div
            className={`offcanvas-backdrop fade ${showOffcanvas ? "show" : ""}`}
            onClick={toggleOffcanvas}
          ></div>
        </div>
      </main>
    </>
  );
}