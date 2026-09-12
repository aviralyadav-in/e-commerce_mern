import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 1. Fetch All Categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      // Admin endpoint — inactive (soft-deleted) categories bhi aati hain,
      // warna restore kabhi possible nahi tha. Storefront apna public
      // GET /categories use karta hai (sirf active).
      const response = await API.get("/categories/admin/all");
      return response.data.categories || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching categories",
      );
    }
  },
);

// 2. Add Category
export const addCategory = createAsyncThunk(
  "categories/add",
  async (categoryData, { rejectWithValue }) => {
    try {
      // categoryData is now FormData
      const response = await API.post("/categories/admin", categoryData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // 🆕 { category, childCategory } — child re-parent hua ho toh updated
      // child bhi (table hierarchy turant update ho jaye)
      return {
        category: response.data.category,
        childCategory: response.data.childCategory || null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error adding category");
    }
  },
);

// 3. Update Category
export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // data is now FormData
      const response = await API.put(`/categories/admin/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // 🆕 { category, childCategory } — child re-parent hua ho toh updated
      // child bhi (table hierarchy turant update ho jaye)
      return {
        category: response.data.category,
        childCategory: response.data.childCategory || null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating category");
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (categoryId, { rejectWithValue }) => {
    try {
      // Simple delete, backend handles check
      await API.delete(`/categories/admin/${categoryId}`);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error deleting category");
    }
  },
);

// 🆕 Soft-deleted (inactive) category ko wapas active karo
export const restoreCategory = createAsyncThunk(
  "categories/restore",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/categories/admin/${categoryId}/restore`);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error restoring category");
    }
  },
);

// 🆕 Status toggle — active ⇄ inactive (restore ka superset; row toggle)
export const toggleCategoryStatus = createAsyncThunk(
  "categories/toggleStatus",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.patch(
        `/categories/admin/${categoryId}/toggle-status`,
      );
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error toggling category status",
      );
    }
  },
);

// 🆕 Bulk Import Categories via CSV
export const bulkCreateCategories = createAsyncThunk(
  "categories/bulkCreate",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post("/categories/admin/bulk", formData, {
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

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    loading: false,
    error: null,
    deleteLoading: false, // Delete (soft) ke liye alag loading
  },
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Category
      .addCase(addCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload.category);
        // 🆕 Child re-parent hua toh us row ko updated version se badlo
        if (action.payload.childCategory) {
          const ci = state.categories.findIndex(
            (c) => c._id === action.payload.childCategory._id,
          );
          if (ci !== -1) state.categories[ci] = action.payload.childCategory;
        }
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const { category, childCategory } = action.payload;
        const index = state.categories.findIndex(
          (cat) => cat._id === category._id,
        );
        if (index !== -1) {
          state.categories[index] = category;
        }
        // 🆕 Child re-parent hua toh us row ko updated version se badlo
        if (childCategory) {
          const ci = state.categories.findIndex(
            (cat) => cat._id === childCategory._id,
          );
          if (ci !== -1) state.categories[ci] = childCategory;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Category — backend soft-delete karta hai (isActive: false);
      // products delete NAHI hote, category Inactive filter me restore hoti hai
      .addCase(deleteCategory.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Soft delete: category ko inactive mark karo taaki Inactive filter me restore UI dikhe
        const index = state.categories.findIndex(
          (cat) => cat._id === action.payload,
        );
        if (index !== -1) {
          state.categories[index].isActive = false;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // 🆕 Restore — inactive category wapas active
      .addCase(restoreCategory.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(restoreCategory.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const index = state.categories.findIndex(
          (cat) => cat._id === action.payload._id,
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        } else {
          state.categories.push(action.payload);
        }
      })
      .addCase(restoreCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // 🆕 Toggle status — row ko updated category se replace karo
      .addCase(toggleCategoryStatus.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const index = state.categories.findIndex(
          (cat) => cat._id === action.payload._id,
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(toggleCategoryStatus.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // 🆕 Bulk Import — nayi categories list me merge kar do
      .addCase(bulkCreateCategories.fulfilled, (state, action) => {
        state.categories.unshift(...(action.payload.categories || []));
      });
  },
});

export const { clearCategoryError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
