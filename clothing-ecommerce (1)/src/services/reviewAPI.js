import api from "./api"

const reviewAPI = {
  // Lấy đánh giá của sản phẩm
  getProductReviews: (productId, params = {}) => {
    return api.get(`/products/${productId}/reviews`, { params })
  },

  // Thêm đánh giá sản phẩm
  addReview: (productId, reviewData) => {
    return api.post(`/products/${productId}/review`, reviewData)
  },

  // Cập nhật đánh giá
  updateReview: (reviewId, reviewData) => {
    return api.put(`/reviews/${reviewId}`, reviewData)
  },

  // Xóa đánh giá
  deleteReview: (reviewId) => {
    return api.delete(`/reviews/${reviewId}`)
  },

  // Lấy đánh giá của user
  getUserReviews: (params = {}) => {
    return api.get("/users/reviews", { params })
  },

  // Like/Unlike đánh giá
  toggleReviewLike: (reviewId) => {
    return api.post(`/reviews/${reviewId}/like`)
  },

  // Báo cáo đánh giá
  reportReview: (reviewId, reason) => {
    return api.post(`/reviews/${reviewId}/report`, { reason })
  },
}

export default reviewAPI
