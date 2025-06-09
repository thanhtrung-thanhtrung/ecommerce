import api from "./api";

const cartAPI = {
  // Lấy giỏ hàng
  getCart: async () => {
    await cartAPI.ensureSessionId();
    return api.get("/cart");
  },

  // Thêm vào giỏ hàng
  addToCart: async (item) => {
    await cartAPI.ensureSessionId();
    return api.post("/cart", {
      id_ChiTietSanPham: item.id_ChiTietSanPham,
      soLuong: item.soLuong || 1, // Giữ nhất quán theo format backend yêu cầu
    });
  },

  // Cập nhật giỏ hàng
  updateCartItem: async (id, data) => {
    await cartAPI.ensureSessionId();
    return api.put(`/cart/${id}`, {
      soLuong: data.soLuong, // Giữ nhất quán theo format backend yêu cầu
    });
  },

  // Xóa khỏi giỏ hàng
  removeFromCart: async (id) => {
    await cartAPI.ensureSessionId();
    return api.delete(`/cart/${id}`);
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    await cartAPI.ensureSessionId();
    return api.delete("/cart");
  },

  // Gộp giỏ hàng khi đăng nhập
  mergeCart: async () => {
    await cartAPI.ensureSessionId();
    return api.post("/cart/merge");
  },

  // Lấy số lượng items trong giỏ hàng
  getCartItemCount: async () => {
    try {
      await cartAPI.ensureSessionId();
      const response = await api.get("/cart");
      // Nếu response.data là mảng (phản hồi trực tiếp từ backend)
      if (Array.isArray(response.data)) {
        return response.data.reduce(
          (total, item) => total + (parseInt(item.SoLuong) || 0),
          0
        );
      }
      // Nếu response.data là đối tượng có thuộc tính items
      else if (response.data && response.data.items) {
        return response.data.items.reduce(
          (total, item) => total + parseInt(item.SoLuong || item.soLuong || 0),
          0
        );
      }
      return 0;
    } catch (error) {
      console.error("Error getting cart item count:", error);
      return 0;
    }
  },

  // Kiểm tra sản phẩm có trong giỏ hàng không
  checkItemInCart: async (productDetailId) => {
    try {
      await cartAPI.ensureSessionId();
      const response = await api.get("/cart");
      // Chuyển productDetailId thành số để so sánh chính xác
      const idToCheck = parseInt(productDetailId);

      // Nếu response.data là mảng (phản hồi trực tiếp từ backend)
      if (Array.isArray(response.data)) {
        return response.data.some(
          (item) => parseInt(item.id_ChiTietSanPham) === idToCheck
        );
      }
      // Nếu response.data là đối tượng có thuộc tính items
      else if (response.data && response.data.items) {
        return response.data.items.some(
          (item) => parseInt(item.id_ChiTietSanPham) === idToCheck
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking item in cart:", error);
      return false;
    }
  },

  // Tính tổng giá trị giỏ hàng
  getCartTotal: async () => {
    try {
      await cartAPI.ensureSessionId();
      const response = await api.get("/cart");
      // Nếu response.data là mảng (phản hồi trực tiếp từ backend)
      if (Array.isArray(response.data)) {
        return response.data.reduce(
          (total, item) =>
            total + parseFloat(item.Gia || 0) * parseInt(item.SoLuong || 0),
          0
        );
      }
      // Nếu response.data là đối tượng có thuộc tính tongTien
      else if (response.data && response.data.tongTien) {
        return parseFloat(response.data.tongTien || 0);
      }
      // Nếu response.data là đối tượng có thuộc tính items
      else if (response.data && response.data.items) {
        return response.data.items.reduce(
          (total, item) =>
            total +
            parseFloat(item.Gia || 0) *
              parseInt(item.SoLuong || item.soLuong || 0),
          0
        );
      }
      return 0;
    } catch (error) {
      console.error("Error getting cart total:", error);
      return 0;
    }
  },

  // Validate giỏ hàng trước khi checkout
  validateCart: async () => {
    await cartAPI.ensureSessionId();
    return api.post("/cart/validate");
  },

  // Kiểm tra và cập nhật session ID khi cần
  ensureSessionId: async () => {
    try {
      // Kiểm tra xem đã có cookie sessionId chưa
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("sessionId=")
      );

      // Nếu có cookie, cập nhật localStorage
      if (sessionCookie) {
        const sessionId = sessionCookie.trim().substring("sessionId=".length);
        localStorage.setItem("guestSessionId", sessionId);
        return;
      }

      // Nếu không có cookie nhưng có lưu trong localStorage
      const guestSessionId = localStorage.getItem("guestSessionId");

      // Nếu có sessionId trong localStorage, kiểm tra xem giỏ hàng có tồn tại
      if (guestSessionId) {
        try {
          // Thêm header X-Session-ID để backend có thể xác định session
          const config = {
            headers: {
              "X-Session-ID": guestSessionId,
            },
          };
          // Ping API để thiết lập lại cookie
          await api.get("/cart/sync-session", config);
        } catch (error) {
          // Nếu lỗi (ví dụ: sessionId không hợp lệ), xóa sessionId cũ
          if (error.response && error.response.status === 400) {
            localStorage.removeItem("guestSessionId");
          }
        }
      } else {
        // Nếu không có sessionId trong localStorage, tạo mới và lưu trong cookie
        await api.get("/cart/create-session");
      }
    } catch (error) {
      console.error("Error ensuring session ID:", error);
    }
  },

  // Đồng bộ giỏ hàng sau khi đăng nhập
  syncCartAfterLogin: async (token) => {
    try {
      // Thêm token vào header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Gọi API để đồng bộ giỏ hàng từ session cũ
      await api.post("/cart/sync-after-login", {}, config);

      // Xóa sessionId cũ vì đã đăng nhập
      localStorage.removeItem("guestSessionId");
    } catch (error) {
      console.error("Error syncing cart after login:", error);
    }
  },
};

export default cartAPI;
