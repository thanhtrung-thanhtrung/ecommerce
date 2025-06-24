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

  // Lấy danh sách phương thức thanh toán
  async getPaymentMethods(req, res) {
    try {
      const paymentMethods =
        await paymentService.layDanhSachPhuongThucThanhToan({
          trangThai: 1, // Chỉ lấy những phương thức đang hoạt động
        });
      res.json(paymentMethods);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Admin: Lấy tất cả phương thức thanh toán
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

  // Admin: Tạo phương thức thanh toán mới
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

  // Admin: Cập nhật phương thức thanh toán
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

  // Admin: Cập nhật trạng thái phương thức thanh toán
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

  // Admin: Xóa phương thức thanh toán
  async deletePaymentMethod(req, res) {
    try {
      const { id } = req.params;
      const result = await paymentService.xoaPhuongThucThanhToan(id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new PaymentController();
