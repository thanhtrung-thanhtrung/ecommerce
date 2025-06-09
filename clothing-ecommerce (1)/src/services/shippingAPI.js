import api from "./api"

const shippingAPI = {
  // Lấy danh sách phương thức vận chuyển
  getShippingMethods: () => {
    return api.get("/shipping/methods")
  },

  // Tính phí vận chuyển
  calculateShippingFee: (shippingData) => {
    return api.post("/shipping/calculate", shippingData)
  },

  // Lấy thông tin vận chuyển
  getShippingInfo: (orderId) => {
    return api.get(`/shipping/orders/${orderId}`)
  },

  // Theo dõi vận chuyển
  trackShipping: (trackingNumber) => {
    return api.get(`/shipping/track/${trackingNumber}`)
  },
}

export default shippingAPI
