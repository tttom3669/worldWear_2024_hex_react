// cookieUtils.js
import axios from "axios";

// 獲取環境變數的 API 路徑
const { VITE_API_PATH: API_PATH } = import.meta.env;

// Cookie 名稱常量
export const COOKIE_NAMES = {
  TOKEN: "worldWearToken",
  USER_ID: "worldWearUserId",
};

// 安全地獲取 Cookie
export const getCookie = (name) => {
  try {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : "";
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return "";
  }
};

// 獲取用戶 ID
export const getUserIdFromCookie = () => {
  return getCookie(COOKIE_NAMES.USER_ID);
};

// 設置 Cookie，增加安全性和靈活性
export const setCookie = (name, value, days = 7, options = {}) => {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

    const cookieOptions = {
      expires: date.toUTCString(),
      path: "/",
      secure: window.location.protocol === "https:", // 只在HTTPS下設置secure
      sameSite: "Strict", // 防止 CSRF 攻擊
      ...options,
    };

    const cookieString = Object.entries(cookieOptions)
      .filter(([, value]) => value !== false)
      .map(([key, value]) =>
        key === "expires"
          ? `Expires=${value}`
          : key === "path"
          ? `Path=${value}`
          : `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
      )
      .join("; ");

    document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// 設置用戶 ID Cookie
export const setUserIdCookie = (userId, days = 7) => {
  return setCookie(COOKIE_NAMES.USER_ID, userId, days);
};

// 設置 Token Cookie
export const setTokenCookie = (token, days = 7) => {
  // 確保移除可能存在的 Bearer 前綴
  const rawToken = token.startsWith("Bearer ")
    ? token.substring(7).trim()
    : token.trim();

  // 直接存儲純 token，不添加 Bearer 前綴
  return setCookie(COOKIE_NAMES.TOKEN, rawToken, days);
};

// 刪除特定 Cookie
export const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; SameSite=Strict`;
    if (window.location.protocol === "https:") {
      document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
    }
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// 清除所有用戶相關的 Cookies
export const clearAllUserCookies = () => {
  deleteCookie(COOKIE_NAMES.TOKEN);
  deleteCookie(COOKIE_NAMES.USER_ID);
};

// 獲取 JWT Token，確保返回正確格式的帶有 Bearer 前綴的 token
export const getJWTToken = () => {
  try {
    // 依次嘗試從不同來源獲取 token
    const tokenFromLocalStorage = localStorage.getItem("token");
    const tokenFromCookie = getCookie(COOKIE_NAMES.TOKEN);
    const directTokenFromCookie = getCookie("worldWearToken");

    let rawToken = null;

    if (tokenFromLocalStorage) {
      rawToken = tokenFromLocalStorage.startsWith("Bearer ")
        ? tokenFromLocalStorage.substring(7).trim()
        : tokenFromLocalStorage.trim();
    } else if (tokenFromCookie) {
      rawToken = tokenFromCookie.startsWith("Bearer ")
        ? tokenFromCookie.substring(7).trim()
        : tokenFromCookie.trim();
    } else if (directTokenFromCookie) {
      rawToken = directTokenFromCookie.startsWith("Bearer ")
        ? directTokenFromCookie.substring(7).trim()
        : directTokenFromCookie.trim();
    }

    // 如果找不到 token，返回 null
    if (!rawToken) {
      return null;
    }

    // 返回 Bearer + token 格式
    return `Bearer ${rawToken}`;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return null;
  }
};

// 判斷用戶是否已登入
export const isUserLoggedIn = () => {
  const token = getJWTToken();
  const userId = getUserIdFromCookie();
  return !!(token && userId);
};

// 設置 axios 預設 Authorization header
export const setAuthorizationHeader = (axiosInstance = axios) => {
  const token = getJWTToken();
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = token;
    return true;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
    return false;
  }
};

// 創建一個帶有授權的 axios 實例
export const createAuthAxios = () => {
  const token = getJWTToken();
  return axios.create({
    baseURL: API_PATH,
    headers: {
      "Content-Type": "application/json",
      Authorization: token || "",
    },
  });
};

// 儲存登入資訊，一次性設置所有相關的 Cookie 和 localStorage
export const saveLoginInfo = (
  userData,
  token,
  rememberDays = 7,
  refreshToken = null
) => {
  try {
    let rawToken = token;
    if (token && token.startsWith("Bearer ")) {
      rawToken = token.substring(7).trim();
    }

    // 設置 Cookie - 直接存儲純 token，不添加 Bearer 前綴
    setTokenCookie(rawToken, rememberDays);
    setUserIdCookie(userData.id, rememberDays);

    // 設置 localStorage - 也存儲純 token
    localStorage.setItem("token", rawToken);
    localStorage.setItem("user", JSON.stringify(userData));

    if (refreshToken) {
      let rawRefreshToken = refreshToken;
      if (refreshToken.startsWith("Bearer ")) {
        rawRefreshToken = refreshToken.substring(7).trim();
      }
      localStorage.setItem("refreshToken", rawRefreshToken);
    }
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// 清除所有用戶相關數據
export const clearAllUserData = () => {
  try {
    clearAllUserCookies();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_complete_data");
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// 獲取當前登入用戶資訊
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }

    // 嘗試從其他可能的來源獲取
    const userDataStr = localStorage.getItem("user_data");
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }

    return null;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return null;
  }
};

// 獲取用戶詳細資料
export const getUserDetails = async (userId) => {
  try {
    const token = getJWTToken();
    if (!token || !userId) {
      throw new Error("缺少令牌或用戶ID");
    }

    // 使用授權令牌發送請求
    const response = await axios.get(
      `${API_PATH}/users/${userId}?_embed=favorites&_embed=orders&_embed=carts`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (response.data) {
      return response.data;
    }

    throw new Error("獲取用戶詳細資料失敗");
  } catch (error) {
    throw new Error(`獲取用戶詳細資料時出錯: ${error.message}`);
  }
};

// 處理登入請求
export const handleLogin = async (email, password, rememberMe = false) => {
  try {
    // 設定 cookie 過期時間（天數）- 根據"記住我"選項
    const cookieExpireDays = rememberMe ? 30 : 1;

    // 發送登入請求
    const response = await axios.post(`${API_PATH}/login`, {
      email,
      password,
    });

    if (response.data && response.data.accessToken) {
      // 處理成功的登入響應
      const { user, accessToken } = response.data;

      // 儲存用戶資訊
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username || user.name,
        role: user.role || "user",
      };

      // 儲存登入資訊
      saveLoginInfo(userData, accessToken, cookieExpireDays);

      // 獲取用戶詳細資訊
      try {
        const userDetails = await getUserDetails(user.id);
        if (userDetails) {
          // 將詳細資訊與基本資訊合併
          const completeUserData = {
            ...userData,
            details: userDetails,
          };
          localStorage.setItem(
            "user_complete_data",
            JSON.stringify(completeUserData)
          );
        }
      } catch (detailsError) {
        throw new Error(
          `獲取用戶詳細資訊失敗，但不影響登入過程: ${detailsError}`
        );
      }

      return {
        success: true,
        user: userData,
        token: accessToken,
      };
    } else {
      throw new Error("登入失敗：未收到有效的令牌");
    }
  } catch (error) {
    let errorMsg = "登入失敗，請檢查您的憑據";
    if (error.response) {
      // 伺服器回應了錯誤訊息
      errorMsg = error.response.data.message || errorMsg;
    } else if (error.message) {
      errorMsg = error.message;
    }

    throw new Error(errorMsg);
  }
};

// 處理註冊請求
export const handleRegister = async (userData) => {
  // // 檢查郵件是否已存在
  // const emailCheckResponse = await axios.get(
  //   `${API_PATH}/users?email=${userData.email}`
  // );

  // if (emailCheckResponse.data && emailCheckResponse.data.length > 0) {
  //   throw new Error('此郵件已被註冊，請使用其他郵件或直接登入');
  // } else {

  // }
  try {
    // 發送註冊請求
    const registerData = {
      email: userData.email,
      password: userData.password,
      username: userData.username,
      role: "user", // 預設角色
    };

    const response = await axios.post(`${API_PATH}/signup`, registerData);

    if (response.data) {
      return {
        success: true,
        message: "註冊成功，請使用您的帳號密碼登入",
        user: response.data.user,
      };
    } else {
      throw new Error("註冊失敗：伺服器未返回有效響應");
    }
  } catch (error) {
    let errorMsg = "註冊失敗，請檢查您的資料或稍後再試";
    if (error.response) {
      // 伺服器回應了錯誤訊息
      errorMsg = error.response.data.message || errorMsg;
    } else if (error.message) {
      errorMsg = error.message;
    }

    throw new Error(errorMsg);
  }
};

// 登出用戶
export const logout = () => {
  clearAllUserData();
  return true;
};

// 導出所有方法作為默認導出
const cookieUtils = {
  COOKIE_NAMES,
  getCookie,
  getUserIdFromCookie,
  setCookie,
  setUserIdCookie,
  setTokenCookie,
  deleteCookie,
  clearAllUserCookies,
  getJWTToken,
  setAuthorizationHeader,
  createAuthAxios,
  saveLoginInfo,
  clearAllUserData,
  isUserLoggedIn,
  getCurrentUser,
  getUserDetails,
  handleLogin,
  handleRegister,
  logout,
};

export default cookieUtils;
