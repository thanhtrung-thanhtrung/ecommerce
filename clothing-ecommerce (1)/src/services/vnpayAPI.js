import api from "./api";

const vnpayAPI = {
  // Tạo đơn hàng và payment URL cho VNPay
  createPayment: async (orderData) => {
    try {
      // Bước 1: Tạo đơn hàng trước
      const orderResponse = await api.post("/orders", orderData);

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Không thể tạo đơn hàng");
      }

      const order = orderResponse.data.data;

      //Logic gửi dữ liệu chính xác
      const paymentResponse = await api.post("/payments/create", {
        orderId: order.id, // ID của đơn hàng vừa tạo
        paymentMethodId: orderData.id_ThanhToan || 7, // ID phương thức thanh toán (VNPay)
      });

      return paymentResponse.data;
    } catch (error) {
      console.error("VNPay createPayment error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi tạo thanh toán"
      );
    }
  },

  // Xử lý kết quả trả về từ VNPay
  handlePaymentReturn: async (queryParams) => {
    try {
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await api.get(`/payments/vnpay/return?${queryString}`);

      return response;
    } catch (error) {
      console.error("VNPay return handling error:", error);
      throw error;
    }
  },

  // Lấy danh sách phương thức thanh toán
  getPaymentMethods: async () => {
    try {
      const response = await api.get("/payments/methods");
      return response;
    } catch (error) {
      console.error("Get payment methods error:", error);
      throw error;
    }
  },

  // Test VNPay với demo payment
  createDemoPayment: async (amount, orderInfo) => {
    try {
      const response = await api.post("/test/vnpay/demo-payment", {
        amount: parseInt(amount),
        orderInfo: orderInfo || "Demo payment test",
      });

      return response;
    } catch (error) {
      console.error("VNPay demo payment error:", error);
      throw error;
    }
  },
};

export default vnpayAPI;
