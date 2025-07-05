const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {
  createPaymentValidator,
  paymentMethodValidator,
  updateStatusValidator,
} = require("../validators/payment.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

// Route lấy danh sách phương thức thanh toán (public)
router.get("/methods", paymentController.getPaymentMethods);

// Route tạo thanh toán (không cần xác thực)
router.post("/create", createPaymentValidator, paymentController.createPayment);

// Routes callback từ các cổng thanh toán (không yêu cầu xác thực)
router.get("/vnpay/ipn", paymentController.handleVNPayIPN);
router.get("/vnpay/return", paymentController.handleVNPayReturn);
router.get("/momo/ipn", paymentController.handleMoMoIPN);
router.get("/zalopay/ipn", paymentController.handleZaloPayIPN);

// Admin routes - yêu cầu quyền admin (Admin hoặc Nhân viên)
router.get(
  "/admin",
  verifyToken,
  checkAdminRole(),
  paymentController.getPaymentMethodsAdmin
);

router.post(
  "/admin",
  verifyToken,
  checkAdminRole(),
  paymentMethodValidator,
  paymentController.createPaymentMethod
);

router.put(
  "/admin/:id",
  verifyToken,
  checkAdminRole(),
  paymentMethodValidator,
  paymentController.updatePaymentMethod
);

router.patch(
  "/admin/:id/status",
  verifyToken,
  checkAdminRole(),
  updateStatusValidator,
  paymentController.updatePaymentStatus
);

router.delete(
  "/admin/:id",
  verifyToken,
  checkAdminRole(),
  paymentController.deletePaymentMethod
);

module.exports = router;
