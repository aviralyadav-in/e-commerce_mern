import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/settings");
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load store settings",
      );
    }
  },
);

export const updateSettings = createAsyncThunk(
  "settings/updateSettings",
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await API.put("/settings", settingsData);
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update store settings",
      );
    }
  },
);

export const resetSettings = createAsyncThunk(
  "settings/resetSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.post("/settings/reset");
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset store settings",
      );
    }
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    settings: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(resetSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export default settingsSlice.reducer;
