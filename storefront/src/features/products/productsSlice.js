import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? 12));
  query.set("page", String(params.page ?? 1));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  // Multi-category (comma-separated IDs), gender, collection tags, sale
  if (params.categoryIds) query.set("categoryId", params.categoryIds);
  if (params.subCategory) query.set("subCategory", params.subCategory);
  if (params.collection) query.set("collection", params.collection);
  if (params.onSale) query.set("onSale", "true");
  if (params.isActive) query.set("isActive", "true");
  if (params.search) query.set("search", params.search);
  if (params.minPrice !== undefined && params.minPrice !== "")
    query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined && params.maxPrice !== "")
    query.set("maxPrice", String(params.maxPrice));
  return query.toString();
};

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get(`/products?${buildQuery(params)}`);
      return {
        products: response.data.products || [],
        pagination: response.data.pagination || null,
        params,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching products",
      );
    }
  },
);

export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/products/${id}`);
      return response.data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Product not found",
      );
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    pagination: null,
    current: null,
    currentLoading: false,
    loading: false,
    error: null,
    lastParams: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.current = null;
      state.currentLoading = false;
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
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.lastParams = action.payload.params;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.currentLoading = true;
        state.current = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
