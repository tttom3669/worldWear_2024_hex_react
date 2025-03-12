import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { 
  setUserIdCookie, 
  clearAllUserCookies, 
  getUserIdFromCookie,
  getWorldWearTokenFromCookie, 
  isUserLoggedInByCookie,
  clearAllUserData,
  setCookie,
  setTokenCookie,
  COOKIE_NAMES,
  syncExternalAuth
} from "../components/tools/cookieUtils";

// 用於儲存新註冊用戶的原始密碼，以便在模擬環境中登入
// 注意：這只是用於模擬目的，實際生產環境中絕不能這樣做
const userCredentialsMap = new Map();

// 從資料庫導入的使用者數據
const dbUsers = [
  {
    "email": "worldwear@gmail.com",
    "password": "$2a$10$y4mim8jjw8kXZLNA3b4sLupUHFe768FCBwkNUprUXfEERkGNbcSaW",
    "role": "admin",
    "id": "pqyfZ3sGxjTKmTSjmCAKa",
    "username": "管理員" // 為了顯示，添加用戶名
  },
  {
    "email": "test@gmail.com",
    "password": "$2a$10$SeA6eM43X2ThO3ikPZxmvu7XYvikgzaRjcMZ6BrLF80gLRafAfwqi",
    "role": "user",
    "username": "test",
    "id": "pbs5UHdZo7Th7_BStU-o9"
  },
  {
    "email": "qa@gmail.com",
    "password": "$2a$10$riE41dU5cvXOYCVQvkqQFOYNlMIWxyiJoKbThgGUndm2lVkKsc6nq",
    "role": "user",
    "username": "qa",
    "id": "Ct5HXrUgBSgTZnal_qJdU"
  }
];

// 預設用戶的密碼對照表
const defaultUserPasswords = {
  "worldwear@gmail.com": "worldwear",
  "test@gmail.com": "12345678",
  "qa@gmail.com": "test1234"
};

// 生成 JWT 格式的 token
const generateJWT = (userId, email, expiresIn = '1h') => {
  // JWT Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // 獲取當前時間戳（秒）
  const now = Math.floor(Date.now() / 1000);
  
  // JWT Payload
  const payload = {
    email: email,
    iat: now,
    exp: now + (expiresIn === '1h' ? 3600 : parseInt(expiresIn, 10)),
    sub: userId
  };
  
  // Base64Url 編碼
  const base64Header = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const base64Payload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  // 生成簽名（在前端模擬，實際應在後端安全環境進行）
  // 使用一個固定的字符串作為簽名，僅用於模擬
  const signature = btoa(`${userId}-${now}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  // 組合 JWT
  return `${base64Header}.${base64Payload}.${signature}`;
};

// 本地存儲中獲取用戶信息
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('解析本地存儲的用戶信息失敗:', error);
    return null;
  }
};

// 設置 axios 請求頭中的 Authorization
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('設置 axios Authorization header 成功:', token);
    return true;
  }
  
  delete axios.defaults.headers.common['Authorization'];
  console.log('清除 axios Authorization header');
  return false;
};

// 設置完整的用戶認證信息（包括 Cookie 和 localStorage）
const setFullUserAuth = (user, token, refreshToken, days = 7) => {
  if (!user || !user.id || !token) {
    console.error('設置用戶認證信息失敗: 參數不完整');
    return false;
  }
  
  try {
    // 儲存 Token 到 Cookie
    setTokenCookie(token, days);
    
    // 儲存用戶 ID 到 Cookie
    setUserIdCookie(user.id, days);
    
    // 儲存到 localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // 設置請求頭
    setAuthHeader(token);
    
    console.log('設置用戶認證信息成功:', user.id);
    return true;
  } catch (error) {
    console.error('設置用戶認證信息失敗:', error);
    return false;
  }
};

// 本地認證的登入功能
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      console.log("嘗試登入資料:", userData);
      
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 在真實用戶數據中尋找匹配的電子郵件
      const user = dbUsers.find(u => u.email === userData.email);
      
      if (!user) {
        return rejectWithValue('電子郵件或密碼不正確');
      }
      
      // 驗證密碼
      let passwordValid = false;
      
      // 首先檢查是否是預設用戶
      if (defaultUserPasswords[user.email] && userData.password === defaultUserPasswords[user.email]) {
        passwordValid = true;
      } 
      // 然後檢查是否是新註冊用戶
      else if (userCredentialsMap.has(user.email) && userData.password === userCredentialsMap.get(user.email)) {
        passwordValid = true;
      }
      
      if (!passwordValid) {
        return rejectWithValue('電子郵件或密碼不正確');
      }
      
      // 生成 JWT 格式的令牌
      const jwtToken = generateJWT(user.id, user.email, '1h');
      const refreshToken = `refresh-${Date.now()}-${user.id}`;
      
      // 將用戶資訊存儲到本地，但不包含密碼
      const userToStore = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      // 設置完整的用戶認證信息
      setFullUserAuth(userToStore, jwtToken, refreshToken, 7);
      
      console.log("登入成功:", userToStore);
      
      return {
        user: userToStore,
        accessToken: jwtToken
      };
    } catch (error) {
      console.error('登入模擬錯誤:', error);
      return rejectWithValue('登入處理過程中發生錯誤');
    }
  }
);

// 從外部API同步登入狀態
export const syncExternalLogin = createAsyncThunk(
  'auth/syncExternalLogin',
  async ({ accessToken, userId }, { rejectWithValue }) => {
    try {
      console.log("同步外部登入, token:", accessToken, "userId:", userId);
      
      // 檢查必要參數
      if (!accessToken || !userId) {
        return rejectWithValue('缺少必要的認證參數');
      }
      
      // 在資料庫中尋找對應的用戶
      const user = dbUsers.find(u => u.id === userId);
      
      if (!user) {
        return rejectWithValue('找不到對應的用戶');
      }
      
      // 建立用戶資料
      const userToStore = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      // 設置完整的用戶認證資訊
      setFullUserAuth(userToStore, accessToken, null, 7);
      
      console.log("外部登入同步成功:", userToStore);
      
      return {
        user: userToStore,
        accessToken: accessToken
      };
    } catch (error) {
      console.error('同步外部登入錯誤:', error);
      return rejectWithValue('同步外部登入失敗');
    }
  }
);

// 本地註冊功能 - 使用與資料庫相容的ID格式
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      console.log("嘗試註冊資料:", userData);
      
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 檢查電子郵件是否已被使用
      if (dbUsers.some(u => u.email === userData.email)) {
        return rejectWithValue('此電子郵件已被註冊');
      }
      
      // 生成與資料庫兼容的ID格式
      const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
        let id = '';
        for (let i = 0; i < 20; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      };
      
      // 模擬加密密碼 (實際情況下應該在後端處理)
      const hashedPassword = `$2a$10$MockHashedPassword${Date.now()}`;
      
      // 模擬創建新用戶 (僅記憶體中，重新整理後會消失)
      const newUser = {
        id: generateId(),
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: 'user'
      };
      
      // 將新用戶添加到模擬數據中
      dbUsers.push(newUser);
      
      // 保存用戶原始密碼到映射表中 (僅用於模擬登入)
      userCredentialsMap.set(userData.email, userData.password);
      
      console.log("註冊成功:", newUser);
      
      return {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      };
    } catch (error) {
      console.error('註冊模擬錯誤:', error);
      return rejectWithValue('註冊處理過程中發生錯誤');
    }
  }
);

// 獲取當前用戶信息 - 同時檢查 localStorage 和 cookie
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 優先從 localStorage 獲取用戶信息
      const storedUser = getStoredUser();
      
      if (storedUser) {
        // 確保 token 設置在 axios headers
        const token = localStorage.getItem('token');
        if (token) {
          setAuthHeader(token);
        }
        
        console.log("從 localStorage 獲取用戶信息成功:", storedUser);
        return storedUser;
      }
      
      // 如果本地存儲中沒有，則嘗試從 cookie 獲取用戶 ID 和 token
      const userIdFromCookie = getUserIdFromCookie();
      const tokenFromCookie = getWorldWearTokenFromCookie();
      
      if (userIdFromCookie && tokenFromCookie) {
        console.log("從 cookie 獲取用戶認證成功:", userIdFromCookie);
        
        // 通過 userId 查找對應的用戶
        const user = dbUsers.find(u => u.id === userIdFromCookie);
        
        if (user) {
          const userToStore = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          };
          
          // 使用從 cookie 中獲取的 token
          localStorage.setItem('user', JSON.stringify(userToStore));
          localStorage.setItem('token', tokenFromCookie);
          
          // 設置 axios 請求頭
          setAuthHeader(tokenFromCookie);
          
          console.log("從 cookie 恢復用戶會話成功:", userToStore);
          
          return userToStore;
        }
      }
      
      return rejectWithValue('未登入');
    } catch (error) {
      console.error('獲取用戶信息錯誤:', error);
      return rejectWithValue('獲取用戶信息失敗');
    }
  }
);

// 模擬預設帳號登入
export const loginWithPredefinedAccount = createAsyncThunk(
  'auth/loginPredefined',
  async (accountType = 'user', { rejectWithValue }) => {
    try {
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 根據帳號類型選擇預設用戶
      let selectedUser;
      if (accountType === 'admin') {
        selectedUser = dbUsers.find(u => u.role === 'admin');
      } else {
        selectedUser = dbUsers.find(u => u.role === 'user');
      }
      
      if (!selectedUser) {
        return rejectWithValue('無法找到預設帳號');
      }
      
      // 生成 JWT 格式的令牌
      const jwtToken = generateJWT(selectedUser.id, selectedUser.email, '1h');
      const refreshToken = `refresh-${Date.now()}-${selectedUser.id}`;
      
      // 將用戶資訊存儲到本地，但不包含密碼
      const userToStore = {
        id: selectedUser.id,
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role
      };
      
      // 設置完整的用戶認證信息
      setFullUserAuth(userToStore, jwtToken, refreshToken, 7);
      
      console.log("預設帳號登入成功:", userToStore);
      
      return {
        user: userToStore,
        accessToken: jwtToken
      };
    } catch (error) {
      console.error('預設帳號登入錯誤:', error);
      return rejectWithValue('登入處理過程中發生錯誤');
    }
  }
);

// 忘記密碼功能
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      console.log("嘗試請求密碼重設:", email);
      
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 檢查郵件是否存在於系統中（資料庫用戶或新註冊用戶）
      const isEmailInDatabase = dbUsers.some(u => u.email === email);
      const isEmailInNewRegistrations = userCredentialsMap.has(email);
      
      if (!isEmailInDatabase && !isEmailInNewRegistrations) {
        return rejectWithValue('此電子郵件未註冊');
      }
      
      // 在實際應用中，這裡會發送一封包含重設連結的電子郵件
      console.log("已發送重設密碼請求至:", email);
      
      return { success: true, message: '密碼重設連結已發送' };
    } catch (error) {
      console.error('密碼重設請求錯誤:', error);
      return rejectWithValue('處理密碼重設請求時發生錯誤');
    }
  }
);

// 初始化 auth 輔助函數 - 用於應用啟動時設置
export const initializeAuth = () => {
  // 從 localStorage 獲取 token
  const token = localStorage.getItem('token');
  if (token) {
    // 如果有 token，設置 axios 默認 headers
    setAuthHeader(token);
  }
  
  // 檢查 cookie
  const userIdFromCookie = getUserIdFromCookie();
  const tokenFromCookie = getWorldWearTokenFromCookie();
  
  if (userIdFromCookie && tokenFromCookie && !token) {
    // 如果 cookie 中有用戶 ID 和 token 但 localStorage 中沒有 token
    console.log("發現 cookie 中有有效的用戶認證，但未在 localStorage 找到對應 token");
    return { 
      shouldFetchUser: true, 
      userId: userIdFromCookie,
      token: tokenFromCookie
    };
  }
  
  return { shouldFetchUser: false };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    token: localStorage.getItem('token') || getWorldWearTokenFromCookie() || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    // 檢查 localStorage 和 cookie 來決定初始登入狀態
    status: (getStoredUser() || isUserLoggedInByCookie()) ? 'logged-in' : 'idle',
    error: null,
    resetPasswordRequestStatus: 'idle'
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.status = 'idle';
      state.error = null;
      
      // 清除所有用戶資料
      clearAllUserData();
      
      // 清除 axios headers
      setAuthHeader(null);
      
      console.log("用戶登出，所有數據已清除");
    },
    clearError: (state) => {
      state.error = null;
    },
    // 同步外部 API 的登入狀態
    syncExternalLoginState: (state, action) => {
      const { accessToken, userId } = action.payload;
      if (accessToken && userId) {
        // 更新 cookie
        syncExternalAuth(accessToken, userId);
        state.token = accessToken;
        console.log("已同步外部 API 登入狀態");
      }
    },
    // 初始化 auth 狀態
    initAuth: (state) => {
      const token = localStorage.getItem('token') || getWorldWearTokenFromCookie();
      const user = getStoredUser();
      const userIdCookie = getUserIdFromCookie();
      
      // 如果 localStorage 中有 token 和 user
      if (token && user) {
        state.token = token;
        state.user = user;
        state.status = 'logged-in';
        setAuthHeader(token);
        state.refreshToken = localStorage.getItem('refreshToken');
        console.log("初始化 Auth: 從 localStorage 恢復會話成功");
      } 
      // 如果只有 cookie 中有用戶 ID 和 token
      else if (userIdCookie && token) {
        state.token = token;
        state.status = 'cookie-detected';
        console.log("初始化 Auth: 檢測到 cookie 中有用戶 ID", userIdCookie);
        // 這裡可以觸發一個 action 來從 cookie 恢復用戶會話
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // 登入
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'logged-in';
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || '登入失敗';
      })
      
      // 同步外部登入
      .addCase(syncExternalLogin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(syncExternalLogin.fulfilled, (state, action) => {
        state.status = 'logged-in';
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
      })
      .addCase(syncExternalLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || '同步外部登入失敗';
      })
      
      // 預設帳號登入
      .addCase(loginWithPredefinedAccount.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginWithPredefinedAccount.fulfilled, (state, action) => {
        state.status = 'logged-in';
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginWithPredefinedAccount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || '預設帳號登入失敗';
      })
      
      // 註冊
      .addCase(signupUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.status = 'signup-success';
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || '註冊失敗';
      })
      
      // 獲取當前用戶信息
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = state.status === 'idle' || state.status === 'cookie-detected' 
          ? 'loading' 
          : state.status;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'logged-in';
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (action.payload === '未登入') {
          state.status = 'idle';
          // 清除 cookie，因為它可能已經過期
          clearAllUserCookies();
        } else {
          state.status = 'failed';
          state.error = action.payload;
        }
      })
      
      // 忘記密碼
      .addCase(requestPasswordReset.pending, (state) => {
        state.resetPasswordRequestStatus = 'loading';
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.resetPasswordRequestStatus = 'success';
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.resetPasswordRequestStatus = 'failed';
        state.error = action.payload || '密碼重設請求失敗';
      });
  }
});

export const { logout, clearError, initAuth, syncExternalLoginState } = authSlice.actions;
export default authSlice.reducer;


// ----------------------------------------
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { 
//   setUserIdCookie, 
//   clearAllUserCookies, 
//   getUserIdFromCookie, 
//   isUserLoggedInByCookie,
//   clearAllUserData,
//   setCookie,
//   COOKIE_NAMES 
// } from "../components/tools/cookieUtils";

// // 用於儲存新註冊用戶的原始密碼，以便在模擬環境中登入
// // 注意：這只是用於模擬目的，實際生產環境中絕不能這樣做
// const userCredentialsMap = new Map();

// // 從資料庫導入的使用者數據
// const dbUsers = [
//   {
//     "email": "worldwear@gmail.com",
//     "password": "$2a$10$y4mim8jjw8kXZLNA3b4sLupUHFe768FCBwkNUprUXfEERkGNbcSaW",
//     "role": "admin",
//     "id": "pqyfZ3sGxjTKmTSjmCAKa",
//     "username": "管理員" // 為了顯示，添加用戶名
//   },
//   {
//     "email": "test@gmail.com",
//     "password": "$2a$10$SeA6eM43X2ThO3ikPZxmvu7XYvikgzaRjcMZ6BrLF80gLRafAfwqi",
//     "role": "user",
//     "username": "test",
//     "id": "pbs5UHdZo7Th7_BStU-o9"
//   },
//   {
//     "email": "qa@gmail.com",
//     "password": "$2a$10$riE41dU5cvXOYCVQvkqQFOYNlMIWxyiJoKbThgGUndm2lVkKsc6nq",
//     "role": "user",
//     "username": "qa",
//     "id": "Ct5HXrUgBSgTZnal_qJdU"
//   }
// ];

// // 預設用戶的密碼對照表
// const defaultUserPasswords = {
//   "worldwear@gmail.com": "worldwear",
//   "test@gmail.com": "12345678",
//   "qa@gmail.com": "test1234"
// };

// // 本地存儲中獲取用戶信息
// const getStoredUser = () => {
//   try {
//     const storedUser = localStorage.getItem('user');
//     return storedUser ? JSON.parse(storedUser) : null;
//   } catch (error) {
//     console.error('解析本地存儲的用戶信息失敗:', error);
//     return null;
//   }
// };

// // 設置 axios 請求頭中的 Authorization
// const setAuthHeader = (token) => {
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     console.log('設置 axios Authorization header 成功:', token);
//     return true;
//   }
  
//   delete axios.defaults.headers.common['Authorization'];
//   console.log('清除 axios Authorization header');
//   return false;
// };

// // 設置完整的用戶認證信息（包括 Cookie 和 localStorage）
// const setFullUserAuth = (user, token, refreshToken, days = 7) => {
//   if (!user || !user.id || !token) {
//     console.error('設置用戶認證信息失敗: 參數不完整');
//     return false;
//   }
  
//   try {
//     // 儲存 Token 到 Cookie
//     setCookie(COOKIE_NAMES.TOKEN, token, days);
    
//     // 儲存用戶 ID 到 Cookie
//     setUserIdCookie(user.id, days);
    
//     // 儲存到 localStorage
//     localStorage.setItem('user', JSON.stringify(user));
//     localStorage.setItem('token', token);
//     if (refreshToken) {
//       localStorage.setItem('refreshToken', refreshToken);
//     }
    
//     // 設置請求頭
//     setAuthHeader(token);
    
//     console.log('設置用戶認證信息成功:', user.id);
//     return true;
//   } catch (error) {
//     console.error('設置用戶認證信息失敗:', error);
//     return false;
//   }
// };

// // 本地認證的登入功能
// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async (userData, { rejectWithValue }) => {
//     try {
//       console.log("嘗試登入資料:", userData);
      
//       // 模擬API請求延遲
//       await new Promise(resolve => setTimeout(resolve, 800));
      
//       // 在真實用戶數據中尋找匹配的電子郵件
//       const user = dbUsers.find(u => u.email === userData.email);
      
//       if (!user) {
//         return rejectWithValue('電子郵件或密碼不正確');
//       }
      
//       // 驗證密碼
//       let passwordValid = false;
      
//       // 首先檢查是否是預設用戶
//       if (defaultUserPasswords[user.email] && userData.password === defaultUserPasswords[user.email]) {
//         passwordValid = true;
//       } 
//       // 然後檢查是否是新註冊用戶
//       else if (userCredentialsMap.has(user.email) && userData.password === userCredentialsMap.get(user.email)) {
//         passwordValid = true;
//       }
      
//       if (!passwordValid) {
//         return rejectWithValue('電子郵件或密碼不正確');
//       }
      
//       // 生成模擬的令牌
//       const mockToken = `mock-jwt-${Date.now()}-${user.id}`;
//       const mockRefreshToken = `mock-refresh-${Date.now()}-${user.id}`;
      
//       // 將用戶資訊存儲到本地，但不包含密碼
//       const userToStore = {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         role: user.role
//       };
      
//       // 設置完整的用戶認證信息
//       setFullUserAuth(userToStore, mockToken, mockRefreshToken, 7);
      
//       console.log("登入成功:", userToStore);
      
//       return {
//         user: userToStore,
//         accessToken: mockToken
//       };
//     } catch (error) {
//       console.error('登入模擬錯誤:', error);
//       return rejectWithValue('登入處理過程中發生錯誤');
//     }
//   }
// );

// // 本地註冊功能 - 使用與資料庫相容的ID格式
// export const signupUser = createAsyncThunk(
//   'auth/signup',
//   async (userData, { rejectWithValue }) => {
//     try {
//       console.log("嘗試註冊資料:", userData);
      
//       // 模擬API請求延遲
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // 檢查電子郵件是否已被使用
//       if (dbUsers.some(u => u.email === userData.email)) {
//         return rejectWithValue('此電子郵件已被註冊');
//       }
      
//       // 生成與資料庫兼容的ID格式
//       const generateId = () => {
//         const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
//         let id = '';
//         for (let i = 0; i < 20; i++) {
//           id += chars.charAt(Math.floor(Math.random() * chars.length));
//         }
//         return id;
//       };
      
//       // 模擬加密密碼 (實際情況下應該在後端處理)
//       const hashedPassword = `$2a$10$MockHashedPassword${Date.now()}`;
      
//       // 模擬創建新用戶 (僅記憶體中，重新整理後會消失)
//       const newUser = {
//         id: generateId(),
//         username: userData.username,
//         email: userData.email,
//         password: hashedPassword,
//         role: 'user'
//       };
      
//       // 將新用戶添加到模擬數據中
//       dbUsers.push(newUser);
      
//       // 保存用戶原始密碼到映射表中 (僅用於模擬登入)
//       userCredentialsMap.set(userData.email, userData.password);
      
//       console.log("註冊成功:", newUser);
      
//       return {
//         user: {
//           id: newUser.id,
//           username: newUser.username,
//           email: newUser.email,
//           role: newUser.role
//         }
//       };
//     } catch (error) {
//       console.error('註冊模擬錯誤:', error);
//       return rejectWithValue('註冊處理過程中發生錯誤');
//     }
//   }
// );

// // 獲取當前用戶信息 - 同時檢查 localStorage 和 cookie
// export const fetchCurrentUser = createAsyncThunk(
//   'auth/fetchCurrentUser',
//   async (_, { rejectWithValue }) => {
//     try {
//       // 模擬API請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       // 優先從 localStorage 獲取用戶信息
//       const storedUser = getStoredUser();
      
//       if (storedUser) {
//         // 確保 token 設置在 axios headers
//         const token = localStorage.getItem('token');
//         if (token) {
//           setAuthHeader(token);
//         }
        
//         console.log("從 localStorage 獲取用戶信息成功:", storedUser);
//         return storedUser;
//       }
      
//       // 如果本地存儲中沒有，則嘗試從 cookie 獲取用戶 ID
//       const userIdFromCookie = getUserIdFromCookie();
      
//       if (userIdFromCookie) {
//         console.log("從 cookie 獲取用戶 ID 成功:", userIdFromCookie);
        
//         // 通過 userId 查找對應的用戶
//         const user = dbUsers.find(u => u.id === userIdFromCookie);
        
//         if (user) {
//           const userToStore = {
//             id: user.id,
//             username: user.username,
//             email: user.email,
//             role: user.role
//           };
          
//           // 生成新的 token
//           const mockToken = `mock-jwt-${Date.now()}-${user.id}`;
//           const mockRefreshToken = `mock-refresh-${Date.now()}-${user.id}`;
          
//           // 設置完整的用戶認證信息
//           setFullUserAuth(userToStore, mockToken, mockRefreshToken, 7);
          
//           console.log("從 cookie 恢復用戶會話成功:", userToStore);
          
//           return userToStore;
//         }
//       }
      
//       return rejectWithValue('未登入');
//     } catch (error) {
//       console.error('獲取用戶信息錯誤:', error);
//       return rejectWithValue('獲取用戶信息失敗');
//     }
//   }
// );

// // 模擬預設帳號登入
// export const loginWithPredefinedAccount = createAsyncThunk(
//   'auth/loginPredefined',
//   async (accountType = 'user', { rejectWithValue }) => {
//     try {
//       // 模擬API請求延遲
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       // 根據帳號類型選擇預設用戶
//       let selectedUser;
//       if (accountType === 'admin') {
//         selectedUser = dbUsers.find(u => u.role === 'admin');
//       } else {
//         selectedUser = dbUsers.find(u => u.role === 'user');
//       }
      
//       if (!selectedUser) {
//         return rejectWithValue('無法找到預設帳號');
//       }
      
//       // 生成模擬的令牌
//       const mockToken = `mock-jwt-${Date.now()}-${selectedUser.id}`;
//       const mockRefreshToken = `mock-refresh-${Date.now()}-${selectedUser.id}`;
      
//       // 將用戶資訊存儲到本地，但不包含密碼
//       const userToStore = {
//         id: selectedUser.id,
//         username: selectedUser.username,
//         email: selectedUser.email,
//         role: selectedUser.role
//       };
      
//       // 設置完整的用戶認證信息
//       setFullUserAuth(userToStore, mockToken, mockRefreshToken, 7);
      
//       console.log("預設帳號登入成功:", userToStore);
      
//       return {
//         user: userToStore,
//         accessToken: mockToken
//       };
//     } catch (error) {
//       console.error('預設帳號登入錯誤:', error);
//       return rejectWithValue('登入處理過程中發生錯誤');
//     }
//   }
// );

// // 忘記密碼功能
// export const requestPasswordReset = createAsyncThunk(
//   'auth/requestPasswordReset',
//   async (email, { rejectWithValue }) => {
//     try {
//       console.log("嘗試請求密碼重設:", email);
      
//       // 模擬API請求延遲
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // 檢查郵件是否存在於系統中（資料庫用戶或新註冊用戶）
//       const isEmailInDatabase = dbUsers.some(u => u.email === email);
//       const isEmailInNewRegistrations = userCredentialsMap.has(email);
      
//       if (!isEmailInDatabase && !isEmailInNewRegistrations) {
//         return rejectWithValue('此電子郵件未註冊');
//       }
      
//       // 在實際應用中，這裡會發送一封包含重設連結的電子郵件
//       console.log("已發送重設密碼請求至:", email);
      
//       return { success: true, message: '密碼重設連結已發送' };
//     } catch (error) {
//       console.error('密碼重設請求錯誤:', error);
//       return rejectWithValue('處理密碼重設請求時發生錯誤');
//     }
//   }
// );

// // 初始化 auth 輔助函數 - 用於應用啟動時設置
// export const initializeAuth = () => {
//   // 從 localStorage 獲取 token
//   const token = localStorage.getItem('token');
//   if (token) {
//     // 如果有 token，設置 axios 默認 headers
//     setAuthHeader(token);
//   }
  
//   // 檢查 cookie
//   const userIdFromCookie = getUserIdFromCookie();
//   if (userIdFromCookie && !token) {
//     // 如果 cookie 中有用戶 ID 但 localStorage 中沒有 token
//     // 可以觸發 fetchCurrentUser 來恢復用戶會話
//     console.log("發現 cookie 中有有效的用戶 ID，但未在 localStorage 找到對應 token");
//     return { 
//       shouldFetchUser: true, 
//       userId: userIdFromCookie 
//     };
//   }
  
//   return { shouldFetchUser: false };
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: getStoredUser(),
//     token: localStorage.getItem('token') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     // 檢查 localStorage 和 cookie 來決定初始登入狀態
//     status: (getStoredUser() || isUserLoggedInByCookie()) ? 'logged-in' : 'idle',
//     error: null,
//     resetPasswordRequestStatus: 'idle'
//   },
//   reducers: {
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//       state.refreshToken = null;
//       state.status = 'idle';
//       state.error = null;
      
//       // 清除所有用戶資料
//       clearAllUserData();
      
//       // 清除 axios headers
//       setAuthHeader(null);
      
//       console.log("用戶登出，所有數據已清除");
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     // 初始化 auth 狀態
//     initAuth: (state) => {
//       const token = localStorage.getItem('token');
//       const user = getStoredUser();
//       const userIdCookie = getUserIdFromCookie();
      
//       // 如果 localStorage 中有 token 和 user
//       if (token && user) {
//         state.token = token;
//         state.user = user;
//         state.status = 'logged-in';
//         setAuthHeader(token);
//         state.refreshToken = localStorage.getItem('refreshToken');
//         console.log("初始化 Auth: 從 localStorage 恢復會話成功");
//       } 
//       // 如果只有 cookie 中有用戶 ID
//       else if (userIdCookie) {
//         state.status = 'cookie-detected';
//         console.log("初始化 Auth: 檢測到 cookie 中有用戶 ID", userIdCookie);
//         // 這裡可以觸發一個 action 來從 cookie 恢復用戶會話
//       }
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // 登入
//       .addCase(loginUser.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.status = 'logged-in';
//         state.user = action.payload.user;
//         state.token = action.payload.accessToken;
//         state.error = null;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || '登入失敗';
//       })
      
//       // 預設帳號登入
//       .addCase(loginWithPredefinedAccount.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(loginWithPredefinedAccount.fulfilled, (state, action) => {
//         state.status = 'logged-in';
//         state.user = action.payload.user;
//         state.token = action.payload.accessToken;
//         state.error = null;
//       })
//       .addCase(loginWithPredefinedAccount.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || '預設帳號登入失敗';
//       })
      
//       // 註冊
//       .addCase(signupUser.pending, (state) => {
//         state.status = 'loading';
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state) => {
//         state.status = 'signup-success';
//         state.error = null;
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload || '註冊失敗';
//       })
      
//       // 獲取當前用戶信息
//       .addCase(fetchCurrentUser.pending, (state) => {
//         state.status = state.status === 'idle' || state.status === 'cookie-detected' 
//           ? 'loading' 
//           : state.status;
//       })
//       .addCase(fetchCurrentUser.fulfilled, (state, action) => {
//         state.user = action.payload;
//         state.status = 'logged-in';
//       })
//       .addCase(fetchCurrentUser.rejected, (state, action) => {
//         if (action.payload === '未登入') {
//           state.status = 'idle';
//           // 清除 cookie，因為它可能已經過期
//           clearAllUserCookies();
//         } else {
//           state.status = 'failed';
//           state.error = action.payload;
//         }
//       })
      
//       // 忘記密碼
//       .addCase(requestPasswordReset.pending, (state) => {
//         state.resetPasswordRequestStatus = 'loading';
//         state.error = null;
//       })
//       .addCase(requestPasswordReset.fulfilled, (state) => {
//         state.resetPasswordRequestStatus = 'success';
//       })
//       .addCase(requestPasswordReset.rejected, (state, action) => {
//         state.resetPasswordRequestStatus = 'failed';
//         state.error = action.payload || '密碼重設請求失敗';
//       });
//   }
// });

// export const { logout, clearError, initAuth } = authSlice.actions;
// export default authSlice.reducer;