import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../slice/authSlice';

export default function UserAside() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userData = useSelector((state) => state.authSlice.user);

  // 定義側邊欄選單項目
  const menuItems = [
    { path: '/user/userInfo', name: '會員資料維護' },
    { path: '/user/favorites', name: '收藏列表' },
    { path: '/user/order', name: '查詢訂單' },
  ];

  // 檢查是否為當前路徑的函數
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // 處理登出功能 - 使用 logoutUser action
  const handleLogout = async () => {
    try {
      console.log('登出按鈕被點擊'); // 添加除錯訊息

      // 執行登出 action 並等待完成
      await dispatch(logoutUser()).unwrap();

      console.log('登出成功，準備導航回首頁');

      // 登出成功後導航回首頁
      navigate('/');
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使登出失敗，也嘗試導航回首頁
      navigate('/');
    }
  };

  return (
    <aside>
      <nav>
        <ul className="list-group c-user-aside">
          <li className="list-group-item pt-3" aria-current="true">
            <h2 className="fw-bold fs-base px-4 py-3">會員中心</h2>
          </li>
          {menuItems.map((item) => (
            <li key={item.path} className="list-group-item">
              <NavLink
                to={item.path}
                className={({ isActive: navActive }) =>
                  `c-user-aside__link ${
                    isActive(item.path) || navActive ? 'active' : ''
                  }`
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
          {userData?.role === 'admin' && (
            <li className="list-group-item">
              <NavLink to="/admin" className="c-user-aside__link">
                進入後台
              </NavLink>
            </li>
          )}
          <li className="list-group-item">
            <button
              className="c-user-aside__link border-0 bg-transparent w-100 text-start"
              onClick={handleLogout}
              style={{ cursor: 'pointer' }}
            >
              登出
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
