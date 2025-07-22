const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {
  createPaymentValidator,
  updatePaymentValidator,
  updateStatusValidator,
} = require("../validators/payment.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

router.get("/methods", paymentController.getPaymentMethods);
router.post("/create", createPaymentValidator, paymentController.createPayment);
router.post(
  "/vnpay/create-payment-url",
  createPaymentValidator,
  paymentController.createPayment
);
router.get("/test/vnpay", paymentController.testVNPay);
router.post("/vnpay/ipn", paymentController.handleVNPayIPN);
router.get("/vnpay/return", paymentController.handleVNPayReturn);

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
  updatePaymentValidator,
  paymentController.createPaymentMethod
);
router.put(
  "/admin/:id",
  verifyToken,
  checkAdminRole(),
  updatePaymentValidator,
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
