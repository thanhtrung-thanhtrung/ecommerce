const wishlistService = require("../services/wishlist.service");

class WishlistController {
  // Thêm sản phẩm vào wishlist
  async addToWishlist(req, res) {
    try {
      const userId = req.user.userId;
      const { id_SanPham } = req.body;

      await wishlistService.addToWishlist(userId, id_SanPham);
      res.json({ message: "Thêm vào danh sách yêu thích thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Xóa sản phẩm khỏi wishlist
  async removeFromWishlist(req, res) {
    try {
      const userId = req.user.userId;
      const { id_SanPham } = req.params;

      await wishlistService.removeFromWishlist(userId, id_SanPham);
      res.json({ message: "Xóa khỏi danh sách yêu thích thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Lấy danh sách sản phẩm trong wishlist
  async getWishlist(req, res) {
    try {
      const userId = req.user.userId;
      const wishlist = await wishlistService.getWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Kiểm tra sản phẩm có trong wishlist không
  async checkInWishlist(req, res) {
    try {
      const userId = req.user.userId;
      const { id_SanPham } = req.params;

      const exists = await wishlistService.checkInWishlist(userId, id_SanPham);
      res.json({ exists });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Xóa toàn bộ wishlist
  async clearWishlist(req, res) {
    try {
      const userId = req.user.userId;
      await wishlistService.clearWishlist(userId);
      res.json({ message: "Xóa toàn bộ danh sách yêu thích thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new WishlistController();
