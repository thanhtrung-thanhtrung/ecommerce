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
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");

// Routes công khai
router.post(
  "/check-stock",

  checkStockValidator,
  InventoryController.checkStock
);

// Routes admin (yêu cầu xác thực và quyền admin)
router.post(
  "/admin/phieu-nhap/create",
  verifyToken,
  checkAdminRole(),
  createPhieuNhapValidator,
  InventoryController.createPhieuNhap
);

router.put(
  "/admin/phieu-nhap/:phieuNhapId",
  verifyToken,
  checkAdminRole(),
  updatePhieuNhapStatusValidator,
  InventoryController.updatePhieuNhap
);

router.get(
  "/admin/phieu-nhap/list",
  verifyToken,
  checkAdminRole(),
  getPhieuNhapListValidator,
  InventoryController.getPhieuNhapList
);

router.get(
  "/admin/phieu-nhap/:phieuNhapId",
  verifyToken,
  checkAdminRole(),
  getPhieuNhapDetailValidator,
  InventoryController.getPhieuNhapDetail
);

// Routes cho thống kê và báo cáo (yêu cầu quyền admin)
router.get(
  "/thong-ke/ton-kho",
  verifyToken,
  checkAdminRole(),
  thongKeTonKhoValidator,
  InventoryController.thongKeTonKho
);

router.get(
  "/thong-ke/nhap-kho",
  verifyToken,
  checkAdminRole(),
  thongKeNhapKhoTheoThoiGianValidator,
  InventoryController.thongKeNhapKhoTheoThoiGian
);

// Routes cho lịch sử nhập kho (yêu cầu quyền admin)
router.get(
  "/san-pham/:chiTietSanPhamId/lich-su-nhap",
  verifyToken,
  checkAdminRole(),
  getProductImportHistoryValidator,
  InventoryController.getProductImportHistory
);

// Routes mới đã thêm (yêu cầu quyền admin)
router.get(
  "/bao-cao/ton-kho",
  verifyToken,
  checkAdminRole(),
  InventoryController.getTonKhoReport
);

router.post(
  "/sync",
  verifyToken,
  checkAdminRole(),
  InventoryController.syncTonKho
);

// Route kiểm tra tồn kho (yêu cầu quyền admin)
router.post(
  "/kiem-tra-ton-kho",
  verifyToken,
  checkAdminRole(),
  InventoryController.checkStockBeforeImport
);

// ===== API MỚI CHO PHIẾU NHẬP THÔNG MINH =====

// Tìm kiếm sản phẩm cho phiếu nhập (có filter) - yêu cầu quyền admin
router.get(
  "/products/search",
  verifyToken,
  checkAdminRole(),
  InventoryController.searchProductsForImport
);

// Lấy thông tin sản phẩm và biến thể hiện có - yêu cầu quyền admin
router.get(
  "/products/:productId/variants",
  verifyToken,
  checkAdminRole(),
  InventoryController.getProductVariantsForImport
);

// Tạo phiếu nhập thông minh - yêu cầu quyền admin
router.post(
  "/admin/phieu-nhap/smart-create",
  verifyToken,
  checkAdminRole(),
  InventoryController.createSmartPhieuNhap
);

// Tạo mã sản phẩm tự động - yêu cầu quyền admin
router.post(
  "/generate-variant-code",
  verifyToken,
  checkAdminRole(),
  InventoryController.generateVariantCode
);

module.exports = router;
