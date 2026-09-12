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

// 6. Bulk Import Collections via CSV

// 🆕 Status toggle — active ⇄ inactive
export const toggleCollectionStatus = createAsyncThunk(
  "collections/toggleStatus",
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await API.patch(
        `/collections/admin/${collectionId}/toggle-status`,
      );
      return response.data.collection;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error toggling collection status",
      );
    }
  },
);

export const bulkCreateCollections = createAsyncThunk(
  "collections/bulkCreate",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post("/collections/admin/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Bulk import failed",
      );
    }
  },
);

// 7. Bulk Add Products (products table bulk action bar)
// Ek collection me multiple products ek saath — backend $addToSet se
// duplicates skip hote hain, response me { added, skipped } aata hai.
export const bulkAddProducts = createAsyncThunk(
  "collections/bulkAddProducts",
  async ({ collectionId, productIds }, { rejectWithValue }) => {
    try {
      const response = await API.post("/collections/admin/bulk-add-products", {
        collectionId,
        productIds,
      });
      return {
        added: response.data.added ?? 0,
        skipped: response.data.skipped ?? 0,
        collectionId,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Error adding products to collection",
      );
    }
  },
);

// 8. Fetch Products of a Collection (View Products modal)
// Existing GET /products endpoint ka collections filter reuse karta hai -
// backend buildCollectionsCondition manual ids + automated rules DONO
// resolve karta hai, isliye dono collection types ke products mil jaate hain.
// isActive param pass nahi karte - admin ko inactive products bhi dikhne hain.
export const fetchProductsByCollection = createAsyncThunk(
  "collections/fetchProducts",
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/products?collections=${collectionId}&includeInactive=true&limit=100&page=1`,
      );
      const products = response.data.products || [];
      return {
        products,
        totalProducts:
          response.data.pagination?.totalProducts ?? products.length,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Error fetching collection products",
      );
    }
  },
);

const collectionsSlice = createSlice({
  name: "collections",
  initialState: {
    collections: [],
    // 🆕 Bulk add — abhi kaunsi collection row busy hai (spinner ke liye)
    bulkAddLoadingId: null,
    loading: false,
    error: null,
    deleteLoading: false,
    // View Products modal state
    collectionProducts: [],
    collectionProductsLoading: false,
    collectionProductsError: null,
  },
  reducers: {
    clearCollectionError: (state) => {
      state.error = null;
    },
    // Modal close hone par products reset
    clearCollectionProducts: (state) => {
      state.collectionProducts = [];
      state.collectionProductsError = null;
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
        // Soft delete: collection ko inactive mark karo taaki Inactive filter me restore UI dikhe
        const index = state.collections.findIndex(
          (c) => c._id === action.payload,
        );
        if (index !== -1) {
          state.collections[index].isActive = false;
        }
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
            .addCase(toggleCollectionStatus.fulfilled, (state, action) => {
        const index = state.collections.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.collections[index] = {
            ...state.collections[index],
            ...action.payload,
          };
        }
      })
      .addCase(restoreCollection.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      // View Products modal
      // 🆕 Bulk add — row-level loading state (kaunsi collection busy)
      .addCase(bulkAddProducts.pending, (state, action) => {
        state.bulkAddLoadingId = action.meta.arg.collectionId;
        state.error = null;
      })
      .addCase(bulkAddProducts.fulfilled, (state) => {
        state.bulkAddLoadingId = null;
      })
      .addCase(bulkAddProducts.rejected, (state, action) => {
        state.bulkAddLoadingId = null;
        state.error = action.payload;
      })
      .addCase(fetchProductsByCollection.pending, (state) => {
        state.collectionProductsLoading = true;
        state.collectionProductsError = null;
      })
      .addCase(fetchProductsByCollection.fulfilled, (state, action) => {
        state.collectionProductsLoading = false;
        state.collectionProducts = action.payload.products;
      })
      .addCase(fetchProductsByCollection.rejected, (state, action) => {
        state.collectionProductsLoading = false;
        state.collectionProductsError = action.payload;
      })
      // 🆕 Bulk Import Collections
      .addCase(bulkCreateCollections.fulfilled, (state, action) => {
        state.collections.unshift(...(action.payload.collections || []));
      });
  },
});

export const { clearCollectionError, clearCollectionProducts } =
  collectionsSlice.actions;
export default collectionsSlice.reducer;
