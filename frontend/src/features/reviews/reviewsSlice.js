import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchAllReviews = createAsyncThunk(
  "reviews/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/reviews/admin/all");
      return response.data.reviews || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching reviews",
      );
    }
  },
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/reviews/admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting review",
      );
    }
  },
);

// 🆕 Moderation — approve / hide / re-pending
export const updateReviewStatus = createAsyncThunk(
  "reviews/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/reviews/admin/${id}/status`, { status });
      return response.data.review;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating review status",
      );
    }
  },
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateReviewStatus.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) {
          state.reviews[index] = {
            ...state.reviews[index],
            ...action.payload,
            user:
              typeof action.payload.user === "object" && action.payload.user !== null
                ? action.payload.user
                : state.reviews[index].user,
            product:
              typeof action.payload.product === "object" && action.payload.product !== null
                ? action.payload.product
                : state.reviews[index].product,
          };
        }
      })
      .addCase(updateReviewStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default reviewsSlice.reducer;
