import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts, resetFilters } from "../../slice/productsListSlice";

// 安全地從對象中提取唯一值的實用函數
const getUniqueValues = (array, key) => {
  if (!Array.isArray(array)) return [];
  return [...new Set(array.map((item) => item?.[key]).filter(Boolean))];
};

// 定義固定的狀態選項
const FIXED_STATUS_OPTIONS = [
  {
    id: "categoryItem-status-all",
    label: "全部",
    isDefaultAll: true,
  },
  {
    id: "categoryItem-status-1",
    label: "現貨",
    isDefaultAll: false,
  },
  {
    id: "categoryItem-status-2",
    label: "預購",
    isDefaultAll: false,
  },
  {
    id: "categoryItem-status-3",
    label: "補貨中",
    isDefaultAll: false,
  },
];

// 從產品數據中生成類別映射的函數
const generateCategoryMappingsFromProducts = (products) => {
  const categoryMappings = {};

  // 遍歷所有產品
  products.forEach((product) => {
    const classType = product.class; // '男裝' 或 '女裝'
    const category = product.category; // '上衣', '褲子' 等
    const categoryItem = product.categoryItems; // '襯衫', 'T恤' 等

    // 如果此類別還沒有在映射中，則創建
    if (!categoryMappings[classType]) {
      categoryMappings[classType] = {};
    }

    // 如果此子類別還沒有在映射中，則創建
    if (!categoryMappings[classType][category]) {
      categoryMappings[classType][category] = [];
    }

    // 添加類別項目，如果不存在的話
    if (
      categoryItem &&
      !categoryMappings[classType][category].includes(categoryItem)
    ) {
      categoryMappings[classType][category].push(categoryItem);
    }
  });

  return categoryMappings;
};

// 動態生成類別數據的函數，基於當前選擇的性別分類
const generateCategoriesData = (
  products,
  currentCategory,
  categoryMappings
) => {
  // 確定當前選擇的性別分類
  const selectedGender =
    currentCategory === "men"
      ? "男裝"
      : currentCategory === "women"
      ? "女裝"
      : null;

  // 過濾當前性別的產品
  const filteredProducts = selectedGender
    ? products.filter((product) => product.class === selectedGender)
    : products;

  // 如果有類別映射且有選定的性別
  if (categoryMappings && selectedGender && categoryMappings[selectedGender]) {
    const genderCategories = categoryMappings[selectedGender];

    // 基於映射生成類別數據
    const categoriesData = Object.entries(genderCategories).map(
      ([category, categoryItems]) => ({
        title: category,
        options: [
          {
            id: `categoryItem-${category}-all`,
            label: "全部",
            isDefaultAll: true,
          },
          ...categoryItems.map((item, itemIndex) => ({
            id: `categoryItem-${category}-${itemIndex + 1}`,
            label: item,
            isDefaultAll: false,
          })),
        ],
      })
    );

    // 添加固定的狀態類別
    const statusCategories = {
      title: "狀態",
      options: FIXED_STATUS_OPTIONS,
    };

    categoriesData.push(statusCategories);
    return categoriesData;
  } else {
    // 沒有特定性別或映射，從產品中動態提取所有唯一的主類別和子類別
    const uniqueCategories = new Set(
      filteredProducts.map((product) => product.category)
    );
    const categoriesWithSubCategories = {};

    // 遍歷每個唯一類別，找出其子類別
    uniqueCategories.forEach((category) => {
      const subCategories = new Set(
        filteredProducts
          .filter((product) => product.category === category)
          .map((product) => product.categoryItems)
          .filter(Boolean)
      );

      categoriesWithSubCategories[category] = Array.from(subCategories);
    });

    // 生成類別數據
    const categoriesData = Object.entries(categoriesWithSubCategories).map(
      ([title, subCategories]) => ({
        title,
        options: [
          {
            id: `categoryItem-${title}-all`,
            label: "全部",
            isDefaultAll: true,
          },
          ...subCategories.map((item, itemIndex) => ({
            id: `categoryItem-${title}-${itemIndex + 1}`,
            label: item,
            isDefaultAll: false,
          })),
        ],
      })
    );

    // 添加固定的狀態類別
    const statusCategories = {
      title: "狀態",
      options: FIXED_STATUS_OPTIONS,
    };

    categoriesData.push(statusCategories);
    return categoriesData;
  }
};

// CategoryItem 組件，使用 memo  進行性能優化
const CategoryItem = memo(
  ({ category, index, isOffcanvas = false, onFilterChange, activeFilters }) => {
    const [isOpen, setIsOpen] = useState(index === 0);
    const [selectedItems, setSelectedItems] = useState({});

    // 使用 useMemo 優化初始選中狀態計算
    const initialSelectedItems = useMemo(() => {
      const newSelectedItems = {};
      const categoryFilters = activeFilters[category.title] || [];

      category.options.forEach((option) => {
        if (option.label === "全部") {
          // 檢查是否除"全部"外所有選項都被選中
          const allOptionsExceptAll = category.options.filter(
            (opt) => opt.label !== "全部"
          );
          const allSelected = allOptionsExceptAll.every((opt) =>
            categoryFilters.includes(opt.label)
          );
          newSelectedItems[option.id] = allSelected;
        } else {
          // 檢查選項是否在活動篩選條件中
          newSelectedItems[option.id] = categoryFilters.includes(option.label);
        }
      });

      return newSelectedItems;
    }, [activeFilters, category.title, category.options]);

    // 同步 initialSelectedItems
    useEffect(() => {
      setSelectedItems(initialSelectedItems);
      // 如果有選中的選項，自動展開
      setIsOpen(Object.values(initialSelectedItems).some(Boolean));
    }, [initialSelectedItems]);

    // 統一的選項變更邏輯
    const handleSelectedChange = useCallback(
      (newSelectedItems) => {
        const selectedLabels = Object.entries(newSelectedItems)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => {
            const option = category.options.find((opt) => opt.id === id);
            return option ? option.label : null;
          })
          .filter((label) => label && label !== "全部");

        onFilterChange(
          category.title,
          selectedLabels.length ? selectedLabels : ["全部"]
        );
      },
      [category.options, category.title, onFilterChange]
    );

    // 處理「全部」選項變更
    const handleAllCheckboxChange = useCallback(
      (e) => {
        const isChecked = e.target.checked;
        const newSelectedItems = {};

        category.options.forEach((option) => {
          newSelectedItems[option.id] = isChecked;
        });

        setSelectedItems(newSelectedItems);
        handleSelectedChange(newSelectedItems);
      },
      [category.options, handleSelectedChange]
    );

    // 處理子選項變更
    const handleCheckboxChange = useCallback(
      (optionId) => (e) => {
        const isChecked = e.target.checked;
        const newSelectedItems = { ...selectedItems };
        newSelectedItems[optionId] = isChecked;

        // 更新全部選項狀態
        const allOptionsExceptAll = category.options.filter(
          (opt) => opt.label !== "全部"
        );
        const allSelected = allOptionsExceptAll.every(
          (opt) => newSelectedItems[opt.id]
        );

        const allOptionId = category.options.find(
          (opt) => opt.label === "全部"
        )?.id;
        if (allOptionId) {
          newSelectedItems[allOptionId] = allSelected;
        }

        setSelectedItems(newSelectedItems);
        handleSelectedChange(newSelectedItems);
      },
      [category.options, selectedItems, handleSelectedChange]
    );

    return (
      <div className="accordion-item category-item">
        <h6 className="accordion-header">
          <button
            className={`ps-0 pe-0 accordion-button category-button ${
              !isOpen ? "collapsed" : ""
            }`}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            {category.title}
          </button>
        </h6>
        <div className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}>
          <div className="accordion-body d-flex text-nowrap flex-wrap gap-2 category-subItem">
            {category.options.map((option) => {
              const optionId = isOffcanvas ? `${option.id}-sm` : option.id;
              const isSelected = selectedItems[option.id] || false;
              return (
                <div key={optionId}>
                  <input
                    type="checkbox"
                    className="d-none"
                    name="categoryItem"
                    id={optionId}
                    checked={isSelected}
                    onChange={
                      option.label === "全部"
                        ? handleAllCheckboxChange
                        : handleCheckboxChange(option.id)
                    }
                  />
                  <label
                    htmlFor={optionId}
                    className={`btn btn-outline-primary fs-sm ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

// FilterMenu 組件
export const FilterMenu = memo(({ isOffcanvas = false }) => {
  const dispatch = useDispatch();

  // 使用 useSelector 獲取狀態
  const {
    filters: reduxFilters = {},
    items: products = [],
    currentCategory = null,
  } = useSelector((state) => state.productsList);

  // 使用 useMemo 生成類別映射
  const categoryMappings = useMemo(
    () => generateCategoryMappingsFromProducts(products),
    [products]
  );

  // 使用 useMemo 優化 categoriesData 的生成
  const categoriesData = useMemo(
    () => generateCategoriesData(products, currentCategory, categoryMappings),
    [products, currentCategory, categoryMappings]
  );

  // 狀態管理優化
  const [activeFilters, setActiveFilters] = useState(reduxFilters);

  // 同步 Redux 篩選條件
  useEffect(() => {
    setActiveFilters(reduxFilters);
  }, [reduxFilters]);

  // 篩選條件變更處理
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

  // 重置所有篩選條件
  const handleResetFilters = useCallback(() => {
    setActiveFilters({});
    dispatch(resetFilters());
  }, [dispatch]);

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
        {categoriesData.map((category, index) => (
          <CategoryItem
            key={category.title}
            category={category}
            index={index}
            isOffcanvas={isOffcanvas}
            onFilterChange={handleFilterChange}
            activeFilters={activeFilters}
          />
        ))}
      </div>
    </nav>
  );
});

// 合併 FilterButton 和 SortFilter 組件
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

// 導出工具函數和篩選器
export { generateCategoriesData, getUniqueValues };
