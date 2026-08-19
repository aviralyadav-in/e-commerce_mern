import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchAllCarts = createAsyncThunk(
  "adminCart/fetchAllCarts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/cart/admin/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch carts"
      );
    }
  },
);

const adminCartSlice = createSlice({
  name: "adminCart",
  initialState: {
    carts: [],
    totalEntries: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCarts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCarts.fulfilled, (state, action) => {
        state.loading = false;
        state.carts = action.payload.carts;
        state.totalEntries = action.payload.totalEntries;
      })
      .addCase(fetchAllCarts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminCartSlice.reducer;
