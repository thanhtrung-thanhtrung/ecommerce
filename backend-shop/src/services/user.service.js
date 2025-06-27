const db = require("../config/database");
const bcrypt = require("bcryptjs");

class UserService {
  async getProfile(userId) {
    const [users] = await db.execute(
      `SELECT nd.id, nd.Email, nd.HoTen, nd.SDT, nd.DiaChi, nd.TrangThai, qnd.id_Quyen
       FROM nguoidung nd
       LEFT JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
       WHERE nd.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new Error("Người dùng không tồn tại");
    }

    return users[0];
  }

  async updateProfile(userId, userData) {
    const allowedFields = {
      hoTen: "HoTen",
      soDienThoai: "SDT",
      diaChi: "DiaChi",
    };

    const fields = [];
    const values = [];

    for (const key in allowedFields) {
      if (userData[key] !== undefined) {
        fields.push(`${allowedFields[key]} = ?`);
        values.push(userData[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error("Không có trường nào để cập nhật");
    }

    values.push(userId);

    const sql = `UPDATE nguoidung SET ${fields.join(", ")} WHERE id = ?`;

    await db.execute(sql, values);

    return this.getProfile(userId);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const [users] = await db.execute("SELECT * FROM nguoidung WHERE id = ?", [
      userId,
    ]);

    if (users.length === 0) {
      throw new Error("Người dùng không tồn tại");
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(oldPassword, user.MatKhau);
    if (!isValidPassword) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute("UPDATE nguoidung SET MatKhau = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    return true;
  }

  async deleteAccount(userId) {
    await db.execute("DELETE FROM token_lammoi WHERE id_NguoiDung = ?", [
      userId,
    ]);

    await db.execute("UPDATE nguoidung SET TrangThai = 0 WHERE id = ?", [
      userId,
    ]);

    return true;
  }

  async getOrderHistory(userId) {
    const [orders] = await db.execute(
      `SELECT dh.*, httt.Ten as tenHinhThucThanhToan, htvc.Ten as tenHinhThucVanChuyen 
       FROM donhang dh
       LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
       LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
       WHERE dh.id_NguoiMua = ?
       ORDER BY dh.NgayDatHang DESC`,
      [userId]
    );

    for (let order of orders) {
      const [orderDetails] = await db.execute(
        `SELECT ctdh.*, ctsp.id_SanPham, sp.Ten as tenSanPham, sp.HinhAnh
         FROM chitietdonhang ctdh
         JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
         JOIN sanpham sp ON ctsp.id_SanPham = sp.id
         WHERE ctdh.id_DonHang = ?`,
        [order.id]
      );
      order.chiTiet = orderDetails;
    }

    return orders;
  }

  async getWishlist(userId) {
    const [wishlist] = await db.execute(
      `SELECT w.*, sp.Ten as tenSanPham, sp.HinhAnh, sp.Gia, sp.MoTa
       FROM wishlist w
       JOIN sanpham sp ON w.id_SanPham = sp.id
       WHERE w.id_NguoiDung = ?`,
      [userId]
    );

    return wishlist;
  }

  async addToWishlist(userId, productId) {
    if (userId == null || productId == null) {
      throw new Error("userId và productId không được để trống");
    }
    const [existing] = await db.execute(
      "SELECT * FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (existing.length > 0) {
      throw new Error("Sản phẩm đã có trong danh sách yêu thích");
    }

    await db.execute(
      "INSERT INTO wishlist (id_NguoiDung, id_SanPham) VALUES (?, ?)",
      [userId, productId]
    );

    return true;
  }

  async removeFromWishlist(userId, productId) {
    await db.execute(
      "DELETE FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    return true;
  }
}

module.exports = new UserService();
