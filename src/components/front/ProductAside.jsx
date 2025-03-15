import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { productCategories } from "../../slice/productsSlice";
import {
  setCurrentCategory,
  filterProducts,
  resetFilters,
  fetchProducts,
} from "../../slice/productsListSlice";

// 安全地從對象中提取唯一值的實用函數
const getUniqueValues = (array, key) => {
  if (!Array.isArray(array)) return [];
  return [...new Set(array.map((item) => item?.[key]).filter(Boolean))];
};

// 創建一個全局變量來存儲最後選擇的分類路徑
let lastSelectedCategoryPath = "";

const ProductAside = memo(({ isOffcanvas = false, toggleOffcanvas }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category, gender: urlGender } = useParams();
  const location = useLocation();

  // 從 Redux 獲取產品分類和篩選狀態
  const categoriesList = useSelector(productCategories);
  const {
    filters: reduxFilters = {},
    items: products = [],
    currentCategory = null,
  } = useSelector((state) => state.productsList);

  // 篩選器的活動狀態
  const [activeFilters, setActiveFilters] = useState(reduxFilters);
  // 存儲選擇的分類路徑（用於手機版的"查看品項"按鈕）
  const [selectedPath, setSelectedPath] = useState("");
  // 追蹤展開的類別
  const [expandedCategories, setExpandedCategories] = useState({});
  // 新增一個狀態來跟踪「商品狀態」的過濾選項
  const [productStatusFilter, setProductStatusFilter] = useState([]);

  // 確定當前選擇的性別
  const currentGender = useMemo(() => {
    // 從URL參數確定
    if (urlGender) {
      return urlGender;
    }

    // 從currentCategory確定
    if (currentCategory) {
      const parts = currentCategory.split("/");
      if (parts.length > 0 && (parts[0] === "men" || parts[0] === "women")) {
        return parts[0];
      }
    }

    // 從hash路徑確定
    const hashPath = location.hash;
    if (hashPath) {
      const path = hashPath.replace("#", "");
      const pathSegments = path.split("/").filter(Boolean);

      if (pathSegments.length >= 2 && pathSegments[0] === "products") {
        if (pathSegments[1] === "men" || pathSegments[1] === "women") {
          return pathSegments[1];
        }
      }
    }

    // 預設顯示女裝
    return "women";
  }, [urlGender, currentCategory, location.hash]);

  // 過濾出當前性別的分類
  const currentCategories = useMemo(() => {
    const genderCategory = categoriesList.find(
      (cat) => cat.slug === currentGender
    );
    return genderCategory ? [genderCategory] : [];
  }, [categoriesList, currentGender]);

  // 取得狀態分類的參考，用於狀態過濾時使用標題而不是slug
  const statusCategory = useMemo(() => {
    const gender = categoriesList.find(cat => cat.slug === currentGender);
    if (gender) {
      return gender.categories.find(cat => cat.slug === "product-status");
    }
    return null;
  }, [categoriesList, currentGender]);

  // 將狀態slug轉換為title的映射
  const statusSlugToTitle = useMemo(() => {
    if (statusCategory && statusCategory.subCategories) {
      return statusCategory.subCategories.reduce((map, status) => {
        map[status.slug] = status.title;
        return map;
      }, {});
    }
    return {};
  }, [statusCategory]);

  // 將狀態title轉換為slug的映射
  const statusTitleToSlug = useMemo(() => {
    if (statusCategory && statusCategory.subCategories) {
      return statusCategory.subCategories.reduce((map, status) => {
        map[status.title] = status.slug;
        return map;
      }, {});
    }
    return {};
  }, [statusCategory]);

  // 同步 Redux 篩選條件
  useEffect(() => {
    setActiveFilters(reduxFilters);

    // 同步狀態過濾器，使用title而不是slug
    if (reduxFilters?.productStatus) {
      // 確保使用title而非slug，如果已經是title則不需轉換
      const statusFilters = reduxFilters.productStatus
        .filter(status => status !== "全部")
        // 檢查是否為slug，如果是則轉換為title
        .map(status => statusSlugToTitle[status] || status);

      setProductStatusFilter(statusFilters);
    } else {
      setProductStatusFilter([]);
    }
  }, [reduxFilters, statusSlugToTitle]);

  // 處理篩選條件變更
  const handleFilterChange = useCallback(
    (category, selectedLabels) => {
      // 特別處理商品狀態類別
      if (category === "productStatus") {
        // 確保使用產品的status值(即title)而不是slug進行過濾
        const newFilters = {
          ...activeFilters,
          [category]: selectedLabels.length ? selectedLabels : ["全部"],
        };

        // 移除空值的類別
        const cleanFilters = Object.fromEntries(
          Object.entries(newFilters).filter(([_, value]) => value.length > 0)
        );

        // 只有當過濾條件確實發生變化時才更新
        if (JSON.stringify(cleanFilters) !== JSON.stringify(activeFilters)) {
          setActiveFilters(cleanFilters);
          dispatch(filterProducts(cleanFilters));
        }
      } else {
        // 其他類別保持原有邏輯
        const newFilters = {
          ...activeFilters,
          [category]: selectedLabels.length ? selectedLabels : ["全部"],
        };

        // 移除空值的類別
        const cleanFilters = Object.fromEntries(
          Object.entries(newFilters).filter(([_, value]) => value.length > 0)
        );

        // 只有當過濾條件確實發生變化時才更新
        if (JSON.stringify(cleanFilters) !== JSON.stringify(activeFilters)) {
          setActiveFilters(cleanFilters);
          dispatch(filterProducts(cleanFilters));
        }
      }
    },
    [activeFilters, dispatch, statusSlugToTitle]
  );

  // 切換類別的展開狀態
  const toggleCategoryExpand = useCallback((categorySlug) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categorySlug]: !prev[categorySlug],
    }));
  }, []);

  // 處理主類別點擊，顯示該類別下的所有商品
  const handleCategoryClick = useCallback(
    (gender, category) => {
      // 構建類別路徑
      const categoryPath = category.slug;

      // 構建完整的導航路徑
      const fullPath = `/products/${gender.slug}/${category.slug}`;

      // 設置最後選擇的分類路徑
      lastSelectedCategoryPath = fullPath;

      // 同時更新組件狀態
      setSelectedPath(fullPath);

      // 更新 Redux 狀態
      dispatch(setCurrentCategory(categoryPath));

      // 重置篩選條件
      dispatch(resetFilters());

      // 如果是在手機版中，不立即跳轉，讓用戶點擊"查看品項"按鈕
      if (!isOffcanvas) {
        // 在桌面版中，直接導航到對應頁面
        navigate(fullPath);

        // 觸發產品獲取
        dispatch(fetchProducts(categoryPath));
      }
    },
    [dispatch, navigate, isOffcanvas]
  );

  // 點擊子分類時的處理
  const handleSubCategoryClick = useCallback(
    (mainCategory, subCategory) => {
      // 正確構建類別路徑，確保包含子類別
      const categoryPath = `${mainCategory.slug}/${subCategory.slug}`;

      // 構建完整的導航路徑
      const fullPath = `/products/${currentGender}/${mainCategory.slug}/${subCategory.slug}`;

      // 設置最後選擇的分類路徑（全局變量）
      lastSelectedCategoryPath = fullPath;

      // 同時更新組件狀態
      setSelectedPath(fullPath);

      // 更新 Redux 狀態，確保傳遞正確的路徑格式
      dispatch(setCurrentCategory(categoryPath));

      // 更新篩選條件（立即更新而不是在渲染中處理）
      const currentFilters = activeFilters[mainCategory.slug] || [];
      const newFilter = currentFilters.includes(subCategory.slug)
        ? currentFilters.filter((s) => s !== subCategory.slug)
        : [...currentFilters, subCategory.slug];

      // 立即更新本地篩選狀態
      setActiveFilters(prevFilters => ({
        ...prevFilters,
        [mainCategory.slug]: newFilter.length ? newFilter : ['全部']
      }));

      // 分發篩選更新
      dispatch(filterProducts({
        ...activeFilters,
        [mainCategory.slug]: newFilter.length ? newFilter : ['全部']
      }));

      // 重置篩選條件（可選）
      dispatch(resetFilters());

      // 如果是在手機版中，不立即跳轉，讓用戶點擊"查看品項"按鈕
      if (!isOffcanvas) {
        // 在桌面版中，直接導航到對應頁面
        navigate(fullPath);

        // 觸發產品獲取
        dispatch(fetchProducts(categoryPath));
      }
    },
    [currentGender, dispatch, navigate, isOffcanvas, activeFilters]
  );

  // 重置所有篩選條件
  const handleResetFilters = useCallback(() => {
    setActiveFilters({});
    setProductStatusFilter([]);
    dispatch(resetFilters());
  }, [dispatch]);

  // 查看品項按鈕點擊處理
  const handleViewItems = useCallback(() => {
    if (lastSelectedCategoryPath) {
      // 從路徑中提取分類信息
      const pathParts = lastSelectedCategoryPath.split("/").filter(Boolean);

      if (pathParts.length >= 3) {
        const gender = pathParts[1]; // 'women' 或 'men'

        if (pathParts.length >= 4) {
          // 處理子類別路徑
          const category = pathParts[2]; // 如 'dress', 'top' 等
          const subcategory = pathParts[3]; // 如 'shirt', 'long-dress' 等

          // 構建分類參數
          const categoryPath = `${category}/${subcategory}`;

          // 先更新 Redux 狀態
          dispatch(setCurrentCategory(categoryPath));
        } else {
          // 處理主類別路徑
          const category = pathParts[2]; // 如 'dress', 'top' 等

          // 更新 Redux 狀態
          dispatch(setCurrentCategory(category));
        }

        // 延遲關閉側邊欄和導航，確保 Redux 狀態更新
        setTimeout(() => {
          // 關閉側邊欄
          if (toggleOffcanvas) {
            toggleOffcanvas();
          }

          // 重新獲取產品數據
          dispatch(fetchProducts(currentCategory));

          // 最後導航到所選分類頁面
          navigate(lastSelectedCategoryPath);
        }, 100);
      }
    }
  }, [navigate, toggleOffcanvas, dispatch, currentCategory]);

  // 計算總篩選數量
  const totalFilterCount = useMemo(
    () =>
      Object.values(activeFilters).reduce(
        (count, labels) =>
          count + (labels.includes("全部") ? 0 : labels.length),
        0
      ),
    [activeFilters]
  );

  // 重設全局變量，以便下次訪問時能正確檢測到當前 URL
  useEffect(() => {
    // 如果 URL 包含性別和分類，設置最後選擇的分類路徑
    if (urlGender && category) {
      lastSelectedCategoryPath = `/products/${urlGender}/${category}`;
      setSelectedPath(lastSelectedCategoryPath);
    }
  }, [urlGender, category]);

  return (
    <nav className="navCategory bg-white ms-4 me-4">
      <div className="d-flex justify-content-between align-items-center w-100 mb-4 mt-6">
        <span className="navbar-brand btnClose">
          <h6>類別</h6>
        </span>

        {/* 清除全部選項 */}
        {totalFilterCount > 0 && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleResetFilters}
          >
            清除全部 ({totalFilterCount})
          </button>
        )}
      </div>

      <div className="accordion">
        {currentCategories.map((gender) => (
          <div key={gender.slug} className="category-wrap">
            <ul className="list-unstyled">
              {gender.categories.map((category, index) => {
                // 判斷是否為狀態分類
                const isStatusCategory = category.slug === "product-status";
                // 判斷是否展開
                const isExpanded = expandedCategories[category.slug];

                return (
                  <li key={category.slug} className="category-item mb-3">
                    {/* 主類別上方的分隔線 */}
                    <hr className="category-divider my-2 border-secondary-subtle" />
                    
                    {/* 主類別標題 - 可展開/收合 */}
                    <div
                      className="text-decoration-none text-dark fw-bold d-flex justify-content-between align-items-center w-100 py-2"
                      onClick={() => toggleCategoryExpand(category.slug)}
                      style={{ cursor: "pointer" }}
                    >
                      <span>{category.title}</span>
                      <span className="dropdown-icon">
                        <i
                          className={`bi bi-chevron-${
                            isExpanded ? "up" : "down"
                          }`}
                        ></i>
                      </span>
                    </div>

                    {/* 展開時的分隔線 */}
                    {isExpanded && (
                      <hr className="category-divider my-2 border-secondary-subtle" />
                    )}

                    {/* 子類別列表 - 根據類型顯示不同的內容 */}
                    {isExpanded && (
                      <div className="ms-3 mt-2">
                        {!isStatusCategory ? (
                          <div className="d-flex flex-wrap gap-2">
                            {/* 全部按鈕 */}
                            {category.subCategories &&
                              category.subCategories.length > 0 && (
                                <button
                                  className={`btn ${
                                    selectedPath ===
                                      `/products/${currentGender}/${category.slug}` ||
                                    (activeFilters[category.slug] &&
                                      activeFilters[category.slug].length ===
                                        category.subCategories.length)
                                      ? "btn-primary"
                                      : "btn-outline-secondary"
                                  } btn-sm px-2 py-1`}
                                  onClick={() => {
                                    // 直接調用 handleCategoryClick
                                    handleCategoryClick(
                                      { slug: currentGender },
                                      category
                                    );

                                    // 立即更新篩選狀態
                                    const newFilter =
                                      activeFilters[category.slug] &&
                                      activeFilters[category.slug].length ===
                                        category.subCategories.length
                                        ? []
                                        : category.subCategories.map(
                                            (subCategory) => subCategory.slug
                                          );

                                    // 立即更新本地篩選狀態
                                    setActiveFilters((prevFilters) => ({
                                      ...prevFilters,
                                      [category.slug]: newFilter.length
                                        ? newFilter
                                        : ["全部"],
                                    }));

                                    // 分發篩選更新
                                    dispatch(
                                      filterProducts({
                                        ...activeFilters,
                                        [category.slug]: newFilter.length
                                          ? newFilter
                                          : ["全部"],
                                      })
                                    );
                                  }}
                                >
                                  全部
                                </button>
                              )}

                            {/* 子類別按鈕 */}
                            {category.subCategories &&
                              category.subCategories.length > 0 &&
                              category.subCategories.map((subCategory) => {
                                // 在此處定義 subCategoryPath
                                const subCategoryPath = `/products/${currentGender}/${category.slug}/${subCategory.slug}`;

                                const isSelected = 
                                  activeFilters[category.slug] && 
                                  activeFilters[category.slug].includes(subCategory.slug);

                                return (
                                  <button
                                    key={subCategory.slug}
                                    className={`btn btn-sm px-2 py-1 ${
                                      selectedPath === subCategoryPath || isSelected
                                        ? "btn-primary"
                                        : "btn-outline-secondary"
                                    }`}
                                    onClick={() => {
                                      // 直接調用 handleSubCategoryClick
                                      handleSubCategoryClick(category, subCategory);
                                    }}
                                  >
                                    {subCategory.title}
                                  </button>
                                );
                              })}
                          </div>
                        ) : (
                          // 商品狀態的按鈕選擇 - 這裡應直接使用 title 而非 slug
                          <div className="d-flex flex-wrap gap-2">
                            {category.subCategories &&
                              category.subCategories.length > 0 && (
                                <button
                                  className={`btn ${
                                    productStatusFilter.length ===
                                    category.subCategories.length
                                      ? "btn-primary"
                                      : "btn-outline-secondary"
                                  } btn-sm px-2 py-1`}
                                  onClick={() => {
                                    const newFilter =
                                      productStatusFilter.length ===
                                      category.subCategories.length
                                        ? []
                                        : category.subCategories.map(
                                            (subCategory) => subCategory.title
                                          );

                                    setProductStatusFilter(newFilter);
                                    handleFilterChange(
                                      "productStatus",
                                      newFilter
                                    );
                                  }}
                                >
                                  全部
                                </button>
                              )}

                            {category.subCategories &&
                              category.subCategories.length > 0 &&
                              category.subCategories.map((subCategory) => {
                                // 使用 title 而非 slug 來選擇
                                const isSelected = productStatusFilter.includes(
                                  subCategory.title
                                );

                                return (
                                  <button
                                    key={subCategory.slug}
                                    className={`btn ${
                                      isSelected
                                        ? "btn-primary"
                                        : "btn-outline-secondary"
                                    } btn-sm px-2 py-1`}
                                    onClick={() => {
                                      const newFilter = isSelected
                                        ? productStatusFilter.filter(
                                            (s) => s !== subCategory.title
                                          )
                                        : [
                                            ...productStatusFilter,
                                            subCategory.title,
                                          ];

                                      setProductStatusFilter(newFilter);
                                      handleFilterChange(
                                        "productStatus",
                                        newFilter
                                      );
                                    }}
                                  >
                                    {subCategory.title}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 只在手機版 (offcanvas) 中顯示查看品項按鈕 */}
      {isOffcanvas && selectedPath && (
        <div className="mt-4">
          <button
            className="checkItem w-100 btn btn-primary"
            onClick={handleViewItems}
          >
            <h6 className="mb-0">
              查看品項 {totalFilterCount > 0 && `(${totalFilterCount})`}
            </h6>
          </button>
        </div>
      )}
    </nav>
  );
});

export default ProductAside;

// 為了與原有的組件保持兼容，導出以下組件
export const FilterSortButton = memo(
  ({ toggleOffcanvas, sortOption, handleSortChange }) => {
    const filters = useSelector((state) => state.productsList.filters || {});
    const totalFilterCount = Object.values(filters).reduce(
      (count, labels) => count + (labels.includes("全部") ? 0 : labels.length),
      0
    );

    // 定義排序選項
    const sortOptions = [
      "最新上架",
      "熱門商品", 
      "價格由低至高",
      "價格由高至低",
    ];

    return (
      <div className="d-md-none w-100 mt-4 d-flex mb-4">
        <div className="d-flex justify-content-between align-items-start w-100">
          {/* 手機版篩選按鈕 */}
          <button
            className="selectButton"
            type="button"
            onClick={toggleOffcanvas}
            aria-controls="offcanvasCategoryMenu"
          >
            <h6>
              類別
              {totalFilterCount > 0 && (
                <span className="ms-1">({totalFilterCount})</span>
              )}
            </h6>
            <span className="dropdown-icon ms-2">
              <img src="/icons/dropdownIcon.svg" alt="dropdown-Icon" />
            </span>
          </button>

          {/* 手機版排序選單 */}
          <div className="sortList fs-6">
            <button
              type="button"
              className="btn btn-outline-secondary dropdown-toggle text-start"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {sortOption}
            </button>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-product">
              {sortOptions.map((option) => (
                <li key={option}>
                  <button
                    className="dropdown-item"
                    onClick={() => handleSortChange(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

// SortFilter 組件 - 僅電腦版排序
export const SortFilter = memo(({ sortOption, handleSortChange }) => {
  const sortOptions = ["最新上架", "熱門商品", "價格由低至高", "價格由高至低"];

  return (
    <div className="sortList fs-6 d-none d-md-block">
      <button
        type="button"
        className="btn btn-outline-secondary dropdown-toggle text-start"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {sortOption}
      </button>
      <ul className="dropdown-menu dropdown-menu-end dropdown-menu-product">
        {sortOptions.map((option) => (
          <li key={option}>
            <button
              className="dropdown-item"
              onClick={() => handleSortChange(option)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});