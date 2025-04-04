// 初始狀態
export const initialState = {
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      "紅色", "黃色", "水藍色", "米白色", "卡其色", "灰色", "青綠色", "黑色", "紫色",
      "深灰色", "綠色", "棕色", "藏青色", "白色", "粉紅色", "天藍色", "寶藍色",
      "咖啡色", "酒紅色", "深藍色", "淺藍色", "軍綠色", "奶茶色", "橄欖綠漸層",
      "紅棕漸層", "純白色", "杏色", "薄荷綠", "珊瑚紅", "淡粉色", "藍白條紋",
      "灰白條紋", "黑白條紋", "米白條紋", "深灰條紋", "經典藍", "霧灰色",
      "深咖啡色", "經典棕色", "駝色", "經典黑", "奶茶漸層", "黑白格紋",
      "深藍格紋", "米白格紋", "咖啡格紋", "酒紅拼白", "深藍拼白", "卡其條紋",
      "深藍條紋", "黑白條紋", "淺綠色", "淺灰色", "海軍藍", "灰紫色", "淺灰藍"
    ],
    status: ["現貨", "預購", "補貨中"]
  };
  
  // 排序尺寸的輔助函數
  export const sortSizes = (sizes) => {
    const sizeOrder = {
      XS: 0, S: 1, M: 2, L: 3, XL: 4, "2XL": 5, "3XL": 6, "4XL": 7, "5XL": 8
    };
  
    return [...sizes].sort((a, b) => {
      // 如果兩個尺寸都在預設順序中
      if (sizeOrder[a] !== undefined && sizeOrder[b] !== undefined) {
        return sizeOrder[a] - sizeOrder[b];
      }
      // 如果只有a在預設順序中
      else if (sizeOrder[a] !== undefined) {
        return -1;
      }
      // 如果只有b在預設順序中
      else if (sizeOrder[b] !== undefined) {
        return 1;
      }
      // 如果都不在預設順序中，按字母排序
      return a.localeCompare(b);
    });
  };
  
  // 定義 actions
  export const optionReducer = (state, action) => {
    switch (action.type) {
      case "ADD_SIZE":
        if (state.sizes.includes(action.payload)) {
          return state; // 尺寸已存在
        }
        return {
          ...state,
          sizes: sortSizes([...state.sizes, action.payload]),
        };
  
      case "ADD_SIZES": {
        const newSizes = [...state.sizes];
        let sizesAdded = false;
        action.payload.forEach((size) => {
          if (!newSizes.includes(size)) {
            newSizes.push(size);
            sizesAdded = true;
          }
        });
  
        if (!sizesAdded) {
          return state; // 沒有新增任何尺寸
        }
  
        return {
          ...state,
          sizes: sortSizes(newSizes),
        };
      }
  
      case "REMOVE_SIZE":
        if (!state.sizes.includes(action.payload)) {
          return state; // 尺寸不存在
        }
        return {
          ...state,
          sizes: state.sizes.filter((size) => size !== action.payload),
        };
  
      case "ADD_COLOR":
        if (state.colors.includes(action.payload)) {
          return state; // 顏色已存在
        }
        return {
          ...state,
          colors: [...state.colors, action.payload],
        };
  
      case "ADD_COLORS": {
        const newColors = [...state.colors];
        let colorsAdded = false;
        action.payload.forEach((color) => {
          if (!newColors.includes(color)) {
            newColors.push(color);
            colorsAdded = true;
          }
        });
  
        if (!colorsAdded) {
          return state; // 沒有新增任何顏色
        }
  
        return {
          ...state,
          colors: newColors,
        };
      }
  
      case "REMOVE_COLOR":
        if (!state.colors.includes(action.payload)) {
          return state; // 顏色不存在
        }
        return {
          ...state,
          colors: state.colors.filter((color) => color !== action.payload),
        };
  
      case "ADD_STATUS":
        if (state.status.includes(action.payload)) {
          return state; // 狀態已存在
        }
        return {
          ...state,
          status: [...state.status, action.payload],
        };
  
      case "REMOVE_STATUS":
        if (!state.status.includes(action.payload)) {
          return state; // 狀態不存在
        }
        return {
          ...state,
          status: state.status.filter((status) => status !== action.payload),
        };
  
      default:
        return state;
    }
  };