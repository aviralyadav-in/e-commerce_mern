import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

const buildProductQuery = (params = {}) => {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? 100));
  query.set("page", String(params.page ?? 1));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);
  return query.toString();
};

// Server-paginated endpoint ko page-by-page loop karke SAARE products
// laate hain — pehle sirf pehle 100 aa rahe the (101st product invisible).
const MAX_PAGES = 50; // safety cap

const fetchAllProductPages = async (params = {}) => {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const all = [];
  do {
    const qs = buildProductQuery({ ...params, limit, page });
    const response = await API.get(`/products?${qs}`);
    const data = response.data || {};
    all.push(...(data.products || []));
    totalPages = Number(data.pagination?.totalPages) || 1;
    page += 1;
  } while (page <= Math.min(totalPages, MAX_PAGES));
  return all;
};

// 1. Fetch All Products
export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fetchAllProductPages(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching products",
      );
    }
  },
);

// 2. Fetch Products By Category
export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchByCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      return await fetchAllProductPages({ categoryId });
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching products by category",
      );
    }
  },
);

export const addProduct = createAsyncThunk(
  "products/add",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await API.post("/products/admin", productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error adding product",
      );
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/products/admin/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating product",
      );
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/products/admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error deleting product",
      );
    }
  },
);

// 🆕 Soft delete (hide) ke baad wapas live karo
export const restoreProduct = createAsyncThunk(
  "products/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/products/admin/${id}/restore`);
      return response.data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error restoring product",
      );
    }
  },
);

// 🆕 Bulk Import Products via CSV (dropdown-category method)
export const bulkCreateProducts = createAsyncThunk(
  "products/bulkCreate",
  async ({ formData }, { rejectWithValue }) => {
    try {
      const response = await API.post("/products/admin/bulk", formData, {
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

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedCategoryId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategoryId = action.payload;
      state.products = [];
    },
    clearProducts: (state) => {
      state.products = [];
      state.selectedCategoryId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (prod) => prod._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (prod) => prod._id !== action.payload,
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(restoreProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (prod) => prod._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(restoreProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCategory, clearProducts } = productsSlice.actions;
export default productsSlice.reducer;
