const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const {
  createOrderValidator,
  cancelOrderValidator,
} = require("../validators/order.validator");
const { verifyToken, optionalAuth } = require("../middlewares/auth.middleware");

// Route tạo đơn hàng mới (hỗ trợ cả guest và user đã đăng nhập)
router.post(
  "/",
  optionalAuth,
  createOrderValidator,
  orderController.createOrder
);

// Route xem chi tiết đơn hàng (yêu cầu đăng nhập)
router.get("/:maDonHang", verifyToken, orderController.getOrderDetail);

// Route tra cứu đơn hàng cho guest (không cần đăng nhập)
router.get("/guest/:maDonHang", orderController.getGuestOrderDetail);

// Route hủy đơn hàng (yêu cầu đăng nhập)
router.post(
  "/:maDonHang/cancel",
  verifyToken,
  cancelOrderValidator,
  orderController.cancelOrder
);

// Route hủy đơn hàng cho guest (không cần đăng nhập)
router.post("/guest/:maDonHang/cancel", orderController.cancelGuestOrder);

// Route xem lịch sử đơn hàng (yêu cầu đăng nhập)
router.get("/", verifyToken, orderController.getOrderHistory);

module.exports = router;
