const { validationResult } = require("express-validator");
const paymentService = require("../services/payment.service");

class PaymentController {
  async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { maDonHang, maHinhThucThanhToan } = req.body;
      const userId = req.user?.userId || null;

      const paymentData = await paymentService.createPayment(
        maDonHang,
        userId,
        maHinhThucThanhToan
      );
      res.json(paymentData);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async handleVNPayIPN(req, res) {
    try {
      const result = await paymentService.handleVNPayIPN(req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async handleVNPayReturn(req, res) {
    try {
      const vnpayData = req.query;
      if (vnpayData.vnp_ResponseCode === "00") {
        res.json({
          code: "00",
          message: "Thanh toán thành công",
          data: vnpayData,
        });
      } else {
        res.json({
          code: vnpayData.vnp_ResponseCode,
          message: "Thanh toán thất bại",
          data: vnpayData,
        });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Các phương thức xử lý callback từ MoMo và ZaloPay sẽ được thêm sau
  async handleMoMoIPN(req, res) {
    res.status(501).json({ message: "Chức năng đang được phát triển" });
  }

  async handleZaloPayIPN(req, res) {
    res.status(501).json({ message: "Chức năng đang được phát triển" });
  }
}

module.exports = new PaymentController();
