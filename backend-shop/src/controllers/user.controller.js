const { validationResult } = require("express-validator");
const userService = require("../services/user.service");

class UserController {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.userId);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updatedProfile = await userService.updateProfile(
        req.user.userId,
        req.body
      );
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matKhauCu, matKhauMoi } = req.body;
      await userService.changePassword(req.user.userId, matKhauCu, matKhauMoi);
      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      await userService.deleteAccount(req.user.userId);
      res.json({ message: "Xóa tài khoản thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrderHistory(req, res) {
    try {
      const orders = await userService.getOrderHistory(req.user.userId);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getWishlist(req, res) {
    try {
      const wishlist = await userService.getWishlist(req.user.userId);
      res.json(wishlist);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async addToWishlist(req, res) {
    try {
      const { maSanPham } = req.body;
      await userService.addToWishlist(req.user.userId, maSanPham);
      res.json({ message: "Đã thêm sản phẩm vào danh sách yêu thích" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async removeFromWishlist(req, res) {
    try {
      const { maSanPham } = req.params;
      await userService.removeFromWishlist(req.user.userId, maSanPham);
      res.json({ message: "Đã xóa sản phẩm khỏi danh sách yêu thích" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new UserController();
