const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shipping.controller");
const shippingValidator = require("../validators/shipping.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

// CRUD Routes cho quản lý phương thức vận chuyển

// Các routes cụ thể phải đặt TRƯỚC routes có params để tránh conflict

// Routes công khai
// Lấy danh sách phương thức vận chuyển đang hoạt động (cho dropdown)
router.get("/active", shippingController.getAllActiveShippingMethods);

// Lấy tùy chọn vận chuyển với phí tính theo địa chỉ và giá trị đơn hàng
router.get("/options", shippingController.getShippingOptions);

// Tính phí vận chuyển
router.post(
  "/calculate",
  shippingValidator.calculateShippingFee(),
  shippingController.calculateShippingFee
);

// Lấy danh sách phương thức vận chuyển với phân trang và tìm kiếm (public)
router.get(
  "/",
  shippingValidator.getShippingMethods(),
  shippingController.getShippingMethods
);

// Lấy phương thức vận chuyển theo ID (public)
router.get(
  "/:id",
  shippingValidator.getShippingMethodById(),
  shippingController.getShippingMethodById
);

// Admin routes - yêu cầu quyền admin (Admin hoặc Nhân viên)
// Tạo mới phương thức vận chuyển
router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  shippingValidator.createShippingMethod(),
  shippingController.createShippingMethod
);

// Cập nhật phương thức vận chuyển
router.put(
  "/:id",
  verifyToken,
  checkAdminRole(),
  shippingValidator.updateShippingMethod(),
  shippingController.updateShippingMethod
);

// Cập nhật trạng thái phương thức vận chuyển (0 hoặc 1)
router.patch(
  "/:id/trang-thai",
  verifyToken,
  checkAdminRole(),
  shippingValidator.updateShippingStatus(),
  shippingController.updateShippingStatus
);

// Xóa cứng phương thức vận chuyển (hard delete)
router.delete(
  "/:id",
  verifyToken,
  checkAdminRole(),
  shippingValidator.hardDeleteShippingMethod(),
  shippingController.hardDeleteShippingMethod
);

module.exports = router;
