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

// Tất cả routes revenue yêu cầu quyền admin
// GET /api/revenue/stats - Thống kê doanh thu theo thời gian
router.get(
  "/stats",
  verifyToken,
  checkAdminRole(),
  thongKeDoanhThuValidator,
  revenueController.thongKeDoanhThu
);

// GET /api/revenue/report - Báo cáo doanh thu chi tiết
router.get(
  "/report",
  verifyToken,
  checkAdminRole(),
  baoCaoDoanhThuValidator,
  revenueController.baoCaoDoanhThu
);

// GET /api/revenue/customers - Thống kê khách hàng VIP
router.get(
  "/customers",
  verifyToken,
  checkAdminRole(),
  thongKeKhachHangValidator,
  revenueController.thongKeKhachHang
);

// GET /api/revenue/vouchers - Thống kê mã giảm giá
router.get(
  "/vouchers",
  verifyToken,
  checkAdminRole(),
  thongKeMaGiamGiaValidator,
  revenueController.thongKeMaGiamGia
);

// GET /api/revenue/dashboard - Dashboard thống kê tổng quan
router.get(
  "/dashboard",
  verifyToken,
  checkAdminRole(),
  revenueController.dashboardThongKe
);

// GET /api/revenue/export - Xuất báo cáo
router.get(
  "/export",
  verifyToken,
  checkAdminRole(),
  xuatBaoCaoValidator,
  revenueController.xuatBaoCao
);

// GET /api/revenue/compare - So sánh doanh thu giữa 2 kỳ
router.get(
  "/compare",
  verifyToken,
  checkAdminRole(),
  soSanhDoanhThuValidator,
  revenueController.soSanhDoanhThu
);

// GET /api/revenue/overview - Tổng quan doanh thu (cho admin dashboard)
router.get(
  "/overview",
  verifyToken,
  checkAdminRole(),
  tongQuanDoanhThuValidator,
  revenueController.tongQuanDoanhThu
);

module.exports = router;
