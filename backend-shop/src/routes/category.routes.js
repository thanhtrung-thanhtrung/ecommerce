const express = require("express");
const categoryController = require("../controllers/category.controller");
const {
  categoryValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/category.validator");

const router = express.Router();

// Lấy danh sách danh mục
router.get("/", categoryController.layDanhSachDanhMuc);

// Thống kê danh mục - Specific route before dynamic routes
router.get("/thong-ke/all", categoryController.thongKeDanhMuc);

// Lấy chi tiết danh mục - Dynamic route with parameter after specific routes
router.get("/:id", categoryController.layChiTietDanhMuc);

// Tạo danh mục mới
router.post("/", categoryValidator, categoryController.taoDanhMuc);

// Cập nhật danh mục
router.put("/:id", categoryValidator, categoryController.capNhatDanhMuc);

// Xóa danh mục
router.delete("/:id", categoryController.xoaDanhMuc);

// Cập nhật trạng thái danh mục
router.patch(
  "/:id/trang-thai",
  updateStatusValidator,
  categoryController.capNhatTrangThai
);

module.exports = router;
