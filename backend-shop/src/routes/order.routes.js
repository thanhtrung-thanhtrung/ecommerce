const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const {
  createOrderValidator,
  cancelOrderValidator,
  updateOrderStatusValidator,
} = require("../validators/order.validator");
const {
  verifyToken,
  optionalAuth,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

// ===== ADMIN ROUTES =====
// Admin route to get all orders with filtering and pagination
router.get(
  "/admin",
  verifyToken,
  checkAdminRole(),
  orderController.getOrdersAdmin
);

// Admin route to get order detail
router.get(
  "/admin/:orderId",
  verifyToken,
  checkAdminRole(),
  orderController.getOrderDetailAdmin
);

// Admin route to update order status
router.patch(
  "/admin/:orderId/status",
  verifyToken,
  checkAdminRole(),
  updateOrderStatusValidator,
  orderController.updateOrderStatusAdmin
);

// Admin route to get order statistics
router.get(
  "/admin/stats/overview",
  verifyToken,
  checkAdminRole(),
  orderController.getOrderStats
);

// ===== CUSTOMER ROUTES =====
// Route xem lịch sử đơn hàng (yêu cầu đăng nhập)
router.get("/", verifyToken, orderController.getOrderHistory);

// Route tạo đơn hàng mới (hỗ trợ cả guest và user đã đăng nhập)
router.post(
  "/",
  optionalAuth,
  createOrderValidator,
  orderController.createOrder
);

// Route tra cứu đơn hàng cho guest (không cần đăng nhập)
router.get("/guest/:maDonHang", orderController.getGuestOrderDetail);

// Route hủy đơn hàng cho guest (không cần đăng nhập)
router.post("/guest/:maDonHang/cancel", orderController.cancelGuestOrder);

// Route xem chi tiết đơn hàng (yêu cầu đăng nhập)
router.get("/:maDonHang", verifyToken, orderController.getOrderDetail);

// Route hủy đơn hàng (yêu cầu đăng nhập)
router.post(
  "/:maDonHang/cancel",
  verifyToken,
  cancelOrderValidator,
  orderController.cancelOrder
);

module.exports = router;
