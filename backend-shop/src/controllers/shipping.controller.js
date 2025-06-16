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

  async getShippingOptions(req, res) {
    try {
      const { orderValue, address } = req.query;

      if (!orderValue) {
        return res.status(400).json({
          message: "Thiếu thông tin giá trị đơn hàng",
        });
      }

      const options = await shippingService.getShippingOptionsWithFees(
        parseFloat(orderValue),
        address
      );

      res.json(options);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async calculateShippingFee(req, res) {
    try {
      const { id_VanChuyen, tongGiaTriDonHang, diaChi } = req.body;

      if (!tongGiaTriDonHang) {
        return res.status(400).json({
          message: "Thiếu thông tin giá trị đơn hàng",
        });
      }

      const shippingFee = await shippingService.calculateShippingFee(
        id_VanChuyen,
        tongGiaTriDonHang,
        diaChi
      );

      res.json({
        phiVanChuyen: shippingFee,
        mienphi: shippingFee === 0,
        thongTin: {
          giaTriDonHang: tongGiaTriDonHang,
          diaChi: diaChi,
          phiVanChuyenTheoKhuVuc: diaChi
            ? shippingService.isHCMAddress(diaChi)
              ? "TP.HCM (30k)"
              : "Ngoại thành (50k)"
            : null,
          mienpPhiTu: 2000000,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ShippingController();
