const { validationResult } = require("express-validator");
const authService = require("../services/auth.service");

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = await authService.register(req.body);
      res.status(201).json({
        message: "Đăng ký thành công",
        userId,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Email, MatKhau } = req.body;
      const result = await authService.login(Email, MatKhau);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Email } = req.body;
      await authService.forgotPassword(Email);
      res.json({ message: "Email đặt lại mật khẩu đã được gửi" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.params;
      const { MatKhau } = req.body;
      await authService.resetPassword(token, MatKhau);
      res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ message: "Đăng xuất thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();
