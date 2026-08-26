import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchAddresses = createAsyncThunk(
  "addresses/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/addresses");
      return response.data.addresses || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching addresses",
      );
    }
  },
);

export const addAddress = createAsyncThunk(
  "addresses/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post("/addresses", data);
      return response.data.address;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error saving address",
      );
    }
  },
);

export const deleteAddress = createAsyncThunk(
  "addresses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/addresses/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting address",
      );
    }
  },
);

const addressesSlice = createSlice({
  name: "addresses",
  initialState: {
    addresses: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses.unshift(action.payload);
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(
          (a) => a._id !== action.payload,
        );
      });
  },
});

export default addressesSlice.reducer;
