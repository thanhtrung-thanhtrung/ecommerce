import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productAPI from "../../services/productAPI";

// Async thunks
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (
    { page = 1, limit = 12, sortBy = "newest" } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await productAPI.getProducts(page, limit, sortBy);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải sản phẩm"
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải chi tiết sản phẩm"
      );
    }
  }
);

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
      const response = await productAPI.getCategories();
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
      const response = await productAPI.getBrands();
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

        // Nếu API trả về dữ liệu theo cấu trúc pagination
        if (action.payload.products) {
          state.products = action.payload.products;
          state.totalProducts =
            action.payload.total || action.payload.products.length;
          state.totalPages =
            action.payload.totalPages ||
            Math.ceil(state.totalProducts / (action.payload.limit || 12));
          state.currentPage = action.payload.page || 1;
        }
        // Nếu API chỉ trả về mảng sản phẩm
        else {
          state.products = action.payload;
          state.totalProducts = action.payload.length;
          state.totalPages = 1;
          state.currentPage = 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.products = [];
        state.totalProducts = 0;
        state.totalPages = 1;
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
        state.products = action.payload.products || [];

        // Xử lý dữ liệu phân trang
        const pagination = action.payload.pagination;

        if (pagination) {
          state.totalProducts = pagination.total || 0;
          state.totalPages =
            pagination.totalPages ||
            Math.ceil((pagination.total || 0) / (pagination.limit || 12));
          state.currentPage = pagination.page || 1;
        } else {
          // Xử lý trường hợp không có dữ liệu phân trang
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
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Fetch Brands
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
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
