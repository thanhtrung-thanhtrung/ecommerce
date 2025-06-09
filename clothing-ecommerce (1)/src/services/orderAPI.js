import api from "./api"

const orderAPI = {
  // Tạo đơn hàng
  createOrder: (orderData) => {
    return api.post("/orders", orderData)
  },

  // Lấy danh sách đơn hàng của user
  getUserOrders: (params = {}) => {
    return api.get("/orders", { params })
  },

  // Lấy chi tiết đơn hàng
  getOrderById: (id) => {
    return api.get(`/orders/${id}`)
  },

  // Hủy đơn hàng
  cancelOrder: (id, reason) => {
    return api.post(`/orders/${id}/cancel`, { lyDo: reason })
  },

  // Theo dõi đơn hàng
  trackOrder: (id) => {
    return api.get(`/orders/${id}/track`)
  },

  // Lấy lịch sử đơn hàng
  getOrderHistory: (params = {}) => {
    return api.get("/orders/history", { params })
  },
}

export default orderAPI
