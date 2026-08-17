import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 1. Fetch All Banners
export const fetchBanners = createAsyncThunk(
  "banners/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/banners");
      return response.data.banners || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching banners",
      );
    }
  },
);

// 2. Add Banner
export const addBanner = createAsyncThunk(
  "banners/add",
  async (bannerData, { rejectWithValue }) => {
    try {
      const response = await API.post("/banners", bannerData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.banner;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error adding banner",
      );
    }
  },
);

// 3. Update Banner
export const updateBanner = createAsyncThunk(
  "banners/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/banners/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.banner;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating banner",
      );
    }
  },
);

// 4. Delete Banner
export const deleteBanner = createAsyncThunk(
  "banners/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/banners/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting banner",
      );
    }
  },
);

const bannersSlice = createSlice({
  name: "banners",
  initialState: {
    banners: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearBannerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBanner.fulfilled, (state, action) => {
        state.loading = false;
        state.banners.push(action.payload);
      })
      .addCase(addBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.banners.findIndex(
          (b) => b._id === action.payload._id,
        );
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = state.banners.filter((b) => b._id !== action.payload);
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBannerError } = bannersSlice.actions;
export default bannersSlice.reducer;
