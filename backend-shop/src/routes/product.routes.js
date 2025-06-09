const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const {
  reviewProductValidator,
  searchProductValidator,
} = require("../validators/product.validator");
const { verifyToken } = require("../middlewares/auth.middleware");

// Routes công khai
router.get("/", productController.getAllProducts);
router.post(
  "/search",
  searchProductValidator,
  productController.searchProducts
);
router.get("/:maSanPham", productController.getProductDetail);

// Route đánh giá sản phẩm (yêu cầu đăng nhập)
router.post(
  "/:maSanPham/review",
  verifyToken,
  reviewProductValidator,
  productController.reviewProduct
);

module.exports = router;
