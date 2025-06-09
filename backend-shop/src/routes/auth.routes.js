const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");
const { verifyToken } = require("../middlewares/auth.middleware");

// Route đăng ký tài khoản
router.post("/register", registerValidator, authController.register);

// Route đăng nhập
router.post("/login", loginValidator, authController.login);

// Route quên mật khẩu
router.post(
  "/forgot-password",
  forgotPasswordValidator,
  authController.forgotPassword
);

// Route đặt lại mật khẩu
router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  authController.resetPassword
);

// Route refresh token
router.post("/refresh-token", authController.refreshToken);

// Route đăng xuất (yêu cầu đăng nhập)
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
