import { createHashRouter } from "react-router-dom";
import App from "../App.jsx";
import AdminLayout from "../Layout/admin/AdminLayout.jsx";
import AdminHome from "../views/admin/AdminHome.jsx";
import Home from "../views/front/Home.jsx";
import Login from "../views/Login.jsx";
import Signup from "../views/Signup.jsx";
import NotFound from "../views/NotFound.jsx";
import Cart from "../views/front/Cart.jsx";
import ProductsList from "../views/front/ProductsList.jsx";
import FrontUserLayout from "../Layout/front/FrontUserLayout.jsx";
import { element } from "prop-types";
import UserOrder from "../views/front/user/UserOrder.jsx";
import Product from "../views/front/Product.jsx";
import UserFavorites from "../views/front/user/UserFavorites.jsx";
import UserInfo from "../views/front/user/UserInfo.jsx";

const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "products",  //顯示所有產品
        children: [
          {
            index: true,
            element: <ProductsList />,
          },
          {
            path: ":gender",  //顯示特定性別的產品（如女裝或男裝）
            children: [
              {
                index: true,
                element: <ProductsList />,
              },
              {
                path: ":category",  //顯示特定性別下的特定類別（如女裝/上衣）
                children: [
                  {
                    index: true,
                    element: <ProductsList />,
                  },
                  {
                    // 新增子類別層級
                    path: ":subcategory",  //顯示特定性別、類別下的子類別（如女裝/上衣/襯衫）
                    element: <ProductsList />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "user",
        element: <FrontUserLayout />,
        children: [
          {
            index: true,
            element: <UserOrder />,
          },
          {
            path: "order",
            element: <UserOrder />,
          },
          {
            path: "favorites",
            element: <UserFavorites />,
          },
          {
            path: "userInfo",
            element: <UserInfo />,
          },
        ],
      },
      {
        path: "product/:id",
        element: <Product />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      //   path: '"users',
      //   path: 'products',
      //   path: 'orders',
      //   path: 'coupons',
      //   path: 'products',
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

const router = createHashRouter(routes);

export default router;
