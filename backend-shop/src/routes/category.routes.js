const express = require("express");
const categoryController = require("../controllers/category.controller");
const {
  categoryValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/category.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Routes công khai
router.get("/", categoryController.layDanhSachDanhMuc);
router.get("/thong-ke/all", categoryController.thongKeDanhMuc);
router.get("/:id", categoryController.layChiTietDanhMuc);

// Routes admin - yêu cầu quyền admin
router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  categoryValidator,
  categoryController.taoDanhMuc
);

router.put(
  "/:id",
  verifyToken,
  checkAdminRole(),
  categoryValidator,
  categoryController.capNhatDanhMuc
);

router.delete(
  "/:id",
  verifyToken,
  checkAdminRole(),
  categoryController.xoaDanhMuc
);

router.patch(
  "/:id/trang-thai",
  verifyToken,
  checkAdminRole(),
  updateStatusValidator,
  categoryController.capNhatTrangThai
);

module.exports = router;
