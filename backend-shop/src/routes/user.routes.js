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

// Route xem thông tin cá nhân
router.get("/profile", userController.getProfile);

// Route cập nhật thông tin cá nhân
router.put("/profile", updateProfileValidator, userController.updateProfile);

// Route đổi mật khẩu
router.put(
  "/change-password",
  changePasswordValidator,
  userController.changePassword
);

// Route xóa tài khoản
router.delete("/delete-account", userController.deleteAccount);

// Route xem lịch sử đơn hàng
router.get("/order-history", userController.getOrderHistory);

// Routes quản lý wishlist
router.get("/wishlist", userController.getWishlist);
router.post("/wishlist", userController.addToWishlist);
router.delete("/wishlist/:maSanPham", userController.removeFromWishlist);

module.exports = router;
