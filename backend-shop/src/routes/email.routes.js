const express = require("express");
const router = express.Router();
const emailService = require("../services/email.service");

// Manual send order status email endpoint
router.post("/order-status", async (req, res) => {
  try {
    const { orderId, status, note } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "orderId và status là bắt buộc",
      });
    }

    // Get order details
    const orderService = require("../services/order.service");
    const orderData = await orderService.getOrderDetail(orderId);

    const result = await emailService.sendOrderStatusUpdate(
      orderData,
      status,
      note
    );

    res.json({
      success: true,
      message: "Email thông báo trạng thái đã được gửi",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
