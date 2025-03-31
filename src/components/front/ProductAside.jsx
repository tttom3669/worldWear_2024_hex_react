import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { productCategories } from "../../slice/productsSlice";
import {
  setCurrentCategory,
  filterProducts,
  resetFilters,
  fetchProducts,
  setFilterProducts,
} from "../../slice/productsListSlice";
import useImgUrl from "../../hooks/useImgUrl";
import useSwal from "../../hooks/useSwal";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import axios from "axios";

// 在組件內部定義常量，避免多餘的渲染
const STATUS_MAP = {
  "in-stock": "現貨",
  "pre-order": "預購",
  restocking: "補貨中",
};

// 安全地從對象中提取唯一值的實用函數
const getUniqueValues = (array, key) => {
  if (!Array.isArray(array)) return [];
  return [...new Set(array.map((item) => item?.[key]).filter(Boolean))];
};

// 先定義並導出 SortFilter 組件
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

// 導出 FilterSortButton 組件
export const FilterSortButton = memo(
  ({ toggleOffcanvas, sortOption, handleSortChange }) => {
    const getImgUrl = useImgUrl();
    // 直接從 Redux 獲取原始 filters 數據和當前類別
    const filters = useSelector((state) => state.productsList?.filters || {});
    const currentCategory = useSelector(
      (state) => state.productsList?.currentCategory || ""
    );

    // 從當前類別路徑中提取類別信息
    const categoryInfo = useMemo(() => {
      if (!currentCategory)
        return { gender: "", mainCategory: "", subCategories: [] };

      const parts = currentCategory.split("/");
      if (parts.length >= 2) {
        const gender = parts[0];
        const mainCategory = parts[1];

        if (parts.length >= 3) {
          // 處理可能的多個子類別 (用逗號分隔的子類別列表)
          const subCategories = parts[2].split(",");
          return { gender, mainCategory, subCategories };
        }

        return { gender, mainCategory, subCategories: [] };
      }

      return { gender: "", mainCategory: "", subCategories: [] };
    }, [currentCategory]);

    // 計算當前類別中已選擇的篩選條件數量 - 避免累加計算
    const totalCount = useMemo(() => {
      // 細項類別數量 - 只計算當前類別路徑下的細項
      const subCategoriesCount = categoryInfo.subCategories.length;

      // 篩選條件數量 - 只計算當前類別下的篩選條件
      let filtersCount = 0;

      // 只計算篩選條件
      if (filters && typeof filters === "object") {
        Object.keys(filters).forEach((key) => {
          const labels = filters[key];
          if (Array.isArray(labels) && !labels.includes("全部")) {
            filtersCount += labels.length;
          }
        });
      }

      // 返回總計數，避免重複計算
      return subCategoriesCount + filtersCount;
    }, [filters, categoryInfo]);

    // 記錄上次類別路徑，用於偵測類別變化
    const [lastCategoryPath, setLastCategoryPath] = useState("");

    // 當類別路徑變化時，確保計數被重置
    useEffect(() => {
      // 如果類別路徑變化，記錄新路徑
      if (currentCategory !== lastCategoryPath) {
        setLastCategoryPath(currentCategory);
        // 可以在這裡添加其他重置邏輯
      }
    }, [currentCategory, lastCategoryPath]);

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
            <h6 className="mb-0">
              類別
              {totalCount > 0 && <span className="ms-1">({totalCount})</span>}
            </h6>
            <span className="dropdown-icon ms-2">
              <img
                src={getImgUrl("/icons/dropdownIcon.svg")}
                alt="dropdown-Icon"
              />
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

// 全局變量來存儲最後選擇的分類路徑
let lastSelectedCategoryPath = "";

// 定義主要的 ProductAside 組件
const ProductAside = memo(({ isOffcanvas = false, toggleOffcanvas }) => {
  const getImgUrl = useImgUrl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { category, subcategory, gender: urlGender } = useParams();
  const location = useLocation();
  const { toastAlert } = useSwal();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("全部商品");
  const [selectedPriceRange, setSelectedPriceRange] = useState("全部價格");
  const [selectedSort, setSelectedSort] = useState("預設排序");

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
  // 跟踪「商品狀態」的過濾選項
  const [productStatusFilter, setProductStatusFilter] = useState([]);
  // 選中的主類別
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  // 選中的多個細項類別 (改為數組，支持多選)
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  // 直接使用常量而不是 useMemo，避免多餘的渲染和依賴問題
  const statusMap = STATUS_MAP;

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
    const gender = categoriesList.find((cat) => cat.slug === currentGender);
    if (gender) {
      return gender.categories.find((cat) => cat.slug === "product-status");
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

  // 從當前分類路徑中解析出主類別和子類別
  useEffect(() => {
    if (currentCategory) {
      const parts = currentCategory.split("/");
      if (parts.length >= 2) {
        // 儲存主類別，但不顯示選中樣式
        setSelectedMainCategory(parts[1]); // 設置主類別 (如 'top', 'jacket')

        if (parts.length >= 3) {
          // 處理可能的多個子類別 (用逗號分隔的子類別列表)
          const subCats = parts[2].split(",");
          setSelectedSubCategories(subCats); // 設置多個子類別
        } else {
          setSelectedSubCategories([]); // 如果沒有子類別，清空選中狀態
        }
      } else {
        setSelectedMainCategory("");
        setSelectedSubCategories([]);
      }
    }
  }, [currentCategory]);

  // 從 URL 參數同步選中狀態
  useEffect(() => {
    if (category) {
      setSelectedMainCategory(category);

      if (subcategory) {
        // 處理可能的多個子類別 (用逗號分隔的子類別列表)
        const subCats = subcategory.split(",");
        setSelectedSubCategories(subCats);
      } else {
        setSelectedSubCategories([]);
      }

      // 自動展開選中的類別
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: true,
      }));
    }
  }, [category, subcategory]);

  // 同步 Redux 篩選條件
  useEffect(() => {
    setActiveFilters(reduxFilters);

    // 同步狀態過濾器，確保使用資料庫中的實際值 (如 "現貨", "預購", "補貨中")
    if (reduxFilters?.productStatus) {
      // 過濾掉"全部"選項
      const statusFilters = reduxFilters.productStatus
        .filter((status) => status !== "全部")
        // 將 slug 轉換為實際的資料庫值
        .map((status) => {
          // 檢查是否為 slug，如果是則轉換為對應的資料庫值
          return STATUS_MAP[status] || status;
        });

      setProductStatusFilter(statusFilters);
    } else {
      setProductStatusFilter([]);
    }
  }, [reduxFilters]);

  // 處理篩選條件變更
  const handleFilterChange = useCallback(
    (category, selectedLabels) => {
      // 特別處理商品狀態類別
      if (category === "productStatus") {
        // 將顯示值(現貨、預購、補貨中)轉換回 slug 以傳給 Redux
        const slugLabels = selectedLabels.map((label) => {
          // 找出這個標題對應的 slug
          for (const [slug, title] of Object.entries(STATUS_MAP)) {
            if (title === label) {
              return slug;
            }
          }
          // 如果找不到對應的 slug，保持原值
          return label;
        });

        const newFilters = {
          ...activeFilters,
          [category]: slugLabels.length ? slugLabels : ["全部"],
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
    [activeFilters, dispatch]
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
    (gender, mainCategory) => {
      // 構建類別路徑
      const categoryPath = `${gender.slug}/${mainCategory.slug}`;

      // 構建完整的導航路徑
      const fullPath = `/products/${gender.slug}/${mainCategory.slug}`;

      // 設置最後選擇的分類路徑
      lastSelectedCategoryPath = fullPath;

      // 更新選中狀態
      setSelectedMainCategory(mainCategory.slug);
      setSelectedSubCategories([]); // 清除細項類別選中狀態，因為選擇了「全部」

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

  // 處理細項類別按鈕點擊 - 支持多選並重置計數
  const handleSubCategoryClick = useCallback(
    (mainCategory, subCategory) => {
      // 檢查該細項是否已被選中
      const isSelected = selectedSubCategories.includes(subCategory.slug);
      let updatedSubCategories = [];

      if (isSelected) {
        // 如果已選中，則取消選中
        updatedSubCategories = selectedSubCategories.filter(
          (slug) => slug !== subCategory.slug
        );
      } else {
        // 如果未選中，則添加到選中列表
        updatedSubCategories = [...selectedSubCategories, subCategory.slug];
      }

      // 更新選中的細項類別
      setSelectedSubCategories(updatedSubCategories);

      // 每次切換細項類別時，重置篩選條件
      setActiveFilters({});
      setProductStatusFilter([]);
      dispatch(resetFilters());

      if (updatedSubCategories.length === 0) {
        // 如果沒有選中的細項，則顯示所有商品 (相當於選擇了「全部」)
        const categoryPath = `${currentGender}/${mainCategory.slug}`;

        // 構建完整的導航路徑
        const fullPath = `/products/${currentGender}/${mainCategory.slug}`;

        // 設置最後選擇的分類路徑
        lastSelectedCategoryPath = fullPath;

        // 同時更新組件狀態
        setSelectedPath(fullPath);

        // 更新 Redux 狀態
        dispatch(setCurrentCategory(categoryPath));

        // 如果是在手機版中，不立即跳轉
        if (!isOffcanvas) {
          navigate(fullPath);
          dispatch(fetchProducts(categoryPath));
        }
      } else {
        // 構建包含多個細項的類別路徑，用逗號分隔
        const subCategoriesPath = updatedSubCategories.join(",");
        const categoryPath = `${currentGender}/${mainCategory.slug}/${subCategoriesPath}`;

        // 構建完整的導航路徑
        const fullPath = `/products/${currentGender}/${mainCategory.slug}/${subCategoriesPath}`;

        // 設置最後選擇的分類路徑
        lastSelectedCategoryPath = fullPath;

        // 同時更新組件狀態
        setSelectedPath(fullPath);

        // 更新 Redux 狀態
        dispatch(setCurrentCategory(categoryPath));

        // 如果是在手機版中，不立即跳轉
        if (!isOffcanvas) {
          navigate(fullPath);
          dispatch(fetchProducts(categoryPath));
        }
      }
    },
    [
      currentGender,
      selectedSubCategories,
      dispatch,
      navigate,
      isOffcanvas,
      setActiveFilters,
      setProductStatusFilter,
    ]
  );

  // 重置所有篩選條件
  const handleResetFilters = useCallback(() => {
    setActiveFilters({});
    setProductStatusFilter([]);
    // 不要清除類別選中狀態，只清除篩選條件
    dispatch(resetFilters());
  }, [dispatch]);

  // 清除所有細項類別選取狀態
  const handleClearSubCategories = useCallback(() => {
    if (selectedMainCategory) {
      // 找到當前選中的主類別
      const genderCategory = currentCategories[0];
      const mainCategory = genderCategory?.categories.find(
        (cat) => cat.slug === selectedMainCategory
      );

      if (mainCategory) {
        // 清除選中的細項類別
        setSelectedSubCategories([]);

        // 構建類別路徑 (回到主類別的「全部」選項)
        const categoryPath = `${currentGender}/${selectedMainCategory}`;

        // 構建完整的導航路徑
        const fullPath = `/products/${currentGender}/${selectedMainCategory}`;

        // 設置最後選擇的分類路徑
        lastSelectedCategoryPath = fullPath;

        // 同時更新組件狀態
        setSelectedPath(fullPath);

        // 更新 Redux 狀態
        dispatch(setCurrentCategory(categoryPath));

        // 如果是在桌面版中，直接導航到對應頁面
        if (!isOffcanvas) {
          navigate(fullPath);

          // 觸發產品獲取
          dispatch(fetchProducts(categoryPath));
        }
      }
    }
  }, [
    selectedMainCategory,
    currentCategories,
    currentGender,
    dispatch,
    navigate,
    isOffcanvas,
  ]);

  // 查看品項按鈕點擊處理
  const handleViewItems = useCallback(() => {
    if (lastSelectedCategoryPath) {
      // 從路徑中提取分類信息
      const pathParts = lastSelectedCategoryPath.split("/").filter(Boolean);

      if (pathParts.length >= 3) {
        const gender = pathParts[1]; // 'women' 或 'men'

        // 處理可能包含多個子類別的路徑
        const mainCategory = pathParts[2]; // 如 'dress', 'top' 等

        if (pathParts.length >= 4) {
          // 包含子類別部分
          const subcategories = pathParts[3]; // 可能是單個子類別或逗號分隔的多個子類別

          // 更新 Redux 狀態
          dispatch(
            setCurrentCategory(`${gender}/${mainCategory}/${subcategories}`)
          );
        } else {
          // 只有主類別
          dispatch(setCurrentCategory(`${gender}/${mainCategory}`));
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

  // 計算各種統計數據 - 針對當前類別計算
  const totalFilterCount = useMemo(() => {
    // 已選擇的細項類別數量
    const subCategoriesCount = selectedSubCategories.length;

    // 篩選條件計數
    let filtersCount = 0;

    // 計算篩選條件 - 僅考慮當前類別相關的條件
    Object.keys(activeFilters).forEach((key) => {
      const labels = activeFilters[key];
      if (Array.isArray(labels) && !labels.includes("全部")) {
        filtersCount += labels.length;
      }
    });

    return subCategoriesCount + filtersCount;
  }, [activeFilters, selectedSubCategories]);

  // 判斷是否有任何選中的細項
  const hasSelectedSubcategories = useMemo(
    () => selectedSubCategories.length > 0,
    [selectedSubCategories]
  );

  // 重設全局變量，以便下次訪問時能正確檢測到當前 URL
  useEffect(() => {
    // 如果 URL 包含性別和分類，設置最後選擇的分類路徑
    if (urlGender && category) {
      const path = subcategory
        ? `/products/${urlGender}/${category}/${subcategory}`
        : `/products/${urlGender}/${category}`;

      lastSelectedCategoryPath = path;
      setSelectedPath(path);
    }
  }, [urlGender, category, subcategory]);

  // 從 URL 參數中獲取過濾條件
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const priceRangeParam = params.get("priceRange");
    const sortParam = params.get("sort");

    if (categoryParam) {
      setSelectedCategory(categoryParam);
      dispatch(setCategory(categoryParam));
    }
    if (priceRangeParam) {
      setSelectedPriceRange(priceRangeParam);
      dispatch(setPriceRange(priceRangeParam));
    }
    if (sortParam) {
      setSelectedSort(sortParam);
      dispatch(setSort(sortParam));
    }
  }, [location.search, dispatch]);

  // 獲取商品分類
  {
    /* useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_PATH}/products/categories`
        );
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("獲取分類失敗:", error);
      }
    };

    fetchCategories();
  }, []); */
  }

  const fetchProductsData = async () => {
    setIsLoading(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_PATH}/products`,
        {
          params: {
            category:
              selectedCategory !== "全部商品" ? selectedCategory : undefined,
            priceRange:
              selectedPriceRange !== "全部價格"
                ? selectedPriceRange
                : undefined,
            sort: selectedSort !== "預設排序" ? selectedSort : undefined,
          },
        }
      );
      dispatch(setFilterProducts(response.data));
    } catch (error) {
      console.error("獲取商品列表失敗:", error);
      toastAlert({
        icon: "error",
        title: "獲取商品列表失敗，請稍後再試",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 當過濾條件改變時重新獲取商品列表
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const priceRangeParam = params.get('priceRange');
    const sortParam = params.get('sort');
    if (!categoryParam && !priceRangeParam && !sortParam) {
      return;
    }
    fetchProductsData();
  }, [selectedCategory, selectedPriceRange, selectedSort]);

  return (
    <nav className="navCategory bg-white ms-4 me-4">
      <div className="d-flex justify-content-between align-items-center w-100 mb-4 mt-6">
        <span className="navbar-brand btnClose">
          <h6>類別</h6>
        </span>

        {/* 當有細項類別被選中或有篩選條件時，顯示「清除全部」按鈕 */}
        {(hasSelectedSubcategories || totalFilterCount > 0) && (
          <button
            className="btn btn-sm btn-outline-black"
            onClick={() => {
              // 清除選中的細項類別
              if (hasSelectedSubcategories) {
                handleClearSubCategories();
              }
              // 清除篩選條件
              if (totalFilterCount > 0) {
                handleResetFilters();
              }
            }}
          >
            清除全部({totalFilterCount})
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

                // 檢查當前主類別是否是當前選中的路徑 (僅用於內部邏輯，不顯示選中樣式)
                const isCurrentCategoryPath =
                  selectedMainCategory === category.slug;

                return (
                  <li key={category.slug} className="category-item mb-3">
                    {/* 主類別上方的分隔線 */}
                    <hr className="category-divider my-2 border-secondary-subtle" />
                    {/* 主類別標題 - 可展開/收合 */}
                    <div
                      className="text-decoration-none d-flex justify-content-between align-items-center w-100 py-2"
                      onClick={() => toggleCategoryExpand(category.slug)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* 主類別標題不顯示選中樣式，保持原來的顏色 */}
                      <span className="fw-bold text-dark">
                        {category.title}
                      </span>
                      <span className="dropdown-icon">
                        {isExpanded ? (
                          <FiChevronUp style={{ fontSize: "24px" }} />
                        ) : (
                          <FiChevronDown style={{ fontSize: "24px" }} />
                        )}
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
                            {/* 「全部」按鈕 - 第三層細項選擇 */}
                            {category.subCategories &&
                              category.subCategories.length > 0 && (
                                <button
                                  className={`btn ${
                                    isCurrentCategoryPath &&
                                    selectedSubCategories.length === 0
                                      ? "btn-primary"
                                      : "btn-outline-secondary"
                                  } btn-sm px-2 py-1`}
                                  onClick={() =>
                                    handleCategoryClick(
                                      { slug: currentGender },
                                      category
                                    )
                                  }
                                >
                                  全部
                                </button>
                              )}

                            {/* 細項類別按鈕 - 第三層，支持多選 */}
                            {category.subCategories &&
                              category.subCategories.length > 0 &&
                              category.subCategories.map((subCategory) => {
                                // 檢查細項類別是否被選中 (這裡允許多選)
                                const isSubCategorySelected =
                                  isCurrentCategoryPath &&
                                  selectedSubCategories.includes(
                                    subCategory.slug
                                  );

                                return (
                                  <button
                                    key={subCategory.slug}
                                    className={`btn btn-sm px-2 py-1 ${
                                      isSubCategorySelected
                                        ? "btn-primary"
                                        : "btn-outline-secondary"
                                    }`}
                                    onClick={() =>
                                      handleSubCategoryClick(
                                        category,
                                        subCategory
                                      )
                                    }
                                  >
                                    {subCategory.title}
                                  </button>
                                );
                              })}
                          </div>
                        ) : (
                          // 商品狀態的按鈕選擇
                          <div className="d-flex flex-wrap gap-2">
                            {category.subCategories &&
                              category.subCategories.length > 0 && (
                                <button
                                  className={`btn ${
                                    productStatusFilter.length === 0
                                      ? "btn-primary"
                                      : "btn-outline-secondary"
                                  } btn-sm px-2 py-1`}
                                  onClick={() => {
                                    setProductStatusFilter([]);
                                    handleFilterChange("productStatus", []);
                                  }}
                                >
                                  全部
                                </button>
                              )}

                            {category.subCategories &&
                              category.subCategories.length > 0 &&
                              category.subCategories.map((subCategory) => {
                                // 用資料庫中實際的值來判斷是否選中
                                const dbValue =
                                  STATUS_MAP[subCategory.slug] ||
                                  subCategory.title;
                                const isSelected =
                                  productStatusFilter.includes(dbValue);

                                return (
                                  <button
                                    key={subCategory.slug}
                                    className={`btn ${
                                      isSelected
                                        ? "btn-primary"
                                        : "btn-outline-secondary"
                                    } btn-sm px-2 py-1`}
                                    onClick={() => {
                                      // 使用資料庫中的實際值而不是 slug
                                      const dbValue =
                                        STATUS_MAP[subCategory.slug] ||
                                        subCategory.title;

                                      const newFilter = isSelected
                                        ? productStatusFilter.filter(
                                            (s) => s !== dbValue
                                          )
                                        : [...productStatusFilter, dbValue];

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

// 將 ProductAside 設為默認導出
export default ProductAside;

// 重新導出其他工具函數和組件
export { getUniqueValues };
