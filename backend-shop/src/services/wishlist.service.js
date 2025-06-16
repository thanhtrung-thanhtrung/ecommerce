const db = require("../config/database");

class WishlistService {
  // Add product to wishlist
  async addToWishlist(userId, productId) {
    // Check if product already exists in wishlist
    const [existing] = await db.execute(
      "SELECT * FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (existing.length > 0) {
      throw new Error("Sản phẩm đã có trong danh sách yêu thích");
    }

    // Check if product exists
    const [product] = await db.execute("SELECT id FROM sanpham WHERE id = ?", [
      productId,
    ]);

    if (product.length === 0) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Add to wishlist
    await db.execute(
      "INSERT INTO wishlist (id_NguoiDung, id_SanPham) VALUES (?, ?)",
      [userId, productId]
    );

    return true;
  }

  // Remove product from wishlist
  async removeFromWishlist(userId, productId) {
    const [result] = await db.execute(
      "DELETE FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy sản phẩm trong danh sách yêu thích");
    }

    return true;
  }

  // Get wishlist products
  async getWishlist(userId) {
    const [wishlist] = await db.execute(
      `SELECT 
        w.id,
        w.NgayThem,
        sp.id as id_SanPham,
        sp.Ten as tenSanPham,
        sp.HinhAnh,
        sp.Gia,
        sp.MoTa,
        sp.TrangThai as trangThaiSanPham,
        dm.Ten as tenDanhMuc,
        th.Ten as tenThuongHieu
      FROM wishlist w
      JOIN sanpham sp ON w.id_SanPham = sp.id
      LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      WHERE w.id_NguoiDung = ?
      ORDER BY w.NgayThem DESC`,
      [userId]
    );

    return wishlist;
  }

  // Check if product exists in wishlist
  async checkInWishlist(userId, productId) {
    const [result] = await db.execute(
      "SELECT id FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    return result.length > 0;
  }

  // Clear entire wishlist
  async clearWishlist(userId) {
    await db.execute("DELETE FROM wishlist WHERE id_NguoiDung = ?", [userId]);

    return true;
  }
}

module.exports = new WishlistService();
