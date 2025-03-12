// cookieUtils.js

// Cookie 名稱常量，與 authSlice 一致
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

// 獲取 WorldWear 的 Token
export const getWorldWearTokenFromCookie = () => {
  return getCookie(COOKIE_NAMES.TOKEN);
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

// 設置 TokenCookie
export const setTokenCookie = (token, days = 7) => {
  return setCookie(COOKIE_NAMES.TOKEN, token, days);
};

// 設置特定的用戶 ID Cookie
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

// 獲取用戶 ID，多重降級策略
export const getUserId = (state = null) => {
  // 1. 嘗試從 cookie 獲取
  const userIdFromCookie = getUserIdFromCookie();
  if (userIdFromCookie) return userIdFromCookie;
  
  // 2. 嘗試從 localStorage 獲取
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user && user.id) return user.id;
    }
  } catch (e) {
    console.error('解析用戶信息失敗:', e);
  }
  
  // 3. 從 state 中獲取用戶 ID
  if (state) {
    const possibleUserIdPaths = [
      'auth.user.id', 
      'authSlice.user.id', 
      'user.id'
    ];

    for (const path of possibleUserIdPaths) {
      const userIdFromState = path.split('.').reduce((obj, key) => obj && obj[key], state);
      if (userIdFromState) return userIdFromState;
    }
  }
  
  return '';
};

// 檢查用戶是否登入（多重驗證）
export const isUserLoggedIn = () => {
  return (
    !!getWorldWearTokenFromCookie() && 
    !!getUserIdFromCookie() && 
    isUserLoggedInByLocalStorage()
  );
};

// 通過 Cookie 檢查登入狀態
export const isUserLoggedInByCookie = () => {
  return !!getUserIdFromCookie() && !!getWorldWearTokenFromCookie();
};

// 通過 LocalStorage 檢查登入狀態
export const isUserLoggedInByLocalStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  } catch (error) {
    console.error('檢查 LocalStorage 登入狀態時發生錯誤:', error);
    return false;
  }
};

// 清除用戶 Cookie
export const clearUserCookie = () => {
  deleteCookie(COOKIE_NAMES.USER_ID);
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

// 從外部登入 API 同步認證資訊
export const syncExternalAuth = (accessToken, userId) => {
  try {
    // 設置 Cookie
    setTokenCookie(accessToken);
    setUserIdCookie(userId);
    
    console.log('從外部 API 同步認證資訊成功');
    return true;
  } catch (error) {
    console.error('從外部 API 同步認證資訊失敗:', error);
    return false;
  }
};

export default {
  COOKIE_NAMES,
  getCookie,
  getWorldWearTokenFromCookie,
  getUserIdFromCookie,
  setCookie,
  setTokenCookie,
  setUserIdCookie,
  deleteCookie,
  clearAllUserCookies,
  getUserId,
  isUserLoggedIn,
  isUserLoggedInByCookie,
  isUserLoggedInByLocalStorage,
  clearUserCookie,
  clearAllUserData,
  syncExternalAuth
};



// ------------------------------
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