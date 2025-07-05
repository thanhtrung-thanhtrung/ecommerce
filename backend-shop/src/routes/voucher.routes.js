const express = require("express");
const router = express.Router();
const VoucherController = require("../controllers/voucher.controller");
const {
  voucherValidator,
  updateVoucherStatusValidator,
  searchVoucherValidator,
} = require("../validators/voucher.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

// Routes admin - yêu cầu quyền admin (Admin hoặc Nhân viên)
// Tìm kiếm voucher (chỉ cho admin)
router.get(
  "/",
  verifyToken,
  checkAdminRole(),
  searchVoucherValidator,
  VoucherController.timKiemVoucher
);

// Tạo voucher mới
router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  voucherValidator,
  VoucherController.taoVoucher
);

// Cập nhật voucher
router.put(
  "/:maVoucher",
  verifyToken,
  checkAdminRole(),
  voucherValidator,
  VoucherController.capNhatVoucher
);

// Cập nhật trạng thái voucher
router.patch(
  "/:maVoucher/status",
  verifyToken,
  checkAdminRole(),
  updateVoucherStatusValidator,
  VoucherController.capNhatTrangThai
);

// Áp dụng voucher - route công khai cho frontend
router.post("/:maVoucher/apply", VoucherController.applyVoucher);

module.exports = router;
