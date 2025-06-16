import api from "./api";

const shippingAPI = {
  // Lấy danh sách phương thức vận chuyển
  getShippingMethods: () => {
    return api.get("/shipping/methods");
  },

  // Lấy tùy chọn vận chuyển với phí tính theo địa chỉ và giá trị đơn hàng
  getShippingOptions: (orderValue, address = null) => {
    const params = new URLSearchParams({ orderValue: orderValue.toString() });
    if (address) {
      params.append("address", address);
    }
    return api.get(`/shipping/options?${params.toString()}`);
  },

  // Tính phí vận chuyển
  calculateShippingFee: (shippingData) => {
    return api.post("/shipping/calculate", shippingData);
  },

  // Lấy thông tin vận chuyển
  getShippingInfo: (orderId) => {
    return api.get(`/shipping/orders/${orderId}`);
  },

  // Theo dõi vận chuyển
  trackShipping: (trackingNumber) => {
    return api.get(`/shipping/track/${trackingNumber}`);
  },
};

export default shippingAPI;
