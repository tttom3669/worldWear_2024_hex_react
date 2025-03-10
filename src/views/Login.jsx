import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FrontFooter from "../components/front/FrontFooter";
import useSwal from '../hooks/useSwal';

const { VITE_API_PATH: API_PATH } = import.meta.env;

export default function Login() {
  const navigate = useNavigate();
  const { toastAlert } = useSwal();
  const [activeTab, setActiveTab] = useState("login");

  const [account, setAccount] = useState({
    email: "",  //test@gmail.com
    password: "",  //AAbbcc12345678
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 記錄發送的數據以便除錯
      console.log("發送登入資料:", account);
      console.log("登入請求:", {
        email: account.email,
        password: account.password
      });

      // const res = await axios.post(`${API_PATH}/login`, account);
      //測試用
      const res = await axios.post('http://localhost:3000/login', account);
      console.log("登入響應:", res.data);

      // const { accessToken, expired } = res.data;
      const { accessToken, expired } = res.data;
      document.cookie = `myToken=${accessToken}; expires=${new Date(expired)}`;
      // 設定 Authorization header
      axios.defaults.headers.common["Authorization"] = accessToken;
      setAccount(true);
      // checkUserLogin(); // 登入成功後立即檢查
      navigate("/");
      console.log("登入成功");
    } catch (error) {
      console.error("登入錯誤詳情:", error);
      toastAlert({ icon: 'error', title: '登入失敗' });
    }
  };

  const handleInputChange = (e) => {
    const { value, name } = e.target;
    setAccount({
      ...account,
      [name]: value,
    });
  };

  const login = async () => {
    const res = await axios.post(`${API_PATH}/login`, {
      email: "worldwear@gmail.com",
      password: "worldwear",
    });
    console.log(res);
    const { accessToken, user } = res.data;
    document.cookie = `worldWearToken=${accessToken};`;
    document.cookie = `worldWearUserId=${user.id}`;
    console.log(accessToken, user.id);
    navigate("/");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };

  return (
    <>
      <aside className="bg-primary-80 py-1 py-lg-3 text-center fs-sm fw-bold">
        與世界共舞，與時尚同步 - WorldWear
      </aside>
      <div className="bg-nature-99 d-flex flex-column min-vh-100">
        <main className="flex-grow-1 overflow-auto-md">
          <button type="button" onClick={login}>
            測試登入
          </button>
          <div className="container py-5 mt-10 mb-10">
            <div className="row justify-content-center">
              <div
                className="col-md-6"
                style={{ width: "100%", maxWidth: "470px" }}
              >
                <div className="card bg-white">
                  <div className="card-header p-0">
                    <ul className="nav nav-tabs w-100">
                      <li className="nav-item w-50">
                        <button
                          className={`nav-link w-100 ${
                            activeTab === "login" ? "active" : "inactive"
                          }`}
                          onClick={() => handleTabChange("login")}
                        >
                          會員登入
                        </button>
                      </li>
                      <li className="nav-item w-50">
                        <button
                          className={`nav-link w-100 ${
                            activeTab === "register" ? "active" : "inactive"
                          }`}
                          onClick={() => handleTabChange("register")}
                        >
                          加入會員
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div className="card-body">
                    <div className="tab-content bg-white">
                      {/* 會員登入頁籤 */}
                      <div
                        className={`tab-pane fade ${
                          activeTab === "login" ? "show active" : ""
                        }`}
                      >
                        <form onSubmit={handleLogin}>
                          <div className="mb-3">
                            <label
                              htmlFor="email"
                              className="form-label mt-4"
                            >
                              電子郵件
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              className="form-control bg-white"
                              placeholder="請輸入您的電子郵件"
                              value={account.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="mb-3">
                            <label
                              htmlFor="password"
                              className="form-label mt-4"
                            >
                              密碼
                            </label>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              className="form-control bg-white"
                              placeholder="請輸入您的密碼"
                              value={account.password}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="mb-3 d-flex justify-content-between mt-8">
                            {/* <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="rememberMe"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="rememberMe"
                        >
                          記住我
                        </label>
                      </div>
                      <div className="forgot-password">
                        <a
                          href="#"
                          className="btn btn-sm text-muted border border-muted rounded btn-forgot-password"
                        >
                          忘記密碼
                        </a>
                      </div> */}
                          </div>
                          <div className="d-grid mt-2">
                            <button type="submit" className="btn btn-primary">
                              登入
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* 加入會員頁籤 */}
                      <div
                        className={`tab-pane fade ${
                          activeTab === "register" ? "show active" : ""
                        }`}
                      >
                        <form>
                          <div className="mb-3">
                            <label
                              htmlFor="registerName"
                              className="form-label"
                            >
                              姓名
                            </label>
                            <input
                              type="text"
                              className="form-control bg-white"
                              id="registerName"
                              placeholder="請輸入您的姓名"
                            />
                          </div>
                          <div className="mb-3">
                            <label
                              htmlFor="registerEmail"
                              className="form-label"
                            >
                              電子郵件
                            </label>
                            <input
                              type="email"
                              className="form-control bg-white"
                              id="registerEmail"
                              placeholder="請輸入您的電子郵件"
                            />
                          </div>
                          <div className="mb-3">
                            <label
                              htmlFor="registerPassword"
                              className="form-label"
                            >
                              密碼
                            </label>
                            <input
                              type="password"
                              className="form-control bg-white"
                              id="registerPassword"
                              placeholder="請設定您的密碼"
                            />
                          </div>
                          <div className="mb-3">
                            <label
                              htmlFor="registerConfirmPassword"
                              className="form-label"
                            >
                              確認密碼
                            </label>
                            <input
                              type="password"
                              className="form-control bg-white"
                              id="registerConfirmPassword"
                              placeholder="請再次輸入密碼"
                            />
                          </div>
                          <div className="mb-3 text-center">
                            <small>
                              當您使用 WorldWear 購物，代表您同意
                              <a
                                href="#"
                                className="text-decoration-none text-secondary"
                              >
                                &nbsp;服務條款&nbsp;
                              </a>
                              與
                              <a
                                href="#"
                                className="text-decoration-none text-secondary"
                              >
                                &nbsp;隱私政策&nbsp;
                              </a>
                            </small>
                          </div>
                          <div className="d-grid">
                            <button type="submit" className="btn btn-primary">
                              註冊
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <FrontFooter />
      </div>
    </>
  );
}
