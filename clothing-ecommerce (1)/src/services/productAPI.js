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

  // Tìm kiếm sản phẩm - POST method to match backend
  searchProducts: (searchData, page = 1, limit = 10) => {
    return api.post("/products/search", searchData, {
      params: { page, limit },
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

  // Gợi ý tìm kiếm - simplified for basic suggestions
  getSearchSuggestions: (query) => {
    // Use a simple search for suggestions
    return api.post(
      "/products/search",
      { tuKhoa: query },
      {
        params: { page: 1, limit: 5 },
      }
    );
  },
};

export default productAPI;
