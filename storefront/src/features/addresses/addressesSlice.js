import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// Server se aaya error message nikaalo (Zod field errors bhi ho sakte hain)
const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const fetchAddresses = createAsyncThunk(
  "addresses/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/addresses");
      return response.data.addresses || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Error fetching addresses"),
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
      return rejectWithValue(getErrorMessage(error, "Error saving address"));
    }
  },
);

export const updateAddress = createAsyncThunk(
  "addresses/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/addresses/${id}`, data);
      return response.data.address;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Error updating address"));
    }
  },
);

export const setDefaultAddress = createAsyncThunk(
  "addresses/setDefault",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/addresses/${id}/default`);
      return response.data.address;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Could not set default address"),
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
      return rejectWithValue(getErrorMessage(error, "Error deleting address"));
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
  reducers: {},
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
      .addCase(updateAddress.fulfilled, (state, action) => {
        const updated = action.payload;
        state.addresses = state.addresses.map((a) =>
          a._id === updated._id
            ? updated
            : // Agar naya version default ban gaya, baaki ke flags hatao
              { ...a, isDefault: updated.isDefault ? false : a.isDefault },
        );
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const defId = action.payload._id;
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a._id === defId,
        }));
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(
          (a) => a._id !== action.payload,
        );
      });
  },
});

export default addressesSlice.reducer;

