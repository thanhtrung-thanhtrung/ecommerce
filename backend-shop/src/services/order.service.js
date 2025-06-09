// Cập nhật các service khác: OrderService, PaymentService, CartService
// (đã sửa tên cột theo chuẩn database: id, id_SanPham, id_NguoiDung, ...)

const db = require("../config/database");

class OrderService {
  async createOrder(userId, orderData, sessionId = null) {
    const {
      DiaChiNhan,
      SDTNguoiNhan,
      TenNguoiNhan,
      Email,
      id_ThanhToan,
      id_VanChuyen,
      MaGiamGia,
      GhiChu,
    } = orderData;

    // 1. Lấy giỏ hàng
    let cartQuery, cartParams;
    if (userId) {
      cartQuery = `
        SELECT gh.*, ctsp.id_SanPham, sp.Gia
        FROM giohang gh
        JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
        JOIN sanpham sp ON ctsp.id_SanPham = sp.id
        WHERE gh.id_NguoiDung = ?`;
      cartParams = [userId];
    } else if (sessionId) {
      cartQuery = `
        SELECT gh.*, ctsp.id_SanPham, sp.Gia
        FROM giohang gh
        JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
        JOIN sanpham sp ON ctsp.id_SanPham = sp.id
        WHERE gh.session_id = ? AND gh.id_NguoiDung IS NULL`;
      cartParams = [sessionId];
    } else {
      throw new Error("Không tìm thấy thông tin người dùng hoặc session");
    }

    const [cartItems] = await db.execute(cartQuery, cartParams);
    if (cartItems.length === 0) throw new Error("Giỏ hàng trống");

    // 2. Tính tổng tiền
    let TongTienHang = cartItems.reduce(
      (sum, item) => sum + item.Gia * item.SoLuong,
      0
    );

    // 3. Áp dụng mã giảm giá
    let GiamGia = 0;
    if (MaGiamGia) {
      const [vouchers] = await db.execute(
        `SELECT * FROM magiamgia 
         WHERE Ma = ? 
         AND NgayBatDau <= NOW() 
         AND NgayKetThuc >= NOW()
         AND SoLuotSuDung - SoLuotDaSuDung > 0`,
        [MaGiamGia]
      );
      if (vouchers.length > 0) {
        const voucher = vouchers[0];
        if (TongTienHang >= voucher.DieuKienApDung) {
          GiamGia = (TongTienHang * voucher.PhanTramGiam) / 100;
          await db.execute(
            `UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung + 1 WHERE Ma = ?`,
            [MaGiamGia]
          );
        } else {
          throw new Error("Không đủ điều kiện sử dụng mã giảm giá");
        }
      } else {
        throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      }
    }

    // 4. Tính phí vận chuyển
    const [shippingMethod] = await db.execute(
      `SELECT PhiVanChuyen FROM hinhthucvanchuyen WHERE id = ?`,
      [id_VanChuyen]
    );
    if (shippingMethod.length === 0) {
      throw new Error("Hình thức vận chuyển không hợp lệ");
    }
    const PhiVanChuyen = shippingMethod[0].PhiVanChuyen;

    // 5. Tính tổng thanh toán
    const TongThanhToan = TongTienHang - GiamGia + PhiVanChuyen;

    // 6. Tạo đơn hàng
    const [orderResult] = await db.execute(
      `INSERT INTO donhang (
        id_NguoiMua, NgayDatHang, TongTienHang, GiamGia, PhiVanChuyen, 
        TongThanhToan, DiaChiNhan, SDTNguoiNhan, HoTenNguoiNhan, EmailNguoiNhan,
        TrangThai, id_ThanhToan, id_VanChuyen, MaGiamGia, GhiChu, session_id
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        TongTienHang,
        GiamGia,
        PhiVanChuyen,
        TongThanhToan,
        DiaChiNhan,
        SDTNguoiNhan,
        TenNguoiNhan,
        Email,
        id_ThanhToan,
        id_VanChuyen,
        MaGiamGia || null,
        GhiChu || null,
        userId ? null : sessionId,
      ]
    );
    const orderId = orderResult.insertId;

    // 7. Lưu chi tiết đơn hàng
    for (const item of cartItems) {
      await db.execute(
        `INSERT INTO chitietdonhang (id_DonHang, id_ChiTietSanPham, SoLuong, GiaBan)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id_ChiTietSanPham, item.SoLuong, item.Gia]
      );
    }

    // 8. Xóa giỏ hàng
    if (userId) {
      await db.execute(`DELETE FROM giohang WHERE id_NguoiDung = ?`, [userId]);
    } else if (sessionId) {
      await db.execute(
        `DELETE FROM giohang WHERE session_id = ? AND id_NguoiDung IS NULL`,
        [sessionId]
      );
    }

    // 9. Trả lại chi tiết đơn hàng
    return this.getOrderDetail(orderId);
  }

  async getOrderDetail(orderId) {
    const [orders] = await db.execute(
      `SELECT dh.*, 
              httt.Ten as tenHinhThucThanhToan, 
              htvc.Ten as tenHinhThucVanChuyen,
              IFNULL(mgg.Ma, '') as maGiamGiaText
       FROM donhang dh
       LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
       LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
       LEFT JOIN magiamgia mgg ON dh.MaGiamGia = mgg.Ma
       WHERE dh.id = ?`,
      [orderId]
    );
    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại");
    }
    const order = orders[0];
    const [orderDetails] = await db.execute(
      `SELECT ctdh.*, ctsp.id_SanPham, sp.Ten as tenSanPham, sp.HinhAnh,
              kc.Ten as tenKichCo, ms.Ten as tenMau
       FROM chitietdonhang ctdh
       JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
       JOIN sanpham sp ON ctsp.id_SanPham = sp.id
       JOIN kichco kc ON ctsp.id_KichCo = kc.id
       JOIN mausac ms ON ctsp.id_MauSac = ms.id
       WHERE ctdh.id_DonHang = ?`,
      [orderId]
    );
    order.chiTiet = orderDetails;
    return order;
  }

  // Add method to get guest order by ID and email (for order tracking)
  async getGuestOrderDetail(orderId, email) {
    const [orders] = await db.execute(
      `SELECT dh.*, 
              httt.Ten as tenHinhThucThanhToan, 
              htvc.Ten as tenHinhThucVanChuyen,
              IFNULL(mgg.Ma, '') as maGiamGiaText
       FROM donhang dh
       LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
       LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
       LEFT JOIN magiamgia mgg ON dh.MaGiamGia = mgg.Ma
       WHERE dh.id = ? AND dh.EmailNguoiNhan = ? AND dh.id_NguoiMua IS NULL`,
      [orderId, email]
    );
    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại hoặc email không khớp");
    }
    const order = orders[0];
    const [orderDetails] = await db.execute(
      `SELECT ctdh.*, ctsp.id_SanPham, sp.Ten as tenSanPham, sp.HinhAnh,
              kc.Ten as tenKichCo, ms.Ten as tenMau
       FROM chitietdonhang ctdh
       JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
       JOIN sanpham sp ON ctsp.id_SanPham = sp.id
       JOIN kichco kc ON ctsp.id_KichCo = kc.id
       JOIN mausac ms ON ctsp.id_MauSac = ms.id
       WHERE ctdh.id_DonHang = ?`,
      [orderId]
    );
    order.chiTiet = orderDetails;
    return order;
  }

  async cancelOrder(orderId, userId, cancelReason) {
    const [orders] = await db.execute(
      "SELECT * FROM donhang WHERE id = ? AND id_NguoiMua = ?",
      [orderId, userId]
    );
    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại");
    }
    const order = orders[0];
    if (order.TrangThai !== 1) {
      throw new Error("Không thể hủy đơn hàng ở trạng thái này");
    }
    await db.execute(
      "UPDATE donhang SET TrangThai = 5, LyDoHuy = ? WHERE id = ?",
      [cancelReason, orderId]
    );
    const [orderDetails] = await db.execute(
      "SELECT * FROM chitietdonhang WHERE id_DonHang = ?",
      [orderId]
    );
    for (const item of orderDetails) {
      await db.execute(
        `UPDATE chitietsanpham 
         SET SoLuongTon = SoLuongTon + ?
         WHERE id = ?`,
        [item.SoLuong, item.id_ChiTietSanPham]
      );
    }
    if (order.MaGiamGia) {
      await db.execute(
        "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
        [order.MaGiamGia]
      );
    }
    return this.getOrderDetail(orderId);
  }

  // Add method to cancel guest order
  async cancelGuestOrder(orderId, email, cancelReason) {
    const [orders] = await db.execute(
      "SELECT * FROM donhang WHERE id = ? AND EmailNguoiNhan = ? AND id_NguoiMua IS NULL",
      [orderId, email]
    );
    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại hoặc email không khớp");
    }
    const order = orders[0];
    if (order.TrangThai !== 1) {
      throw new Error("Không thể hủy đơn hàng ở trạng thái này");
    }
    await db.execute(
      "UPDATE donhang SET TrangThai = 5, LyDoHuy = ? WHERE id = ?",
      [cancelReason, orderId]
    );
    const [orderDetails] = await db.execute(
      "SELECT * FROM chitietdonhang WHERE id_DonHang = ?",
      [orderId]
    );
    for (const item of orderDetails) {
      await db.execute(
        `UPDATE chitietsanpham 
         SET SoLuongTon = SoLuongTon + ?
         WHERE id = ?`,
        [item.SoLuong, item.id_ChiTietSanPham]
      );
    }
    if (order.MaGiamGia) {
      await db.execute(
        "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
        [order.MaGiamGia]
      );
    }
    return this.getOrderDetail(orderId);
  }

  async getOrderHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [orders] = await db.execute(
      `SELECT dh.*, 
              httt.Ten as tenHinhThucThanhToan, 
              htvc.Ten as tenHinhThucVanChuyen
       FROM donhang dh
       LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
       LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
       WHERE dh.id_NguoiMua = ?
       ORDER BY dh.NgayDatHang DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
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
    const [total] = await db.execute(
      "SELECT COUNT(*) as total FROM donhang WHERE id_NguoiMua = ?",
      [userId]
    );
    return {
      orders,
      pagination: {
        page,
        limit,
        total: total[0].total,
      },
    };
  }
}

module.exports = new OrderService();
