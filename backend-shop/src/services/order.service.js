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
        id_ThanhToan, // ✅ Fixed: match database field name
        id_VanChuyen,
        MaGiamGia,
        ghiChu,
        tongTien,
        tongTienSauGiam,
        phiVanChuyen,
        sessionId: frontendSessionId, // In case sessionId is sent in body
      } = orderData;

      // Use sessionId from parameter or from body
      const finalSessionId = sessionId || frontendSessionId;

      // Validate required fields
      if (!hoTen || !email || !diaChiGiao || !soDienThoai) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      // Cải thiện validation cho payment và shipping methods
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

      // Kiểm tra xem phương thức thanh toán có tồn tại không
      const [paymentMethod] = await connection.execute(
        "SELECT id FROM hinhthucthanhtoan WHERE id = ? AND TrangThai = 1",
        [paymentMethodId]
      );
      if (paymentMethod.length === 0) {
        throw new Error(
          "Phương thức thanh toán không tồn tại hoặc đã bị vô hiệu hóa"
        );
      }

      // 1. Lấy giỏ hàng
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

      // Debugging logs to verify session and cart query
      console.log("🔍 Debug - sessionId:", sessionId);
      console.log("🔍 Debug - userId:", userId);

      const [cartItems] = await connection.execute(cartQuery, cartParams);

      // Debug log kết quả giỏ hàng
      console.log("🔍 Debug - cartItems count:", cartItems.length);
      console.log("🔍 Debug - cartItems:", cartItems);

      if (cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
      }

      // ✅ SỬA: 2. Kiểm tra tồn kho bằng database functions thay vì cột TonKho
      for (const item of cartItems) {
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

      // 3. Tính tổng tiền (ưu tiên GiaKhuyenMai theo nghiệp vụ web bán giày)
      let TongTienHang = cartItems.reduce((sum, item) => {
        const finalPrice = item.GiaKhuyenMai || item.Gia;
        return sum + finalPrice * item.SoLuong;
      }, 0);

      // 4. Áp dụng mã giảm giá (nếu có)
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
            GiamGia = Math.min(
              (TongTienHang * voucher.PhanTramGiam) / 100,
              voucher.GiaTriGiamToiDa
            );
            await connection.execute(
              `UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung + 1 WHERE Ma = ?`,
              [MaGiamGia]
            );
          }
        }
      }

      // 5. Tính phí vận chuyển
      const [shippingMethod] = await connection.execute(
        `SELECT PhiVanChuyen FROM hinhthucvanchuyen WHERE id = ?`,
        [id_VanChuyen]
      );
      if (shippingMethod.length === 0) {
        throw new Error("Hình thức vận chuyển không hợp lệ");
      }
      const PhiVanChuyen = shippingMethod[0].PhiVanChuyen || 0;

      // 6. Tính tổng thanh toán
      const TongThanhToan = TongTienHang - GiamGia + PhiVanChuyen;

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

      // Map frontend status to database status - SỬA CHO ĐÚNG DATABASE SCHEMA
      const statusMap = {
        pending: 1,
        confirmed: 2,
        processing: 3, // Đang xử lý -> map thành 3 (đang giao)
        shipping: 4, // Đang giao -> map thành 4 (đã giao)
        delivered: 4, // Đã giao -> map thành 4
        cancelled: 5, // Đã hủy -> map thành 5
      };

      const dbStatus = statusMap[status];
      if (!dbStatus) {
        throw new Error("Trạng thái không hợp lệ");
      }

      // Check if order exists and get full order details for email
      const [orders] = await connection.execute(
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
      const oldStatus = order.TrangThai;

      // Get order details for email
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

      // Prepare order data for email
      const orderDataForEmail = {
        ...order,
        chiTiet: orderDetails,
      };

      // ✅ SỬA: Chỉ cập nhật trạng thái, database trigger sẽ tự động quản lý tồn kho
      await connection.execute(
        `UPDATE donhang 
         SET TrangThai = ?, 
             GhiChu = CASE 
               WHEN ? IS NOT NULL THEN CONCAT(IFNULL(GhiChu, ''), '\n[Admin] ', ?)
               ELSE GhiChu 
             END,
             NgayCapNhat = NOW()
         WHERE id = ?`,
        [dbStatus, note, note, orderId]
      );

      // ✅ HOÀN LẠI MÃ GIẢM GIÁ NẾU HỦY ĐƠN HÀNG
      if (status === "cancelled" && oldStatus !== 5 && order.MaGiamGia) {
        await connection.execute(
          "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung - 1 WHERE Ma = ?",
          [order.MaGiamGia]
        );
      }

      await connection.commit();
      connection.release();

      // 🎯 GỬI EMAIL TỰ ĐỘNG KHI CẬP NHẬT TRẠNG THÁI
      // Chỉ gửi email nếu trạng thái thực sự thay đổi và có email khách hàng
      if (oldStatus !== dbStatus && order.EmailNguoiNhan) {
        try {
          await emailService.sendOrderStatusUpdate(
            orderDataForEmail,
            status,
            note
          );
        } catch (emailError) {
          // Log lỗi email nhưng không throw để không ảnh hưởng đến việc cập nhật đơn hàng
          console.error(
            `❌ Lỗi gửi email cho đơn hàng #${orderId}:`,
            emailError.message
          );

          // Có thể lưu log vào database để theo dõi
          try {
            await db.execute(
              `INSERT INTO email_logs (order_id, email_type, recipient, status, error_message, created_at) 
               VALUES (?, ?, ?, 'failed', ?, NOW())`,
              [
                orderId,
                "order_status_update",
                order.EmailNguoiNhan,
                emailError.message,
              ]
            );
          } catch (logError) {
            console.error("Lỗi ghi log email:", logError.message);
          }
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

  // Get order statistics for admin dashboard
  async getOrderStats(period = "week") {
    try {
      // Get total orders count
      const [totalOrders] = await db.execute(
        "SELECT COUNT(*) as total FROM donhang"
      );

      // Get orders by status
      const [statusStats] = await db.execute(`
        SELECT 
          TrangThai,
          COUNT(*) as count,
          CASE TrangThai
            WHEN 1 THEN 'pending'
            WHEN 2 THEN 'confirmed' 
            WHEN 3 THEN 'processing'
            WHEN 4 THEN 'shipping'
            WHEN 5 THEN 'cancelled'
            ELSE 'unknown'
          END as status
        FROM donhang 
        GROUP BY TrangThai
      `);

      // Get revenue stats
      const [revenueStats] = await db.execute(`
        SELECT 
          SUM(TongThanhToan) as totalRevenue,
          AVG(TongThanhToan) as averageOrderValue,
          COUNT(*) as totalOrders
        FROM donhang 
        WHERE TrangThai = 5
      `);

      // Get recent orders trend (last 7 days)
      const [trendStats] = await db.execute(`
        SELECT 
          DATE(NgayDatHang) as date,
          COUNT(*) as orders,
          SUM(TongThanhToan) as revenue
        FROM donhang 
        WHERE NgayDatHang >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(NgayDatHang)
        ORDER BY date ASC
      `);

      return {
        totalOrders: totalOrders[0].total,
        statusBreakdown: statusStats,
        revenue: {
          total: revenueStats[0].totalRevenue || 0,
          average: revenueStats[0].averageOrderValue || 0,
          completedOrders: revenueStats[0].totalOrders || 0,
        },
        trend: trendStats,
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  }
}

module.exports = new OrderService();
