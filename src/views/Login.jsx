import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios"; // 確保導入 axios
import { loginUser, signupUser, clearError, requestPasswordReset } from "../slice/authSlice";
import { isUserLoggedIn, setCookie, COOKIE_NAMES } from "../components/tools/cookieUtils";
import FrontFooter from "../components/front/FrontFooter";
import useSwal from '../hooks/useSwal';

// API 路徑常量
const { VITE_API_PATH: API_PATH } = import.meta.env;
const BASE_URL = API_PATH || "http://localhost:3000";

// 常量定義
const TABS = {
  LOGIN: 'login',
  REGISTER: 'register'
};

const initialLoginData = {
  email: "",
  password: "",
  rememberMe: false // 記住我選項
};

const initialRegisterData = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialForgotPasswordData = {
  email: "",
};

// 表單驗證工具函數
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export default function Login() {
  // 完整版本，添加了對 cookie 和記住我功能的正確處理
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toastAlert } = useSwal();

  // Redux 狀態
  const authStatus = useSelector((state) => state.authSlice.status);
  const authError = useSelector((state) => state.authSlice.error);

  // 狀態管理
  const [activeTab, setActiveTab] = useState(TABS.LOGIN);
  const [loginData, setLoginData] = useState(initialLoginData);
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [forgotPasswordData, setForgotPasswordData] = useState(initialForgotPasswordData);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 新增載入狀態

  // Refs 用於追踪用戶操作狀態
  const isLoginAttemptRef = useRef(false);
  const isRegisterAttemptRef = useRef(false);
  const isResetPasswordAttemptRef = useRef(false);

  // 檢查用戶是否已登入，若已登入則導向首頁
  useEffect(() => {
    if (isUserLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  // 表單驗證函數
  const validateLoginForm = useCallback(() => {
    const errors = {};
    
    if (!loginData.email) {
      errors.email = "請輸入電子郵件";
    } else if (!validateEmail(loginData.email)) {
      errors.email = "請輸入有效的電子郵件格式";
    }
    
    if (!loginData.password) {
      errors.password = "請輸入密碼";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [loginData]);

  // 直接使用 axios 進行登入 (新增)
  const directLogin = useCallback(async () => {
    if (validateLoginForm()) {
      setIsLoading(true);
      setSubmitError(null);
      
      try {
        const res = await axios.post(`${API_PATH}/login`, {
          email: loginData.email,
          password: loginData.password,
        });
        
        const { accessToken, user } = res.data;
        
        // 設定 cookie
        document.cookie = `worldWearToken=${accessToken};${loginData.rememberMe ? ' max-age=2592000;' : ''}`;
        document.cookie = `worldWearUserId=${user.id};${loginData.rememberMe ? ' max-age=2592000;' : ''}`;
        
        // 設定 localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // 設定 axios 的預設 headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        console.log("登入成功:", accessToken, user.id);
        
        // 登入成功提示
        toastAlert({ icon: 'success', title: '登入成功' });
        
        // 導航到首頁
        navigate('/');
      } catch (error) {
        console.error("登入失敗:", error);
        const errorMsg = error.response?.data?.message || '登入失敗，請檢查您的憑據';
        
        setSubmitError(errorMsg);
        toastAlert({ 
          icon: 'error', 
          title: '登入失敗', 
          text: errorMsg 
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [loginData, navigate, toastAlert, validateLoginForm]);

  // 使用 Redux 方式進行登入 (原有流程)
  const handleReduxLogin = useCallback(async (e) => {
    e.preventDefault();
    if (validateLoginForm()) {
      setSubmitError(null);
      isLoginAttemptRef.current = true;
      
      try {
        // 設定 cookie 過期時間（天數）- 根據"記住我"選項
        const cookieExpireDays = loginData.rememberMe ? 30 : 1;
        
        // 將過期天數信息傳遞給 loginUser
        const loginResult = await dispatch(loginUser({
          ...loginData,
          cookieExpireDays
        })).unwrap();
        
        // 處理一般登入成功邏輯，loginUser 本身會負責設置 cookie
      } catch (error) {
        const errorMsg = typeof error === 'string' 
          ? error 
          : '登入失敗，請檢查您的憑據';
        
        setSubmitError(errorMsg);
        toastAlert({ 
          icon: 'error', 
          title: '登入失敗', 
          text: errorMsg 
        });
        
        isLoginAttemptRef.current = false;
      }
    }
  }, [loginData, dispatch, toastAlert, validateLoginForm]);

  // 替換為直接使用 axios 登入的方法
  const handleLogin = useCallback((e) => {
    e.preventDefault();
    directLogin();
  }, [directLogin]);

  const validateRegisterForm = useCallback(() => {
    const errors = {};
    
    if (!registerData.username) {
      errors.username = "請輸入姓名";
    }
    
    if (!registerData.email) {
      errors.email = "請輸入電子郵件";
    } else if (!validateEmail(registerData.email)) {
      errors.email = "請輸入有效的電子郵件格式";
    }
    
    if (!registerData.password) {
      errors.password = "請輸入密碼";
    } else if (registerData.password.length < 8) {
      errors.password = "密碼長度至少需要8個字元";
    }
    
    if (!registerData.confirmPassword) {
      errors.confirmPassword = "請確認密碼";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "密碼不一致";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [registerData]);

  const validateForgotPasswordForm = useCallback(() => {
    const errors = {};
    
    if (!forgotPasswordData.email) {
      errors.forgotEmail = "請輸入電子郵件";
    } else if (!validateEmail(forgotPasswordData.email)) {
      errors.forgotEmail = "請輸入有效的電子郵件格式";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [forgotPasswordData]);

  // 輸入變化處理函數
  const handleInputChange = useCallback((setter) => (e) => {
    const { name, value, type, checked } = e.target;
    
    setter(prev => ({
      ...prev,
      // 針對 checkbox 使用 checked 值，其他使用 value
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除對應欄位的錯誤訊息
    setFormErrors(prev => ({
      ...prev,
      [name]: null
    }));
    
    // 清除提交錯誤
    setSubmitError(null);
  }, []);

  // 註冊處理
  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    
    if (validateRegisterForm()) {
      try {
        setSubmitError(null);
        setIsLoading(true);
        isRegisterAttemptRef.current = true;
        
        await dispatch(signupUser({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        })).unwrap();
      } catch (error) {
        const errorMsg = typeof error === 'string' 
          ? error 
          : error?.message || '註冊失敗，請檢查您的資料或稍後再試';
        
        setSubmitError(errorMsg);
        toastAlert({ 
          icon: 'error', 
          title: '註冊失敗', 
          text: errorMsg 
        });
        
        isRegisterAttemptRef.current = false;
      } finally {
        setIsLoading(false);
      }
    }
  }, [registerData, dispatch, toastAlert, validateRegisterForm]);
  
  // 忘記密碼處理
  const handleForgotPassword = useCallback(async (e) => {
    e.preventDefault();
    
    if (validateForgotPasswordForm()) {
      try {
        setSubmitError(null);
        setIsLoading(true);
        isResetPasswordAttemptRef.current = true;
        
        await dispatch(requestPasswordReset(forgotPasswordData.email)).unwrap();
        
        toastAlert({ 
          icon: 'success', 
          title: '重設密碼郵件已發送', 
          text: '請檢查您的電子郵件信箱，並按照指示重設密碼' 
        });
        
        // 重置表單並返回登入視圖
        setForgotPasswordData(initialForgotPasswordData);
        setShowForgotPassword(false);
      } catch (error) {
        const errorMsg = typeof error === 'string' 
          ? error 
          : '重設密碼請求失敗，請稍後再試';
        
        setSubmitError(errorMsg);
        toastAlert({ 
          icon: 'error', 
          title: '重設密碼請求失敗', 
          text: errorMsg 
        });
      } finally {
        setIsLoading(false);
        isResetPasswordAttemptRef.current = false;
      }
    }
  }, [forgotPasswordData, dispatch, toastAlert, validateForgotPasswordForm, initialForgotPasswordData]);

  // 頁籤切換處理
  const handleTabChange = useCallback((tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setFormErrors({});
      setSubmitError(null);
      
      // 重置各種嘗試標記
      isLoginAttemptRef.current = false;
      isRegisterAttemptRef.current = false;
      isResetPasswordAttemptRef.current = false;
      
      // 關閉忘記密碼視圖
      setShowForgotPassword(false);
      
      // 清除全局錯誤
      dispatch(clearError());
    }
  }, [activeTab, dispatch]);

  // 切換忘記密碼視圖
  const toggleForgotPassword = useCallback(() => {
    setShowForgotPassword(prev => !prev);
    setFormErrors({});
    setSubmitError(null);
  }, []);

  // 處理註冊成功後的副作用
  useEffect(() => {
    if (authStatus === "signup-success" && isRegisterAttemptRef.current) {
      toastAlert({ 
        icon: 'success', 
        title: '註冊成功', 
        text: '請用您的帳號密碼登入' 
      });
      
      // 自動填入登入表單的電子郵件
      setLoginData(prev => ({
        ...prev,
        email: registerData.email,
        password: ""
      }));
      
      // 清空註冊表單
      setRegisterData(initialRegisterData);
      
      isRegisterAttemptRef.current = false;
      setActiveTab(TABS.LOGIN);
    }
  }, [
    authStatus,
    toastAlert,
    registerData.email,
    initialRegisterData
  ]);

  // 清除錯誤的副作用
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, activeTab]);

  // 測試用
  // const login = async () => {
  //   const res = await axios.post(`${API_PATH}/login`, {
  //     email: "worldwear@gmail.com",
  //     password: "worldwear",
  //   });
  //   console.log(res);
  //   const { accessToken, user } = res.data;
  //   document.cookie = `worldWearToken=${accessToken};`;
  //   document.cookie = `worldWearUserId=${user.id}`;
  //   console.log(accessToken, user.id);
  // };

  // 渲染
  return (
    <>
      <aside className="bg-primary-80 py-1 py-lg-3 text-center fs-sm fw-bold">
        與世界共舞，與時尚同步 - WorldWear
      </aside>
      {/* <button type="button" onClick={login} className="btn btn-outline-primary">
          登入
        </button> */}
      <div className="bg-nature-99 d-flex flex-column min-vh-100">
        <main className="flex-grow-1 overflow-auto-md">
          <div className="container py-5 mt-10 mb-10">
            <div className="row justify-content-center">
              <div className="col-md-6" style={{ width: "100%", maxWidth: "470px" }}>
                <div className="card bg-white">
                  {/* 頁籤導航 */}
                  <div className="card-header p-0">
                    <ul className="nav nav-tabs w-100">
                      {Object.entries(TABS).map(([key, tab]) => (
                        <li key={tab} className="nav-item w-50">
                          <button
                            className={`nav-link w-100 ${activeTab === tab ? "active" : "inactive"}`}
                            onClick={() => handleTabChange(tab)}
                          >
                            {tab === TABS.LOGIN ? "會員登入" : "加入會員"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 表單內容 */}
                  <div className="card-body">
                    <div className="tab-content bg-white">
                      {/* 登入表單 */}
                      {activeTab === TABS.LOGIN && !showForgotPassword && (
                        <LoginForm 
                          loginData={loginData}
                          formErrors={formErrors}
                          submitError={submitError}
                          isLoading={isLoading}
                          onInputChange={handleInputChange(setLoginData)}
                          onSubmit={handleLogin}
                          onForgotPassword={toggleForgotPassword}
                        />
                      )}

                      {/* 忘記密碼表單 */}
                      {activeTab === TABS.LOGIN && showForgotPassword && (
                        <ForgotPasswordForm 
                          forgotPasswordData={forgotPasswordData}
                          formErrors={formErrors}
                          submitError={submitError}
                          isLoading={isLoading}
                          onInputChange={handleInputChange(setForgotPasswordData)}
                          onSubmit={handleForgotPassword}
                          onBack={toggleForgotPassword}
                        />
                      )}

                      {/* 註冊表單 */}
                      {activeTab === TABS.REGISTER && (
                        <RegisterForm 
                          registerData={registerData}
                          formErrors={formErrors}
                          submitError={submitError}
                          isLoading={isLoading}
                          onInputChange={handleInputChange(setRegisterData)}
                          onSubmit={handleRegister}
                        />
                      )}
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

// 登入表單子組件
const LoginForm = React.memo(({
  loginData, 
  formErrors, 
  submitError,
  isLoading,
  onInputChange, 
  onSubmit,
  onForgotPassword
}) => (
  <div className="tab-pane fade show active">
    <form onSubmit={onSubmit}>
      {submitError && (
        <div className="alert alert-danger">{submitError}</div>
      )}
      <div className="mb-3">
        <label htmlFor="email" className="form-label mt-4">電子郵件</label>
        <input
          id="email"
          name="email"
          type="email"
          className={`form-control bg-white ${formErrors.email ? "is-invalid" : ""}`}
          placeholder="請輸入您的電子郵件"
          value={loginData.email}
          onChange={onInputChange}
        />
        {formErrors.email&& (
          <div className="invalid-feedback">
            {formErrors.email}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="password" className="form-label mt-4">密碼</label>
        <input
          id="password"
          name="password"
          type="password"
          className={`form-control bg-white ${formErrors.password ? "is-invalid" : ""}`}
          placeholder="請輸入您的密碼"
          value={loginData.password}
          onChange={onInputChange}
        />
        {formErrors.password && (
          <div className="invalid-feedback">
            {formErrors.password}
          </div>
        )}
      </div>
      <div className="mb-3 d-flex justify-content-between mt-8">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={loginData.rememberMe}
            onChange={onInputChange}
          />
          <label
            className="form-check-label"
            htmlFor="rememberMe"
          >
            記住我
          </label>
        </div>
        <div className="forgot-password">
          <button
            type="button"
            className="btn btn-sm text-muted border border-muted rounded btn-forgot-password"
            onClick={onForgotPassword}
          >
            忘記密碼
          </button>
        </div>
      </div>
      <div className="d-grid mt-2">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "登入中..." : "登入"}
        </button>
      </div>
    </form>
  </div>
));

// 忘記密碼表單子組件
const ForgotPasswordForm = React.memo(({
  forgotPasswordData, 
  formErrors, 
  submitError,
  isLoading,
  onInputChange, 
  onSubmit,
  onBack
}) => (
  <div className="tab-pane fade show active">
    <div className="d-flex align-items-center mb-4">
      <button 
        type="button" 
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={onBack}
      >
        <i className="bi bi-arrow-left"></i> 返回
      </button>
      <h5 className="mb-0">忘記密碼</h5>
    </div>
    <form onSubmit={onSubmit}>
      {submitError && (
        <div className="alert alert-danger">{submitError}</div>
      )}
      <div className="mb-4">
        <p className="text-muted">請輸入您的電子郵件，我們將發送密碼重設連結給您。</p>
      </div>
      <div className="mb-3">
        <label htmlFor="forgotEmail" className="form-label">電子郵件</label>
        <input
          id="forgotEmail"
          name="email"
          type="email"
          className={`form-control bg-white ${formErrors.forgotEmail ? "is-invalid" : ""}`}
          placeholder="請輸入您註冊時使用的電子郵件"
          value={forgotPasswordData.email}
          onChange={onInputChange}
        />
        {formErrors.forgotEmail && (
          <div className="invalid-feedback">
            {formErrors.forgotEmail}
          </div>
        )}
      </div>
      <div className="d-grid mt-4">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "發送中..." : "發送重設密碼連結"}
        </button>
      </div>
    </form>
  </div>
));

// 註冊表單子組件
const RegisterForm = React.memo(({
  registerData, 
  formErrors, 
  submitError,
  isLoading,
  onInputChange, 
  onSubmit
}) => (
  <div className="tab-pane fade show active">
    <form onSubmit={onSubmit}>
      {submitError && (
        <div className="alert alert-danger">{submitError}</div>
      )}
      <div className="mb-3">
        <label htmlFor="username" className="form-label">姓名</label>
        <input
          type="text"
          className={`form-control bg-white ${formErrors.username ? "is-invalid" : ""}`}
          id="username"
          name="username"
          placeholder="請輸入您的姓名"
          value={registerData.username}
          onChange={onInputChange}
        />
        {formErrors.username && (
          <div className="invalid-feedback">
            {formErrors.username}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="registerEmail" className="form-label">電子郵件</label>
        <input
          type="email"
          className={`form-control bg-white ${formErrors.email ? "is-invalid" : ""}`}
          id="registerEmail"
          name="email"
          placeholder="請輸入您的電子郵件"
          value={registerData.email}
          onChange={onInputChange}
        />
        {formErrors.email && (
          <div className="invalid-feedback">
            {formErrors.email}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="registerPassword" className="form-label">密碼</label>
        <input
          type="password"
          className={`form-control bg-white ${formErrors.password ? "is-invalid" : ""}`}
          id="registerPassword"
          name="password"
          placeholder="請設定您的密碼"
          value={registerData.password}
          onChange={onInputChange}
        />
        {formErrors.password && (
          <div className="invalid-feedback">
            {formErrors.password}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">確認密碼</label>
        <input
          type="password"
          className={`form-control bg-white ${formErrors.confirmPassword ? "is-invalid" : ""}`}
          id="confirmPassword"
          name="confirmPassword"
          placeholder="請再次輸入密碼"
          value={registerData.confirmPassword}
          onChange={onInputChange}
        />
        {formErrors.confirmPassword && (
          <div className="invalid-feedback">
            {formErrors.confirmPassword}
          </div>
        )}
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
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "註冊中..." : "註冊"}
        </button>
      </div>
    </form>
  </div>
));