import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchByProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/reviews/${productId}`);
      return {
        productId,
        reviews: response.data.reviews || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching reviews",
      );
    }
  },
);

export const createReview = createAsyncThunk(
  "reviews/create",
  async ({ product, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await API.post("/reviews", {
        product,
        rating,
        comment,
      });
      return response.data.review;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error submitting review",
      );
    }
  },
);

// Apna review edit karo (PUT /reviews/:id)
export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ id, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/reviews/${id}`, { rating, comment });
      return response.data.review;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating review",
      );
    }
  },
);

// Apna review delete karo (DELETE /reviews/:id)
export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/reviews/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting review",
      );
    }
  },
);


const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    items: [],
    productId: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.reviews;
        state.productId = action.payload.productId;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateReview.pending, (state) => {
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r._id !== action.payload);
      });
  },
});

export default reviewsSlice.reducer;
