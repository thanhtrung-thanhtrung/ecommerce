import api from "./api"

const paymentAPI = {
  // Tạo thanh toán
  createPayment: (paymentData) => {
    return api.post("/payments/create", paymentData)
  },

  // Xác nhận thanh toán
  confirmPayment: (paymentId, confirmData) => {
    return api.post(`/payments/${paymentId}/confirm`, confirmData)
  },

  // Lấy thông tin thanh toán
  getPaymentInfo: (paymentId) => {
    return api.get(`/payments/${paymentId}`)
  },

  // Lấy danh sách phương thức thanh toán
  getPaymentMethods: () => {
    return api.get("/payments/methods")
  },

  // Callback từ cổng thanh toán
  handlePaymentCallback: (callbackData) => {
    return api.post("/payments/callback", callbackData)
  },

  // Hoàn tiền
  refundPayment: (paymentId, refundData) => {
    return api.post(`/payments/${paymentId}/refund`, refundData)
  },
}

export default paymentAPI
