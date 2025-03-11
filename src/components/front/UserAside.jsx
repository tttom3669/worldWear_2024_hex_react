import { Link, NavLink, useLocation } from "react-router-dom";
// import useSwal from "../../../hooks/useSwal";
import useSwal from "../../hooks/useSwal";

export default function UserAside() {
  const location = useLocation();

  // 定義側邊欄選單項目
  const menuItems = [
    { path: "/user/userInfo", name: "會員資料維護" },
    { path: "/user/favorites", name: "收藏列表" },
    { path: "/user/order", name: "查詢訂單" },
  ];

  // 檢查是否為當前路徑的函數
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // 清除所有相關的 cookie 函數
  const clearAllCookies = () => {
    // 清除可能存在的所有相關 cookie
    document.cookie =
      "worldWearToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "worldWearUserId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    document.cookie =
      "myToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 清除 localStorage 中可能存儲的用戶信息
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    // 清除 sessionStorage 中可能存儲的用戶信息
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("user");
  };

  // 登出處理函數
  const handleLogout = () => {
    // 確認用戶是否真的要登出
    if (window.confirm("確定要登出嗎？")) {
      try {
        // 清除所有 cookie 和存儲
        clearAllCookies();

        // 清除 axios 默認標頭中的授權信息
        if (window.axios && window.axios.defaults) {
          delete window.axios.defaults.headers.common["Authorization"];
        }

        // 顯示成功消息
        toastAlert({ icon: "success", title: "已成功登出" });

        // 導航到登入頁面
        navigate("/login");
      } catch (error) {
        console.error("登出時發生錯誤:", error);
        toastAlert({ icon: "error", title: "登出失敗", text: "請稍後再試" });
      }
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
                    isActive(item.path) || navActive ? "active" : ""
                  }`
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
          <li className="list-group-item">
            <button
              className="c-user-aside__link border-0 bg-transparent w-100 text-start"
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
            >
              登出
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
