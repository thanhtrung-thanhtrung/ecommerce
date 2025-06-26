const db = require("../config/database");
const InventoryService = require("./inventory.service");

class CartService {
  async getCart(userId = null, sessionId = null) {
    let query = `
      SELECT 
        gh.id,
        gh.id_ChiTietSanPham,
        gh.SoLuong as soLuong,
        ctsp.id_SanPham, 
        sp.Ten as Ten,
        sp.HinhAnh, 
        sp.Gia as gia,
        sp.GiaKhuyenMai,
        kc.Ten as kichCo,
        ms.Ten as mauSac,
        ctsp.TonKho as SoLuongTon,
        th.Ten as tenThuongHieu
      FROM giohang gh
      JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN kichco kc ON ctsp.id_KichCo = kc.id
      JOIN mausac ms ON ctsp.id_MauSac = ms.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
    `;
    const params = [];

    if (userId) {
      query += " WHERE gh.id_NguoiDung = ?";
      params.push(userId);
    } else if (sessionId) {
      query += " WHERE gh.id_NguoiDung IS NULL AND gh.session_id = ?";
      params.push(sessionId);
    } else {
      // If no userId or sessionId, return empty cart
      return [];
    }

    query += " ORDER BY gh.id DESC";

    const [cartItems] = await db.execute(query, params);

    // Process image data for each item
    const processedItems = cartItems.map((item) => {
      let anhChinh = "/placeholder.jpg";

      try {
        if (item.HinhAnh && item.HinhAnh !== "{}") {
          const imageData = JSON.parse(item.HinhAnh);
          anhChinh = imageData.anhChinh || "/placeholder.jpg";
        }
      } catch (error) {
        console.error("Error parsing HinhAnh:", error);
      }

      return {
        ...item,
        anhChinh,
        // Ensure consistent property names
        gia: Number(item.gia) || 0,
        soLuong: Number(item.soLuong) || 0,
        GiaKhuyenMai: item.GiaKhuyenMai ? Number(item.GiaKhuyenMai) : null,
      };
    });

    return processedItems;
  }

  async addToCart(cartData, userId = null, sessionId = null) {
    // Sửa tên trường cho đúng với CSDL
    const { id_ChiTietSanPham, SoLuong } = cartData;

    // Kiểm tra số lượng tồn kho
    const stockCheck = await InventoryService.checkStock(
      id_ChiTietSanPham,
      SoLuong
    );
    const stockData = stockCheck.data || stockCheck;
    if (!stockData.isAvailable) {
      throw new Error(
        `Số lượng sản phẩm trong kho không đủ. Hiện có ${stockData.tonKho} sản phẩm.`
      );
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
      const newQuantity = existingItem[0].SoLuong + SoLuong;
      // Kiểm tra lại số lượng tồn kho với số lượng mới
      const newStockCheck = await InventoryService.checkStock(
        id_ChiTietSanPham,
        newQuantity
      );
      const newStockData = newStockCheck.data || newStockCheck;
      if (!newStockData.isAvailable) {
        throw new Error(
          `Số lượng sản phẩm trong kho không đủ. Hiện có ${newStockData.tonKho} sản phẩm.`
        );
      }
      await db.execute("UPDATE giohang SET SoLuong = ? WHERE id = ?", [
        newQuantity,
        existingItem[0].id,
      ]);
    } else {
      // Thêm mới vào giỏ hàng
      await db.execute(
        "INSERT INTO giohang (id_ChiTietSanPham, SoLuong, id_NguoiDung, session_id) VALUES (?, ?, ?, ?)",
        [id_ChiTietSanPham, SoLuong, userId, sessionId]
      );
    }
    return this.getCart(userId, sessionId);
  }

  async updateCart(cartId, SoLuong, userId = null, sessionId = null) {
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
    // Kiểm tra số lượng tồn kho với số lượng mới
    const stockCheck = await InventoryService.checkStock(
      cartItem[0].id_ChiTietSanPham,
      SoLuong
    );
    const stockData = stockCheck.data || stockCheck;
    if (!stockData.isAvailable) {
      throw new Error(
        `Số lượng sản phẩm trong kho không đủ. Hiện có ${stockData.tonKho} sản phẩm.`
      );
    }
    // Cập nhật số lượng
    await db.execute("UPDATE giohang SET SoLuong = ? WHERE id = ?", [
      SoLuong,
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
