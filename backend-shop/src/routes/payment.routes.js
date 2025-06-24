const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {
  createPaymentValidator,
  paymentMethodValidator,
  updateStatusValidator,
} = require("../validators/payment.validator");

// Route lấy danh sách phương thức thanh toán (public)
router.get("/methods", paymentController.getPaymentMethods);

// Admin routes
router.get("/admin", paymentController.getPaymentMethodsAdmin);
router.post(
  "/admin",
  paymentMethodValidator,
  paymentController.createPaymentMethod
);
router.put(
  "/admin/:id",
  paymentMethodValidator,
  paymentController.updatePaymentMethod
);
router.patch(
  "/admin/:id/status",
  updateStatusValidator,
  paymentController.updatePaymentStatus
);
router.delete("/admin/:id", paymentController.deletePaymentMethod);

// Route tạo thanh toán (không cần xác thực)
router.post("/create", createPaymentValidator, paymentController.createPayment);

// Routes callback từ các cổng thanh toán (không yêu cầu xác thực)
router.get("/vnpay/ipn", paymentController.handleVNPayIPN);
router.get("/vnpay/return", paymentController.handleVNPayReturn);
router.get("/momo/ipn", paymentController.handleMoMoIPN);
router.get("/zalopay/ipn", paymentController.handleZaloPayIPN);

module.exports = router;
