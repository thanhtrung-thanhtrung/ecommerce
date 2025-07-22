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
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

router.get("/hoat-dong", supplierController.layDanhSachNhaCungCapHoatDong);

router.get(
  "/",
  getSupplierListValidator,
  supplierController.layDanhSachNhaCungCap
);

router.get(
  "/:id",
  getSupplierDetailValidator,
  supplierController.layChiTietNhaCungCap
);

router.get("/thong-ke/tong-quan", supplierController.thongKeNhaCungCap);

router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  supplierValidator,
  supplierController.taoNhaCungCap
);

router.put(
  "/:id",
  verifyToken,
  checkAdminRole(),
  updateSupplierValidator,
  supplierController.capNhatNhaCungCap
);

router.patch(
  "/:id/trang-thai",
  verifyToken,
  checkAdminRole(),
  updateStatusValidator,
  supplierController.capNhatTrangThai
);

router.delete(
  "/:id",
  verifyToken,
  checkAdminRole(),
  deleteSupplierValidator,
  supplierController.xoaNhaCungCap
);

module.exports = router;
