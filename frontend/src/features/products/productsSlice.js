import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 1. Fetch All Products (Dashboard ke liye)
export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/products");
      return response.data.products || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error fetching products");
    }
  },
);

// 2. Fetch Products By Category (Products Page ke liye)
// Jab admin koi category select karega toh us category ke
// products fetch honge
export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchByCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/products?categoryId=${categoryId}`);
      return response.data.products || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching products by category",
      );
    }
  },
);

// 3. Add Product (Category ke andar)
// Jab product add hoga toh categoryId automatically
// selected category ki jayegi
export const addProduct = createAsyncThunk(
  "products/add",
  async (productData, { rejectWithValue }) => {
    try {
      // productData is FormData
      const response = await API.post("/products/admin", productData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error adding product");
    }
  },
);

// 4. Update Product
export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // data is FormData
      const response = await API.put(`/products/admin/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating product");
    }
  },
);

// 5. Delete Product
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/products/admin/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error deleting product");
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedCategoryId: null, // Selected category track karega
    loading: false,
    error: null,
  },
  reducers: {
    // Jab admin category dropdown se category change kare
    setSelectedCategory: (state, action) => {
      state.selectedCategoryId = action.payload;
      state.products = []; // Purane products clear karo
    },
    clearProducts: (state) => {
      state.products = [];
      state.selectedCategoryId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Products
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

      // Fetch Products By Category
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

      // Add Product
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

      // Update Product
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

      // Delete Product
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
      });
  },
});

export const { setSelectedCategory, clearProducts } = productsSlice.actions;
export default productsSlice.reducer;
