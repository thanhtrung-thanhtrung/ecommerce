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

router.get(
  "/admin",
  verifyToken,
  checkAdminRole(),
  orderController.getOrdersAdmin
);

router.get(
  "/admin/:orderId",
  verifyToken,
  checkAdminRole(),
  orderController.getOrderDetailAdmin
);

router.patch(
  "/admin/:orderId/status",
  verifyToken,
  checkAdminRole(),
  updateOrderStatusValidator,
  orderController.updateOrderStatusAdmin
);

router.get(
  "/admin/stats/overview",
  verifyToken,
  checkAdminRole(),
  orderController.getOrderStats
);

router.get("/", verifyToken, orderController.getOrderHistory);

router.post(
  "/",
  optionalAuth,
  createOrderValidator,
  orderController.createOrder
);

router.get("/guest/:maDonHang", orderController.getGuestOrderDetail);

router.post("/guest/:maDonHang/cancel", orderController.cancelGuestOrder);

router.get("/:maDonHang", verifyToken, orderController.getOrderDetail);

router.post(
  "/:maDonHang/cancel",
  verifyToken,
  cancelOrderValidator,
  orderController.cancelOrder
);

module.exports = router;
