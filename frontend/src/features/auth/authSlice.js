import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// Cookie me JWT already hai — session verify karo
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/auth/admin/me");
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Not authenticated",
      );
    }
  },
);

export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      // Backend JWT httpOnly cookie me set karega
      const response = await API.post("/auth/admin/login", credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Something went wrong! Server might be down.",
      );
    }
  },
);

export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      await API.post("/auth/admin/logout");
      return true;
    } catch (error) {
      // Cookie clear fail ho bhi, client state clear karna hai
      return rejectWithValue(
        error.response?.data?.message || "Logout failed",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    admin: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    authChecked: false, // cookie session check ho chuka ya nahi
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth (app load / refresh)
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.authChecked = true;
        state.isAuthenticated = true;
        state.admin = action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.authChecked = true;
        state.isAuthenticated = false;
        state.admin = null;
      })

      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.authChecked = true;
        state.isAuthenticated = true;
        state.admin = action.payload;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.error = action.payload;
      })

      // Logout — cookie clear + state clear
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        // Server fail ho toh bhi local session clear
        state.admin = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.loading = false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
