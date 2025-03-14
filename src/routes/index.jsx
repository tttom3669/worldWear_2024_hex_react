import { createHashRouter } from 'react-router-dom';
import App from '../App.jsx';
import AdminLayout from '../Layout/admin/AdminLayout.jsx';
import AdminHome from '../views/admin/AdminHome.jsx';
import Home from '../views/front/Home.jsx';
import Login from '../views/Login.jsx';
import Signup from '../views/Signup.jsx';
import NotFound from '../views/NotFound.jsx';
import Cart from '../views/front/Cart.jsx';
import Checkout from '../views/front/Checkout.jsx';
import CheckoutSuccess from '../views/front/CheckoutSuccess.jsx';
import ProductsList from '../views/front/ProductsList.jsx';
import FrontUserLayout from '../Layout/front/FrontUserLayout.jsx';
import { element } from 'prop-types';
import UserOrder from '../views/front/user/UserOrder.jsx';
import Product from '../views/front/Product.jsx';

const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <ProductsList />,
          },
          {
            path: ':gender',
            children: [
              {
                index: true,
                element: <ProductsList />,
              },
              {
                path: ':category',
                element: <ProductsList />,
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
        ],
      },
	  {
        path: 'product/:id',
        element: <Product />,
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
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

const router = createHashRouter(routes);

export default router;
