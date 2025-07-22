const express = require("express");
const router = express.Router();
const WishlistController = require("../controllers/wishlist.controller");
const {
  wishlistValidator,
  getWishlistValidator,
  checkMultipleProductsValidator,
  getWishlistDetailValidator,
} = require("../validators/wishlist.validator");

router.get("/", getWishlistValidator, WishlistController.layDanhSachWishlist);

router.get("/count", WishlistController.demSoLuongWishlist);

router.get(
  "/check-multiple",
  checkMultipleProductsValidator,
  WishlistController.kiemTraNhieuSanPham
);
router.get("/show", WishlistController.hienThiWishlist);

router.get("/statistics", WishlistController.thongKeWishlist);

router.get(
  "/details",
  getWishlistDetailValidator,
  WishlistController.layWishlistChiTiet
);

router.get(
  "/check/:productId",
  wishlistValidator,
  WishlistController.kiemTraTrongWishlist
);

router.post(
  "/:productId",
  wishlistValidator,
  WishlistController.themVaoWishlist
);

router.delete(
  "/:productId",
  wishlistValidator,
  WishlistController.xoaKhoiWishlist
);

router.delete("/", WishlistController.xoaToanBoWishlist);

module.exports = router;
