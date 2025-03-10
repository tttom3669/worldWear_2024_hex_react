import { Link, NavLink, useLocation } from "react-router-dom";

export default function UserAside() {
  const location = useLocation();

  // 定義側邊欄選單項目
  const menuItems = [
    { path: "/user/userInfo", name: "會員資料維護"},
    { path: "/user/favorites", name: "收藏列表" },
    { path: "/user/order", name: "查詢訂單" },
    { path: "/logout", name: "登出" },
  ];

  // 檢查是否為當前路徑的函數
  const isActive = (path) => {
    return location.pathname.startsWith(path);
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
                    isActive(item.path) || navActive ? "active" : ""
                  }`
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
