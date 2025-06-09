import api from "./api"

const brandAPI = {
  // Lấy danh sách thương hiệu
  getBrands: () => {
    return api.get("/brands")
  },

  // Lấy chi tiết thương hiệu
  getBrandById: (id) => {
    return api.get(`/brands/${id}`)
  },

  // Lấy sản phẩm theo thương hiệu
  getProductsByBrand: (id, params = {}) => {
    return api.get(`/brands/${id}/products`, { params })
  },

  // Lấy thương hiệu phổ biến
  getPopularBrands: () => {
    return api.get("/brands/popular")
  },
}

export default brandAPI
