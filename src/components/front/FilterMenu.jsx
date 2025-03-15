import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { productCategories } from "../../slice/productsSlice";
import { 
  setCurrentCategory, 
  filterProducts, 
  resetFilters,
  fetchProducts
} from "../../slice/productsListSlice";

// 安全地從對象中提取唯一值的實用函數
const getUniqueValues = (array, key) => {
  if (!Array.isArray(array)) return [];
  return [...new Set(array.map((item) => item?.[key]).filter(Boolean))];
};

// 創建一個全局變量來存儲最後選擇的分類路徑
let lastSelectedCategoryPath = '';

// 定義固定的狀態選項
const PRODUCT_STATUS_OPTIONS = [
  { slug: 'in-stock', title: '現貨' },
  { slug: 'pre-order', title: '預購' },
  { slug: 'restocking', title: '補貨中' }
];

// CategoryItem 組件，用於一般類別顯示
const CategoryItem = memo(({ gender, category, isExpanded, toggleExpand, handleCategoryClick, handleSubCategoryClick }) => {
  return (
    <li className="category-item mb-3">
      {/* 主類別標題 - 可展開/收合 */}
      <div 
        className="text-decoration-none text-dark fw-bold d-flex justify-content-between align-items-center w-100 py-2"
        onClick={() => toggleExpand(category.slug)}
        style={{ cursor: 'pointer' }}
      >
        <span>{category.title}</span>
        <span className="dropdown-icon">
          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </span>
      </div>
      
      {/* 子類別列表 - 可點擊跳轉 */}
      {isExpanded && (
        <ul className="list-unstyled ms-3 mt-2">
          {/* 「全部」選項 */}
          <li className="mb-2">
            <div
              className="text-decoration-none text-dark fw-bold"
              onClick={() => handleCategoryClick(gender, category)}
              style={{ cursor: 'pointer' }}
            >
              全部
            </div>
          </li>
          
          {/* 子類別列表 */}
          {category.subCategories?.map((subCategory) => (
            <li key={subCategory.slug} className="mb-2">
              <div
                className="text-decoration-none text-dark"
                onClick={() => handleSubCategoryClick(gender, category, subCategory)}
                style={{ cursor: 'pointer' }}
              >
                {subCategory.title}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
});

// StatusFilterItem 組件，用於狀態過濾顯示
const StatusFilterItem = memo(({ category, isExpanded, toggleExpand, statusFilter, handleStatusFilterChange }) => {
  return (
    <li className="category-item mb-3">
      {/* 狀態類別標題 - 可展開/收合 */}
      <div 
        className="text-decoration-none text-dark fw-bold d-flex justify-content-between align-items-center w-100 py-2"
        onClick={() => toggleExpand(category.slug)}
        style={{ cursor: 'pointer' }}
      >
        <span>{category.title}</span>
        <span className="dropdown-icon">
          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </span>
      </div>
      
      {/* 狀態過濾選項 - 使用核取方塊 */}
      {isExpanded && (
        <ul className="list-unstyled ms-3 mt-2">
          {category.subCategories?.map((subCategory) => {
            const isChecked = statusFilter.includes(subCategory.slug);
            
            return (
              <li key={subCategory.slug} className="mb-2 d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  id={`status-${subCategory.slug}`}
                  checked={isChecked}
                  onChange={() => {
                    // 更新選中的狀態過濾器
                    const newFilter = isChecked
                      ? statusFilter.filter(s => s !== subCategory.slug)
                      : [...statusFilter, subCategory.slug];
                    
                    handleStatusFilterChange(newFilter);
                  }}
                />
                <label
                  className="text-decoration-none text-dark"
                  htmlFor={`status-${subCategory.slug}`}
                  style={{ cursor: 'pointer' }}
                >
                  {subCategory.title}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
});

// 主要 FilterMenu 組件
const FilterMenu = memo(({ isOffcanvas = false, toggleOffcanvas }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category, subcategory, gender: urlGender } = useParams();
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
  const [selectedPath, setSelectedPath] = useState('');
  // 追蹤展開的類別
  const [expandedCategories, setExpandedCategories] = useState({
    'product-status': true, // 確保「狀態」類別預設展開
  });
  // 狀態來跟踪「商品狀態」的過濾選項
  const [productStatusFilter, setProductStatusFilter] = useState([]);

  // 確定當前選擇的性別
  const currentGender = useMemo(() => {
    // 從URL參數確定
    if (urlGender) {
      return urlGender;
    }
    
    // 從currentCategory確定
    if (currentCategory) {
      const parts = currentCategory.split('/');
      if (parts.length > 0 && (parts[0] === 'men' || parts[0] === 'women')) {
        return parts[0];
      }
    }
    
    // 預設顯示女裝
    return 'women';
  }, [urlGender, currentCategory]);

  // 過濾出當前性別的分類
  const currentCategories = useMemo(() => {
    const genderCategory = categoriesList.find(cat => cat.slug === currentGender);
    return genderCategory ? [genderCategory] : [];
  }, [categoriesList, currentGender]);

  // 同步 Redux 篩選條件
  useEffect(() => {
    if (JSON.stringify(activeFilters) !== JSON.stringify(reduxFilters)) {
      setActiveFilters(reduxFilters);
    }
    
    // 同步狀態過濾器
    if (reduxFilters?.productStatus) {
      const newStatusFilter = reduxFilters.productStatus.filter(status => status !== "全部");
      // 只有當真正需要更新時才更新狀態
      if (JSON.stringify(productStatusFilter) !== JSON.stringify(newStatusFilter)) {
        setProductStatusFilter(newStatusFilter);
      }
    } else if (productStatusFilter.length > 0) { 
      // 只有當真正需要清空時才清空
      setProductStatusFilter([]);
    }
  }, [reduxFilters, activeFilters, productStatusFilter]);

  // 處理篩選條件變更
  const handleFilterChange = useCallback(
    (category, selectedLabels) => {
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
    },
    [activeFilters, dispatch]
  );

  // 處理狀態過濾器變更
  const handleStatusFilterChange = useCallback((newFilter) => {
    if (JSON.stringify(productStatusFilter) !== JSON.stringify(newFilter)) {
      setProductStatusFilter(newFilter);
      handleFilterChange('productStatus', newFilter);
    }
  }, [productStatusFilter, handleFilterChange]);

  // 切換類別的展開狀態
  const toggleCategoryExpand = useCallback((categorySlug) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categorySlug]: !prev[categorySlug]
    }));
  }, []);

  // 處理主類別點擊，顯示該類別下的所有商品
  const handleCategoryClick = useCallback((gender, category) => {
    // 構建類別路徑
    const categoryPath = `${gender.slug}/${category.slug}`;
    
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
  }, [dispatch, navigate, isOffcanvas]);

  // 點擊子分類時的處理
  const handleSubCategoryClick = useCallback((gender, mainCategory, subCategory) => {
    // 正確構建類別路徑，確保包含子類別
    const categoryPath = `${gender.slug}/${mainCategory.slug}/${subCategory.slug}`;
    
    // 構建完整的導航路徑
    const fullPath = `/products/${gender.slug}/${mainCategory.slug}/${subCategory.slug}`;
    
    // 設置最後選擇的分類路徑（全局變量）
    lastSelectedCategoryPath = fullPath;
    
    // 同時更新組件狀態
    setSelectedPath(fullPath);
    
    // 更新 Redux 狀態，確保傳遞正確的路徑格式
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
  }, [dispatch, navigate, isOffcanvas]);

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
      const pathParts = lastSelectedCategoryPath.split('/').filter(Boolean);
      
      if (pathParts.length >= 3) {
        const gender = pathParts[1]; // 'women' 或 'men'
        
        if (pathParts.length >= 5) {
          // 處理三層結構: /products/gender/mainCategory/subCategory
          const mainCategory = pathParts[2];
          const subCategory = pathParts[3];
          
          // 構建分類參數
          const categoryPath = `${gender}/${mainCategory}/${subCategory}`;
          
          // 先更新 Redux 狀態
          dispatch(setCurrentCategory(categoryPath));
        } else if (pathParts.length >= 4) {
          // 處理二層結構: /products/gender/category
          const category = pathParts[2];
          
          // 構建分類參數
          const categoryPath = `${gender}/${category}`;
          
          // 更新 Redux 狀態
          dispatch(setCurrentCategory(categoryPath));
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
  const totalFilterCount = useMemo(() =>
    Object.values(activeFilters).reduce(
      (count, labels) => count + (labels.includes("全部") ? 0 : labels.length),
      0
    ),
    [activeFilters]
  );

  // 同步路徑和展開狀態
  useEffect(() => {
    if (urlGender && category) {
      const path = subcategory
        ? `/products/${urlGender}/${category}/${subcategory}`
        : `/products/${urlGender}/${category}`;
      
      lastSelectedCategoryPath = path;
      
      if (selectedPath !== path) {
        setSelectedPath(path);
      }
    }
  
    // 確保「狀態」類別始終保持展開狀態
    setExpandedCategories(prev => {
      // 只有在狀態需要更改時才更新
      if (prev['product-status'] === true) {
        return prev;
      }
      return {
        ...prev,
        'product-status': true
      };
    });
  }, [urlGender, category, subcategory, selectedPath]);

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
              {gender.categories.map((category) => {
                // 判斷是否為狀態分類
                const isStatusCategory = category.slug === 'product-status';
                // 檢查類別是否展開
                const isExpanded = !!expandedCategories[category.slug];
                
                // 根據類別類型選擇不同的組件
                if (isStatusCategory) {
                  // 使用狀態過濾組件
                  return (
                    <StatusFilterItem 
                      key={category.slug}
                      category={category}
                      isExpanded={isExpanded}
                      toggleExpand={toggleCategoryExpand}
                      statusFilter={productStatusFilter}
                      handleStatusFilterChange={handleStatusFilterChange}
                    />
                  );
                } else {
                  // 使用一般類別組件
                  return (
                    <CategoryItem 
                      key={category.slug}
                      gender={gender}
                      category={category}
                      isExpanded={isExpanded}
                      toggleExpand={toggleCategoryExpand}
                      handleCategoryClick={handleCategoryClick}
                      handleSubCategoryClick={handleSubCategoryClick}
                    />
                  );
                }
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
              查看品項{" "}
              {totalFilterCount > 0 && `(${totalFilterCount})`}
            </h6>
          </button>
        </div>
      )}
    </nav>
  );
});

// 合併 FilterButton 和 SortFilter 組件
const FilterSortButton = memo(
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
const SortFilter = memo(({ sortOption, handleSortChange }) => {
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

export default FilterMenu;
export { FilterSortButton, SortFilter, getUniqueValues, PRODUCT_STATUS_OPTIONS };