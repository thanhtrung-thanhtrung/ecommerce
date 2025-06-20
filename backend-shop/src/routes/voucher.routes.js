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

// Tìm kiếm voucher
router.get("/", searchVoucherValidator, VoucherController.timKiemVoucher);

// Kiểm tra và áp dụng voucher
router.post("/:maVoucher/apply", VoucherController.kiemTraVoucher);

module.exports = router;
