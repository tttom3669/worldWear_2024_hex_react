import { createHashRouter } from 'react-router-dom';
import App from '../App.jsx';
import AdminLayout from '../Layout/AdminLayout.jsx';
import AdminHome from '../views/admin/AdminHome.jsx';
import Home from '../views/front/Home.jsx';
// import Login from '../views/Login.jsx';
import Login from '../views/account/Login.jsx';
import Signup from '../views/account/Signup.jsx';
import AccountLayout from '../Layout/AccountLayout.jsx';
import AccountIndex from '../views/account/index.jsx';
import NotFound from '../views/NotFound.jsx';

const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
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
    path: '/account',
    element: <AccountLayout />,
    children: [
      {
        index: true,
        element: <AccountIndex />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup ',
        element: <Signup />,
      },
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
