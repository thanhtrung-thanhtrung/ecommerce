import api from "./api"

const categoryAPI = {
  // Lấy danh sách danh mục
  getCategories: () => {
    return api.get("/categories")
  },

  // Lấy chi tiết danh mục
  getCategoryById: (id) => {
    return api.get(`/categories/${id}`)
  },

  // Lấy sản phẩm theo danh mục
  getProductsByCategory: (id, params = {}) => {
    return api.get(`/categories/${id}/products`, { params })
  },

  // Lấy danh mục cha
  getParentCategories: () => {
    return api.get("/categories/parent")
  },

  // Lấy danh mục con
  getSubCategories: (parentId) => {
    return api.get(`/categories/${parentId}/children`)
  },
}

export default categoryAPI
