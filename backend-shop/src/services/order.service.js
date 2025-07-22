const {
  Order,
  OrderDetail,
  ProductDetail,
  Product,
  Size,
  Color,
  Brand,
  Category,
  User,
  PaymentMethod,
  ShippingMethod,
  Voucher,
  Cart,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const emailService = require("./email.service");
const inventoryService = require("./inventory.service");

class OrderService {
  async createOrder(orderData, userId = null, sessionId = null) {
    const transaction = await sequelize.transaction();

    try {
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

      const paymentMethod = await PaymentMethod.findOne({
        where: { id: paymentMethodId, TrangThai: 1 },
      });

      if (!paymentMethod) {
        throw new Error(
          "Phương thức thanh toán không tồn tại hoặc đã bị vô hiệu hóa"
        );
      }

      let cartQuery = {};
      if (userId) {
        cartQuery = { id_NguoiDung: userId };
      } else if (sessionId) {
        cartQuery = { session_id: sessionId, id_NguoiDung: null };
      } else {
        throw new Error("Thiếu thông tin người dùng hoặc session");
      }

      const cartItems = await Cart.findAll({
        where: cartQuery,
        include: [
          {
            model: ProductDetail,
            as: "productDetail",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "Gia", "GiaKhuyenMai"],
              },
            ],
          },
        ],
      });

      if (cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
      }

      // Check inventory using the new inventory service
      for (const item of cartItems) {
        const stockCheck = await inventoryService.canSell(
          item.id_ChiTietSanPham,
          item.SoLuong
        );

        if (!stockCheck.canSell) {
          throw new Error(
            `Sản phẩm trong giỏ hàng không đủ số lượng tồn kho. Tồn kho khả dụng: ${stockCheck.availableStock}, yêu cầu: ${item.SoLuong}`
          );
        }
      }

      const frontendTongTien = Number(tongTien) || 0;
      const frontendPhiVanChuyen = Number(phiVanChuyen) || 0;
      const frontendTongTienSauGiam = Number(tongTienSauGiam) || 0;
      const frontendGiamGia = Number(orderData.giamGia) || 0;

      let calculatedTongTienHang = cartItems.reduce((sum, item) => {
        const finalPrice =
          Number(item.productDetail.product.GiaKhuyenMai) ||
          Number(item.productDetail.product.Gia) ||
          0;
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
        var TongTienHang = calculatedTongTienHang;
      } else {
        var TongTienHang = frontendTongTien;
      }

      // 4. Áp dụng mã giảm giá (nếu có)
      let GiamGia = 0;
      if (MaGiamGia) {
        const voucher = await Voucher.findOne({
          where: {
            Ma: MaGiamGia,
            NgayBatDau: { [Op.lte]: new Date() },
            NgayKetThuc: { [Op.gte]: new Date() },
            TrangThai: 1,
            [Op.and]: [
              sequelize.where(
                sequelize.literal("SoLuotSuDung - SoLuotDaSuDung"),
                Op.gt,
                0
              ),
            ],
          },
          transaction,
        });

        if (voucher) {
          // Check if voucher has remaining uses
          if (voucher.SoLuotDaSuDung >= voucher.SoLuotSuDung) {
            throw new Error("Mã giảm giá đã hết lượt sử dụng");
          }

          if (TongTienHang >= voucher.DieuKienApDung) {
            const calculatedDiscount = Math.min(
              (TongTienHang * voucher.PhanTramGiam) / 100,
              voucher.GiaTriGiamToiDa
            );

            if (
              frontendGiamGia > 0 &&
              Math.abs(calculatedDiscount - frontendGiamGia) <= 1000
            ) {
              GiamGia = frontendGiamGia;
            } else {
              GiamGia = calculatedDiscount;
            }

            await voucher.update(
              { SoLuotDaSuDung: voucher.SoLuotDaSuDung + 1 },
              { transaction }
            );
          }
        }
      }

      const PhiVanChuyen = frontendPhiVanChuyen;

      let TongThanhToan;
      if (frontendTongTienSauGiam > 0) {
        TongThanhToan = frontendTongTienSauGiam;
      } else {
        TongThanhToan =
          Number(TongTienHang) - Number(GiamGia) + Number(PhiVanChuyen);
      }

      // 7. Tạo đơn hàng với mã tạm thời
      const today = new Date();
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
      const timeStr = today.getTime().toString().slice(-6); // Lấy 6 số cuối của timestamp
      const tempMaDonHang = `DH${dateStr}-${timeStr}`;

      // 8. Tạo đơn hàng với field name đúng
      const newOrder = await Order.create(
        {
          MaDonHang: tempMaDonHang, // Sử dụng mã tạm thời
          id_NguoiMua: userId || null,
          NgayDatHang: new Date(),
          TongTienHang,
          GiamGia,
          PhiVanChuyen,
          TongThanhToan,
          DiaChiNhan: diaChiGiao,
          SDTNguoiNhan: soDienThoai,
          TenNguoiNhan: hoTen,
          EmailNguoiNhan: email,
          TrangThai: 1,
          id_ThanhToan,
          id_VanChuyen,
          MaGiamGia: MaGiamGia || null,
          GhiChu: ghiChu || null,
          session_id: userId ? null : finalSessionId,
        },
        { transaction }
      );

      // 9. Cập nhật MaDonHang với ID thực sự
      const finalMaDonHang = `DH${dateStr}-${newOrder.id}`;
      await newOrder.update({ MaDonHang: finalMaDonHang }, { transaction });

      // 10. Lưu chi tiết đơn hàng
      for (const item of cartItems) {
        const finalPrice =
          item.productDetail.product.GiaKhuyenMai ||
          item.productDetail.product.Gia;

        await OrderDetail.create(
          {
            id_DonHang: newOrder.id,
            id_ChiTietSanPham: item.id_ChiTietSanPham,
            SoLuong: item.SoLuong,
            GiaBan: finalPrice,
            ThanhTien: finalPrice * item.SoLuong,
          },
          { transaction }
        );
      }

      // 11. Xóa giỏ hàng
      await Cart.destroy({
        where: cartQuery,
        transaction,
      });

      await transaction.commit();

      // 🎯 GỬI EMAIL XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG
      try {
        const orderForEmail = await this.getOrderDetail(newOrder.id);
        await emailService.sendOrderConfirmation(orderForEmail);
      } catch (emailError) {
        console.error(
          `❌ Lỗi gửi email xác nhận cho đơn hàng #${newOrder.id}:`,
          emailError.message
        );
      }

      // 12. Trả lại chi tiết đơn hàng
      return { id: newOrder.id, TongThanhToan, message: "Đặt hàng thành công" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getOrderDetail(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
      ],
    });

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    const orderDetails = await OrderDetail.findAll({
      where: { id_DonHang: orderId },
      include: [
        {
          model: ProductDetail,
          as: "productDetail",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "Ten", "HinhAnh"],
            },
            {
              model: Size,
              as: "size",
              attributes: ["Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["Ten"],
            },
          ],
        },
      ],
    });

    const orderData = order.get({ plain: true });
    orderData.tenHinhThucThanhToan = order.paymentMethod?.Ten || "";
    orderData.tenHinhThucVanChuyen = order.shippingMethod?.Ten || "";
    orderData.maGiamGiaText = orderData.MaGiamGia || "";
    orderData.chiTiet = orderDetails.map((detail) => ({
      ...detail.get({ plain: true }),
      tenSanPham: detail.productDetail.product.Ten,
      tenKichCo: detail.productDetail.size.Ten,
      tenMauSac: detail.productDetail.color.Ten,
    }));

    return orderData;
  }

  // Add method to get guest order by ID and email
  async getGuestOrderDetail(orderId, email) {
    const order = await Order.findOne({
      where: {
        id: orderId,
        EmailNguoiNhan: email,
        id_NguoiMua: null,
      },
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
      ],
    });

    if (!order) {
      throw new Error("Đơn hàng không tồn tại hoặc email không khớp");
    }

    const orderDetails = await OrderDetail.findAll({
      where: { id_DonHang: orderId },
      include: [
        {
          model: ProductDetail,
          as: "productDetail",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "Ten", "HinhAnh"],
            },
            {
              model: Size,
              as: "size",
              attributes: ["Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["Ten"],
            },
          ],
        },
      ],
    });

    const orderData = order.get({ plain: true });
    orderData.tenHinhThucThanhToan = order.paymentMethod?.Ten || "";
    orderData.tenHinhThucVanChuyen = order.shippingMethod?.Ten || "";
    orderData.maGiamGiaText = orderData.MaGiamGia || "";
    orderData.chiTiet = orderDetails.map((detail) => ({
      ...detail.get({ plain: true }),
      tenSanPham: detail.productDetail.product.Ten,
      tenKichCo: detail.productDetail.size.Ten,
      tenMauSac: detail.productDetail.color.Ten,
    }));

    return orderData;
  }

  async cancelOrder(orderId, userId, cancelReason) {
    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra đơn hàng tồn tại và thuộc về user
      const order = await Order.findOne({
        where: {
          id: orderId,
          [Op.or]: [
            { id_NguoiMua: userId },
            {
              id_NguoiMua: null,
              EmailNguoiNhan: {
                [Op.in]: sequelize.literal(
                  `(SELECT Email FROM nguoidung WHERE id = ${userId})`
                ),
              },
            },
          ],
        },
        transaction,
      });

      if (!order) {
        throw new Error(
          "Đơn hàng không tồn tại hoặc bạn không có quyền hủy đơn hàng này"
        );
      }

      if (order.TrangThai !== 1) {
        throw new Error("Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận");
      }

      // Chỉ cập nhật trạng thái, database trigger sẽ tự động hoàn lại tồn kho
      await order.update(
        {
          TrangThai: 5,
          LyDoHuy: cancelReason,
        },
        { transaction }
      );

      // Hoàn lại mã giảm giá (nếu có)
      if (order.MaGiamGia) {
        await Voucher.update(
          { SoLuotDaSuDung: sequelize.literal("SoLuotDaSuDung - 1") },
          {
            where: { Ma: order.MaGiamGia },
            transaction,
          }
        );
      }

      await transaction.commit();
      return this.getOrderDetail(orderId);
    } catch (error) {
      await transaction.rollback();
      console.error("Error canceling order:", error);
      throw error;
    }
  }

  // Add method to cancel guest order
  async cancelGuestOrder(orderId, email, cancelReason) {
    const transaction = await sequelize.transaction();

    try {
      const order = await Order.findOne({
        where: {
          id: orderId,
          EmailNguoiNhan: email,
          id_NguoiMua: null,
        },
        transaction,
      });

      if (!order) {
        throw new Error("Đơn hàng không tồn tại hoặc email không khớp");
      }

      if (order.TrangThai !== 1) {
        throw new Error("Không thể hủy đơn hàng ở trạng thái này");
      }

      // Chỉ cập nhật trạng thái, database trigger sẽ tự động hoàn lại tồn kho
      await order.update(
        {
          TrangThai: 5,
          LyDoHuy: cancelReason,
        },
        { transaction }
      );

      // Hoàn lại mã giảm giá (nếu có)
      if (order.MaGiamGia) {
        await Voucher.update(
          { SoLuotDaSuDung: sequelize.literal("SoLuotDaSuDung - 1") },
          {
            where: { Ma: order.MaGiamGia },
            transaction,
          }
        );
      }

      await transaction.commit();
      return this.getOrderDetail(orderId);
    } catch (error) {
      await transaction.rollback();
      console.error("Error canceling guest order:", error);
      throw error;
    }
  }

  async getOrderHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const orders = await Order.findAll({
      where: { id_NguoiMua: userId },
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
      ],
      order: [["NgayDatHang", "DESC"]],
      limit,
      offset,
    });

    for (let order of orders) {
      const orderDetails = await OrderDetail.findAll({
        where: { id_DonHang: order.id },
        include: [
          {
            model: ProductDetail,
            as: "productDetail",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "Ten", "HinhAnh"],
              },
            ],
          },
        ],
      });

      order.dataValues.tenHinhThucThanhToan = order.paymentMethod?.Ten || "";
      order.dataValues.tenHinhThucVanChuyen = order.shippingMethod?.Ten || "";
      order.dataValues.chiTiet = orderDetails.map((detail) => ({
        ...detail.get({ plain: true }),
        tenSanPham: detail.productDetail.product.Ten,
      }));
    }

    const total = await Order.count({
      where: { id_NguoiMua: userId },
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
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
    let whereClause = {};

    // Status filter
    if (status) {
      const statusMap = {
        pending: 1,
        confirmed: 2,
        processing: 3,
        shipping: 4,
        delivered: 4,
        cancelled: 5,
      };
      if (statusMap[status]) {
        whereClause.TrangThai = statusMap[status];
      }
    }

    // Date filter
    if (date) {
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        sequelize.where(
          sequelize.fn("DATE", sequelize.col("NgayDatHang")),
          date
        ),
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      whereClause.NgayDatHang = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Search filter (by order ID, customer name, email, phone)
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { TenNguoiNhan: { [Op.like]: `%${search}%` } },
        { EmailNguoiNhan: { [Op.like]: `%${search}%` } },
        { SDTNguoiNhan: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get orders with pagination
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
      ],
      order: [["NgayDatHang", "DESC"]],
      limit,
      offset,
    });

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.TenNguoiNhan,
      customerEmail: order.EmailNguoiNhan,
      customerPhone: order.SDTNguoiNhan,
      total: order.TongThanhToan,
      TrangThai: order.TrangThai,
      status:
        {
          1: "pending",
          2: "confirmed",
          3: "shipping",
          4: "delivered",
          5: "cancelled",
        }[order.TrangThai] || "pending",
      createdAt: order.NgayDatHang,
      paymentMethod: order.paymentMethod?.Ten || "",
      shippingMethod: order.shippingMethod?.Ten || "",
      shippingAddress: order.DiaChiNhan,
      note: order.GhiChu,
      discount: order.GiamGia,
      shippingFee: order.PhiVanChuyen,
      subtotal: order.TongTienHang,
    }));

    // Get total count for pagination
    const total = await Order.count({ where: whereClause });

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
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
      ],
    });

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    // Get order items with Sequelize
    const orderItems = await OrderDetail.findAll({
      where: { id_DonHang: orderId },
      include: [
        {
          model: ProductDetail,
          as: "productDetail",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["Ten", "HinhAnh"],
            },
            {
              model: Size,
              as: "size",
              attributes: ["Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["Ten"],
            },
          ],
        },
      ],
    });

    // Parse product images
    const items = orderItems.map((item) => {
      let image = null;
      try {
        if (item.productDetail.product.HinhAnh) {
          const imageData = JSON.parse(item.productDetail.product.HinhAnh);
          image = imageData.anhChinh || null;
        }
      } catch (error) {
        console.error("Error parsing product image:", error);
      }

      return {
        id: item.id,
        name: item.productDetail.product.Ten,
        image: image,
        variant: `${item.productDetail.size.Ten} / ${item.productDetail.color.Ten}`,
        size: item.productDetail.size.Ten,
        color: item.productDetail.color.Ten,
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
      paymentMethod: order.paymentMethod?.Ten || "",
      shippingMethod: order.shippingMethod?.Ten || "",
      TrangThai: order.TrangThai,
      status:
        {
          1: "pending",
          2: "confirmed",
          3: "shipping",
          4: "delivered",
          5: "cancelled",
        }[order.TrangThai] || "pending",
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
    const transaction = await sequelize.transaction();

    try {
      const dbStatus = parseInt(status);

      if (![1, 2, 3, 4, 5].includes(dbStatus)) {
        throw new Error("Trạng thái không hợp lệ");
      }

      // Get full order details
      const order = await Order.findByPk(orderId, {
        transaction,
      });

      if (!order) {
        throw new Error("Đơn hàng không tồn tại");
      }

      const oldStatus = order.TrangThai;

      // Get order items for inventory check
      const orderDetails = await OrderDetail.findAll({
        where: { id_DonHang: orderId },
        include: [
          {
            model: ProductDetail,
            as: "productDetail",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "Ten", "HinhAnh"],
              },
              {
                model: Size,
                as: "size",
                attributes: ["Ten"],
              },
              {
                model: Color,
                as: "color",
                attributes: ["Ten"],
              },
            ],
          },
        ],
        transaction,
      });

      // KIỂM TRA TỒN KHO KHI DUYỆT ĐÔN HÀNG (chuyển từ status 1 sang 2)
      if (dbStatus === 2 && oldStatus === 1) {
        console.log(
          `🔍 Checking inventory for order ${orderId} before confirmation...`
        );

        const insufficientItems = [];

        for (const item of orderDetails) {
          // Kiểm tra tồn kho thực tế bằng SQL function
          const stockCheck = await inventoryService.canSell(
            item.id_ChiTietSanPham,
            item.SoLuong
          );

          if (!stockCheck.canSell) {
            insufficientItems.push({
              tenSanPham: item.productDetail.product.Ten,
              kichCo: item.productDetail.size.Ten,
              mauSac: item.productDetail.color.Ten,
              soLuongYeuCau: item.SoLuong,
              tonKhoThucTe: stockCheck.availableStock,
            });
          }
        }

        // Nếu có sản phẩm không đủ hàng, tự động hủy đơn và thông báo
        if (insufficientItems.length > 0) {
          console.log(
            "❌ Order " + orderId + " has insufficient inventory:",
            insufficientItems
          );

          // Tự động chuyển đơn hàng sang trạng thái hủy
          const cancelReason =
            "[Tự động hủy] Không đủ hàng trong kho. Chi tiết: " +
            insufficientItems
              .map(
                (item) =>
                  item.tenSanPham +
                  " (" +
                  item.kichCo +
                  "/" +
                  item.mauSac +
                  "): yêu cầu " +
                  item.soLuongYeuCau +
                  ", tồn kho " +
                  item.tonKhoThucTe
              )
              .join("; ");

          await order.update(
            {
              TrangThai: 5,
              LyDoHuy: cancelReason,
              GhiChu: (order.GhiChu || "") + "\n[Hệ thống] " + cancelReason,
              NgayCapNhat: new Date(),
            },
            { transaction }
          );

          // Hoàn lại mã giảm giá nếu có
          if (order.MaGiamGia) {
            await Voucher.update(
              { SoLuotDaSuDung: sequelize.literal("SoLuotDaSuDung - 1") },
              {
                where: { Ma: order.MaGiamGia },
                transaction,
              }
            );
          }

          await transaction.commit();

          // Gửi email thông báo hủy đơn hàng
          if (order.EmailNguoiNhan) {
            try {
              const orderDataForEmail = {
                ...order.get({ plain: true }),
                chiTiet: orderDetails.map((detail) =>
                  detail.get({ plain: true })
                ),
              };
              await emailService.sendOrderCancellationDueToInventory(
                orderDataForEmail,
                insufficientItems,
                cancelReason
              );
            } catch (emailError) {
              console.error(
                "❌ Lỗi gửi email hủy đơn cho #" + orderId + ":",
                emailError.message
              );
            }
          }

          // TÌM VÀ TỰ ĐỘNG HỦY CÁC ĐƠN HÀNG KHÁC CÙNG SẢN PHẨM KHÔNG ĐỦ HÀNG
          await this.cancelSimilarInsufficientOrders(
            insufficientItems,
            orderId
          );

          throw new Error(
            "Đơn hàng đã được tự động hủy do không đủ hàng trong kho. " +
              insufficientItems.length +
              " sản phẩm không đủ số lượng."
          );
        }
      }

      // Prepare order data for email
      const orderDataForEmail = {
        ...order.get({ plain: true }),
        chiTiet: orderDetails.map((detail) => detail.get({ plain: true })),
      };

      // Cập nhật trạng thái đơn hàng
      let updateData = {
        TrangThai: dbStatus,
        NgayCapNhat: new Date(),
      };

      if (note) {
        updateData.GhiChu = (order.GhiChu || "") + `\n[Admin] ${note}`;
      }

      await order.update(updateData, { transaction });

      // Logic voucher: chỉ hoàn lại khi hủy đơn hàng (chuyển sang trạng thái 5)
      if (order.MaGiamGia) {
        // Hoàn lại mã giảm giá khi hủy đơn hàng (bất kể từ trạng thái nào)
        if (dbStatus === 5 && oldStatus !== 5) {
          await Voucher.update(
            { SoLuotDaSuDung: sequelize.literal("SoLuotDaSuDung - 1") },
            {
              where: { Ma: order.MaGiamGia },
              transaction,
            }
          );
          console.log(
            `✅ Hoàn lại voucher ${order.MaGiamGia} cho đơn hàng ${orderId}`
          );
        }
      }

      await transaction.commit();

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
            `❌ Lỗi gửi email cho đơn hàng #${orderId}:`,
            emailError.message
          );
        }
      }

      // Return updated order detail
      return await this.getOrderDetailAdmin(orderId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // HÀM MỚI: Tự động hủy các đơn hàng khác có cùng sản phẩm không đủ hàng
  async cancelSimilarInsufficientOrders(insufficientItems, excludeOrderId) {
    try {
      for (const item of insufficientItems) {
        // Tìm các đơn hàng khác đang chờ xác nhận và có cùng sản phẩm
        const similarOrders = await Order.findAll({
          where: {
            TrangThai: 1,
            id: { [Op.ne]: excludeOrderId },
          },
          include: [
            {
              model: OrderDetail,
              as: "orderDetails",
              include: [
                {
                  model: ProductDetail,
                  as: "productDetail",
                  include: [
                    {
                      model: Product,
                      as: "product",
                      where: { Ten: item.tenSanPham },
                    },
                    {
                      model: Size,
                      as: "size",
                      where: { Ten: item.kichCo },
                    },
                    {
                      model: Color,
                      as: "color",
                      where: { Ten: item.mauSac },
                    },
                  ],
                },
              ],
            },
          ],
        });

        console.log(
          `Found ${similarOrders.length} similar orders for ${item.tenSanPham}`
        );

        // Hủy từng đơn hàng tương tự
        for (const similarOrder of similarOrders) {
          const cancelReason = `[Tự động hủy] Sản phẩm ${item.tenSanPham} (${item.kichCo}/${item.mauSac}) không đủ hàng trong kho. Tồn kho hiện tại: ${item.tonKhoThucTe}, yêu cầu: ${item.soLuongYeuCau}`;

          await similarOrder.update({
            TrangThai: 5,
            LyDoHuy: cancelReason,
            GhiChu:
              (similarOrder.GhiChu || "") + `\n[Hệ thống] ${cancelReason}`,
            NgayCapNhat: new Date(),
          });

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

  // HÀM MỚI: Thống kê đơn hàng cho admin dashboard
  async getOrderStats(period = "week") {
    try {
      const stats = {};

      // Thống kê tổng quan - CHỈ TÍNH DOANH THU TỪ ĐƠN HÀNG ĐÃ GIAO (TrangThai = 4)
      const overviewStats = await Order.findOne({
        attributes: [
          [sequelize.fn("COUNT", "*"), "totalOrders"],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END")
            ),
            "pendingOrders",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 2 THEN 1 ELSE 0 END")
            ),
            "confirmedOrders",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 3 THEN 1 ELSE 0 END")
            ),
            "shippingOrders",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 4 THEN 1 ELSE 0 END")
            ),
            "deliveredOrders",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END")
            ),
            "cancelledOrders",
          ],
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE 0 END"
                )
              ),
              0
            ),
            "totalRevenue",
          ],
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn(
                "AVG",
                sequelize.literal(
                  "CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE NULL END"
                )
              ),
              0
            ),
            "averageOrderValue",
          ],
        ],
        raw: true,
      });

      stats.overview = overviewStats;

      // Thống kê theo thời gian dựa trên period
      let dateCondition = {};
      switch (period) {
        case "today":
          dateCondition = {
            NgayDatHang: {
              [Op.gte]: sequelize.fn("CURDATE"),
            },
          };
          break;
        case "week":
          dateCondition = {
            NgayDatHang: {
              [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 7 DAY)"),
            },
          };
          break;
        case "month":
          dateCondition = {
            NgayDatHang: {
              [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 1 MONTH)"),
            },
          };
          break;
        case "year":
          dateCondition = {
            NgayDatHang: {
              [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 1 YEAR)"),
            },
          };
          break;
        default:
          dateCondition = {
            NgayDatHang: {
              [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 7 DAY)"),
            },
          };
      }

      // Doanh thu theo ngày - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO (TrangThai = 4)
      const revenueByDate = await Order.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("NgayDatHang")), "date"],
          [sequelize.fn("COUNT", "*"), "orders"],
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN TrangThai = 4 THEN TongThanhToan ELSE 0 END"
                )
              ),
              0
            ),
            "revenue",
          ],
        ],
        where: dateCondition,
        group: [sequelize.fn("DATE", sequelize.col("NgayDatHang"))],
        order: [[sequelize.fn("DATE", sequelize.col("NgayDatHang")), "ASC"]],
        raw: true,
      });

      stats.revenueByDate = revenueByDate;

      // Top sản phẩm bán chạy - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO
      const topProducts = await OrderDetail.findAll({
        attributes: [
          [
            sequelize.fn("SUM", sequelize.col("OrderDetail.SoLuong")),
            "totalSold",
          ],
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn("SUM", sequelize.col("OrderDetail.ThanhTien")),
              0
            ),
            "totalRevenue",
          ],
        ],
        include: [
          {
            model: Order,
            as: "order",
            where: {
              TrangThai: 4,
              ...dateCondition,
            },
            attributes: [],
          },
          {
            model: ProductDetail,
            as: "productDetail",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["Ten", "HinhAnh"],
              },
            ],
          },
        ],
        group: ["productDetail.product.id"],
        order: [
          [sequelize.fn("SUM", sequelize.col("OrderDetail.SoLuong")), "DESC"],
        ],
        limit: 5,
        raw: false,
      });

      stats.topProducts = topProducts.map((item) => ({
        productName: item.productDetail.product.Ten,
        productImage: item.productDetail.product.HinhAnh,
        totalSold: item.dataValues.totalSold,
        totalRevenue: item.dataValues.totalRevenue,
      }));

      // Thống kê theo phương thức thanh toán - CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO
      const paymentStats = await Order.findAll({
        attributes: [
          [sequelize.fn("COUNT", "*"), "orderCount"],
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN Order.TrangThai = 4 THEN Order.TongThanhToan ELSE 0 END"
                )
              ),
              0
            ),
            "totalRevenue",
          ],
        ],
        include: [
          {
            model: PaymentMethod,
            as: "paymentMethod",
            attributes: ["Ten"],
          },
        ],
        where: dateCondition,
        group: ["paymentMethod.id"],
        order: [
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN Order.TrangThai = 4 THEN Order.TongThanhToan ELSE 0 END"
                )
              ),
              0
            ),
            "DESC",
          ],
        ],
        raw: false,
      });

      stats.paymentMethods = paymentStats.map((item) => ({
        paymentMethod: item.paymentMethod.Ten,
        orderCount: item.dataValues.orderCount,
        totalRevenue: item.dataValues.totalRevenue,
      }));

      // Thống kê khách hàng mới
      const newCustomers = await User.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("NgayTao")), "date"],
          [sequelize.fn("COUNT", "*"), "newCustomers"],
        ],
        where: {
          NgayTao: {
            [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("NgayTao"))],
        order: [[sequelize.fn("DATE", sequelize.col("NgayTao")), "ASC"]],
        raw: true,
      });

      stats.newCustomers = newCustomers;

      // Tỉ lệ hủy đơn
      const cancellationRate = await Order.findOne({
        attributes: [
          [sequelize.fn("COUNT", "*"), "totalOrders"],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END")
            ),
            "cancelledOrders",
          ],
          [
            sequelize.fn(
              "ROUND",
              sequelize.literal(
                "(SUM(CASE WHEN TrangThai = 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))"
              ),
              2
            ),
            "cancellationRate",
          ],
        ],
        where: dateCondition,
        raw: true,
      });

      stats.cancellationRate = cancellationRate;

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
