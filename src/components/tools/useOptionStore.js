import { useContext } from "react";
import OptionStoreContext from "../layouts/OptionStoreContext";

export const useOptionStore = () => {
  const context = useContext(OptionStoreContext);
  if (!context) {
    throw new Error("useOptionStore 必須在 OptionStoreProvider 內使用");
  }
  return context;
};