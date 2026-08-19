import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchAllWishlists = createAsyncThunk(
  "wishlist/fetchAllWishlists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/wishlist/admin/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wishlists"
      );
    }
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    wishlists: [],
    totalEntries: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllWishlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWishlists.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlists = action.payload.wishlists;
        state.totalEntries = action.payload.totalEntries;
      })
      .addCase(fetchAllWishlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default wishlistSlice.reducer;
