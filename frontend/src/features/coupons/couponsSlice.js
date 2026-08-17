import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 1. Fetch All Coupons
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/coupons");
      return response.data.coupons || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching coupons",
      );
    }
  },
);

// 2. Add Coupon
export const addCoupon = createAsyncThunk(
  "coupons/add",
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await API.post("/coupons", couponData);
      return response.data.coupon;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error adding coupon",
      );
    }
  },
);

// 3. Update Coupon
export const updateCoupon = createAsyncThunk(
  "coupons/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/coupons/${id}`, data);
      return response.data.coupon;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating coupon",
      );
    }
  },
);

// 4. Delete Coupon
export const deleteCoupon = createAsyncThunk(
  "coupons/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/coupons/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting coupon",
      );
    }
  },
);

const couponsSlice = createSlice({
  name: "coupons",
  initialState: {
    coupons: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.push(action.payload);
      })
      .addCase(addCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponError } = couponsSlice.actions;
export default couponsSlice.reducer;
