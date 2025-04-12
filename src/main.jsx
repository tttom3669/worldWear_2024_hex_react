import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/scss/main.scss";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { Provider } from "react-redux";
import { store } from "./store";
import OptionStoreProvider from "./components/layouts/OptionStoreProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <OptionStoreProvider>
        <RouterProvider router={router} />
      </OptionStoreProvider>
    </Provider>
  </StrictMode>
);