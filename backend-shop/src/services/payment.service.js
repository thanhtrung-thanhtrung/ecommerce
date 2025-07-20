const db = require("../config/database");
const crypto = require("crypto");
const qs = require("qs");
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

class PaymentService {
  constructor() {
    this.vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE || "46OBP8RP",
      secureSecret:
        process.env.VNP_HASH_SECRET || "27TBCDYVROCTIFL2X5M4IF7NM8IGWINX",
      vnpayHost:
        process.env.VNP_URL ||
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });
  }

  async taoPhuongThucThanhToan(paymentData) {
    const [result] = await db.execute(
      `INSERT INTO hinhthucthanhtoan (Ten, MoTa, TrangThai) VALUES (?, ?, ?)`,
      [paymentData.Ten, paymentData.MoTa || null, paymentData.TrangThai ?? 1]
    );

    return {
      id: result.insertId,
      ...paymentData,
      TrangThai: paymentData.TrangThai ?? 1,
    };
  }

  async capNhatPhuongThucThanhToan(id, paymentData) {
    const [result] = await db.execute(
      `UPDATE hinhthucthanhtoan SET Ten = ?, MoTa = ?, TrangThai = ? WHERE id = ?`,
      [
        paymentData.Ten,
        paymentData.MoTa || null,
        paymentData.TrangThai ?? 1,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy phương thức thanh toán");
    }

    return this.layChiTietPhuongThucThanhToan(id);
  }

  async xoaPhuongThucThanhToan(id) {
    const [orders] = await db.execute(
      "SELECT COUNT(*) as count FROM donhang WHERE id_ThanhToan = ?",
      [id]
    );

    if (orders[0].count > 0) {
      throw new Error("Không thể xóa phương thức thanh toán đang được sử dụng");
    }

    const [result] = await db.execute(
      "DELETE FROM hinhthucthanhtoan WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy phương thức thanh toán");
    }

    return { message: "Xóa phương thức thanh toán thành công" };
  }

  async capNhatTrangThai(id, trangThai) {
    const [result] = await db.execute(
      "UPDATE hinhthucthanhtoan SET TrangThai = ? WHERE id = ?",
      [trangThai, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy phương thức thanh toán");
    }

    return { id, TrangThai: trangThai };
  }

  async layChiTietPhuongThucThanhToan(id) {
    const [methods] = await db.execute(
      "SELECT * FROM hinhthucthanhtoan WHERE id = ?",
      [id]
    );

    if (methods.length === 0) {
      throw new Error("Không tìm thấy phương thức thanh toán");
    }

    return methods[0];
  }

  async layDanhSachPhuongThucThanhToan(filters = {}) {
    let query = "SELECT * FROM hinhthucthanhtoan WHERE 1=1";
    const params = [];

    if (filters.trangThai !== undefined) {
      query += " AND TrangThai = ?";
      params.push(filters.trangThai);
    }

    if (filters.tuKhoa) {
      query += " AND (Ten LIKE ? OR MoTa LIKE ?)";
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY id DESC";

    const [methods] = await db.execute(query, params);
    return methods;
  }

  async createPayment(
    orderId,
    userId,
    paymentMethodId,
    clientIp = "127.0.0.1"
  ) {
    orderId = orderId ?? null;
    userId = userId ?? null;
    paymentMethodId = paymentMethodId ?? null;

    // ✅ SỬA: Kiểm tra đơn hàng tồn tại trước
    const [orderExists] = await db.execute(
      "SELECT * FROM donhang WHERE id = ?",
      [orderId]
    );

    if (orderExists.length === 0) {
      throw new Error(
        `Đơn hàng với ID ${orderId} không tồn tại trong hệ thống`
      );
    }

    const order = orderExists[0];

    // ✅ SỬA: Logic linh hoạt cho cả guest và logged user
    // Chỉ cần đảm bảo người thanh toán có quyền với đơn hàng này
    if (userId && order.id_NguoiMua && order.id_NguoiMua !== userId) {
      throw new Error("Bạn không có quyền truy cập đơn hàng này");
    }

    // Cho phép guest user thanh toán bất kỳ đơn hàng nào (trừ trường hợp trên)
    // Cho phép logged user thanh toán đơn hàng của họ hoặc đơn hàng guest

    if (order.TrangThai !== 1) {
      throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");
    }

    const [paymentMethods] = await db.execute(
      "SELECT * FROM hinhthucthanhtoan WHERE id = ? AND TrangThai = 1",
      [paymentMethodId]
    );

    if (paymentMethods.length === 0) {
      throw new Error(
        "Phương thức thanh toán không hợp lệ hoặc đã bị vô hiệu hóa"
      );
    }

    const paymentMethod = paymentMethods[0];
    let paymentData = {};

    switch (paymentMethod.Ten) {
      case "VNPay":
        paymentData = await this.createVNPayPayment(order, clientIp);
        break;
      case "Tiền mặt mặt ":
      case "COD":
        // COD chỉ cần có thông tin liên lạc
        if (!order.EmailNguoiNhan || !order.SDTNguoiNhan) {
          throw new Error("COD yêu cầu thông tin liên lạc hợp lệ");
        }
        await db.execute("UPDATE donhang SET TrangThai = ? WHERE id = ?", [
          2,
          orderId,
        ]);
        paymentData = { message: "Đặt hàng thành công với thanh toán COD" };
        break;
      default:
        throw new Error("Phương thức thanh toán không được hỗ trợ");
    }

    return paymentData;
  }

  async createVNPayPayment(order, clientIp = "127.0.0.1") {
    try {
      const orderId = order.id.toString();
      const amount = Math.floor(parseFloat(order.TongThanhToan) || 0);

      if (amount <= 0 || amount < 5000) {
        throw new Error(
          "Số tiền thanh toán tối thiểu là 5,000 VND cho VNPay sandbox"
        );
      }

      const now = new Date();
      const expire = new Date(now.getTime() + 15 * 60 * 1000);

      // ✅ SỬA: Cập nhật return URL về đúng port customer
      const customerReturnUrl = "http://localhost:5714/vnpay-return";

      console.log("🔗 VNPay FORCED Customer Return URL:", customerReturnUrl);
      console.log("🎯 Order ID:", orderId, "Amount:", amount);
      console.log(
        "⚠️  NOTICE: All VNPay returns will go to CUSTOMER frontend (port 5714) only"
      );

      const paymentUrl = await this.vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: clientIp,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: customerReturnUrl, // FORCED customer URL - port 5714
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(now),
        vnp_ExpireDate: dateFormat(expire),
      });

      console.log("✅ VNPay Payment URL created:", paymentUrl);
      console.log("🔄 This URL will return to:", customerReturnUrl);

      return {
        success: true,
        paymentUrl,
        orderId,
        amount,
        message: "Tạo URL thanh toán VNPay thành công",
      };
    } catch (error) {
      throw new Error(`Lỗi tạo thanh toán VNPay: ${error.message}`);
    }
  }

  async handleVNPayIPN(ipnData) {
    try {
      const isValid = this.vnpay.verifyReturnUrl(ipnData);

      if (!isValid) return { RspCode: "97", Message: "Invalid signature" };

      const orderId = ipnData.vnp_TxnRef;
      const rspCode = ipnData.vnp_ResponseCode;
      const amount = parseInt(ipnData.vnp_Amount) / 100;

      const [orders] = await db.execute("SELECT * FROM donhang WHERE id = ?", [
        orderId,
      ]);
      if (orders.length === 0)
        return { RspCode: "01", Message: "Order not found" };

      const order = orders[0];
      if (Math.abs(order.TongThanhToan - amount) > 1) {
        return { RspCode: "04", Message: "Invalid amount" };
      }

      if (rspCode === "00") {
        await db.execute(
          `UPDATE donhang SET TrangThai = 2, TrangThaiThanhToan = 1, ThoiGianThanhToan = NOW() WHERE id = ?`,
          [order.id]
        );
      } else {
        await db.execute(
          `UPDATE donhang SET TrangThai = 5, TrangThaiThanhToan = 0, LyDoHuy = ? WHERE id = ?`,
          [`Thanh toán VNPay thất bại - Mã lỗi: ${rspCode}`, order.id]
        );
      }

      return { RspCode: "00", Message: "Confirm Success" };
    } catch (error) {
      return { RspCode: "99", Message: "Unknown error" };
    }
  }

  async handleVNPayReturn(returnData) {
    try {
      const isValid = this.vnpay.verifyReturnUrl(returnData);
      if (!isValid) return { success: false, message: "Chữ ký không hợp lệ" };

      const orderId = returnData.vnp_TxnRef;
      const rspCode = returnData.vnp_ResponseCode;
      const amount = parseInt(returnData.vnp_Amount) / 100;

      console.log("🔄 VNPay Return Processing:", {
        orderId,
        rspCode,
        amount,
        isValid,
      });

      const [orders] = await db.execute("SELECT * FROM donhang WHERE id = ?", [
        orderId,
      ]);
      if (orders.length === 0) {
        return { success: false, message: "Không tìm thấy đơn hàng", orderId };
      }

      const order = orders[0];

      // ✅ SỬA: Cập nhật trạng thái đơn hàng dựa trên kết quả VNPay
      if (rspCode === "00") {
        // Thanh toán thành công - cập nhật trạng thái
        await db.execute(
          `UPDATE donhang SET 
            TrangThai = 2, 
            TrangThaiThanhToan = 1, 
            ThoiGianThanhToan = NOW() 
           WHERE id = ?`,
          [orderId]
        );

        console.log("✅ Payment Success - Order updated:", {
          orderId,
          newStatus: 2,
          paymentStatus: 1,
        });
      } else {
        // Thanh toán thất bại - đánh dấu thất bại
        await db.execute(
          `UPDATE donhang SET 
            TrangThai = 5, 
            TrangThaiThanhToan = 2, 
            LyDoHuy = ? 
           WHERE id = ?`,
          [`Thanh toán VNPay thất bại - Mã lỗi: ${rspCode}`, orderId]
        );

        console.log("❌ Payment Failed - Order updated:", {
          orderId,
          newStatus: 5,
          paymentStatus: 2,
          errorCode: rspCode,
        });
      }

      // Lấy lại thông tin đơn hàng sau khi cập nhật
      const [updatedOrders] = await db.execute(
        "SELECT * FROM donhang WHERE id = ?",
        [orderId]
      );
      const updatedOrder = updatedOrders[0];

      const response = {
        orderId,
        amount,
        order: {
          id: updatedOrder.id,
          MaDonHang: updatedOrder.MaDonHang,
          TrangThai: updatedOrder.TrangThai,
          TrangThaiThanhToan: updatedOrder.TrangThaiThanhToan,
          TongThanhToan: updatedOrder.TongThanhToan,
          TenNguoiNhan: updatedOrder.TenNguoiNhan,
          EmailNguoiNhan: updatedOrder.EmailNguoiNhan,
          DiaChiNhan: updatedOrder.DiaChiNhan,
        },
      };

      return rspCode === "00"
        ? { success: true, message: "Thanh toán thành công", ...response }
        : {
            success: false,
            message: this.getVNPayErrorMessage(rspCode),
            code: rspCode,
            ...response,
          };
    } catch (error) {
      console.error("❌ VNPay Return Handler Error:", error);
      return {
        success: false,
        message: "Lỗi xử lý kết quả thanh toán",
        error: error.message,
      };
    }
  }

  getVNPayErrorMessage(code) {
    const errorMessages = {
      "01": "Giao dịch chưa hoàn tất",
      "02": "Giao dịch bị lỗi",
      "04": "Giao dịch đảo",
      "05": "VNPAY đang xử lý giao dịch này",
      "06": "VNPAY đã gửi yêu cầu hoàn tiền",
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "GD Hoàn trả bị từ chối",
      10: "Xác thực thẻ sai quá 3 lần",
      11: "Đã hết hạn chờ thanh toán",
      12: "Thẻ/Tài khoản bị khóa",
      51: "Không đủ số dư",
      65: "Vượt hạn mức giao dịch",
      75: "Ngân hàng bảo trì",
      79: "Sai mật khẩu quá quy định",
    };

    return errorMessages[code] || `Thanh toán thất bại - Mã lỗi: ${code}`;
  }

  async testVNPay() {
    try {
      const testOrder = {
        id: 99999,
        MaDonHang: `TEST-${Date.now()}`,
        TongThanhToan: 50000,
      };

      const testPayment = await this.createVNPayPayment(testOrder);

      return {
        success: true,
        message: "VNPay configuration test successful",
        config: {
          vnp_TmnCode: process.env.VNP_TMN_CODE,
          vnp_Url: process.env.VNP_URL,
          vnp_ReturnUrl: process.env.VNP_RETURN_URL,
          vnp_IpnUrl: process.env.VNP_IPN_URL,
          secretKeyLength: (process.env.VNP_HASH_SECRET || "").length,
        },
        testResult: testPayment,
      };
    } catch (error) {
      return {
        success: false,
        message: "VNPay configuration test failed",
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentService();
