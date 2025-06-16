const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shipping.controller");

// Lấy danh sách phương thức vận chuyển
router.get("/methods", shippingController.getShippingMethods);

// Lấy tùy chọn vận chuyển với phí tính theo địa chỉ và giá trị đơn hàng
router.get("/options", shippingController.getShippingOptions);

// Tính phí vận chuyển
router.post("/calculate", shippingController.calculateShippingFee);

module.exports = router;
