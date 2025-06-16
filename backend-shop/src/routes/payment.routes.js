const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { createPaymentValidator } = require("../validators/payment.validator");

// Route lấy danh sách phương thức thanh toán
router.get("/methods", paymentController.getPaymentMethods);

// Route tạo thanh toán (không cần xác thực)
router.post(
  "/create",
  createPaymentValidator,
  paymentController.createPayment
);

// Routes callback từ các cổng thanh toán (không yêu cầu xác thực)
router.get("/vnpay/ipn", paymentController.handleVNPayIPN);
router.get("/vnpay/return", paymentController.handleVNPayReturn);
router.get("/momo/ipn", paymentController.handleMoMoIPN);
router.get("/zalopay/ipn", paymentController.handleZaloPayIPN);

module.exports = router;
