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
  const { category } = useParams(); // 從 URL 獲取分類參數
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
        const gender = pathParts[0] === 'men' ? '男裝' : '女裝';
        const categoryMappings = {
          'men': {
            'top': '上衣',
            'jacket': '外套',
            'pants': '褲子',
            'accessories': '服飾配件'
          },
          'women': {
            'top': '上衣',
            'jacket': '外套',
            'dress': '洋裝',
            'pants': '褲子',
            'skirts': '裙子',
            'accessories': '服飾配件'
          }
        };
        
        const subCategory = categoryMappings[pathParts[0]]?.[pathParts[1]] || pathParts[1];
        return `${gender} ${subCategory} 商品一覽`;
      }
      return `${currentCategory} 商品一覽`;
    }
    return "商品一覽";
  }, [currentCategory]);

  // 使用 useEffect 獲取產品數據，根據 category 參數
  useEffect(() => {
    // 當 URL 中的 category 參數改變時，更新 Redux 中的 currentCategory
    if (category) {
      dispatch(setCurrentCategory(category));
    } else {
      // 如果沒有 category 參數，可以根據需要設置默認分類或清除當前分類
      dispatch(setCurrentCategory(null));
    }
  }, [category, dispatch]);

  // 當 currentCategory 改變時，重新獲取產品數據
  useEffect(() => {
    dispatch(fetchProducts(currentCategory));
    // 重置篩選條件和頁碼，避免切換分類後篩選條件不匹配
    dispatch(resetFilters());
    dispatch(setCurrentPage(1));
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
    console.log('當前篩選條件:', filters);
    console.log('篩選後產品數量:', filteredItems.length);
    console.log('原始產品數量:', items.length);
  }, [currentCategory, filters, filteredItems, items]);

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
    if (status === "loading") {
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
      {showHeader && <FrontHeader defaultType={"light"} />}
      <main className="mt-17 bg-nature-99">
        <section className="productList-section bg-nature-99">
          <div className="container">
            <div className="row">
              {/* 類別篩選選單 - 桌面版 */}
              <div className="col-md-3 d-none d-md-block ps-3">
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


// ======================================================================
// // ProductsList.jsx
// import { useEffect, useState, useCallback, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchProducts,
//   sortProducts,
//   setCurrentPage,
//   resetFilters,
// } from "../../slice/productsListSlice";
// import FrontHeader from "../../components/front/FrontHeader";
// import Pagination from "../../components/layouts/Pagination";
// import ProductCard from "../../components/front/ProductCard";
// import {
//   FilterMenu,
//   FilterSortButton,
//   SortFilter,
// } from "../../components/front/FilterMenu";

// export default function ProductsList() {
//   const dispatch = useDispatch();
//   const [showOffcanvas, setShowOffcanvas] = useState(false);
//   const [showHeader, setShowHeader] = useState(true);

//   // 從 Redux 獲取狀態，使用新的鍵名 productsList
//   const {
//     filteredItems = [],
//     items = [],
//     status = "idle",
//     error = null,
//     sortOption = "最新上架",
//     currentPage = 1,
//     filters = {},
//   } = useSelector((state) => state.productsList || {});

//   const dataLimit = 9;
//   const pageLimit = 10;

//   // 使用 useEffect 獲取產品數據
//   useEffect(() => {
//     dispatch(fetchProducts());
//   }, [dispatch]);

//   // 使用 useCallback 優化性能
//   const handleSortChange = useCallback(
//     (option) => {
//       dispatch(sortProducts(option));
//     },
//     [dispatch]
//   );

//   const handlePageChange = useCallback(
//     (page) => {
//       dispatch(setCurrentPage(page));
//     },
//     [dispatch]
//   );

//   // 處理Offcanvas開關，使用 useCallback 優化
//   const toggleOffcanvas = useCallback(() => {
//     setShowOffcanvas((prev) => !prev);
//     setShowHeader((prev) => !prev);

//     const headerContainer = document.getElementById("header-container");
//     if (headerContainer) {
//       headerContainer.style.display = showOffcanvas ? "block" : "none";
//     }

//     // 控制 body 的滾動
//     document.body.style.overflow = showOffcanvas ? "" : "hidden";
//   }, [showOffcanvas]);

//   // 使用 useCallback 優化重置篩選邏輯
//   const handleResetFilters = useCallback(() => {
//     dispatch(resetFilters());
//   }, [dispatch]);

//   // 計算總篩選數量
//   const totalFilterCount = useMemo(() =>
//     Object.values(filters).reduce(
//       (count, labels) => count + (labels.includes("全部") ? 0 : labels.length),
//       0
//     ),
//     [filters]
//   );

//   // 調試用日誌
//   useEffect(() => {
//     console.log('當前篩選條件:', filters);
//     console.log('篩選後產品數量:', filteredItems.length);
//     console.log('原始產品數量:', items.length);
//   }, [filters, filteredItems, items]);

//   // 在組件被卸載時確保header可見和body滾動恢復
//   useEffect(() => {
//     return () => {
//       const headerContainer = document.getElementById("header-container");
//       if (headerContainer) {
//         headerContainer.style.display = "block";
//       }
//       document.body.style.overflow = "";
//     };
//   }, []);

//   // 渲染內容
//   const renderContent = () => {
//     if (status === "loading") {
//       return (
//         <div className="text-center py-5">
//           <div className="spinner-border text-primary" role="status">
//             <span className="visually-hidden">載入中...</span>
//           </div>
//         </div>
//       );
//     }

//     if (status === "failed") {
//       return (
//         <div className="alert alert-danger" role="alert">
//           {error || "載入產品時發生錯誤"}
//         </div>
//       );
//     }

//     return (
//       <Pagination
//         data={filteredItems}
//         RenderComponent={ProductCard}
//         pageLimit={pageLimit}
//         dataLimit={dataLimit}
//         currentPage={currentPage}
//         setCurrentPage={handlePageChange}
//       />
//     );
//   };

//   return (
//     <>
//       {showHeader && <FrontHeader defaultType={"light"} />}
//       <main className="mt-17 bg-nature-99">
//         <section className="productList-section bg-nature-99">
//           <div className="container">
//             <div className="row">
//               {/* 類別篩選選單 - 桌面版 */}
//               <div className="col-md-3 d-none d-md-block ps-3">
//                 <div className="filterMenu-wrap">
//                   <FilterMenu isOffcanvas={false} />
//                 </div>
//               </div>
//               <div className="col-12 col-md-9 d-block infoTitle">
//                 <div className="mb-10 mb-md-10 d-flex justify-content-between align-items-start flex-column flex-md-row">
//                   <div className="d-flex align-items-center gap-3">
//                     <h3 id="product-title">女裝 商品一覽</h3>
//                   </div>
//                   {/* 電腦版排序選單 */}
//                   <SortFilter
//                     sortOption={sortOption}
//                     handleSortChange={handleSortChange}
//                   />
//                 </div>

//                 {/* 使用合併後的手機版篩選按鈕與排序選單 */}
//                 <FilterSortButton
//                   toggleOffcanvas={toggleOffcanvas}
//                   sortOption={sortOption}
//                   handleSortChange={handleSortChange}
//                 />

//                 {/* 顯示載入狀態或錯誤訊息 */}
//                 <div className="mb-10">{renderContent()}</div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Offcanvas */}
//         <div className={`offcanvas-wrapper ${showOffcanvas ? "show" : ""}`}>
//           <div
//             className={`offcanvas offcanvas-fullscreen ${
//               showOffcanvas ? "show" : ""
//             }`}
//             tabIndex="-1"
//             id="offcanvasCategoryMenu"
//             aria-labelledby="offcanvasCategoryMenuLabel"
//           >
//             <div className="offcanvas-header position-relative">
//               <h5 className="offcanvas-title" id="offcanvasCategoryMenuLabel">
//               </h5>
//               <button
//                 type="button"
//                 className="btn offcanvas-cancel-btn position-absolute top-0 end-0 mt-3 me-3"
//                 onClick={toggleOffcanvas}
//                 aria-label="Close"
//               >
//                 取消
//               </button>
//             </div>
//             <div className="offcanvas-body">
//               <div className="filterMenu-wrap">
//                 <FilterMenu isOffcanvas={true} />
//               </div>
//               <div>
//                 <button className="checkItem" onClick={toggleOffcanvas}>
//                   <h6>
//                     查看品項{" "}
//                     {filteredItems.length > 0 || !filteredItems.length
//                       ? `(${totalFilterCount})`
//                       : ""}
//                   </h6>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Backdrop for offcanvas */}
//           <div
//             className={`offcanvas-backdrop fade ${showOffcanvas ? "show" : ""}`}
//             onClick={toggleOffcanvas}
//           ></div>
//         </div>
//       </main>
//     </>
//   );
// }
