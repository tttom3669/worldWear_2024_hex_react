import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import cookieUtils from "../components/tools/cookieUtils";

// 從環境變數獲取 API 路徑
const { VITE_API_PATH: API_PATH } = import.meta.env;

// 登入功能
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      console.log("嘗試登入資料:", userData);
      
      // 使用 GET 方法模擬登入
      const response = await axios.get(`${API_PATH}/login`, {
        params: {
          email: userData.email,
          password: userData.password
        }
      });
      
      // 確認是否收到有效的響應和 token
      if (response.data && response.data.accessToken) {
        const { user, accessToken } = response.data;
        
        // 準備用戶資訊
        const userToStore = {
          id: user.id,
          username: user.username || user.name,
          email: user.email,
          role: user.role || 'user'
        };
        
        // 設置 Cookie 和本地存儲，使用 cookieUtils
        const cookieExpireDays = userData.rememberMe ? 30 : 1;
        
        // 儲存登入資訊
        cookieUtils.saveLoginInfo(
          userToStore, 
          accessToken, 
          cookieExpireDays
        );
        
        console.log("登入成功:", userToStore);
        
        return {
          user: userToStore,
          accessToken: cookieUtils.getJWTToken()
        };
      } else {
        // 如果響應中沒有 token，拋出錯誤
        return rejectWithValue('登入失敗：未收到有效的令牌');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      
      // 處理不同類型的錯誤
      let errorMsg = '登入失敗，請檢查您的憑據';
      if (error.response) {
        // 伺服器回應了錯誤訊息
        errorMsg = error.response.data.message || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      return rejectWithValue(errorMsg);
    }
  }
);

// 檢查電子郵件是否已存在
export const checkEmailExists = createAsyncThunk(
  'auth/checkEmailExists',
  async (email, { rejectWithValue }) => {
    try {
      // 使用 axios 檢查郵件是否存在
      const response = await axios.get(`${API_PATH}/users`, {
        params: { email }
      });
      
      return {
        email,
        exists: response.data.length > 0
      };
    } catch (error) {
      return rejectWithValue('檢查郵件是否存在時發生錯誤');
    }
  }
);

// 註冊功能
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      // 使用 axios 發送註冊請求
      const response = await axios.post(`${API_PATH}/signup`, {
        email: userData.email,
        password: userData.password,
        username: userData.username,
        role: 'user' // 預設角色
      });
      
      if (response.data) {
        return {
          user: response.data.user
        };
      } else {
        return rejectWithValue('註冊失敗：伺服器未返回有效響應');
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
      
      return rejectWithValue(errorMsg);
    }
  }
);

// 檢查登入狀態
export const checkLogin = createAsyncThunk(
  'auth/checkLogin',
  async (_, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 檢查是否登入
      if (!cookieUtils.isUserLoggedIn()) {
        throw new Error('未登入');
      }
      
      // 獲取當前用戶
      const user = cookieUtils.getCurrentUser();
      
      if (!user) {
        throw new Error('用戶不存在');
      }
      
      return {
        user,
        token: cookieUtils.getJWTToken()
      };
    } catch (error) {
      // 清除所有認證信息
      cookieUtils.clearAllUserData();
      return rejectWithValue(error.message || '未登入');
    }
  }
);

// 獲取當前用戶信息
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 獲取用戶 ID
      const userId = cookieUtils.getUserIdFromCookie();
      
      if (!userId) {
        throw new Error('無法獲取用戶 ID');
      }
      
      // 獲取用戶詳細資訊
      const response = await axios.get(`${API_PATH}/users/${userId}?_expand=favorites&_expand=orders&_expand=carts`);
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('無法獲取用戶資訊');
      }
    } catch (error) {
      console.error('獲取用戶信息失敗:', error);
      return rejectWithValue(error.response?.data?.message || '獲取用戶信息失敗');
    }
  }
);

// 登出功能
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // 使用 cookieUtils 清除所有用戶數據
      cookieUtils.clearAllUserData();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue('登出失敗');
    }
  }
);

// 請求重設密碼
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      // 發送重設密碼請求
      const response = await axios.post(`${API_PATH}/reset-password`, { email });
      
      console.log("密碼重設請求成功，已發送郵件至:", email);
      
      return { 
        email,
        message: response.data.message || '密碼重設郵件已發送'
      };
    } catch (error) {
      console.error('重設密碼請求錯誤:', error);
      
      let errorMsg = '重設密碼請求處理失敗';
      if (error.response) {
        errorMsg = error.response.data.message || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      return rejectWithValue(errorMsg);
    }
  }
);

// 創建 authSlice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: cookieUtils.getCurrentUser(),
    token: cookieUtils.getJWTToken(),
    status: cookieUtils.isUserLoggedIn() ? 'logged-in' : 'idle',
    error: null,
    resetPasswordRequestStatus: 'idle',
    emailCheckStatus: 'idle',
    emailExists: false,
    checkedEmail: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 檢查郵件是否存在
      .addCase(checkEmailExists.pending, (state) => {
        state.emailCheckStatus = 'loading';
      })
      .addCase(checkEmailExists.fulfilled, (state, action) => {
        state.emailCheckStatus = 'succeeded';
        state.emailExists = action.payload.exists;
        state.checkedEmail = action.payload.email;
      })
      .addCase(checkEmailExists.rejected, (state) => {
        state.emailCheckStatus = 'failed';
      })

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
      
      // 登出
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || '登出失敗';
      })
      
      // 檢查登入狀態
      .addCase(checkLogin.pending, (state) => {
        state.status = 'checking';
      })
      .addCase(checkLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'logged-in';
        state.error = null;
      })
      .addCase(checkLogin.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.status = 'idle';
        state.error = action.payload;
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

      // 請求重設密碼
      .addCase(requestPasswordReset.pending, (state) => {
        state.resetPasswordRequestStatus = 'loading';
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.resetPasswordRequestStatus = 'succeeded';
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.resetPasswordRequestStatus = 'failed';
        state.error = action.payload || '重設密碼請求失敗';
      })
      
      // 獲取當前用戶信息
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = state.status === 'idle' ? 'loading' : state.status;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'logged-in';
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (action.payload === '未登入') {
          state.status = 'idle';
          state.user = null;
          state.token = null;
        } else {
          state.status = 'failed';
          state.error = action.payload;
        }
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;