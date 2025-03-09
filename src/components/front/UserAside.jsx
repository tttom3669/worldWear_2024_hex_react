import { Link, NavLink, useLocation } from 'react-router-dom';

export default function UserAside() {
  const location = useLocation();
  console.log(location);
  return (
    <>
      <aside>
        <nav>
          <ul className="list-group c-user-aside">
            <li className="list-group-item pt-3" aria-current="true">
              <h2 className="fw-bold fs-base px-4 py-3">會員中心</h2>
            </li>
            <li className="list-group-item">
              <Link className="c-user-aside__link">會員資料維護</Link>
            </li>
            <li className="list-group-item">
              <Link className="c-user-aside__link">收藏列表</Link>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/user/order"
                className={({ isActive }) =>
                  'c-user-aside__link ' +
                  (location.pathname.startsWith('/user') || isActive
                    ? 'active'
                    : '')
                }
              >
                查詢訂單
              </NavLink>
            </li>
            <li className="list-group-item">
              <Link className="c-user-aside__link">登出</Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
