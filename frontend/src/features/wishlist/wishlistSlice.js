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
        error.response?.data?.message || "Failed to fetch wishlists",
      );
    }
  },
);

export const adminAddToWishlist = createAsyncThunk(
  "wishlist/adminAddToWishlist",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await API.post("/wishlist/admin/add", { userId, productId });
      return response.data.entry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add product to wishlist",
      );
    }
  },
);

export const adminRemoveWishlistItem = createAsyncThunk(
  "wishlist/adminRemoveWishlistItem",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      await API.delete(`/wishlist/admin/${userId}/${productId}`);
      return { userId, productId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item from wishlist",
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
      // Fetch All
      .addCase(fetchAllWishlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWishlists.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlists = action.payload.wishlists || [];
        state.totalEntries = action.payload.totalEntries || 0;
      })
      .addCase(fetchAllWishlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admin Add
      .addCase(adminAddToWishlist.fulfilled, (state, action) => {
        state.wishlists.unshift(action.payload);
        state.totalEntries += 1;
      })
      // Admin Remove
      .addCase(adminRemoveWishlistItem.fulfilled, (state, action) => {
        state.wishlists = state.wishlists.filter(
          (item) =>
            !(
              String(item.userId) === String(action.payload.userId) &&
              String(item.productId) === String(action.payload.productId)
            ),
        );
        if (state.totalEntries > 0) state.totalEntries -= 1;
      });
  },
});

export default wishlistSlice.reducer;
