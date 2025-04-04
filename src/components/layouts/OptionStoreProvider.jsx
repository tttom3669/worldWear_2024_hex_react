import { useReducer } from "react";
import PropTypes from "prop-types";
import { initialState, optionReducer } from "../tools/optionStoreUtils";
import OptionStoreContext from "../layouts/OptionStoreContext";

// 提供者元件
const OptionStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(optionReducer, initialState);

  // 定義操作函數
  const addSize = (size) => {
    dispatch({ type: "ADD_SIZE", payload: size });
  };

  const addSizes = (sizeArray) => {
    dispatch({ type: "ADD_SIZES", payload: sizeArray });
  };

  const removeSize = (size) => {
    dispatch({ type: "REMOVE_SIZE", payload: size });
  };

  const addColor = (color) => {
    dispatch({ type: "ADD_COLOR", payload: color });
  };

  const addColors = (colorArray) => {
    dispatch({ type: "ADD_COLORS", payload: colorArray });
  };

  const removeColor = (color) => {
    dispatch({ type: "REMOVE_COLOR", payload: color });
  };

  const addStatus = (status) => {
    dispatch({ type: "ADD_STATUS", payload: status });
  };

  const removeStatus = (status) => {
    dispatch({ type: "REMOVE_STATUS", payload: status });
  };

  // 提供值
  const value = {
    sizes: state.sizes,
    colors: state.colors,
    status: state.status,
    addSize,
    addSizes,
    removeSize,
    addColor,
    addColors,
    removeColor,
    addStatus,
    removeStatus,
  };

  return (
    <OptionStoreContext.Provider value={value}>
      {children}
    </OptionStoreContext.Provider>
  );
};

OptionStoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default OptionStoreProvider;