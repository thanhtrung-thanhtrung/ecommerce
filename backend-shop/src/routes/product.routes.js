const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const productController = require("../controllers/product.controller");
const {
  getAllProductsValidator,
  searchProductsValidator,
  getProductDetailValidator,
  reviewProductValidator,
  createProductValidator,
  updateProductAdminValidator,
  deleteProductValidator,
  getAllProductsAdminValidator,
  updateProductStatusValidator,
  checkStockValidator,
} = require("../validators/product.validator");

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/products");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png)"));
  },
});

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Kích thước file quá lớn. Tối đa 5MB",
      });
    }
    return res.status(400).json({
      message: "Lỗi upload file: " + err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
  next();
};

// Routes công khai
router.get("/", getAllProductsValidator, productController.getAllProducts);
router.get(
  "/search",
  searchProductsValidator,
  productController.searchProducts
);
router.get(
  "/:productId",
  getProductDetailValidator,
  productController.getProductDetail
);
router.post(
  "/:productId/check-stock",
  checkStockValidator,
  productController.checkStock
);
router.post(
  "/:productId/review",
  reviewProductValidator,
  productController.reviewProduct
);

// Admin routes
const adminRouter = express.Router();

// Quản lý sản phẩm
adminRouter.post(
  "/admin/create",
  upload.any(), // Chấp nhận tất cả các trường file
  handleUploadError,
  createProductValidator,
  productController.createProduct
);
adminRouter.put(
  "/admin/update/:id",
  upload.any(), // Chấp nhận tất cả các trường file
  handleUploadError,
  updateProductAdminValidator,
  productController.updateProduct
);
adminRouter.delete("/admin/delete/:id", productController.deleteProduct);
adminRouter.get(
  "/admin/list",
  getAllProductsAdminValidator,
  productController.getAllProductsAdmin
);
adminRouter.patch(
  "/admin/:productId/status",
  updateProductStatusValidator,
  productController.updateProductStatus
);
adminRouter.get(
  "/admin/:productId/variants",
  getProductDetailValidator,
  productController.getProductVariants
);
adminRouter.get(
  "/admin/:productId/stock",
  getProductDetailValidator,
  productController.getProductStockInfo
);

// Thêm adminRouter vào router chính
router.use(adminRouter);

module.exports = router;
