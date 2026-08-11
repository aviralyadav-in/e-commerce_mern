import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import client from "../../api/client";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingSession: true,
  error: null,
};

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/signup", formData);

      return data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Signup failed. Please try again."),
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/login", formData);

      return data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Login failed. Please try again."),
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await client.post("/auth/logout");

      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Logout failed."));
    }
  },
);

export const checkSession = createAsyncThunk(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.get("/auth/profile");

      return data;
    } catch (error) {
      return rejectWithValue(null);
    }
  },
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })

      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Signup failed.";
      })

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Login failed.";
      })

      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Logout failed.";
      })

      .addCase(checkSession.pending, (state) => {
        state.isCheckingSession = true;
      })

      .addCase(checkSession.fulfilled, (state, action) => {
        state.isCheckingSession = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })

      .addCase(checkSession.rejected, (state) => {
        state.isCheckingSession = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
