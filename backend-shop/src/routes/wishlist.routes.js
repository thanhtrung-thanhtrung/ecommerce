const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const { validateRequest } = require("../middlewares/validateRequest");
const { authenticate } = require("../middlewares/authenticate");
const {
  addToWishlistValidator,
  removeFromWishlistValidator,
  checkWishlistValidator,
} = require("../validators/wishlist.validator");

// Tất cả các routes đều yêu cầu xác thực người dùng
router.use(authenticate);

// Thêm sản phẩm vào wishlist
router.post(
  "/",
  addToWishlistValidator,
  validateRequest,
  wishlistController.addToWishlist
);

// Xóa sản phẩm khỏi wishlist
router.delete(
  "/:id_SanPham",
  removeFromWishlistValidator,
  validateRequest,
  wishlistController.removeFromWishlist
);

// Lấy danh sách sản phẩm trong wishlist
router.get("/", wishlistController.getWishlist);

// Kiểm tra sản phẩm có trong wishlist không
router.get(
  "/check/:id_SanPham",
  checkWishlistValidator,
  validateRequest,
  wishlistController.checkInWishlist
);

// Xóa toàn bộ wishlist
router.delete("/", wishlistController.clearWishlist);

module.exports = router;
