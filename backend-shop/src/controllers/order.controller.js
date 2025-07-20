const { validationResult } = require("express-validator");
const orderService = require("../services/order.service");

class OrderController {
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const sessionId =
        req.sessionID || req.cookies?.sessionId || req.body.sessionId;
      const userId = req.user?.id;

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin phiên hoặc người dùng",
        });
      }

      const order = await orderService.createOrder(req.body, userId, sessionId);

      res.status(201).json({
        success: true,
        message: "Tạo đơn hàng thành công",
        data: order,
      });
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi tạo đơn hàng",
      });
    }
  }

  async getOrderDetail(req, res) {
    try {
      const { maDonHang } = req.params;
      const order = await orderService.getOrderDetail(maDonHang);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // New method for guest order tracking
  async getGuestOrderDetail(req, res) {
    try {
      const { maDonHang } = req.params;
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          message: "Vui lòng cung cấp email để tra cứu đơn hàng",
        });
      }

      const order = await orderService.getGuestOrderDetail(maDonHang, email);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async cancelOrder(req, res) {
    try {
      const { maDonHang } = req.params;
      const { lyDoHuy } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Chức năng này yêu cầu đăng nhập",
        });
      }

      const order = await orderService.cancelOrder(maDonHang, userId, lyDoHuy);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // New method for guest order cancellation
  async cancelGuestOrder(req, res) {
    try {
      const { maDonHang } = req.params;
      const { lyDoHuy, email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Vui lòng cung cấp email để hủy đơn hàng",
        });
      }

      const order = await orderService.cancelGuestOrder(
        maDonHang,
        email,
        lyDoHuy
      );
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrderHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Chức năng này yêu cầu đăng nhập",
        });
      }

      const orders = await orderService.getOrderHistory(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      res.json(orders);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // ===== ADMIN METHODS =====
  // Get all orders for admin with filtering and pagination
  async getOrdersAdmin(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        date,
        search,
        startDate,
        endDate,
      } = req.query;

      const orders = await orderService.getOrdersAdmin({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        date,
        search,
        startDate,
        endDate,
      });

      res.json(orders);
    } catch (error) {
      console.error("Error getting admin orders:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Get order detail for admin
  async getOrderDetailAdmin(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderDetailAdmin(orderId);
      res.json(order);
    } catch (error) {
      console.error("Error getting admin order detail:", error);
      res.status(400).json({ message: error.message });
    }
  }

  // Update order status by admin
  async updateOrderStatusAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { orderId } = req.params;
      const { status, note } = req.body;

      // Gọi service cập nhật trạng thái, service sẽ tự xử lý logic voucher
      const order = await orderService.updateOrderStatusAdmin(
        orderId,
        status,
        note
      );

      res.json({
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công",
        data: order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật trạng thái đơn hàng",
      });
    }
  }

  // Get order statistics for admin dashboard
  async getOrderStats(req, res) {
    try {
      const { period = "week" } = req.query;
      const stats = await orderService.getOrderStats(period);
      res.json(stats);
    } catch (error) {
      console.error("Error getting order stats:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new OrderController();
