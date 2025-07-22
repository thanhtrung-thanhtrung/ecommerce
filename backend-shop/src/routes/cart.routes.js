const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const {
  addToCartValidator,
  updateCartValidator,
} = require("../validators/cart.validator");
const { verifyToken, optionalAuth } = require("../middlewares/auth.middleware");

router.get("/", optionalAuth, cartController.getCart);

router.get("/sync-session", cartController.syncSession);
router.get("/create-session", cartController.createSession);
router.post("/sync-after-login", verifyToken, cartController.syncAfterLogin);

router.post("/", optionalAuth, addToCartValidator, cartController.addToCart);

router.put(
  "/:maGioHang",
  optionalAuth,
  updateCartValidator,
  cartController.updateCart
);

router.delete("/:maGioHang", optionalAuth, cartController.removeFromCart);

router.delete("/", optionalAuth, cartController.clearCart);

router.post("/merge", verifyToken, cartController.mergeCart);

module.exports = router;
