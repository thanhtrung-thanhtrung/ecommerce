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

router.post("/register", registerValidator, authController.register);

router.post("/login", loginValidator, authController.login);

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  authController.forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  authController.resetPassword
);

router.post("/refresh-token", authController.refreshToken);

router.post("/logout", verifyToken, authController.logout);

module.exports = router;
