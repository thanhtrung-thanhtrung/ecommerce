const express = require("express");
const router = express.Router();
const VoucherController = require("../controllers/voucher.controller");
const {
  voucherValidator,
  updateVoucherStatusValidator,
  searchVoucherValidator,
} = require("../validators/voucher.validator");

// Tạo voucher mới
router.post("/", voucherValidator, VoucherController.taoVoucher);

// Cập nhật voucher
router.put("/:maVoucher", voucherValidator, VoucherController.capNhatVoucher);

// Cập nhật trạng thái voucher
router.patch(
  "/:maVoucher/status",
  updateVoucherStatusValidator,
  VoucherController.capNhatTrangThai
);

// Tìm kiếm voucher (chỉ cho admin)
router.get("/", searchVoucherValidator, VoucherController.timKiemVoucher);

// Áp dụng voucher - route chính cho frontend
router.post("/:maVoucher/apply", VoucherController.applyVoucher);

module.exports = router;
