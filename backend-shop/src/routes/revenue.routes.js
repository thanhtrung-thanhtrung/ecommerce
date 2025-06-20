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

// GET /api/revenue/stats - Thống kê doanh thu theo thời gian
router.get(
  "/stats",
  thongKeDoanhThuValidator,
  revenueController.thongKeDoanhThu
);

// GET /api/revenue/report - Báo cáo doanh thu chi tiết
router.get(
  "/report",
  baoCaoDoanhThuValidator,
  revenueController.baoCaoDoanhThu
);

// GET /api/revenue/customers - Thống kê khách hàng VIP
router.get(
  "/customers",
  thongKeKhachHangValidator,
  revenueController.thongKeKhachHang
);

// GET /api/revenue/vouchers - Thống kê mã giảm giá
router.get(
  "/vouchers",
  thongKeMaGiamGiaValidator,
  revenueController.thongKeMaGiamGia
);

// GET /api/revenue/dashboard - Dashboard thống kê tổng quan
router.get("/dashboard", revenueController.dashboardThongKe);

// GET /api/revenue/export - Xuất báo cáo
router.get("/export", xuatBaoCaoValidator, revenueController.xuatBaoCao);

// GET /api/revenue/compare - So sánh doanh thu giữa 2 kỳ
router.get(
  "/compare",
  soSanhDoanhThuValidator,
  revenueController.soSanhDoanhThu
);

// GET /api/revenue/overview - Tổng quan doanh thu (cho admin dashboard)
router.get(
  "/overview",
  tongQuanDoanhThuValidator,
  revenueController.tongQuanDoanhThu
);

module.exports = router;
