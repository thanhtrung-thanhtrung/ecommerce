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

  async calculateShippingFee(shippingMethodId, orderValue, address = null) {
    try {
      // Miễn phí vận chuyển nếu đơn hàng trên 2 triệu
      if (orderValue >= 2000000) {
        return 0;
      }

      // Nếu có địa chỉ, tính phí theo khu vực
      if (address) {
        const isHCM = this.isHCMAddress(address);
        return isHCM ? 30000 : 50000;
      }

      // Fallback về logic cũ nếu không có địa chỉ
      const shippingMethod = await this.getShippingMethodById(shippingMethodId);
      return shippingMethod.PhiVanChuyen || 50000; // Default 50k nếu không xác định được
    } catch (error) {
      throw new Error("Có lỗi khi tính phí vận chuyển: " + error.message);
    }
  }

  // Kiểm tra địa chỉ có phải TP.HCM không
  isHCMAddress(address) {
    const hcmKeywords = [
      "hồ chí minh",
      "ho chi minh",
      "hcm",
      "tp.hcm",
      "tphcm",
      "sài gòn",
      "saigon",
      "sài gòn",
      "thành phố hồ chí minh",
    ];

    const addressLower = address.toLowerCase();
    return hcmKeywords.some((keyword) => addressLower.includes(keyword));
  }

  // Method để lấy thông tin vận chuyển với phí tính toán
  async getShippingOptionsWithFees(orderValue, address = null) {
    try {
      const baseOptions = [
        {
          id: "standard_hcm",
          name: "Giao hàng tiêu chuẩn - TP.HCM",
          description: "Giao hàng trong 1-2 ngày (TP.HCM)",
          estimatedDays: "1-2 ngày",
          isHCM: true,
        },
        {
          id: "standard_other",
          name: "Giao hàng tiêu chuẩn - Ngoại thành",
          description: "Giao hàng trong 2-4 ngày (Ngoại thành)",
          estimatedDays: "2-4 ngày",
          isHCM: false,
        },
      ];

      const options = baseOptions.map((option) => {
        let fee = option.isHCM ? 30000 : 50000;

        // Miễn phí nếu đơn hàng trên 2 triệu
        if (orderValue >= 2000000) {
          fee = 0;
        }

        return {
          ...option,
          fee,
          freeShippingThreshold: 2000000,
        };
      });

      // Nếu có địa chỉ, chỉ trả về option phù hợp
      if (address) {
        const isHCM = this.isHCMAddress(address);
        return options.filter((option) => option.isHCM === isHCM);
      }

      return options;
    } catch (error) {
      throw new Error("Có lỗi khi lấy tùy chọn vận chuyển: " + error.message);
    }
  }
}

module.exports = new ShippingService();
