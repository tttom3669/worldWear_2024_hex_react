import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const { VITE_BASE_URL: BASE_URL, VITE_API_PATH: API_PATH } = import.meta.env;

const setAuthToken = (token, expired) => {
  if (token) {
    document.cookie = `authToken=${token};expires=${new Date(expired).toUTCString()};path=/`;
    axios.defaults.headers.common.Authorization = token;
  } else {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    delete axios.defaults.headers.common.Authorization;
  }
};

const getAuthToken = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];
};

// User authentication actions
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_PATH}/login`, { email, password });
      const { token, expired } = res.data;
      setAuthToken(token, expired);
      return { token, userRole: 'user' };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ email, password, name }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_PATH}/signup`, { email, password, name });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Signup failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser", 
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_PATH}/logout`);
      setAuthToken(null);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Logout failed");
    }
  }
);

// Admin authentication actions
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_PATH}/login`, { username, password });
      const { token, expired } = res.data;
      setAuthToken(token, expired);
      return { token, userRole: 'admin' };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin", 
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_PATH}/logout`);
      setAuthToken(null);
    } catch (error) {
      return rejectWithValue(error.response?.data || "Logout failed");
    }
  }
);

// Common check login status action
export const checkLoginStatus = createAsyncThunk(
  "auth/checkLoginStatus", 
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      
      axios.defaults.headers.common.Authorization = token;
      const res = await axios.post(`${API_PATH}/user/check`);
      
      // Determine user role from the response if possible
      const userRole = res.data?.role || 'user';
      
      return { token, userRole };
    } catch (error) {
      setAuthToken(null);
      return rejectWithValue("Not authenticated");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: { 
    token: null, 
    status: "idle", 
    error: null,
    userRole: null, // 'user' or 'admin'
  },
  extraReducers: (builder) => {
    builder
      // User login cases
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.userRole = action.payload.userRole;
        state.status = "logged-in";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // User signup cases
      .addCase(signupUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.status = "signup-success";
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // Admin login cases
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.userRole = action.payload.userRole;
        state.status = "logged-in";
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // Check login status cases
      .addCase(checkLoginStatus.pending, (state) => {
        state.status = "checking";
      })
      .addCase(checkLoginStatus.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.userRole = action.payload.userRole;
        state.status = "logged-in";
      })
      .addCase(checkLoginStatus.rejected, (state, action) => {
        state.token = null;
        state.userRole = null;
        state.status = "idle";
        state.error = action.payload;
      })
      
      // Logout cases (both user and admin)
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.userRole = null;
        state.status = "idle";
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.token = null;
        state.userRole = null;
        state.status = "idle";
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;




// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const { VITE_BASE_URL: BASE_URL, VITE_API_PATH: API_PATH } = import.meta.env;

// const setAuthToken = (token, expired) => {
//   if (token) {
//     document.cookie = `authToken=${token};expires=${new Date(expired).toUTCString()};path=/`;
//     axios.defaults.headers.common.Authorization = token;
//   } else {
//     document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
//     delete axios.defaults.headers.common.Authorization;
//   }
// };

// const getAuthToken = () => {
//   return document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("authToken="))
//     ?.split("=")[1];
// };

// // User authentication actions
// export const loginUser = createAsyncThunk(
//   "auth/loginUser",
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const res = await axios.post(`${API_PATH}/login`, { email, password });
//       const { token, expired } = res.data;
//       setAuthToken(token, expired);
//       return { token, userRole: 'user' };
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Login failed");
//     }
//   }
// );

// export const signupUser = createAsyncThunk(
//   "auth/signupUser",
//   async ({ email, password, name }, { rejectWithValue }) => {
//     try {
//       const res = await axios.post(`${API_PATH}/signup`, { email, password, name });
//       return res.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Signup failed");
//     }
//   }
// );

// export const logoutUser = createAsyncThunk(
//   "auth/logoutUser", 
//   async (_, { rejectWithValue }) => {
//     try {
//       await axios.post(`${API_PATH}/logout`);
//       setAuthToken(null);
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Logout failed");
//     }
//   }
// );

// // Admin authentication actions
// export const loginAdmin = createAsyncThunk(
//   "auth/loginAdmin",
//   async ({ username, password }, { rejectWithValue }) => {
//     try {
//       const res = await axios.post(`${API_PATH}/login`, { username, password });
//       const { token, expired } = res.data;
//       setAuthToken(token, expired);
//       return { token, userRole: 'admin' };
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Login failed");
//     }
//   }
// );

// export const logoutAdmin = createAsyncThunk(
//   "auth/logoutAdmin", 
//   async (_, { rejectWithValue }) => {
//     try {
//       await axios.post(`${API_PATH}/logout`);
//       setAuthToken(null);
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Logout failed");
//     }
//   }
// );

// // Common check login status action
// export const checkLoginStatus = createAsyncThunk(
//   "auth/checkLoginStatus", 
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = getAuthToken();
//       if (!token) throw new Error("Not authenticated");
      
//       axios.defaults.headers.common.Authorization = token;
//       const res = await axios.post(`${API_PATH}/user/check`);
      
//       // Determine user role from the response if possible
//       const userRole = res.data?.role || 'user';
      
//       return { token, userRole };
//     } catch (error) {
//       setAuthToken(null);
//       return rejectWithValue("Not authenticated");
//     }
//   }
// );

// const authSlice = createSlice({
//   name: "auth",
//   initialState: { 
//     token: null, 
//     status: "idle", 
//     error: null,
//     userRole: null, // 'user' or 'admin'
//   },
//   extraReducers: (builder) => {
//     builder
//       // User login cases
//       .addCase(loginUser.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.token = action.payload.token;
//         state.userRole = action.payload.userRole;
//         state.status = "logged-in";
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
      
//       // User signup cases
//       .addCase(signupUser.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state) => {
//         state.status = "signup-success";
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
      
//       // Admin login cases
//       .addCase(loginAdmin.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(loginAdmin.fulfilled, (state, action) => {
//         state.token = action.payload.token;
//         state.userRole = action.payload.userRole;
//         state.status = "logged-in";
//       })
//       .addCase(loginAdmin.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
      
//       // Check login status cases
//       .addCase(checkLoginStatus.pending, (state) => {
//         state.status = "checking";
//       })
//       .addCase(checkLoginStatus.fulfilled, (state, action) => {
//         state.token = action.payload.token;
//         state.userRole = action.payload.userRole;
//         state.status = "logged-in";
//       })
//       .addCase(checkLoginStatus.rejected, (state, action) => {
//         state.token = null;
//         state.userRole = null;
//         state.status = "idle";
//         state.error = action.payload;
//       })
      
//       // Logout cases (both user and admin)
//       .addCase(logoutUser.fulfilled, (state) => {
//         state.token = null;
//         state.userRole = null;
//         state.status = "idle";
//       })
//       .addCase(logoutUser.rejected, (state, action) => {
//         state.error = action.payload;
//       })
//       .addCase(logoutAdmin.fulfilled, (state) => {
//         state.token = null;
//         state.userRole = null;
//         state.status = "idle";
//       })
//       .addCase(logoutAdmin.rejected, (state, action) => {
//         state.error = action.payload;
//       });
//   },
// });

// export default authSlice.reducer;