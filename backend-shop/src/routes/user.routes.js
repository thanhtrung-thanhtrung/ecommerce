const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  updateProfileValidator,
  changePasswordValidator,
} = require("../validators/user.validator");
const { verifyToken } = require("../middlewares/auth.middleware");

// Áp dụng middleware xác thực cho tất cả các routes
router.use(verifyToken);

router.get("/profile", userController.getProfile);

router.put("/profile", updateProfileValidator, userController.updateProfile);

router.put(
  "/change-password",
  changePasswordValidator,
  userController.changePassword
);

router.delete("/delete-account", userController.deleteAccount);

router.get("/order-history", userController.getOrderHistory);

router.get("/wishlist", userController.getWishlist);
router.post("/wishlist", userController.addToWishlist);
router.delete("/wishlist/:id_SanPham", userController.removeFromWishlist);

module.exports = router;
