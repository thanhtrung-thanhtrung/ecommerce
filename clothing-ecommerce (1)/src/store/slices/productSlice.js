import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productAPI from "../../services/productAPI";
import categoryAPI from "../../services/categoryAPI";
import brandAPI from "../../services/brandAPI";

// Fetch Products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts(
        params.page,
        params.limit,
        params.sortBy
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải sản phẩm"
      );
    }
  }
);

// Fetch Product by ID
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductById(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải chi tiết sản phẩm"
      );
    }
  }
);

// Search Products - Updated to match backend API format
export const searchProducts = createAsyncThunk(
  "products/searchProducts",
  async ({ searchData, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await productAPI.searchProducts(searchData, page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tìm kiếm sản phẩm"
      );
    }
  }
);

export const getSearchSuggestions = createAsyncThunk(
  "products/getSearchSuggestions",
  async (query, { rejectWithValue }) => {
    try {
      const response = await productAPI.getSearchSuggestions(query);
      // Extract products from the response for suggestions
      return response.data.products || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi lấy gợi ý tìm kiếm"
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryAPI.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải danh mục"
      );
    }
  }
);

export const fetchBrands = createAsyncThunk(
  "products/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const response = await brandAPI.getBrands();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải thương hiệu"
      );
    }
  }
);

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  brands: [],
  searchSuggestions: [],
  totalProducts: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isSearching: false,
  error: null,
  filters: {
    category: "",
    brand: "",
    search: "",
    minPrice: "",
    maxPrice: "",
    priceRange: [0, 10000000],
    sortBy: "newest",
  },
  searchQuery: "",
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSearchSuggestions: (state) => {
      state.searchSuggestions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;

        // Handle your backend API response structure
        if (action.payload && action.payload.products) {
          state.products = action.payload.products;

          // Handle pagination from your API response
          const pagination = action.payload.pagination;
          if (pagination) {
            state.totalProducts = pagination.total || 0;
            state.totalPages =
              Math.ceil(pagination.total / pagination.limit) || 1;
            state.currentPage = pagination.page || 1;
          } else {
            state.totalProducts = action.payload.products.length;
            state.totalPages = 1;
            state.currentPage = 1;
          }
        } else {
          // Fallback for different response structure
          state.products = Array.isArray(action.payload) ? action.payload : [];
          state.totalProducts = state.products.length;
          state.totalPages = state.products.length > 0 ? 1 : 0;
          state.currentPage = 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.products = [];
        state.totalProducts = 0;
        state.totalPages = 0;
        state.currentPage = 1;
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching = false;

        // Handle your backend API response structure
        if (action.payload && action.payload.products) {
          state.products = action.payload.products;

          // Handle pagination from your API response
          const pagination = action.payload.pagination;
          if (pagination) {
            state.totalProducts = pagination.total || 0;
            state.totalPages =
              Math.ceil(pagination.total / pagination.limit) || 1;
            state.currentPage = pagination.page || 1;
          } else {
            state.totalProducts = action.payload.products.length;
            state.totalPages = 1;
            state.currentPage = 1;
          }
        } else {
          // Fallback for different response structure
          state.products = Array.isArray(action.payload) ? action.payload : [];
          state.totalProducts = state.products.length;
          state.totalPages = state.products.length > 0 ? 1 : 0;
          state.currentPage = 1;
        }
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload;
        state.products = [];
        state.totalProducts = 0;
        state.totalPages = 0;
        state.currentPage = 1;
      })
      // Search Suggestions
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        // Limit suggestions to 5 items and extract relevant data
        state.searchSuggestions = (action.payload || [])
          .slice(0, 5)
          .map((product) => ({
            id: product.id,
            Ten: product.Ten,
            query: product.Ten, // For backward compatibility
          }));
      })
      .addCase(getSearchSuggestions.rejected, (state) => {
        state.searchSuggestions = [];
      })
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        // Handle the response structure from your backend API
        // Your API returns { success: true, data: [...] }
        if (action.payload.success && action.payload.data) {
          state.categories = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.categories = action.payload;
        } else {
          state.categories = action.payload.data || [];
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload;
        state.categories = [];
      })
      // Fetch Brands
      .addCase(fetchBrands.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        // Handle the response structure from your backend API
        // Your API returns { success: true, data: [...] }
        if (action.payload.success && action.payload.data) {
          state.brands = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.brands = action.payload;
        } else {
          state.brands = action.payload.data || [];
        }
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.error = action.payload;
        state.brands = [];
      });
  },
});

export const {
  setFilters,
  setSearchQuery,
  setCurrentPage,
  clearCurrentProduct,
  clearError,
  clearSearchSuggestions,
} = productSlice.actions;

export default productSlice.reducer;
