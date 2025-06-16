import api from "./api";

const productAPI = {
  // Lấy danh sách sản phẩm
  getProducts: (page = 1, limit = 12, sortBy = "newest") => {
    return api.get("/products", {
      params: { page, limit, sortBy },
    });
  },

  // Lấy chi tiết sản phẩm
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Tìm kiếm sản phẩm - Fixed to use GET with query parameters
  searchProducts: (searchData = {}, page = 1, limit = 10) => {
    // Convert searchData object to query parameters
    const queryParams = {
      page,
      limit,
      ...searchData,
    };

    // Remove empty/null/undefined values
    Object.keys(queryParams).forEach((key) => {
      if (
        queryParams[key] === null ||
        queryParams[key] === undefined ||
        queryParams[key] === ""
      ) {
        delete queryParams[key];
      }
    });

    return api.get("/products/search", {
      params: queryParams,
    });
  },

  // Đánh giá sản phẩm
  reviewProduct: (productId, reviewData) => {
    return api.post(`/products/${productId}/review`, reviewData);
  },

  // Lấy danh mục
  getCategories: () => {
    return api.get("/categories");
  },

  // Lấy thương hiệu
  getBrands: () => {
    return api.get("/brands");
  },

  // Lấy màu sắc
  getColors: () => {
    return api.get("/colors");
  },

  // Lấy kích cỡ
  getSizes: () => {
    return api.get("/sizes");
  },

  // Gợi ý tìm kiếm - Updated to use GET with query parameters
  getSearchSuggestions: (query) => {
    return api.get("/products/search", {
      params: {
        tuKhoa: query,
        page: 1,
        limit: 5,
      },
    });
  },
};

export default productAPI;
