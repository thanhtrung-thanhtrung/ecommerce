import api from "./api"

const couponAPI = {
  // Lấy danh sách mã giảm giá
  getCoupons: () => {
    return api.get("/coupons")
  },

  // Kiểm tra mã giảm giá
  validateCoupon: (couponCode, orderData) => {
    return api.post("/coupons/validate", {
      code: couponCode,
      ...orderData,
    })
  },

  // Áp dụng mã giảm giá
  applyCoupon: (couponCode, orderId) => {
    return api.post("/coupons/apply", {
      code: couponCode,
      orderId,
    })
  },

  // Lấy mã giảm giá của user
  getUserCoupons: () => {
    return api.get("/users/coupons")
  },

  // Lấy mã giảm giá khả dụng
  getAvailableCoupons: (orderData) => {
    return api.post("/coupons/available", orderData)
  },
}

export default couponAPI
