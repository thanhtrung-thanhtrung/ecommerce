const shippingService = require("../services/shipping.service");

class ShippingController {
  async getShippingMethods(req, res) {
    try {
      const shippingMethods = await shippingService.getShippingMethods();
      res.json(shippingMethods);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async calculateShippingFee(req, res) {
    try {
      const { id_VanChuyen, tongGiaTriDonHang } = req.body;

      if (!id_VanChuyen || !tongGiaTriDonHang) {
        return res.status(400).json({
          message:
            "Thiếu thông tin phương thức vận chuyển hoặc giá trị đơn hàng",
        });
      }

      const shippingFee = await shippingService.calculateShippingFee(
        id_VanChuyen,
        tongGiaTriDonHang
      );

      res.json({ phiVanChuyen: shippingFee });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ShippingController();
