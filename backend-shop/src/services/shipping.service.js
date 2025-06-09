const db = require("../config/database");

class ShippingService {
  async getShippingMethods() {
    try {
      const [shippingMethods] = await db.execute(
        "SELECT * FROM hinhthucvanchuyen WHERE TrangThai = 1"
      );
      return shippingMethods;
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy phương thức vận chuyển: " + error.message
      );
    }
  }

  async getShippingMethodById(id) {
    try {
      const [shippingMethod] = await db.execute(
        "SELECT * FROM hinhthucvanchuyen WHERE id = ? AND TrangThai = 1",
        [id]
      );

      if (shippingMethod.length === 0) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      return shippingMethod[0];
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy phương thức vận chuyển: " + error.message
      );
    }
  }

  async calculateShippingFee(shippingMethodId, orderValue) {
    try {
      const shippingMethod = await this.getShippingMethodById(shippingMethodId);

      // Miễn phí vận chuyển nếu đơn hàng đủ điều kiện
      if (shippingMethod.PhiVanChuyen === 0) {
        return 0;
      }

      // Logic miễn phí vận chuyển cho đơn hàng có giá trị cao
      if (orderValue >= 1000000 && shippingMethod.Ten.includes("miễn phí")) {
        return 0;
      }

      return shippingMethod.PhiVanChuyen;
    } catch (error) {
      throw new Error("Có lỗi khi tính phí vận chuyển: " + error.message);
    }
  }
}

module.exports = new ShippingService();
