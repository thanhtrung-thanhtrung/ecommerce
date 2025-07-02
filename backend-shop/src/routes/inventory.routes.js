const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const InventoryController = require("../controllers/inventory.controller");
const {
  createPhieuNhapValidator,
  updatePhieuNhapStatusValidator,
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
  updatePhieuNhapStatusValidator,
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

// Routes mới đã thêm
router.get("/bao-cao/ton-kho", InventoryController.getTonKhoReport);

router.post("/sync", InventoryController.syncTonKho);

// Route kiểm tra tồn kho
router.post("/kiem-tra-ton-kho", InventoryController.checkStockBeforeImport);

// ===== API MỚI CHO PHIẾU NHẬP THÔNG MINH =====

// Tìm kiếm sản phẩm cho phiếu nhập (có filter)
router.get("/products/search", InventoryController.searchProductsForImport);

// Lấy thông tin sản phẩm và biến thể hiện có
router.get(
  "/products/:productId/variants",
  InventoryController.getProductVariantsForImport
);

// Tạo phiếu nhập thông minh
router.post(
  "/admin/phieu-nhap/smart-create",
  InventoryController.createSmartPhieuNhap
);

// Tạo mã sản phẩm tự động
router.post("/generate-variant-code", InventoryController.generateVariantCode);

module.exports = router;
