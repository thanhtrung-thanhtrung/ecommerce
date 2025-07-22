const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenue.controller");
const {
  thongKeDoanhThuValidator,
  baoCaoDoanhThuValidator,
  thongKeKhachHangValidator,
  thongKeMaGiamGiaValidator,
  xuatBaoCaoValidator,
  soSanhDoanhThuValidator,
  tongQuanDoanhThuValidator,
} = require("../validators/revenue.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

router.get(
  "/stats",
  verifyToken,
  checkAdminRole(),
  thongKeDoanhThuValidator,
  revenueController.thongKeDoanhThu
);

router.get(
  "/report",
  verifyToken,
  checkAdminRole(),
  baoCaoDoanhThuValidator,
  revenueController.baoCaoDoanhThu
);

router.get(
  "/customers",
  verifyToken,
  checkAdminRole(),
  thongKeKhachHangValidator,
  revenueController.thongKeKhachHang
);

router.get(
  "/vouchers",
  verifyToken,
  checkAdminRole(),
  thongKeMaGiamGiaValidator,
  revenueController.thongKeMaGiamGia
);

router.get(
  "/dashboard",
  verifyToken,
  checkAdminRole(),
  revenueController.dashboardThongKe
);

router.get(
  "/export",
  verifyToken,
  checkAdminRole(),
  xuatBaoCaoValidator,
  revenueController.xuatBaoCao
);

router.get(
  "/compare",
  verifyToken,
  checkAdminRole(),
  soSanhDoanhThuValidator,
  revenueController.soSanhDoanhThu
);

router.get(
  "/overview",
  verifyToken,
  checkAdminRole(),
  tongQuanDoanhThuValidator,
  revenueController.tongQuanDoanhThu
);

module.exports = router;
