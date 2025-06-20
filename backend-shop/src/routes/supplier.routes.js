const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplier.controller");
const {
  supplierValidator,
  updateSupplierValidator,
  updateStatusValidator,
  getSupplierDetailValidator,
  getSupplierListValidator,
  deleteSupplierValidator,
} = require("../validators/supplier.validator");

// Routes công khai - không cần authentication
// Lấy danh sách nhà cung cấp hoạt động (cho dropdown)
router.get("/hoat-dong", supplierController.layDanhSachNhaCungCapHoatDong);

// Lấy danh sách nhà cung cấp với tìm kiếm và phân trang
router.get(
  "/",
  getSupplierListValidator,
  supplierController.layDanhSachNhaCungCap
);

// Lấy chi tiết nhà cung cấp
router.get(
  "/:id",
  getSupplierDetailValidator,
  supplierController.layChiTietNhaCungCap
);

// Thống kê nhà cung cấp
router.get("/thong-ke/tong-quan", supplierController.thongKeNhaCungCap);

// Tạo nhà cung cấp mới
router.post("/", supplierValidator, supplierController.taoNhaCungCap);

// Cập nhật nhà cung cấp
router.put(
  "/:id",
  updateSupplierValidator,
  supplierController.capNhatNhaCungCap
);

// Cập nhật trạng thái nhà cung cấp
router.patch(
  "/:id/trang-thai",
  updateStatusValidator,
  supplierController.capNhatTrangThai
);

// Xóa nhà cung cấp
router.delete(
  "/:id",
  deleteSupplierValidator,
  supplierController.xoaNhaCungCap
);

module.exports = router;
