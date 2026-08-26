import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/wishlist");
      return response.data.wishlist?.products || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching wishlist",
      );
    }
  },
);

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await API.post("/wishlist/toggle", {
        productId,
      });
      return {
        products: response.data.wishlist?.products || [],
        action: response.data.action,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating wishlist",
      );
    }
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    products: [], // populated product objects
    loading: false,
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.products = action.payload.products.filter(
          (item) => item.product,
        );
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
