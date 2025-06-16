const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { checkSession } = require("../middlewares/auth.middleware");
const InventoryController = require("../controllers/inventory.controller");
const {
  createPhieuNhapValidator,
  updatePhieuNhapValidator,
  getPhieuNhapListValidator,
  getPhieuNhapDetailValidator,
  thongKeTonKhoValidator,
  getProductImportHistoryValidator,
  thongKeNhapKhoTheoThoiGianValidator,
  checkStockValidator,
} = require("../validators/inventory.validator");

// Routes công khai
router.post(
  "/check-stock",

  checkStockValidator,
  InventoryController.checkStock
);

// Routes admin (không cần xác thực)
router.post(
  "/admin/phieu-nhap/create",
  createPhieuNhapValidator,
  InventoryController.createPhieuNhap
);

router.put(
  "/admin/phieu-nhap/:phieuNhapId",
  updatePhieuNhapValidator,
  InventoryController.updatePhieuNhap
);

router.get(
  "/admin/phieu-nhap/list",
  getPhieuNhapListValidator,
  InventoryController.getPhieuNhapList
);

router.get(
  "/admin/phieu-nhap/:phieuNhapId",
  getPhieuNhapDetailValidator,
  InventoryController.getPhieuNhapDetail
);

// Routes cho thống kê và báo cáo
router.get(
  "/thong-ke/ton-kho",
  thongKeTonKhoValidator,
  InventoryController.thongKeTonKho
);

router.get(
  "/thong-ke/nhap-kho",
  thongKeNhapKhoTheoThoiGianValidator,
  InventoryController.thongKeNhapKhoTheoThoiGian
);

// Routes cho lịch sử nhập kho
router.get(
  "/san-pham/:chiTietSanPhamId/lich-su-nhap",
  getProductImportHistoryValidator,
  InventoryController.getProductImportHistory
);

// Route kiểm tra tồn kho
router.post("/kiem-tra-ton-kho", InventoryController.checkStockBeforeImport);

module.exports = router;
