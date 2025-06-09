const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const {
  addToCartValidator,
  updateCartValidator,
} = require("../validators/cart.validator");
const { verifyToken, optionalAuth } = require("../middlewares/auth.middleware");

// Route xem giỏ hàng (hỗ trợ cả guest và user đã đăng nhập)
router.get("/", optionalAuth, cartController.getCart);

// Routes mới để quản lý session
router.get("/sync-session", cartController.syncSession);
router.get("/create-session", cartController.createSession);
router.post("/sync-after-login", verifyToken, cartController.syncAfterLogin);

// Route thêm sản phẩm vào giỏ hàng (hỗ trợ cả guest và user đã đăng nhập)
router.post("/", optionalAuth, addToCartValidator, cartController.addToCart);

// Route cập nhật số lượng sản phẩm trong giỏ hàng (hỗ trợ cả guest và user đã đăng nhập)
router.put(
  "/:maGioHang",
  optionalAuth,
  updateCartValidator,
  cartController.updateCart
);

// Route xóa sản phẩm khỏi giỏ hàng (hỗ trợ cả guest và user đã đăng nhập)
router.delete("/:maGioHang", optionalAuth, cartController.removeFromCart);

// Route xóa toàn bộ giỏ hàng (hỗ trợ cả guest và user đã đăng nhập)
router.delete("/", optionalAuth, cartController.clearCart);

// Route gộp giỏ hàng khi user đăng nhập (yêu cầu đăng nhập)
router.post("/merge", verifyToken, cartController.mergeCart);

module.exports = router;
