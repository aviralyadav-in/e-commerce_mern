import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// Local storage se data safely nikalne ka function
const getAdminFromStorage = () => {
  try {
    const admin = localStorage.getItem("adminUser");
    return admin ? JSON.parse(admin) : null;
  } catch (error) {
    return null;
  }
};

// Async Thunk for Admin Login
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      // Backend POST request for login
      const response = await API.post("/auth/admin/login", credentials);
      
      const user = response.data.user;

      // Token cookies mein store hoga backend se, par hum user info localStorage me rakhenge UI ke liye
      localStorage.setItem("adminUser", JSON.stringify(user));

      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Something went wrong! Server might be down.",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    admin: getAdminFromStorage(),
    loading: false,
    error: null,
    isAuthenticated: !!getAdminFromStorage(),
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("adminUser");
      state.admin = null;
      state.isAuthenticated = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.admin = action.payload;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
