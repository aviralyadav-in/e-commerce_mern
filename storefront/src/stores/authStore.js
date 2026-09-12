import { create } from "zustand";
import { api } from "../lib/api";

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  authChecked: false,
  error: null,

  // Check current session from cookie
  checkAuth: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/auth/profile");
      set({ user: res.data.user, authChecked: true, loading: false });
      return res.data.user;
    } catch {
      set({ user: null, authChecked: true, loading: false });
      return null;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post("/auth/login", credentials);
      set({ user: res.data.user, loading: false });
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please verify credentials.";
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // Signup
  signup: async (userData) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post("/auth/signup", userData);
      set({ user: res.data.user, loading: false });
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ loading: true });
      await api.post("/auth/logout");
      set({ user: null, loading: false });
      return { success: true };
    } catch (err) {
      set({ user: null, loading: false });
      return { success: false, message: err.message };
    }
  },

  // Update profile
  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await api.patch("/auth/profile", data);
      set({ user: res.data.user, loading: false });
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // Update Avatar
  updateAvatar: async (file) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.put("/auth/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: res.data.user, loading: false });
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload profile photo";
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  // Remove Avatar
  removeAvatar: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.delete("/auth/profile/avatar");
      set({ user: res.data.user, loading: false });
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove avatar";
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  clearError: () => set({ error: null }),
}));
