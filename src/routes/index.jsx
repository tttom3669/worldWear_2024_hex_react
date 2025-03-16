import { createHashRouter } from 'react-router-dom';
import App from '../App.jsx';
import AdminLayout from '../Layout/admin/AdminLayout.jsx';
import AdminHome from '../views/admin/AdminHome.jsx';
import Home from '../views/front/Home.jsx';
import Login from '../views/Login.jsx';
import NotFound from '../views/NotFound.jsx';
import Cart from '../views/front/Cart.jsx';
import Checkout from '../views/front/Checkout.jsx';
import CheckoutSuccess from '../views/front/CheckoutSuccess.jsx';
import ProductsList from '../views/front/ProductsList.jsx';
import FrontUserLayout from '../Layout/front/FrontUserLayout.jsx';
import UserOrder from '../views/front/user/UserOrder.jsx';
import Product from '../views/front/Product.jsx';
import UserFavorites from '../views/front/user/UserFavorites.jsx';
import UserInfo from '../views/front/user/UserInfo.jsx';
import Search from '../views/front/Search.jsx';

const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
        title: '首頁 | 我的網站',
      },
      {
        path: 'products', //顯示所有產品
        children: [
          {
            index: true,
            element: <ProductsList />,
          },
          {
            path: ':gender', //顯示特定性別的產品（如女裝或男裝）
            children: [
              {
                index: true,
                element: <ProductsList />,
              },
              {
                path: ':category', //顯示特定性別下的特定類別（如女裝/上衣）
                children: [
                  {
                    index: true,
                    element: <ProductsList />,
                  },
                  {
                    // 新增子類別層級
                    path: ':subcategory', //顯示特定性別、類別下的子類別（如女裝/上衣/襯衫）
                    element: <ProductsList />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
      {
        path: 'checkout-success',
        element: <CheckoutSuccess />,
      },
      {
        path: 'user',
        element: <FrontUserLayout />,
        children: [
          {
            index: true,
            element: <UserOrder />,
          },
          {
            path: 'order',
            element: <UserOrder />,
          },
          {
            path: 'favorites',
            element: <UserFavorites />,
          },
          {
            path: 'userInfo',
            element: <UserInfo />,
          },
        ],
      },
      {
        path: 'product/:id',
        element: <Product />,
      },
      {
        path: 'search',
        element: <Search />,
      },
    ],
  },
  {
    path: '/admin',
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
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

const router = createHashRouter(routes);

export default router;
