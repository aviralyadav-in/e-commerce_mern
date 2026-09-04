import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchOrders = createAsyncThunk(
  "orders/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/orders/admin/all-orders");
      return response.data.orders || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching orders",
      );
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/admin/${id}`);
      return response.data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching order details",
      );
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, orderStatus, paymentStatus }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/orders/admin/${id}/status`, {
        orderStatus,
        paymentStatus,
      });
      return response.data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating order status",
      );
    }
  },
);

// NOTE: Order hard-delete hata diya — admin order ko Cancelled karta hai
// (updateOrderStatus), jisse stock restore hota hai aur record safe rehta hai.

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    selectedOrder: null,
    detailLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order._id === action.payload._id,
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?._id === action.payload._id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSelectedOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
