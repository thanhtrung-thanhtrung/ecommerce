const express = require("express");
const brandController = require("../controllers/brand.controller");
const {
  brandValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/brand.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");
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

// Routes công khai
router.get("/", brandController.layDanhSachThuongHieu);

// Thống kê thương hiệu - Specific route before dynamic routes
router.get("/thong-ke/all", brandController.thongKeThuongHieu);

// Lấy chi tiết thương hiệu - Dynamic route with parameter after specific routes
router.get("/:id", brandController.layChiTietThuongHieu);

// Routes admin - yêu cầu quyền admin (Admin hoặc Nhân viên)
// Tạo thương hiệu mới
router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  upload.single("Logo"),
  brandValidator,
  brandController.taoThuongHieu
);

// Cập nhật thương hiệu
router.put(
  "/:id",
  verifyToken,
  checkAdminRole(),
  upload.single("Logo"),
  brandValidator,
  brandController.capNhatThuongHieu
);

// Xóa thương hiệu
router.delete(
  "/:id",
  verifyToken,
  checkAdminRole(),
  brandController.xoaThuongHieu
);

// Cập nhật trạng thái thương hiệu
router.patch(
  "/:id/trang-thai",
  verifyToken,
  checkAdminRole(),
  updateStatusValidator,
  brandController.capNhatTrangThai
);

module.exports = router;
