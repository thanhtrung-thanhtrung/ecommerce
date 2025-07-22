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

router.get(
  "/",
  verifyToken,
  checkAdminRole(),
  searchVoucherValidator,
  VoucherController.timKiemVoucher
);

router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  voucherValidator,
  VoucherController.taoVoucher
);

router.put(
  "/:maVoucher",
  verifyToken,
  checkAdminRole(),
  voucherValidator,
  VoucherController.capNhatVoucher
);

router.patch(
  "/:maVoucher/status",
  verifyToken,
  checkAdminRole(),
  updateVoucherStatusValidator,
  VoucherController.capNhatTrangThai
);

router.post("/:maVoucher/apply", VoucherController.applyVoucher);

module.exports = router;
