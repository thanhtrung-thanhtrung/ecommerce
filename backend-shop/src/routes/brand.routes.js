const express = require("express");
const brandController = require("../controllers/brand.controller");
const {
  brandValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/brand.validator");

const router = express.Router();

// Lấy danh sách thương hiệu
router.get("/", brandController.layDanhSachThuongHieu);

// Thống kê thương hiệu - Specific route before dynamic routes
router.get("/thong-ke/all", brandController.thongKeThuongHieu);

// Lấy chi tiết thương hiệu - Dynamic route with parameter after specific routes
router.get("/:id", brandController.layChiTietThuongHieu);

// Tạo thương hiệu mới
router.post("/", brandValidator, brandController.taoThuongHieu);

// Cập nhật thương hiệu
router.put("/:id", brandValidator, brandController.capNhatThuongHieu);

// Xóa thương hiệu
router.delete("/:id", brandController.xoaThuongHieu);

// Cập nhật trạng thái thương hiệu
router.patch(
  "/:id/trang-thai",
  updateStatusValidator,
  brandController.capNhatTrangThai
);

module.exports = router;
