const { validationResult } = require("express-validator");
const userService = require("../services/user.service");

class UserController {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
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
        req.user.id,
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
      await userService.changePassword(req.user.id, matKhauCu, matKhauMoi);
      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      await userService.deleteAccount(req.user.id);
      res.json({ message: "Xóa tài khoản thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrderHistory(req, res) {
    try {
      const orders = await userService.getOrderHistory(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getWishlist(req, res) {
    try {
      const wishlist = await userService.getWishlist(req.user.id);
      res.json(wishlist);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async addToWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { id_SanPham } = req.body;

      if (!userId || !id_SanPham) {
        return res.status(400).json({
          message: "userId và id_SanPham không được để trống",
        });
      }

      const result = await userService.addToWishlist(userId, id_SanPham);
      res.json({
        success: true,
        message: "Đã thêm sản phẩm vào danh sách yêu thích",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async removeFromWishlist(req, res) {
    try {
      const { id_SanPham } = req.params;
      const result = await userService.removeFromWishlist(
        req.user.id,
        id_SanPham
      );
      res.json({
        success: true,
        message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new UserController();
