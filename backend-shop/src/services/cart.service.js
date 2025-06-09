const db = require("../config/database");

class CartService {
  async getCart(userId = null, sessionId = null) {
    let query = `
      SELECT gh.*, ctsp.id_SanPham, sp.Ten as tenSanPham, sp.HinhAnh, sp.Gia,
             kc.Ten as tenKichCo, ms.Ten as tenMau,
             vts.TonKho as SoLuongTon
      FROM giohang gh
      JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN kichco kc ON ctsp.id_KichCo = kc.id
      JOIN mausac ms ON ctsp.id_MauSac = ms.id
      LEFT JOIN v_tonkho_sanpham vts ON ctsp.id = vts.id_ChiTietSanPham
    `;
    const params = [];
    if (userId) {
      query += " WHERE gh.id_NguoiDung = ?";
      params.push(userId);
    } else if (sessionId) {
      query += " WHERE gh.id_NguoiDung IS NULL AND gh.session_id = ?";
      params.push(sessionId);
    }
    const [cartItems] = await db.execute(query, params);
    return cartItems;
  }

  async addToCart(cartData, userId = null, sessionId = null) {
    const { id_ChiTietSanPham, soLuong } = cartData;
    // Kiểm tra số lượng tồn
    const [inventory] = await db.execute(
      "SELECT TonKho FROM v_tonkho_sanpham WHERE id_ChiTietSanPham = ?",
      [id_ChiTietSanPham]
    );
    if (inventory.length === 0 || inventory[0].TonKho < soLuong) {
      throw new Error("Số lượng sản phẩm không đủ");
    }
    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    let where = userId
      ? "id_NguoiDung = ?"
      : "session_id = ? AND id_NguoiDung IS NULL";
    const [existingItem] = await db.execute(
      `SELECT * FROM giohang WHERE id_ChiTietSanPham = ? AND ${where}`,
      userId ? [id_ChiTietSanPham, userId] : [id_ChiTietSanPham, sessionId]
    );
    if (existingItem.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existingItem[0].SoLuong + soLuong;
      if (newQuantity > inventory[0].TonKho) {
        throw new Error("Số lượng sản phẩm không đủ");
      }
      await db.execute("UPDATE giohang SET SoLuong = ? WHERE id = ?", [
        newQuantity,
        existingItem[0].id,
      ]);
    } else {
      // Thêm mới vào giỏ hàng
      await db.execute(
        "INSERT INTO giohang (id_ChiTietSanPham, SoLuong, id_NguoiDung, session_id) VALUES (?, ?, ?, ?)",
        [id_ChiTietSanPham, soLuong, userId, sessionId]
      );
    }
    return this.getCart(userId, sessionId);
  }

  async updateCart(cartId, soLuong, userId = null, sessionId = null) {
    // Kiểm tra giỏ hàng tồn tại
    let where = userId
      ? "id_NguoiDung = ?"
      : "session_id = ? AND id_NguoiDung IS NULL";
    const [cartItem] = await db.execute(
      `SELECT * FROM giohang WHERE id = ? AND ${where}`,
      userId ? [cartId, userId] : [cartId, sessionId]
    );
    if (cartItem.length === 0) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }
    // Kiểm tra số lượng tồn
    const [inventory] = await db.execute(
      "SELECT TonKho FROM v_tonkho_sanpham WHERE id_ChiTietSanPham = ?",
      [cartItem[0].id_ChiTietSanPham]
    );
    if (inventory[0].TonKho < soLuong) {
      throw new Error("Số lượng sản phẩm không đủ");
    }
    // Cập nhật số lượng
    await db.execute("UPDATE giohang SET SoLuong = ? WHERE id = ?", [
      soLuong,
      cartId,
    ]);
    return this.getCart(userId, sessionId);
  }

  async removeFromCart(cartId, userId = null, sessionId = null) {
    let where = userId
      ? "id_NguoiDung = ?"
      : "session_id = ? AND id_NguoiDung IS NULL";
    await db.execute(
      `DELETE FROM giohang WHERE id = ? AND ${where}`,
      userId ? [cartId, userId] : [cartId, sessionId]
    );
    return this.getCart(userId, sessionId);
  }

  async clearCart(userId = null, sessionId = null) {
    if (userId) {
      await db.execute("DELETE FROM giohang WHERE id_NguoiDung = ?", [userId]);
    } else if (sessionId) {
      await db.execute(
        "DELETE FROM giohang WHERE session_id = ? AND id_NguoiDung IS NULL",
        [sessionId]
      );
    }
    return true;
  }

  async mergeCart(userId, sessionId) {
    // Lấy giỏ hàng từ session
    const [sessionCart] = await db.execute(
      "SELECT * FROM giohang WHERE session_id = ? AND id_NguoiDung IS NULL",
      [sessionId]
    );
    // Lấy giỏ hàng của user
    const [userCart] = await db.execute(
      "SELECT * FROM giohang WHERE id_NguoiDung = ?",
      [userId]
    );
    // Gộp giỏ hàng
    for (const sessionItem of sessionCart) {
      const existingItem = userCart.find(
        (item) => item.id_ChiTietSanPham === sessionItem.id_ChiTietSanPham
      );
      if (existingItem) {
        // Cập nhật số lượng nếu sản phẩm đã tồn tại
        await this.updateCart(
          existingItem.id,
          existingItem.SoLuong + sessionItem.SoLuong,
          userId
        );
        await db.execute("DELETE FROM giohang WHERE id = ?", [sessionItem.id]);
      } else {
        // Thêm sản phẩm mới vào giỏ hàng của user
        await db.execute(
          "UPDATE giohang SET id_NguoiDung = ?, session_id = NULL WHERE id = ?",
          [userId, sessionItem.id]
        );
      }
    }
    return this.getCart(userId);
  }
}

module.exports = new CartService();
