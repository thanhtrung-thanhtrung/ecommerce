const express = require("express");
const router = express.Router();
const WishlistController = require("../controllers/wishlist.controller");
const {
  wishlistValidator,
  getWishlistValidator,
  checkMultipleProductsValidator,
  getWishlistDetailValidator,
} = require("../validators/wishlist.validator");

// Lấy danh sách wishlist của người dùng hiện tại
router.get("/", getWishlistValidator, WishlistController.layDanhSachWishlist);

// Đếm số lượng sản phẩm trong wishlist
router.get("/count", WishlistController.demSoLuongWishlist);

// Kiểm tra nhiều sản phẩm có trong wishlist không
router.get(
  "/check-multiple",
  checkMultipleProductsValidator,
  WishlistController.kiemTraNhieuSanPham
);
router.get("/show", WishlistController.hienThiWishlist);

// Thống kê wishlist (admin only)
router.get("/statistics", WishlistController.thongKeWishlist);

// Lấy wishlist chi tiết (admin only)
router.get(
  "/details",
  getWishlistDetailValidator,
  WishlistController.layWishlistChiTiet
);

// Kiểm tra sản phẩm có trong wishlist không
router.get(
  "/check/:productId",
  wishlistValidator,
  WishlistController.kiemTraTrongWishlist
);

// Thêm sản phẩm vào wishlist
router.post(
  "/:productId",
  wishlistValidator,
  WishlistController.themVaoWishlist
);

// Xóa sản phẩm khỏi wishlist
router.delete(
  "/:productId",
  wishlistValidator,
  WishlistController.xoaKhoiWishlist
);

// Xóa toàn bộ wishlist
router.delete("/", WishlistController.xoaToanBoWishlist);

module.exports = router;
