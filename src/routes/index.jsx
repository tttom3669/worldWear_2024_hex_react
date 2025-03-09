import { createHashRouter } from 'react-router-dom';
import App from '../App.jsx';
import AdminLayout from '../Layout/AdminLayout.jsx';
import AdminHome from '../views/admin/AdminHome.jsx';
import Home from '../views/front/Home.jsx';
import Login from '../views/Login.jsx';
import Signup from '../views/Signup.jsx';
import NotFound from '../views/NotFound.jsx';
import Cart from '../views/front/Cart.jsx';
import ProductsList from '../views/front/ProductsList.jsx'
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
        path: "products",
        children: [
          {
            index: true,
            element: <ProductsList />,
          },
          {
            path: ":gender",
            children: [
              {
                index: true,
                element: <ProductsList />,
              },
              {
                path: ":category",
                element: <ProductsList />,
              }
            ]
          }
        ]
      },
      {
        path: 'cart',
        element: <Cart />,
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
