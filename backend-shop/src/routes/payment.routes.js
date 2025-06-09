const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { createPaymentValidator } = require("../validators/payment.validator");
const { optionalAuth } = require("../middlewares/auth.middleware");

// Route tạo thanh toán (hỗ trợ cả guest và user đã đăng nhập)
router.post(
  "/create",
  optionalAuth,
  createPaymentValidator,
  paymentController.createPayment
);

// Routes callback từ các cổng thanh toán (không yêu cầu xác thực)
router.get("/vnpay/ipn", paymentController.handleVNPayIPN);
router.get("/vnpay/return", paymentController.handleVNPayReturn);
router.get("/momo/ipn", paymentController.handleMoMoIPN);
router.get("/zalopay/ipn", paymentController.handleZaloPayIPN);

module.exports = router;
