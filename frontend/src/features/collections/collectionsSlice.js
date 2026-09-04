import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 1. Fetch All Collections (admin — inactive bhi, restore ke liye)
export const fetchCollections = createAsyncThunk(
  "collections/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/collections/admin/all");
      return response.data.collections || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching collections",
      );
    }
  },
);

// 2. Add Collection
export const addCollection = createAsyncThunk(
  "collections/add",
  async (collectionData, { rejectWithValue }) => {
    try {
      const response = await API.post("/collections/admin", collectionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.collection;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error adding collection",
      );
    }
  },
);

// 3. Update Collection
export const updateCollection = createAsyncThunk(
  "collections/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/collections/admin/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.collection;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating collection",
      );
    }
  },
);

// 4. Delete (soft)
export const deleteCollection = createAsyncThunk(
  "collections/delete",
  async (collectionId, { rejectWithValue }) => {
    try {
      await API.delete(`/collections/admin/${collectionId}`);
      return collectionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting collection",
      );
    }
  },
);

// 5. Restore
export const restoreCollection = createAsyncThunk(
  "collections/restore",
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/collections/admin/${collectionId}/restore`);
      return response.data.collection;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error restoring collection",
      );
    }
  },
);

const collectionsSlice = createSlice({
  name: "collections",
  initialState: {
    collections: [],
    loading: false,
    error: null,
    deleteLoading: false,
  },
  reducers: {
    clearCollectionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.collections.push(action.payload);
      })
      .addCase(addCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCollection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.collections.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(updateCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCollection.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.collections = state.collections.filter(
          (c) => c._id !== action.payload,
        );
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      .addCase(restoreCollection.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(restoreCollection.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const index = state.collections.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.collections[index] = action.payload;
        } else {
          state.collections.push(action.payload);
        }
      })
      .addCase(restoreCollection.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCollectionError } = collectionsSlice.actions;
export default collectionsSlice.reducer;
