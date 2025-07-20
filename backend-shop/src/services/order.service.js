// Cập nhật các service khác: OrderService, PaymentService, CartService
// (đã sửa tên cột theo chuẩn database: id, id_SanPham, id_NguoiDung, ...)

const db = require("../config/database");
// ❌ BỎ: const InventoryService = require("./inventory.service");
const emailService = require("./email.service");

class OrderService {
  async createOrder(orderData, userId = null, sessionId = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Frontend gửi format với field names đúng
      const {
        hoTen,
        email,
        diaChiGiao,
        soDienThoai,
        id_ThanhToan,
        id_VanChuyen,
        MaGiamGia,
        ghiChu,
        tongTien,
        tongTienSauGiam,
        phiVanChuyen,
        sessionId: frontendSessionId,
      } = orderData;

      const finalSessionId = sessionId || frontendSessionId;

      // Validate required fields
      if (!hoTen || !email || !diaChiGiao || !soDienThoai) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      const paymentMethodId = parseInt(id_ThanhToan);
      const shippingMethodId = parseInt(id_VanChuyen);

      if (!id_ThanhToan || isNaN(paymentMethodId) || paymentMethodId <= 0) {
        throw new Error(
          "Thiếu thông tin phương thức thanh toán hoặc không hợp lệ"
        );
      }

      if (!id_VanChuyen || isNaN(shippingMethodId) || shippingMethodId <= 0) {
        throw new Error(
          "Thiếu thông tin phương thức vận chuyển hoặc không hợp lệ"
        );
      }

      const [paymentMethod] = await connection.execute(
        "SELECT id FROM hinhthucthanhtoan WHERE id = ? AND TrangThai = 1",
        [paymentMethodId]
      );
      if (paymentMethod.length === 0) {
        throw new Error(
          "Phương thức thanh toán không tồn tại hoặc đã bị vô hiệu hóa"
        );
      }

      let cartQuery, cartParams;
      if (userId) {
        cartQuery = `
          SELECT gh.*, ctsp.id_SanPham, sp.Gia, sp.GiaKhuyenMai
          FROM giohang gh
          JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
          JOIN sanpham sp ON ctsp.id_SanPham = sp.id
          WHERE gh.id_NguoiDung = ?`;
        cartParams = [userId];
      } else if (sessionId) {
        cartQuery = `
          SELECT gh.*, ctsp.id_SanPham, sp.Gia, sp.GiaKhuyenMai
          FROM giohang gh
          JOIN chitietsanpham ctsp ON gh.id_ChiTietSanPham = ctsp.id
          JOIN sanpham sp ON ctsp.id_SanPham = sp.id
          WHERE gh.session_id = ? AND gh.id_NguoiDung IS NULL`;
        cartParams = [sessionId];
      } else {
        throw new Error("Thiếu thông tin người dùng hoặc session");
      }

      const [cartItems] = await connection.execute(cartQuery, cartParams);

      if (cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
      }
      // if (cartItems.length > 2) {
      //   throw new Error("Giỏ hàng không được quá 2 sản phẩm");
      // }
      for (const item of cartItems) {
        // giới hạn số lượng sản phẩm trong giỏ hàng
      
        const [stockCheck] = await connection.execute(
          `SELECT 
            fn_TinhTonKhoRealTime(?) as TonKhoThucTe,
            fn_CoTheBan(?, ?) as CoTheBan
          `,
          [item.id_ChiTietSanPham, item.id_ChiTietSanPham, item.SoLuong]
        );

        if (stockCheck.length === 0 || stockCheck[0].CoTheBan !== 1) {
          throw new Error(
            `Sản phẩm trong giỏ hàng không đủ số lượng tồn kho. Tồn kho thực tế: ${
              stockCheck[0]?.TonKhoThucTe || 0
            }, yêu cầu: ${item.SoLuong}`
          );
        }
      }

      const frontendTongTien = Number(tongTien) || 0;
      const frontendPhiVanChuyen = Number(phiVanChuyen) || 0;
      const frontendTongTienSauGiam = Number(tongTienSauGiam) || 0;
      const frontendGiamGia = Number(orderData.giamGia) || 0;

      console.log("💰 Debug - Frontend values:", {
        tongTien: frontendTongTien,
        phiVanChuyen: frontendPhiVanChuyen,
        tongTienSauGiam: frontendTongTienSauGiam,
        giamGia: frontendGiamGia,
        types: {
          tongTien: typeof frontendTongTien,
          phiVanChuyen: typeof frontendPhiVanChuyen,
          tongTienSauGiam: typeof frontendTongTienSauGiam,
        },
      });

      let calculatedTongTienHang = cartItems.reduce((sum, item) => {
        const finalPrice = Number(item.GiaKhuyenMai) || Number(item.Gia) || 0;
        const quantity = Number(item.SoLuong) || 0;
        return sum + finalPrice * quantity;
      }, 0);

      // Kiểm tra sự khác biệt quá lớn giữa frontend và backend calculation
      const diff = Math.abs(calculatedTongTienHang - frontendTongTien);
      if (diff > 1000) {
        console.warn(
          "⚠️ Cảnh báo: Tổng tiền frontend và backend khác biệt lớn:",
          {
            frontend: frontendTongTien,
            backend: calculatedTongTienHang,
            difference: diff,
          }
        );
        // Sử dụng giá trị backend nếu chênh lệch quá lớn
        var TongTienHang = calculatedTongTienHang;
      } else {
        // Sử dụng giá trị từ frontend
        var TongTienHang = frontendTongTien;
      }

      // 4. Áp dụng mã giảm giá (nếu có) - SỬA ĐỂ SỬ DỤNG GIÁ TRỊ TỪ FRONTEND
      let GiamGia = 0;
      if (MaGiamGia) {
        const [vouchers] = await connection.execute(
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
            // Tính giảm giá từ voucher
            const calculatedDiscount = Math.min(
              (TongTienHang * voucher.PhanTramGiam) / 100,
              voucher.GiaTriGiamToiDa
            );

            // Sử dụng giá trị giảm giá từ frontend nếu có và hợp lý
            if (
              frontendGiamGia > 0 &&
              Math.abs(calculatedDiscount - frontendGiamGia) <= 1000
            ) {
              // Sử dụng giá trị từ frontend nếu chênh lệch không quá 1000đ
              GiamGia = frontendGiamGia;
            } else {
              // Sử dụng giá trị tính toán từ backend
              GiamGia = calculatedDiscount;
            }

            await connection.execute(
              `UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung + 1 WHERE Ma = ?`,
              [MaGiamGia]
            );
          }
        }
      }

      // 5. Sử dụng phí vận chuyển từ frontend (đã được validate)
      const PhiVanChuyen = frontendPhiVanChuyen;

      // 6. SỬA: Tính tổng thanh toán - ĐẢMBẢO PHÉP CỘNG SỐ, KHÔNG PHẢI NỐI CHUỖI
      let TongThanhToan;
      if (frontendTongTienSauGiam > 0) {
        // Sử dụng tổng tiền từ frontend nếu có
        TongThanhToan = frontendTongTienSauGiam;
      } else {
        // Tính toán: Đảm bảo tất cả đều là số trước khi cộng
        TongThanhToan =
          Number(TongTienHang) - Number(GiamGia) + Number(PhiVanChuyen);
      }

      // Debug log để kiểm tra tính toán
      console.log("💰 Final calculation debug:", {
        TongTienHang: Number(TongTienHang),
        GiamGia: Number(GiamGia),
        PhiVanChuyen: Number(PhiVanChuyen),
        TongThanhToan: Number(TongThanhToan),
        calculation: `${Number(TongTienHang)} - ${Number(GiamGia)} + ${Number(
          PhiVanChuyen
        )} = ${Number(TongThanhToan)}`,
        allAreNumbers: {
          TongTienHang: typeof Number(TongTienHang) === "number",
          GiamGia: typeof Number(GiamGia) === "number",
          PhiVanChuyen: typeof Number(PhiVanChuyen) === "number",
          TongThanhToan: typeof Number(TongThanhToan) === "number",
        },
      });

      // 7. Tạo đơn hàng với field name đúng
      // --- Sửa: sinh mã đơn hàng trước khi insert ---
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
      // Insert tạm, sau đó update lại MaDonHang chuẩn
      const [orderResult] = await connection.execute(
        `INSERT INTO donhang (
    MaDonHang, id_NguoiMua, NgayDatHang, TongTienHang, GiamGia, PhiVanChuyen, 
    TongThanhToan, DiaChiNhan, SDTNguoiNhan, TenNguoiNhan, EmailNguoiNhan,
    TrangThai, id_ThanhToan, id_VanChuyen, MaGiamGia, GhiChu, session_id
  ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          null, // MaDonHang sẽ update sau
          userId || null,
          TongTienHang,
          GiamGia,
          PhiVanChuyen,
          TongThanhToan,
          diaChiGiao,
          soDienThoai,
          hoTen,
          email,
          id_ThanhToan,
          id_VanChuyen,
          MaGiamGia || null,
          ghiChu || null,
          userId ? null : finalSessionId, // session_id chỉ dùng cho guest
        ]
      );
      const orderId = orderResult.insertId;
      // --- Update MaDonHang chuẩn sau khi có orderId ---
      const MaDonHang = `DH${dateStr}-${orderId}`;
      await connection.execute(
        `UPDATE donhang SET MaDonHang = ? WHERE id = ?`,
        [MaDonHang, orderId]
      );

      // ✅ SỬA: 8. Lưu chi tiết đơn hàng - Database trigger sẽ tự động quản lý tồn kho
      for (const item of cartItems) {
        // Use correct price (prioritize GiaKhuyenMai)
        const finalPrice = item.GiaKhuyenMai || item.Gia;

        await connection.execute(
          `INSERT INTO chitietdonhang (id_DonHang, id_ChiTietSanPham, SoLuong, GiaBan, ThanhTien)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id_ChiTietSanPham,
            item.SoLuong,
            finalPrice,
            finalPrice * item.SoLuong,
          ]
        );
      }

      // ✅ HOÀN TOÀN BỎ LOGIC TRỪ TỒN KHO MANUAL - DATABASE TRIGGER SẼ XỬ LÝ TỰ ĐỘNG
      // Database trigger `tr_QuanLyTonKhoTheoTrangThaiDonHang` sẽ tự động:
      // - Trừ tồn kho khi đơn hàng chuyển từ trạng thái 1 (chờ xác nhận) sang 2 (đã xác nhận)
      // - Hoàn lại tồn kho khi đơn hàng bị hủy (chuyển sang trạng thái 5)

      // 9. Xóa giỏ hàng
      if (userId) {
        await connection.execute(`DELETE FROM giohang WHERE id_NguoiDung = ?`, [
          userId,
        ]);
      } else if (finalSessionId) {
        await connection.execute(
          `DELETE FROM giohang WHERE session_id = ? AND id_NguoiDung IS NULL`,
          [finalSessionId]
        );
      }

      await connection.commit();
      connection.release();

      // 🎯 GỬI EMAIL XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG
      try {
        // Lấy thông tin đơn hàng để gửi email
        const orderForEmail = await this.getOrderDetail(orderId);

        await emailService.sendOrderConfirmation(orderForEmail);
      } catch (emailError) {
        // Log lỗi email nhưng không ảnh hưởng đến việc tạo đơn hàng
        console.error(
          `❌ Lỗi gửi email xác nhận cho đơn hàng #${orderId}:`,
          emailError.message
        );
      }

      // 10. Trả lại chi tiết đơn hàng
      return { id: orderId, TongThanhToan, message: "Đặt hàng thành công" };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
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
              kc.Ten as tenKichCo, ms.Ten as tenMauSac
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
              kc.Ten as tenKichCo, ms.Ten as tenMauSac
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
    let connection;
    try {
      connection = await db.getConnection();

      await connection.beginTransaction();

      // Sửa: Kiểm tra đơn hàng tồn tại và thuộc về user (hoặc được tạo bởi user)
      const [orders] = await connection.execute(
        `SELECT * FROM donhang 
         WHERE id = ? AND (id_NguoiMua = ? OR (id_NguoiMua IS NULL AND EmailNguoiNhan = (
           SELECT Email FROM nguoidung WHERE id = ?
         )))`,
        [orderId, userId, userId]
      );

      if (orders.length === 0) {
        throw new Error(
          "Đơn hàng không tồn tại hoặc bạn không có quyền hủy đơn hàng này"
        );
      }

      const order = orders[0];
      if (order.TrangThai !== 1) {
        throw new Error("Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận");
      }

      // ✅ SỬA: Chỉ cập nhật trạng thái, database trigger sẽ tự động hoàn lại tồn kho
      await connection.execute(
        "UPDATE donhang SET TrangThai = 5, LyDoHuy = ? WHERE id = ?",
        [cancelReason, orderId]
      );

      // ✅ HOÀN LẠI MÃ GIẢM GIÁ (nếu có)
      if (order.MaGiamGia) {
        await connection.execute(
          "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
          [order.MaGiamGia]
        );
      }

      // Commit transaction
      await connection.commit();

      // Release connection before returning
      connection.release();

      return this.getOrderDetail(orderId);
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
        connection.release();
      }

      console.error("Error canceling order:", error);
      throw error;
    }
  }

  // Add method to cancel guest order
  async cancelGuestOrder(orderId, email, cancelReason) {
    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      const [orders] = await connection.execute(
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

      // ✅ SỬA: Chỉ cập nhật trạng thái, database trigger sẽ tự động hoàn lại tồn kho
      await connection.execute(
        "UPDATE donhang SET TrangThai = 5, LyDoHuy = ? WHERE id = ?",
        [cancelReason, orderId]
      );

      // ✅ HOÀN LẠI MÃ GIẢM GIÁ (nếu có)
      if (order.MaGiamGia) {
        await connection.execute(
          "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
          [order.MaGiamGia]
        );
      }

      // Commit transaction
      await connection.commit();

      // Release connection before returning
      connection.release();

      return this.getOrderDetail(orderId);
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
        connection.release();
      }

      console.error("Error canceling guest order:", error);
      throw error;
    }
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

  // ===== ADMIN METHODS =====

  // Get all orders for admin with filtering and pagination
  async getOrdersAdmin(params = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      date,
      search,
      startDate,
      endDate,
    } = params;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    let queryParams = [];

    // Status filter
    if (status) {
      const statusMap = {
        pending: 1,
        confirmed: 2,
        processing: 3,
        shipping: 4,
        delivered: 4, // Cả shipping và delivered đều map thành 4
        cancelled: 5, // Cancelled map thành 5, không phải 6
      };
      if (statusMap[status]) {
        whereClause += " AND dh.TrangThai = ?";
        queryParams.push(statusMap[status]);
      }
    }

    // Date filter
    if (date) {
      whereClause += " AND DATE(dh.NgayDatHang) = ?";
      queryParams.push(date);
    }

    // Date range filter
    if (startDate && endDate) {
      whereClause += " AND DATE(dh.NgayDatHang) BETWEEN ? AND ?";
      queryParams.push(startDate, endDate);
    }

    // Search filter (by order ID, customer name, email, phone)
    if (search) {
      whereClause += ` AND (
        dh.id LIKE ? OR 
        dh.TenNguoiNhan LIKE ? OR 
        dh.EmailNguoiNhan LIKE ? OR 
        dh.SDTNguoiNhan LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get orders with pagination
    const ordersQuery = `
      SELECT 
        dh.*,
        httt.Ten as paymentMethod,
        htvc.Ten as shippingMethod,
        dh.TrangThai as TrangThai,
        CASE dh.TrangThai
          WHEN 1 THEN 'pending'
          WHEN 2 THEN 'confirmed' 
          WHEN 3 THEN 'shipping'
          WHEN 4 THEN 'delivered'
          WHEN 5 THEN 'cancelled'
          ELSE 'pending'
        END as status
      FROM donhang dh
      LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
      LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
      ${whereClause}
      ORDER BY dh.NgayDatHang DESC
      LIMIT ? OFFSET ?
    `;

    const [orders] = await db.execute(ordersQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.TenNguoiNhan,
      customerEmail: order.EmailNguoiNhan,
      customerPhone: order.SDTNguoiNhan,
      total: order.TongThanhToan,
      TrangThai: order.TrangThai, // ✅ Trả về số trạng thái
      status: order.status, // ✅ Giữ lại string cho backward compatibility
      createdAt: order.NgayDatHang,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      shippingAddress: order.DiaChiNhan,
      note: order.GhiChu,
      discount: order.GiamGia,
      shippingFee: order.PhiVanChuyen,
      subtotal: order.TongTienHang,
    }));

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM donhang dh ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    return {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order detail for admin
  async getOrderDetailAdmin(orderId) {
    const [orders] = await db.execute(
      `SELECT 
        dh.*,
        httt.Ten as paymentMethod,
        htvc.Ten as shippingMethod,
        dh.TrangThai as TrangThai,
        CASE dh.TrangThai
          WHEN 1 THEN 'pending'
          WHEN 2 THEN 'confirmed' 
          WHEN 3 THEN 'shipping'
          WHEN 4 THEN 'delivered'
          WHEN 5 THEN 'cancelled'
          ELSE 'pending'
        END as status
       FROM donhang dh
       LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
       LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
       WHERE dh.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại");
    }

    const order = orders[0];

    // Get order items
    const [orderItems] = await db.execute(
      `SELECT 
        ctdh.*,
        
        sp.Ten as name,
        sp.HinhAnh,
       
        kc.Ten as size,
        ms.Ten as color,
        CONCAT(kc.Ten, ' / ', ms.Ten) as variant
       FROM chitietdonhang ctdh
       JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
       JOIN sanpham sp ON ctsp.id_SanPham = sp.id
       JOIN kichco kc ON ctsp.id_KichCo = kc.id
       JOIN mausac ms ON ctsp.id_MauSac = ms.id
       WHERE ctdh.id_DonHang = ?`,
      [orderId]
    );

    // Parse product images
    const items = orderItems.map((item) => {
      let image = null;
      try {
        if (item.HinhAnh) {
          const imageData = JSON.parse(item.HinhAnh);
          image = imageData.anhChinh || null;
        }
      } catch (error) {
        console.error("Error parsing product image:", error);
      }

      return {
        id: item.id,
        name: item.name,
        image: image,
        variant: item.variant,
        size: item.size,
        color: item.color,
        quantity: item.SoLuong,
        price: item.GiaBan,
        total: item.ThanhTien,
      };
    });

    // Transform order for frontend
    return {
      id: order.id,
      customerName: order.TenNguoiNhan,
      customerEmail: order.EmailNguoiNhan,
      customerPhone: order.SDTNguoiNhan,
      shippingAddress: order.DiaChiNhan,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      TrangThai: order.TrangThai, // ✅ Trả về số trạng thái
      status: order.status, // ✅ Giữ lại string cho backward compatibility
      createdAt: order.NgayDatHang,
      subtotal: order.TongTienHang,
      discount: order.GiamGia,
      shippingFee: order.PhiVanChuyen,
      total: order.TongThanhToan,
      note: order.GhiChu,
      voucherCode: order.MaGiamGia,
      items: items,
    };
  }

  // Update order status by admin
  async updateOrderStatusAdmin(orderId, status, note = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const dbStatus = parseInt(status);

      if (![1, 2, 3, 4, 5].includes(dbStatus)) {
        throw new Error("Trạng thái không hợp lệ");
      }

      // Get full order details
      const [orders] = await connection.execute(
        `SELECT dh.*, IFNULL(mgg.Ma, '') as MaGiamGia FROM donhang dh LEFT JOIN magiamgia mgg ON dh.MaGiamGia = mgg.Ma WHERE dh.id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("Đơn hàng không tồn tại");
      }

      const order = orders[0];
      const oldStatus = order.TrangThai;

      // Get order items for inventory check
      const [orderDetails] = await connection.execute(
        `SELECT ctdh.*, ctsp.id_SanPham, sp.Ten as tenSanPham, sp.HinhAnh,
                kc.Ten as tenKichCo, ms.Ten as tenMauSac
         FROM chitietdonhang ctdh
         JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
         JOIN sanpham sp ON ctsp.id_SanPham = sp.id
         JOIN kichco kc ON ctsp.id_KichCo = kc.id
         JOIN mausac ms ON ctsp.id_MauSac = ms.id
         WHERE ctdh.id_DonHang = ?`,
        [orderId]
      );

      // KIỂM TRA TỒN KHO KHI DUYỆT ĐÔN HÀNG (chuyển từ status 1 sang 2)
      if (dbStatus === 2 && oldStatus === 1) {
        console.log(
          `🔍 Checking inventory for order ${orderId} before confirmation...`
        );

        const insufficientItems = [];

        for (const item of orderDetails) {
          // Kiểm tra tồn kho thực tế
          const [stockCheck] = await connection.execute(
            `SELECT 
              fn_TinhTonKhoRealTime(?) as TonKhoThucTe,
              fn_CoTheBan(?, ?) as CoTheBan
            `,
            [item.id_ChiTietSanPham, item.id_ChiTietSanPham, item.SoLuong]
          );

          if (stockCheck.length === 0 || stockCheck[0].CoTheBan !== 1) {
            insufficientItems.push({
              tenSanPham: item.tenSanPham,
              kichCo: item.tenKichCo,
              mauSac: item.tenMauSac,
              soLuongYeuCau: item.SoLuong,
              tonKhoThucTe: stockCheck[0]?.TonKhoThucTe || 0,
            });
          }
        }

        // Nếu có sản phẩm không đủ hàng, tự động hủy đơn và thông báo
        if (insufficientItems.length > 0) {
          console.log(
            ` Order ${orderId} has insufficient inventory:`,
            insufficientItems
          );

          // Tự động chuyển đơn hàng sang trạng thái hủy
          const cancelReason = `[Tự động hủy] Không đủ hàng trong kho. Chi tiết: ${insufficientItems
            .map(
              (item) =>
                `${item.tenSanPham} (${item.kichCo}/${item.mauSac}): yêu cầu ${item.soLuongYeuCau}, tồn kho ${item.tonKhoThucTe}`
            )
            .join("; ")}`;

          await connection.execute(
            `UPDATE donhang 
             SET TrangThai = 5, 
                 LyDoHuy = ?,
                 GhiChu = CONCAT(IFNULL(GhiChu, ''), '\n[Hệ thống] ', ?),
                 NgayCapNhat = NOW()
             WHERE id = ?`,
            [cancelReason, cancelReason, orderId]
          );

          // Hoàn lại mã giảm giá nếu có
          if (order.MaGiamGia) {
            await connection.execute(
              "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
              [order.MaGiamGia]
            );
          }

          await connection.commit();
          connection.release();

          // Gửi email thông báo hủy đơn hàng
          if (order.EmailNguoiNhan) {
            try {
              const orderDataForEmail = { ...order, chiTiet: orderDetails };
              await emailService.sendOrderCancellationDueToInventory(
                orderDataForEmail,
                insufficientItems,
                cancelReason
              );
            } catch (emailError) {
              console.error(
                ` Lỗi gửi email hủy đơn cho #${orderId}:`,
                emailError.message
              );
            }
          }

          //  TÌM VÀ TỰ ĐỘNG HỦY CÁC ĐƠN HÀNG KHÁC CÙNG SẢN PHẨM KHÔNG ĐỦ HÀNG
          await this.cancelSimilarInsufficientOrders(
            insufficientItems,
            orderId
          );

          throw new Error(
            `Đơn hàng đã được tự động hủy do không đủ hàng trong kho. ${insufficientItems.length} sản phẩm không đủ số lượng.`
          );
        }
      }

      // Prepare order data for email
      const orderDataForEmail = {
        ...order,
        chiTiet: orderDetails,
      };

      // Cập nhật trạng thái đơn hàng
      await connection.execute(
        `UPDATE donhang SET TrangThai = ?, GhiChu = CASE WHEN ? IS NOT NULL THEN CONCAT(IFNULL(GhiChu, ''), '\n[Admin] ', ?) ELSE GhiChu END, NgayCapNhat = NOW() WHERE id = ?`,
        [dbStatus, note, note, orderId]
      );

      // Logic voucher: chỉ cộng/trừ lượt sử dụng khi trạng thái thay đổi hợp lệ
      if (order.MaGiamGia) {
        // Chuyển từ 1 sang 2,3,4: cộng lượt sử dụng
        if ([2, 3, 4].includes(dbStatus) && oldStatus === 1) {
          await require("../services/voucher.service").tangSoLuotSuDung(
            order.MaGiamGia
          );
        }
        // Chuyển từ 2,3,4 sang 5: hoàn lại lượt sử dụng
        if (dbStatus === 5 && [2, 3, 4].includes(oldStatus)) {
          await require("../services/voucher.service").giamSoLuotSuDung(
            order.MaGiamGia
          );
        }
      }

      await connection.commit();
      connection.release();

      // Gửi email thông báo cập nhật trạng thái thành công
      if (oldStatus !== dbStatus && order.EmailNguoiNhan) {
        try {
          const statusForEmail =
            {
              1: "pending",
              2: "confirmed",
              3: "processing",
              4: "delivered",
              5: "cancelled",
            }[dbStatus] || "pending";

          await emailService.sendOrderStatusUpdate(
            orderDataForEmail,
            statusForEmail,
            note
          );
        } catch (emailError) {
          console.error(
            ` Lỗi gửi email cho đơn hàng #${orderId}:`,
            emailError.message
          );
        }
      }

      // Return updated order detail
      return await this.getOrderDetailAdmin(orderId);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  // HÀM MỚI: Tự động hủy các đơn hàng khác có cùng sản phẩm không đủ hàng
  async cancelSimilarInsufficientOrders(insufficientItems, excludeOrderId) {
    try {
      for (const item of insufficientItems) {
        // Tìm các đơn hàng khác đang chờ xác nhận và có cùng sản phẩm
        const [similarOrders] = await db.execute(
          `SELECT DISTINCT dh.id, dh.EmailNguoiNhan, dh.TenNguoiNhan
           FROM donhang dh
           JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
           JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
           JOIN sanpham sp ON ctsp.id_SanPham = sp.id
           JOIN kichco kc ON ctsp.id_KichCo = kc.id
           JOIN mausac ms ON ctsp.id_MauSac = ms.id
           WHERE dh.TrangThai = 1 
           AND dh.id != ?
           AND sp.Ten = ?
           AND kc.Ten = ?
           AND ms.Ten = ?`,
          [excludeOrderId, item.tenSanPham, item.kichCo, item.mauSac]
        );

        console.log(
          `Found ${similarOrders.length} similar orders for ${item.tenSanPham}`
        );

        // Hủy từng đơn hàng tương tự
        for (const similarOrder of similarOrders) {
          const cancelReason = `[Tự động hủy] Sản phẩm ${item.tenSanPham} (${item.kichCo}/${item.mauSac}) không đủ hàng trong kho. Tồn kho hiện tại: ${item.tonKhoThucTe}, yêu cầu: ${item.soLuongYeuCau}`;

          await db.execute(
            `UPDATE donhang 
             SET TrangThai = 5, 
                 LyDoHuy = ?,
                 GhiChu = CONCAT(IFNULL(GhiChu, ''), '\n[Hệ thống] ', ?),
                 NgayCapNhat = NOW()
             WHERE id = ? AND TrangThai = 1`,
            [cancelReason, cancelReason, similarOrder.id]
          );

          // Gửi email thông báo (không chặn luồng chính)
          if (similarOrder.EmailNguoiNhan) {
            this.sendCancellationEmailAsync(
              similarOrder.id,
              cancelReason
            ).catch((err) => {
              console.error(
                `Email error for order ${similarOrder.id}:`,
                err.message
              );
            });
          }
        }
      }
    } catch (error) {
      console.error("Error cancelling similar orders:", error);
      // Không throw error để không ảnh hưởng đến luồng chính
    }
  }

  // HÀM ASYNC GỬI EMAIL (không chặn luồng chính)
  async sendCancellationEmailAsync(orderId, reason) {
    try {
      const orderDetail = await this.getOrderDetailAdmin(orderId);
      await emailService.sendOrderCancellationDueToInventory(
        orderDetail,
        [],
        reason
      );
    } catch (error) {
      console.error(
        `Failed to send cancellation email for order ${orderId}:`,
        error
      );
    }
  }

  //  HÀM MỚI: Thống kê đơn hàng cho admin dashboard
  async getOrderStats(period = "week") {
    try {
      const stats = {};

      // Thống kê tổng quan - CHỈ TÍNH DOANH THU TỪ ĐƠN HÀNG ĐÃ GIAO (TrangThai = 4)
      const [overviewStats] = await db.execute(`
        SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as pendingOrders,
          SUM(CASE WHEN TrangThai = 2 THEN 1 ELSE 0 END) as confirmedOrders,
          SUM(CASE WHEN TrangThai = 3 THEN 1 ELSE 0 END) as shippingOrders,
          SUM(CASE WHEN TrangThai = 4 THEN 1 ELSE 0 END) as deliveredOrders,
          SUM(CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END) as cancelledOrders,
          COALESCE(SUM(CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE 0 END), 0) as totalRevenue,
          COALESCE(AVG(CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE NULL END), 0) as averageOrderValue
        FROM donhang
      `);

      stats.overview = overviewStats[0];

      // Thống kê theo thời gian dựa trên period
      let dateCondition = "";
      switch (period) {
        case "today":
          dateCondition = "WHERE DATE(NgayDatHang) = CURDATE()";
          break;
        case "week":
          dateCondition =
            "WHERE NgayDatHang >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          break;
        case "month":
          dateCondition =
            "WHERE NgayDatHang >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
          break;
        case "year":
          dateCondition =
            "WHERE NgayDatHang >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
          break;
        default:
          dateCondition =
            "WHERE NgayDatHang >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
      }

      // Doanh thu theo ngày - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO (TrangThai = 4)
      const [revenueByDate] = await db.execute(`
        SELECT 
          DATE(NgayDatHang) as date,
          COUNT(*) as orders,
          COALESCE(SUM(CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE 0 END), 0) as revenue
        FROM donhang 
        ${dateCondition}
        GROUP BY DATE(NgayDatHang)
        ORDER BY date ASC
      `);

      stats.revenueByDate = revenueByDate;

      // Top sản phẩm bán chạy - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO
      const [topProducts] = await db.execute(`
        SELECT 
          sp.Ten as productName,
          sp.HinhAnh as productImage,
          SUM(ctdh.SoLuong) as totalSold,
          COALESCE(SUM(ctdh.ThanhTien), 0) as totalRevenue
        FROM chitietdonhang ctdh
        JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
        JOIN sanpham sp ON ctsp.id_SanPham = sp.id
        JOIN donhang dh ON ctdh.id_DonHang = dh.id
        WHERE dh.TrangThai = 4 ${dateCondition.replace("WHERE", "AND")}
        GROUP BY sp.id
        ORDER BY totalSold DESC
        LIMIT 5
      `);

      stats.topProducts = topProducts;

      // Thống kê theo phương thức thanh toán - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO
      const [paymentStats] = await db.execute(`
        SELECT 
          httt.Ten as paymentMethod,
          COUNT(*) as orderCount,
          COALESCE(SUM(CASE WHEN dh.TrangThai = 4 THEN dh.TongThanhToan ELSE 0 END), 0) as totalRevenue
        FROM donhang dh
        JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
        ${dateCondition}
        GROUP BY httt.id
        ORDER BY totalRevenue DESC
      `);

      stats.paymentMethods = paymentStats;

      // Thống kê khách hàng mới
      const [newCustomers] = await db.execute(`
        SELECT 
          DATE(NgayTao) as date,
          COUNT(*) as newCustomers
        FROM nguoidung 
        WHERE NgayTao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(NgayTao)
        ORDER BY date ASC
      `);

      stats.newCustomers = newCustomers;

      // Tỉ lệ hủy đơn
      const [cancellationRate] = await db.execute(`
        SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END) as cancelledOrders,
          ROUND(
            (SUM(CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
            2
          ) as cancellationRate
        FROM donhang 
        ${dateCondition}
      `);

      stats.cancellationRate = cancellationRate[0];

      return stats;
    } catch (error) {
      console.error("Error getting order statistics:", error);
      throw error;
    }
  }
}

module.exports = new OrderService();
// if (item.SoLuong > 2) {
//   throw new Error(
//     `Số lượng sản phẩm không được vượt quá 2 trong giỏ hàng`
//   );
// }