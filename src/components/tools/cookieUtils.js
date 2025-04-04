// cookieUtils.js
import axios from 'axios';

// 獲取環境變數的 API 路徑
const { VITE_API_PATH: API_PATH } = import.meta.env;

// Cookie 名稱常量
export const COOKIE_NAMES = {
  TOKEN: 'worldWearToken',
  USER_ID: 'worldWearUserId',
};

// 安全地獲取 Cookie
export const getCookie = (name) => {
  try {
    const match = document.cookie.match(
      new RegExp('(^| )' + name + '=([^;]+)')
    );
    return match ? decodeURIComponent(match[2]) : '';
  } catch (error) {
    console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
    return '';
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
      path: '/',
      secure: window.location.protocol === 'https:', // 只在HTTPS下設置secure
      sameSite: 'Strict', // 防止 CSRF 攻擊
      ...options,
    };

    const cookieString = Object.entries(cookieOptions)
      .filter(([, value]) => value !== false)
      .map(([key, value]) =>
        key === 'expires'
          ? `Expires=${value}`
          : key === 'path'
          ? `Path=${value}`
          : `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
      )
      .join('; ');

    document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
    return true;
  } catch (error) {
    console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
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
  const rawToken = token.startsWith('Bearer ')
    ? token.substring(7).trim()
    : token.trim();
  console.log('設置 token cookie, 值:', rawToken.substring(0, 10) + '...');

  // 直接存儲純 token，不添加 Bearer 前綴
  return setCookie(COOKIE_NAMES.TOKEN, rawToken, days);
};

// 刪除特定 Cookie
export const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; SameSite=Strict`;
    if (window.location.protocol === 'https:') {
      document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
    }
    return true;
  } catch (error) {
    console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
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
    const tokenFromLocalStorage = localStorage.getItem('token');
    const tokenFromCookie = getCookie(COOKIE_NAMES.TOKEN);
    const directTokenFromCookie = getCookie('worldWearToken');

    console.log('可用的 token 來源:', {
      localStorage: tokenFromLocalStorage ? '有值' : '無',
      cookieConstant: tokenFromCookie ? '有值' : '無',
      directCookie: directTokenFromCookie ? '有值' : '無',
    });

    // 移除可能存在的 Bearer 前綴，獲取純 token
    let rawToken = null;

    if (tokenFromLocalStorage) {
      rawToken = tokenFromLocalStorage.startsWith('Bearer ')
        ? tokenFromLocalStorage.substring(7).trim()
        : tokenFromLocalStorage.trim();
    } else if (tokenFromCookie) {
      rawToken = tokenFromCookie.startsWith('Bearer ')
        ? tokenFromCookie.substring(7).trim()
        : tokenFromCookie.trim();
    } else if (directTokenFromCookie) {
      rawToken = directTokenFromCookie.startsWith('Bearer ')
        ? directTokenFromCookie.substring(7).trim()
        : directTokenFromCookie.trim();
    }

    // 如果找不到 token，返回 null
    if (!rawToken) {
      console.log('未找到有效的 token');
      return null;
    }

    console.log('找到原始 token:', rawToken.substring(0, 10) + '...');

    // 驗證 token 格式
    if (rawToken.split('.').length !== 3) {
      console.warn(
        '獲取到的 token 不是標準的 JWT 格式（應該有三個部分以點分隔）'
      );
    }

    // 返回 Bearer + token 格式
    return `Bearer ${rawToken}`;
  } catch (error) {
    console.error('獲取 JWT Token 時發生錯誤:', error);
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
    axiosInstance.defaults.headers.common['Authorization'] = token;
    console.log('設置 axios Authorization header 成功');
    return true;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
    console.log('未找到有效 token，清除 Authorization header');
    return false;
  }
};

// 創建一個帶有授權的 axios 實例
export const createAuthAxios = () => {
  const token = getJWTToken();
  return axios.create({
    baseURL: API_PATH,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token || '',
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
    console.log('保存登入信息，原始 token:', token);

    // 確保移除可能存在的 Bearer 前綴，獲取純 token
    let rawToken = token;
    if (token && token.startsWith('Bearer ')) {
      rawToken = token.substring(7).trim();
    }

    console.log('處理後的純 token:', rawToken);

    // 設置 Cookie - 直接存儲純 token，不添加 Bearer 前綴
    setTokenCookie(rawToken, rememberDays);
    setUserIdCookie(userData.id, rememberDays);

    // 設置 localStorage - 也存儲純 token
    localStorage.setItem('token', rawToken);
    localStorage.setItem('user', JSON.stringify(userData));

    if (refreshToken) {
      let rawRefreshToken = refreshToken;
      if (refreshToken.startsWith('Bearer ')) {
        rawRefreshToken = refreshToken.substring(7).trim();
      }
      localStorage.setItem('refreshToken', rawRefreshToken);
    }

    console.log('登入信息保存成功');
    return true;
  } catch (error) {
    console.error('儲存登入資訊失敗:', error);
    return false;
  }
};

// 清除所有用戶相關數據
export const clearAllUserData = () => {
  try {
    clearAllUserCookies();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_complete_data');
    return true;
  } catch (error) {
    console.error('清除用戶數據時發生錯誤:', error);
    return false;
  }
};

// 獲取當前登入用戶資訊
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    // 嘗試從其他可能的來源獲取
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }

    return null;
  } catch (error) {
    console.error('獲取當前用戶資訊失敗:', error);
    return null;
  }
};

// 獲取用戶詳細資料
export const getUserDetails = async (userId) => {
  try {
    const token = getJWTToken();
    if (!token || !userId) {
      throw new Error('缺少令牌或用戶ID');
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

    throw new Error('獲取用戶詳細資料失敗');
  } catch (error) {
    console.error('獲取用戶詳細資料時出錯:', error);
    throw error;
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
        role: user.role || 'user',
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
            'user_complete_data',
            JSON.stringify(completeUserData)
          );
        }
      } catch (detailsError) {
        console.warn('獲取用戶詳細資訊失敗，但不影響登入過程', detailsError);
      }

      return {
        success: true,
        user: userData,
        token: accessToken,
      };
    } else {
      throw new Error('登入失敗：未收到有效的令牌');
    }
  } catch (error) {
    console.error('登入請求失敗:', error);

    let errorMsg = '登入失敗，請檢查您的憑據';
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
      role: 'user', // 預設角色
    };

    const response = await axios.post(`${API_PATH}/signup`, registerData);

    if (response.data) {
      return {
        success: true,
        message: '註冊成功，請使用您的帳號密碼登入',
        user: response.data.user,
      };
    } else {
      throw new Error('註冊失敗：伺服器未返回有效響應');
    }
  } catch (error) {
    console.error('註冊請求失敗:', error);

    let errorMsg = '註冊失敗，請檢查您的資料或稍後再試';
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

// // Cookie 名稱常量
// export const COOKIE_NAMES = {
//   TOKEN: 'worldWearToken',
//   USER_ID: 'worldWearUserId'
// };

// // 安全地獲取 Cookie
// export const getCookie = (name) => {
//   try {
//     const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//     return match ? decodeURIComponent(match[2]) : '';
//   } catch (error) {
//     console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
//     return '';
//   }
// };

// // 獲取用戶 ID
// export const getUserIdFromCookie = () => {
//   return getCookie(COOKIE_NAMES.USER_ID);
// };

// // 設置 Cookie，增加安全性和靈活性
// export const setCookie = (name, value, days = 7, options = {}) => {
//   try {
//     const date = new Date();
//     date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

//     const cookieOptions = {
//       expires: date.toUTCString(),
//       path: '/',
//       secure: window.location.protocol === 'https:', // 只在HTTPS下設置secure
//       sameSite: 'Strict',  // 防止 CSRF 攻擊
//       ...options
//     };

//     const cookieString = Object.entries(cookieOptions)
//       .filter(([key, value]) => value !== false)
//       .map(([key, value]) =>
//         key === 'expires' ? `Expires=${value}` :
//         key === 'path' ? `Path=${value}` :
//         `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
//       )
//       .join('; ');

//     document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
//     return true;
//   } catch (error) {
//     console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 設置用戶 ID Cookie
// export const setUserIdCookie = (userId, days = 7) => {
//   return setCookie(COOKIE_NAMES.USER_ID, userId, days);
// };

// // 設置 Token Cookie - 修正版
// export const setTokenCookie = (token, days = 7) => {
//   // 確保移除可能存在的 Bearer 前綴
//   const rawToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
//   console.log('設置 token cookie, 值:', rawToken.substring(0, 10) + '...');

//   // 直接存儲純 token，不添加 Bearer 前綴
//   return setCookie(COOKIE_NAMES.TOKEN, rawToken, days);
// };

// // 刪除特定 Cookie
// export const deleteCookie = (name) => {
//   try {
//     document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; SameSite=Strict`;
//     if (window.location.protocol === 'https:') {
//       document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
//     }
//     return true;
//   } catch (error) {
//     console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 清除所有用戶相關的 Cookies
// export const clearAllUserCookies = () => {
//   deleteCookie(COOKIE_NAMES.TOKEN);
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 獲取 JWT Token，確保返回正確格式的帶有 Bearer 前綴的 token - 修正版
// export const getJWTToken = () => {
//   try {
//     // 依次嘗試從不同來源獲取 token
//     const tokenFromLocalStorage = localStorage.getItem('token');
//     const tokenFromCookie = getCookie(COOKIE_NAMES.TOKEN);
//     const directTokenFromCookie = getCookie('worldWearToken');

//     console.log('可用的 token 來源:', {
//       localStorage: tokenFromLocalStorage ? '有值' : '無',
//       cookieConstant: tokenFromCookie ? '有值' : '無',
//       directCookie: directTokenFromCookie ? '有值' : '無'
//     });

//     // 移除可能存在的 Bearer 前綴，獲取純 token
//     let rawToken = null;

//     if (tokenFromLocalStorage) {
//       rawToken = tokenFromLocalStorage.startsWith('Bearer ')
//         ? tokenFromLocalStorage.substring(7).trim()
//         : tokenFromLocalStorage.trim();
//     } else if (tokenFromCookie) {
//       rawToken = tokenFromCookie.startsWith('Bearer ')
//         ? tokenFromCookie.substring(7).trim()
//         : tokenFromCookie.trim();
//     } else if (directTokenFromCookie) {
//       rawToken = directTokenFromCookie.startsWith('Bearer ')
//         ? directTokenFromCookie.substring(7).trim()
//         : directTokenFromCookie.trim();
//     }

//     // 如果找不到 token，返回 null
//     if (!rawToken) {
//       console.log('未找到有效的 token');
//       return null;
//     }

//     console.log('找到原始 token:', rawToken.substring(0, 10) + '...');

//     // 驗證 token 格式
//     if (rawToken.split('.').length !== 3) {
//       console.warn('獲取到的 token 不是標準的 JWT 格式（應該有三個部分以點分隔）');
//     }

//     // 返回 Bearer + token 格式
//     return `Bearer ${rawToken}`;
//   } catch (error) {
//     console.error('獲取 JWT Token 時發生錯誤:', error);
//     return null;
//   }
// };

// // 判斷用戶是否已登入
// export const isUserLoggedIn = () => {
//   const token = getJWTToken();
//   const userId = getUserIdFromCookie();
//   return !!(token && userId);
// };

// // 設置 axios 預設 Authorization header
// export const setAuthorizationHeader = (axios) => {
//   const token = getJWTToken();
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = token;
//     console.log('設置 axios Authorization header 成功');
//     return true;
//   } else {
//     delete axios.defaults.headers.common['Authorization'];
//     console.log('未找到有效 token，清除 Authorization header');
//     return false;
//   }
// };

// // 儲存登入資訊，一次性設置所有相關的 Cookie 和 localStorage - 修正版
// export const saveLoginInfo = (userData, token, refreshToken = null) => {
//   try {
//     console.log('保存登入信息，原始 token:', token);

//     // 確保移除可能存在的 Bearer 前綴，獲取純 token
//     let rawToken = token;
//     if (token && token.startsWith('Bearer ')) {
//       rawToken = token.substring(7).trim();
//     }

//     console.log('處理後的純 token:', rawToken);

//     // 設置 Cookie - 直接存儲純 token，不添加 Bearer 前綴
//     setTokenCookie(rawToken);
//     setUserIdCookie(userData.id);

//     // 設置 localStorage - 也存儲純 token
//     localStorage.setItem('token', rawToken);
//     localStorage.setItem('user', JSON.stringify(userData));

//     if (refreshToken) {
//       let rawRefreshToken = refreshToken;
//       if (refreshToken.startsWith('Bearer ')) {
//         rawRefreshToken = refreshToken.substring(7).trim();
//       }
//       localStorage.setItem('refreshToken', rawRefreshToken);
//     }

//     console.log('登入信息保存成功');
//     return true;
//   } catch (error) {
//     console.error('儲存登入資訊失敗:', error);
//     return false;
//   }
// };

// // 清除所有用戶相關數據
// export const clearAllUserData = () => {
//   try {
//     clearAllUserCookies();
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     localStorage.removeItem('refreshToken');
//     return true;
//   } catch (error) {
//     console.error('清除用戶數據時發生錯誤:', error);
//     return false;
//   }
// };

// // 獲取當前登入用戶資訊
// export const getCurrentUser = () => {
//   try {
//     const userStr = localStorage.getItem('user');
//     return userStr ? JSON.parse(userStr) : null;
//   } catch (error) {
//     console.error('獲取當前用戶資訊失敗:', error);
//     return null;
//   }
// };

// // 導出所有方法作為默認導出
// const cookieUtils = {
//   COOKIE_NAMES,
//   getCookie,
//   getUserIdFromCookie,
//   setCookie,
//   setUserIdCookie,
//   setTokenCookie,
//   deleteCookie,
//   clearAllUserCookies,
//   getJWTToken,
//   setAuthorizationHeader,
//   saveLoginInfo,
//   clearAllUserData,
//   isUserLoggedIn,
//   getCurrentUser
// };

// export default cookieUtils;

// // Cookie 名稱常量
// export const COOKIE_NAMES = {
//   TOKEN: 'worldWearToken',
//   USER_ID: 'worldWearUserId'
// };

// // 安全地獲取 Cookie
// export const getCookie = (name) => {
//   try {
//     const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//     return match ? decodeURIComponent(match[2]) : '';
//   } catch (error) {
//     console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
//     return '';
//   }
// };

// // 獲取用戶 ID
// export const getUserIdFromCookie = () => {
//   return getCookie(COOKIE_NAMES.USER_ID);
// };

// // 設置 Cookie，增加安全性和靈活性
// export const setCookie = (name, value, days = 7, options = {}) => {
//   try {
//     const date = new Date();
//     date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

//     const cookieOptions = {
//       expires: date.toUTCString(),
//       path: '/',
//       secure: true,   // 僅在 HTTPS 下傳輸
//       sameSite: 'Strict',  // 防止 CSRF 攻擊
//       ...options
//     };

//     const cookieString = Object.entries(cookieOptions)
//       .filter(([key, value]) => value !== false)
//       .map(([key, value]) =>
//         key === 'expires' ? `Expires=${value}` :
//         key === 'path' ? `Path=${value}` :
//         `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
//       )
//       .join('; ');

//     document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
//     return true;
//   } catch (error) {
//     console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 設置用戶 ID Cookie
// export const setUserIdCookie = (userId, days = 7) => {
//   return setCookie(COOKIE_NAMES.USER_ID, userId, days);
// };

// // 刪除特定 Cookie
// export const deleteCookie = (name) => {
//   try {
//     document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
//     return true;
//   } catch (error) {
//     console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 清除所有用戶相關的 Cookies
// export const clearAllUserCookies = () => {
//   deleteCookie(COOKIE_NAMES.TOKEN);
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 獲取 JWT Token，確保返回正確格式的帶有 Bearer 前綴的 token
// export const getJWTToken = () => {
//   try {
//     // 依次嘗試從不同來源獲取 token
//     const tokenFromLocalStorage = localStorage.getItem('token');
//     const tokenFromCookie = getCookie(COOKIE_NAMES.TOKEN);

//     let token = tokenFromLocalStorage || tokenFromCookie || null;

//     // 確保 token 格式正確
//     if (token) {
//       // 如果 token 已經有 Bearer 前綴，直接返回
//       if (token.startsWith('Bearer ')) {
//         return token;
//       }
//       // 否則添加 Bearer 前綴
//       return `Bearer ${token}`;
//     }

//     return null;
//   } catch (error) {
//     console.error('獲取 JWT Token 時發生錯誤:', error);
//     return null;
//   }
// };

// // 判斷用戶是否已登入
// export const isUserLoggedIn = () => {
//   const token = getJWTToken();
//   const userId = getUserIdFromCookie();
//   return !!(token && userId);
// };

// // 設置 axios 預設 Authorization header
// export const setAuthorizationHeader = (axios) => {
//   const token = getJWTToken();
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = token;
//     console.log('設置 axios Authorization header 成功:', token);
//     return true;
//   } else {
//     delete axios.defaults.headers.common['Authorization'];
//     console.log('未找到有效 token，清除 Authorization header');
//     return false;
//   }
// };

// // 清除所有用戶相關數據
// export const clearAllUserData = () => {
//   try {
//     clearAllUserCookies();
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     localStorage.removeItem('refreshToken');
//     return true;
//   } catch (error) {
//     console.error('清除用戶數據時發生錯誤:', error);
//     return false;
//   }
// };

// // 導出所有方法作為默認導出
// const cookieUtils = {
//   COOKIE_NAMES,
//   getCookie,
//   getUserIdFromCookie,
//   setCookie,
//   setUserIdCookie,
//   deleteCookie,
//   clearAllUserCookies,
//   getJWTToken,
//   setAuthorizationHeader,
//   clearAllUserData,
//   isUserLoggedIn
// };

// export default cookieUtils;

/*
// Cookie 名稱常量
export const COOKIE_NAMES = {
  TOKEN: 'worldWearToken',
  USER_ID: 'worldWearUserId'
};

// 安全地獲取 Cookie
export const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  } catch (error) {
    console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
    return '';
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
      path: '/',
      secure: true,   // 僅在 HTTPS 下傳輸
      sameSite: 'Strict',  // 防止 CSRF 攻擊
      ...options
    };

    const cookieString = Object.entries(cookieOptions)
      .filter(([key, value]) => value !== false)
      .map(([key, value]) => 
        key === 'expires' ? `Expires=${value}` : 
        key === 'path' ? `Path=${value}` : 
        `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
      )
      .join('; ');

    document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
    return true;
  } catch (error) {
    console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
    return false;
  }
};

// 設置用戶 ID Cookie
export const setUserIdCookie = (userId, days = 7) => {
  return setCookie(COOKIE_NAMES.USER_ID, userId, days);
};

// 刪除特定 Cookie
export const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
    return true;
  } catch (error) {
    console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
    return false;
  }
};

// 清除所有用戶相關的 Cookies
export const clearAllUserCookies = () => {
  deleteCookie(COOKIE_NAMES.TOKEN);
  deleteCookie(COOKIE_NAMES.USER_ID);
};

// 獲取 JWT Token
export const getJWTToken = () => {
  // 依次嘗試從不同來源獲取 token
  const tokenFromLocalStorage = localStorage.getItem('token');
  const tokenFromCookie = getCookie(COOKIE_NAMES.TOKEN);
  
  return tokenFromLocalStorage || tokenFromCookie || null;
};

// 設置 axios 預設 Authorization header
export const setAuthorizationHeader = (axios) => {
  const token = getJWTToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log('設置 axios Authorization header 成功');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('未找到有效 token，清除 Authorization header');
  }
  return !!token;
};

// 清除所有用戶相關數據
export const clearAllUserData = () => {
  try {
    clearAllUserCookies();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return true;
  } catch (error) {
    console.error('清除用戶數據時發生錯誤:', error);
    return false;
  }
};

// 導出所有方法作為默認導出
const cookieUtils = {
  COOKIE_NAMES,
  getCookie,
  getUserIdFromCookie,
  setCookie,
  setUserIdCookie,
  deleteCookie,
  clearAllUserCookies,
  getJWTToken,
  setAuthorizationHeader,
  clearAllUserData
};

export default cookieUtils;
*/

// // cookieUtils.js

// // Cookie 名稱常量，與 authSlice 一致
// export const COOKIE_NAMES = {
//   TOKEN: 'worldWearToken',
//   USER_ID: 'worldWearUserId'
// };

// // 安全地獲取 Cookie
// export const getCookie = (name) => {
//   try {
//     const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//     return match ? decodeURIComponent(match[2]) : '';
//   } catch (error) {
//     console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
//     return '';
//   }
// };

// // 獲取 WorldWear 的 Token
// export const getWorldWearTokenFromCookie = () => {
//   return getCookie(COOKIE_NAMES.TOKEN);
// };

// // 獲取用戶 ID
// export const getUserIdFromCookie = () => {
//   return getCookie(COOKIE_NAMES.USER_ID);
// };

// // 設置 Cookie，增加安全性和靈活性
// export const setCookie = (name, value, days = 7, options = {}) => {
//   try {
//     const date = new Date();
//     date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

//     const cookieOptions = {
//       expires: date.toUTCString(),
//       path: '/',
//       secure: true,   // 僅在 HTTPS 下傳輸
//       sameSite: 'Strict',  // 防止 CSRF 攻擊
//       ...options
//     };

//     const cookieString = Object.entries(cookieOptions)
//       .filter(([key, value]) => value !== false)
//       .map(([key, value]) =>
//         key === 'expires' ? `Expires=${value}` :
//         key === 'path' ? `Path=${value}` :
//         `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
//       )
//       .join('; ');

//     document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
//     return true;
//   } catch (error) {
//     console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 設置 TokenCookie
// export const setTokenCookie = (token, days = 7) => {
//   return setCookie(COOKIE_NAMES.TOKEN, token, days);
// };

// // 設置特定的用戶 ID Cookie
// export const setUserIdCookie = (userId, days = 7) => {
//   return setCookie(COOKIE_NAMES.USER_ID, userId, days);
// };

// // 刪除特定 Cookie
// export const deleteCookie = (name) => {
//   try {
//     document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
//     return true;
//   } catch (error) {
//     console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
//     return false;
//   }
// };

// // 清除所有用戶相關的 Cookies
// export const clearAllUserCookies = () => {
//   deleteCookie(COOKIE_NAMES.TOKEN);
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 獲取用戶 ID，多重降級策略
// export const getUserId = (state = null) => {
//   // 1. 嘗試從 cookie 獲取
//   const userIdFromCookie = getUserIdFromCookie();
//   if (userIdFromCookie) return userIdFromCookie;

//   // 2. 嘗試從 localStorage 獲取
//   try {
//     const userString = localStorage.getItem('user');
//     if (userString) {
//       const user = JSON.parse(userString);
//       if (user && user.id) return user.id;
//     }
//   } catch (e) {
//     console.error('解析用戶信息失敗:', e);
//   }

//   // 3. 從 state 中獲取用戶 ID
//   if (state) {
//     const possibleUserIdPaths = [
//       'auth.user.id',
//       'authSlice.user.id',
//       'user.id'
//     ];

//     for (const path of possibleUserIdPaths) {
//       const userIdFromState = path.split('.').reduce((obj, key) => obj && obj[key], state);
//       if (userIdFromState) return userIdFromState;
//     }
//   }

//   return '';
// };

// // 檢查用戶是否登入（多重驗證）
// export const isUserLoggedIn = () => {
//   return (
//     !!getWorldWearTokenFromCookie() &&
//     !!getUserIdFromCookie() &&
//     isUserLoggedInByLocalStorage()
//   );
// };

// // 通過 Cookie 檢查登入狀態
// export const isUserLoggedInByCookie = () => {
//   return !!getUserIdFromCookie() && !!getWorldWearTokenFromCookie();
// };

// // 通過 LocalStorage 檢查登入狀態
// export const isUserLoggedInByLocalStorage = () => {
//   try {
//     const token = localStorage.getItem('token');
//     const user = localStorage.getItem('user');
//     return !!(token && user);
//   } catch (error) {
//     console.error('檢查 LocalStorage 登入狀態時發生錯誤:', error);
//     return false;
//   }
// };

// // 清除用戶 Cookie
// export const clearUserCookie = () => {
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 清除所有用戶相關數據
// export const clearAllUserData = () => {
//   try {
//     clearAllUserCookies();
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     localStorage.removeItem('refreshToken');
//     return true;
//   } catch (error) {
//     console.error('清除用戶數據時發生錯誤:', error);
//     return false;
//   }
// };

// // 從外部登入 API 同步認證資訊
// export const syncExternalAuth = (accessToken, userId) => {
//   try {
//     // 設置 Cookie
//     setTokenCookie(accessToken);
//     setUserIdCookie(userId);

//     console.log('從外部 API 同步認證資訊成功');
//     return true;
//   } catch (error) {
//     console.error('從外部 API 同步認證資訊失敗:', error);
//     return false;
//   }
// };

// export default {
//   COOKIE_NAMES,
//   getCookie,
//   getWorldWearTokenFromCookie,
//   getUserIdFromCookie,
//   setCookie,
//   setTokenCookie,
//   setUserIdCookie,
//   deleteCookie,
//   clearAllUserCookies,
//   getUserId,
//   isUserLoggedIn,
//   isUserLoggedInByCookie,
//   isUserLoggedInByLocalStorage,
//   clearUserCookie,
//   clearAllUserData,
//   syncExternalAuth
// };

// ------------------------------
// cookieUtils.js

// Cookie 名稱常量，與 authSlice 一致
// export const COOKIE_NAMES = {
//   TOKEN: 'worldWearToken',
//   USER_ID: 'worldWearUserId'
// };

// // 安全地獲取 Cookie
// export const getCookie = (name) => {
//   try {
//     const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//     return match ? decodeURIComponent(match[2]) : '';
//   } catch (error) {
//     console.error(`獲取 Cookie ${name} 時發生錯誤:`, error);
//     return '';
//   }
// };

// // 獲取 WorldWear 的 Token
// export const getWorldWearTokenFromCookie = () => {
//   return getCookie(COOKIE_NAMES.TOKEN);
// };

// // 獲取用戶 ID
// export const getUserIdFromCookie = () => {
//   return getCookie(COOKIE_NAMES.USER_ID);
// };

// // 設置 Cookie，增加安全性和靈活性
// export const setCookie = (name, value, days = 7, options = {}) => {
//   try {
//     const date = new Date();
//     date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

//     const cookieOptions = {
//       expires: date.toUTCString(),
//       path: '/',
//       secure: true,   // 僅在 HTTPS 下傳輸
//       sameSite: 'Strict',  // 防止 CSRF 攻擊
//       ...options
//     };

//     const cookieString = Object.entries(cookieOptions)
//       .filter(([key, value]) => value !== false)
//       .map(([key, value]) =>
//         key === 'expires' ? `Expires=${value}` :
//         key === 'path' ? `Path=${value}` :
//         `${key.charAt(0).toUpperCase() + key.slice(1)}=${value}`
//       )
//       .join('; ');

//     document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieString}`;
//   } catch (error) {
//     console.error(`設置 Cookie ${name} 時發生錯誤:`, error);
//   }
// };

// // 設置特定的用戶 ID Cookie
// export const setUserIdCookie = (userId, days = 7) => {
//   setCookie(COOKIE_NAMES.USER_ID, userId, days);
// };

// // 刪除特定 Cookie
// export const deleteCookie = (name) => {
//   try {
//     document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
//   } catch (error) {
//     console.error(`刪除 Cookie ${name} 時發生錯誤:`, error);
//   }
// };

// // 清除所有用戶相關的 Cookies
// export const clearAllUserCookies = () => {
//   deleteCookie(COOKIE_NAMES.TOKEN);
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 獲取用戶 ID，多重降級策略
// export const getUserId = (state = null) => {
//   // 1. 嘗試從 cookie 獲取
//   const userIdFromCookie = getUserIdFromCookie();
//   if (userIdFromCookie) return userIdFromCookie;

//   // 2. 嘗試從 localStorage 獲取
//   try {
//     const userString = localStorage.getItem('user');
//     if (userString) {
//       const user = JSON.parse(userString);
//       if (user && user.id) return user.id;
//     }
//   } catch (e) {
//     console.error('解析用戶信息失敗:', e);
//   }

//   // 3. 從 state 中獲取用戶 ID
//   if (state) {
//     const possibleUserIdPaths = [
//       'auth.user.id',
//       'authSlice.user.id',
//       'user.id'
//     ];

//     for (const path of possibleUserIdPaths) {
//       const userIdFromState = path.split('.').reduce((obj, key) => obj && obj[key], state);
//       if (userIdFromState) return userIdFromState;
//     }
//   }

//   return '';
// };

// // 檢查用戶是否登入（多重驗證）
// export const isUserLoggedIn = () => {
//   return (
//     !!getWorldWearTokenFromCookie() &&
//     !!getUserIdFromCookie() &&
//     isUserLoggedInByLocalStorage()
//   );
// };

// // 通過 Cookie 檢查登入狀態
// export const isUserLoggedInByCookie = () => {
//   return !!getUserIdFromCookie();
// };

// // 通過 LocalStorage 檢查登入狀態
// export const isUserLoggedInByLocalStorage = () => {
//   try {
//     const token = localStorage.getItem('token');
//     const user = localStorage.getItem('user');
//     return !!(token && user);
//   } catch (error) {
//     console.error('檢查 LocalStorage 登入狀態時發生錯誤:', error);
//     return false;
//   }
// };

// // 清除用戶 Cookie
// export const clearUserCookie = () => {
//   deleteCookie(COOKIE_NAMES.USER_ID);
// };

// // 清除所有用戶相關數據
// export const clearAllUserData = () => {
//   try {
//     clearAllUserCookies();
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     localStorage.removeItem('refreshToken');
//   } catch (error) {
//     console.error('清除用戶數據時發生錯誤:', error);
//   }
// };

// export default {
//   COOKIE_NAMES,
//   getCookie,
//   getWorldWearTokenFromCookie,
//   getUserIdFromCookie,
//   setCookie,
//   setUserIdCookie,
//   deleteCookie,
//   clearAllUserCookies,
//   getUserId,
//   isUserLoggedIn,
//   isUserLoggedInByCookie,
//   isUserLoggedInByLocalStorage,
//   clearUserCookie,
//   clearAllUserData
// };
