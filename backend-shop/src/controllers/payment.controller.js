const { validationResult } = require("express-validator");
const paymentService = require("../services/payment.service");

class PaymentController {
  async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { orderId, paymentMethodId } = req.body;
      const userId = req.user?.userId || null;

      // ✅ THÊM: Debug logging với thông tin rõ ràng hơn
      console.log("🔍 Payment Debug:", {
        orderId,
        userId: userId || "Guest User",
        paymentMethodId,
        userType: userId ? "Logged In" : "Guest",
        requestBody: req.body,
        hasAuth: !!req.headers.authorization,
      });

      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        "127.0.0.1";

      const paymentData = await paymentService.createPayment(
        orderId,
        userId,
        paymentMethodId,
        clientIp
      );

      res.json({ success: true, ...paymentData });
    } catch (error) {
      console.error("❌ Create payment error:", error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async handleVNPayIPN(req, res) {
    try {
      console.log("Received VNPay IPN:", req.body);
      const result = await paymentService.handleVNPayIPN(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("VNPay IPN error:", error);
      res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }

  async handleVNPayReturn(req, res) {
    try {
      console.log("Received VNPay Return:", req.query);
      const result = await paymentService.handleVNPayReturn(req.query);
      res.json(result);
    } catch (error) {
      console.error("VNPay Return error:", error);
      res.status(400).json({
        success: false,
        message: "Lỗi xử lý kết quả thanh toán",
        error: error.message,
      });
    }
  }

  async testVNPay(req, res) {
    try {
      const testOrder = {
        id: "TEST_" + Date.now(),
        MaDonHang: "TEST_" + Date.now(),
        TongThanhToan: 100000,
      };

      const paymentData = await paymentService.createVNPayPayment(testOrder);
      res.json({
        success: true,
        message: "Tạo URL test VNPay thành công",
        ...paymentData,
      });
    } catch (error) {
      console.error("Test VNPay error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async handleMoMoIPN(req, res) {
    res
      .status(501)
      .json({ success: false, message: "Chức năng MoMo đang được phát triển" });
  }

  async handleZaloPayIPN(req, res) {
    res.status(501).json({
      success: false,
      message: "Chức năng ZaloPay đang được phát triển",
    });
  }

  async getPaymentMethods(req, res) {
    try {
      const paymentMethods =
        await paymentService.layDanhSachPhuongThucThanhToan({ trangThai: 1 });
      res.json(paymentMethods);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getPaymentMethodsAdmin(req, res) {
    try {
      const { search, status } = req.query;
      const filters = {};
      if (search) filters.tuKhoa = search;
      if (status !== undefined) filters.trangThai = parseInt(status);
      const paymentMethods =
        await paymentService.layDanhSachPhuongThucThanhToan(filters);
      res.json(paymentMethods);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createPaymentMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const paymentMethod = await paymentService.taoPhuongThucThanhToan(
        req.body
      );
      res.status(201).json({
        success: true,
        message: "Tạo phương thức thanh toán thành công",
        data: paymentMethod,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updatePaymentMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const paymentMethod = await paymentService.capNhatPhuongThucThanhToan(
        id,
        req.body
      );
      res.json({
        success: true,
        message: "Cập nhật phương thức thanh toán thành công",
        data: paymentMethod,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updatePaymentStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { TrangThai } = req.body;
      const result = await paymentService.capNhatTrangThai(id, TrangThai);
      res.json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const result = await paymentService.xoaPhuongThucThanhToan(id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new PaymentController();
