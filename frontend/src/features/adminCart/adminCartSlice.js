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
        error.response?.data?.message || "Failed to fetch carts",
      );
    }
  },
);

export const adminAddToCart = createAsyncThunk(
  "adminCart/adminAddToCart",
  async ({ userId, productId, variantName, quantity }, { rejectWithValue }) => {
    try {
      const response = await API.post("/cart/admin/add", {
        userId,
        productId,
        variantName,
        quantity,
      });
      return response.data.entry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add item to cart",
      );
    }
  },
);

export const adminRemoveFromCart = createAsyncThunk(
  "adminCart/adminRemoveFromCart",
  async ({ userId, productId, variantName }, { rejectWithValue }) => {
    try {
      await API.delete(`/cart/admin/${userId}/${productId}`, {
        params: { variantName },
      });
      return { userId, productId, variantName };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item from cart",
      );
    }
  },
);

export const adminUpdateCartQuantity = createAsyncThunk(
  "adminCart/adminUpdateCartQuantity",
  async ({ userId, productId, variantName, quantity }, { rejectWithValue }) => {
    try {
      const response = await API.put("/cart/admin/quantity", {
        userId,
        productId,
        variantName,
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update quantity",
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
      // Fetch All
      .addCase(fetchAllCarts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCarts.fulfilled, (state, action) => {
        state.loading = false;
        state.carts = action.payload.carts || [];
        state.totalEntries = action.payload.totalEntries || 0;
      })
      .addCase(fetchAllCarts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admin Add To Cart
      .addCase(adminAddToCart.fulfilled, (state, action) => {
        const newEntry = action.payload;
        const existingIdx = state.carts.findIndex(
          (c) =>
            String(c.userId) === String(newEntry.userId) &&
            String(c.productId) === String(newEntry.productId) &&
            (c.productVariant || null) === (newEntry.productVariant || null),
        );
        if (existingIdx > -1) {
          state.carts[existingIdx] = newEntry;
        } else {
          state.carts.unshift(newEntry);
          state.totalEntries += 1;
        }
      })
      // Admin Remove From Cart
      .addCase(adminRemoveFromCart.fulfilled, (state, action) => {
        const { userId, productId, variantName } = action.payload;
        state.carts = state.carts.filter(
          (c) =>
            !(
              String(c.userId) === String(userId) &&
              String(c.productId) === String(productId) &&
              (c.productVariant || null) === (variantName || null)
            ),
        );
        if (state.totalEntries > 0) state.totalEntries -= 1;
      })
      // Admin Update Quantity
      .addCase(adminUpdateCartQuantity.fulfilled, (state, action) => {
        const { userId, productId, variantName, quantity, itemTotal } = action.payload;
        const item = state.carts.find(
          (c) =>
            String(c.userId) === String(userId) &&
            String(c.productId) === String(productId) &&
            (c.productVariant || null) === (variantName || null),
        );
        if (item) {
          item.quantity = quantity;
          item.itemTotal = itemTotal;
        }
      });
  },
});

export default adminCartSlice.reducer;
