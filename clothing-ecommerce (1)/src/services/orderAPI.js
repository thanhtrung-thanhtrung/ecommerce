import api from "./api"

const orderAPI = {
  // Tạo đơn hàng cho user đăng nhập
  createOrder: (orderData) => {
    return api.post("/orders", orderData)
  },

  // Tạo đơn hàng cho khách vãng lai
  createGuestOrder: (orderData, sessionId) => {
    const params = sessionId ? `?sessionId=${sessionId}` : ''
    return api.post(`/orders${params}`, orderData)
  },

  // Lấy danh sách đơn hàng của user
  getUserOrders: (params = {}) => {
    return api.get("/orders/history", { params })
  },

  // Lấy chi tiết đơn hàng
  getOrderById: (id) => {
    return api.get(`/orders/${id}`)
  },

  // Tra cứu đơn hàng khách vãng lai
  getGuestOrder: (id, email) => {
    return api.get(`/orders/guest/${id}?email=${email}`)
  },

  // Hủy đơn hàng (user đăng nhập)
  cancelOrder: (id, reason) => {
    return api.put(`/orders/${id}/cancel`, { lyDoHuy: reason })
  },

  // Hủy đơn hàng khách vãng lai
  cancelGuestOrder: (id, email, reason) => {
    return api.put(`/orders/guest/${id}/cancel`, { 
      email: email,
      lyDoHuy: reason 
    })
  },

  // Theo dõi đơn hàng
  trackOrder: (id) => {
    return api.get(`/orders/${id}/track`)
  },

  // Lấy lịch sử đơn hàng
  getOrderHistory: (params = {}) => {
    return api.get("/orders/history", { params })
  },

  // Lấy phương thức thanh toán
  getPaymentMethods: () => {
    return api.get("/payments/methods")
  },

  // Lấy phương thức vận chuyển
  getShippingMethods: () => {
    return api.get("/shipping/methods")
  },

  // Kiểm tra mã giảm giá
  validateCoupon: (couponCode, totalAmount) => {
    return api.post("/vouchers/validate", {
      ma: couponCode,
      tongTien: totalAmount
    })
  }
}

export default orderAPI
