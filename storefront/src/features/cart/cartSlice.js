import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/cart");
      return response.data.cart || { items: [], totalPrice: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching cart",
      );
    }
  },
);

// Backend par ab absolute quantity set karne ka dedicated endpoint hai
// (PUT /cart/update/:productId) — pehle wala destructive remove→add hack hata diya,
// kyunki re-add stock fail hone par item permanently kho jata tha.
export const setItemQuantity = createAsyncThunk(
  "cart/setQuantity",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      if (quantity <= 0) {
        await API.delete(`/cart/remove/${productId}`);
      } else {
        await API.put(`/cart/update/${productId}`, { quantity });
      }
      const response = await API.get("/cart");
      return response.data.cart || { items: [], totalPrice: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating cart",
      );
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      await API.post("/cart/add", { product: productId, quantity });
      const response = await API.get("/cart");
      return response.data.cart || { items: [], totalPrice: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error adding to cart",
      );
    }
  },
);

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (productId, { rejectWithValue }) => {
    try {
      await API.delete(`/cart/remove/${productId}`);
      const response = await API.get("/cart");
      return response.data.cart || { items: [], totalPrice: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error removing item",
      );
    }
  },
);

export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { rejectWithValue }) => {
    try {
      await API.delete("/cart/clear");
      return { items: [], totalPrice: 0, totalAmountAfterDiscount: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error clearing cart",
      );
    }
  },
);

// Coupon validate karke local discount state me store karte hain
export const applyCoupon = createAsyncThunk(
  "cart/applyCoupon",
  async ({ code, orderTotal }, { rejectWithValue }) => {
    try {
      const response = await API.post("/coupons/apply", { code, orderTotal });
      return {
        code: response.data.coupon.code,
        discountAmount: response.data.discountAmount,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid coupon code",
      );
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: { items: [], totalPrice: 0 },
    coupon: null, // { code, discountAmount }
    loading: false,
    error: null,
  },
  reducers: {
    clearCoupon: (state) => {
      state.coupon = null;
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const success = (state, action) => {
      state.loading = false;
      state.cart = action.payload;
    };
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, success)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, success)
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(setItemQuantity.pending, (state) => {
        state.loading = true;
      })
      .addCase(setItemQuantity.fulfilled, success)
      .addCase(setItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, success)
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.coupon = null;
      })
      .addCase(applyCoupon.pending, (state) => {
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.coupon = action.payload;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCoupon, clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
