import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchInquiries = createAsyncThunk(
  "inquiries/fetchInquiries",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get("/inquiries", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load inquiries",
      );
    }
  },
);

export const updateInquiryStatus = createAsyncThunk(
  "inquiries/updateStatus",
  async ({ id, status, adminNotes }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/inquiries/${id}`, {
        status,
        adminNotes,
      });
      return response.data.inquiry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update inquiry",
      );
    }
  },
);

export const createInquiry = createAsyncThunk(
  "inquiries/createInquiry",
  async (inquiryData, { rejectWithValue }) => {
    try {
      // Admin lead — admin-only route (public route status/adminNotes ignore karta hai)
      const response = await API.post("/inquiries/admin", inquiryData);
      return response.data.inquiry;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create inquiry",
      );
    }
  },
);

export const deleteInquiry = createAsyncThunk(
  "inquiries/deleteInquiry",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/inquiries/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete inquiry",
      );
    }
  },
);

const inquiriesSlice = createSlice({
  name: "inquiries",
  initialState: {
    inquiries: [],
    counts: {
      total: 0,
      new: 0,
      inProgress: 0,
      resolved: 0,
    },
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.inquiries = action.payload.inquiries || [];
        state.counts = action.payload.counts || state.counts;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchInquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Inquiry
      .addCase(createInquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInquiry.fulfilled, (state, action) => {
        state.loading = false;
        const newInq = action.payload;
        state.inquiries.unshift(newInq);
        state.counts.total += 1;
        if (newInq.status === "New") state.counts.new += 1;
        else if (newInq.status === "In Progress") state.counts.inProgress += 1;
        else if (newInq.status === "Resolved") state.counts.resolved += 1;
      })
      .addCase(createInquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Inquiry
      .addCase(updateInquiryStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.inquiries.findIndex((inq) => inq._id === updated._id);
        if (index !== -1) {
          const oldStatus = state.inquiries[index].status;
          state.inquiries[index] = updated;

          if (oldStatus !== updated.status) {
            // Decrement old
            if (oldStatus === "New" && state.counts.new > 0) state.counts.new -= 1;
            else if (oldStatus === "In Progress" && state.counts.inProgress > 0) state.counts.inProgress -= 1;
            else if (oldStatus === "Resolved" && state.counts.resolved > 0) state.counts.resolved -= 1;

            // Increment new
            if (updated.status === "New") state.counts.new += 1;
            else if (updated.status === "In Progress") state.counts.inProgress += 1;
            else if (updated.status === "Resolved") state.counts.resolved += 1;
          }
        }
      })
      .addCase(updateInquiryStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Inquiry
      .addCase(deleteInquiry.fulfilled, (state, action) => {
        const target = state.inquiries.find((inq) => inq._id === action.payload);
        if (target) {
          if (target.status === "New" && state.counts.new > 0) state.counts.new -= 1;
          else if (target.status === "In Progress" && state.counts.inProgress > 0) state.counts.inProgress -= 1;
          else if (target.status === "Resolved" && state.counts.resolved > 0) state.counts.resolved -= 1;
        }
        state.inquiries = state.inquiries.filter((inq) => inq._id !== action.payload);
        if (state.counts.total > 0) state.counts.total -= 1;
      })
      .addCase(deleteInquiry.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default inquiriesSlice.reducer;
