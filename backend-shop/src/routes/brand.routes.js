const express = require("express");
const brandController = require("../controllers/brand.controller");
const {
  brandValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/brand.validator");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/brands/",
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

const router = express.Router();

// Lấy danh sách thương hiệu
router.get("/", brandController.layDanhSachThuongHieu);

// Thống kê thương hiệu - Specific route before dynamic routes
router.get("/thong-ke/all", brandController.thongKeThuongHieu);

// Lấy chi tiết thương hiệu - Dynamic route with parameter after specific routes
router.get("/:id", brandController.layChiTietThuongHieu);

// Tạo thương hiệu mới
router.post(
  "/",
  upload.single("Logo"),
  brandValidator,
  brandController.taoThuongHieu
);

// Cập nhật thương hiệu
router.put(
  "/:id",
  upload.single("Logo"),
  brandValidator,
  brandController.capNhatThuongHieu
);

// Xóa thương hiệu
router.delete("/:id", brandController.xoaThuongHieu);

// Cập nhật trạng thái thương hiệu
router.patch(
  "/:id/trang-thai",
  updateStatusValidator,
  brandController.capNhatTrangThai
);

module.exports = router;
