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

router.get(
  "/san-pham/:chiTietSanPhamId/lich-su-nhap",
  verifyToken,
  checkAdminRole(),
  getProductImportHistoryValidator,
  InventoryController.getProductImportHistory
);

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

router.post(
  "/kiem-tra-ton-kho",
  verifyToken,
  checkAdminRole(),
  InventoryController.checkStockBeforeImport
);


router.get(
  "/products/search",
  verifyToken,
  checkAdminRole(),
  InventoryController.searchProductsForImport
);

router.get(
  "/products/:productId/variants",
  verifyToken,
  checkAdminRole(),
  InventoryController.getProductVariantsForImport
);

router.post(
  "/admin/phieu-nhap/smart-create",
  verifyToken,
  checkAdminRole(),
  InventoryController.createSmartPhieuNhap
);

router.post(
  "/generate-variant-code",
  verifyToken,
  checkAdminRole(),
  InventoryController.generateVariantCode
);

module.exports = router;
