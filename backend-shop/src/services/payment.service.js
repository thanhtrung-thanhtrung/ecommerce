const db = require("../config/database");
const crypto = require("crypto");

class PaymentService {
  // Quản lý phương thức thanh toán
  async taoPhuongThucThanhToan(paymentData) {
    const [result] = await db.execute(
      `INSERT INTO hinhthucthanhtoan (Ten, MoTa, TrangThai) 
       VALUES (?, ?, ?)`,
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
      `UPDATE hinhthucthanhtoan 
       SET Ten = ?, MoTa = ?, TrangThai = ?
       WHERE id = ?`,
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
    // Kiểm tra xem phương thức thanh toán có đang được sử dụng không
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

  // Các phương thức thanh toán hiện có
  async createPayment(orderId, userId, paymentMethodId) {
    orderId = orderId ?? null;
    userId = userId ?? null;
    paymentMethodId = paymentMethodId ?? null;

    // Modified query to handle both authenticated users and guest orders
    let orderQuery, orderParams;
    if (userId) {
      orderQuery = "SELECT * FROM donhang WHERE id = ? AND id_NguoiMua = ?";
      orderParams = [orderId, userId];
    } else {
      // For guest orders, check that id_NguoiMua is NULL
      orderQuery = "SELECT * FROM donhang WHERE id = ? AND id_NguoiMua IS NULL";
      orderParams = [orderId];
    }

    const [orders] = await db.execute(orderQuery, orderParams);

    if (orders.length === 0) {
      throw new Error("Đơn hàng không tồn tại hoặc không có quyền truy cập");
    }

    const order = orders[0];

    if (order.TrangThai !== 1) {
      throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");
    }

    const [paymentMethods] = await db.execute(
      "SELECT * FROM hinhthucthanhtoan WHERE id = ?",
      [paymentMethodId]
    );

    if (paymentMethods.length === 0) {
      throw new Error("Phương thức thanh toán không hợp lệ");
    }

    const paymentMethod = paymentMethods[0];
    let paymentData = {};

    switch (paymentMethod.Ten) {
      case "VNPay":
        paymentData = await this.createVNPayPayment(order);
        break;
      case "MoMo":
        paymentData = await this.createMoMoPayment(order);
        break;
      case "ZaloPay":
        paymentData = await this.createZaloPayment(order);
        break;
      case "COD":
        await db.execute("UPDATE donhang SET TrangThai = ? WHERE id = ?", [
          2, // Update to confirmed status for COD
          orderId,
        ]);
        paymentData = { message: "Đặt hàng thành công với thanh toán COD" };
        break;
      default:
        throw new Error("Phương thức thanh toán không được hỗ trợ");
    }

    return paymentData;
  }

  async createVNPayPayment(order) {
    const vnp_TmnCode = process.env.VNP_TMN_CODE;
    const vnp_HashSecret = process.env.VNP_HASH_SECRET;
    const vnp_Url = process.env.VNP_URL;
    const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate =
      date.getFullYear().toString() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const orderId = order.id.toString();
    const amount = Math.floor(order.TongThanhToan);
    const orderInfo = `Thanh toan don hang #${orderId}`;
    const orderType = "billpayment";
    const locale = "vn";
    const currCode = "VND";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnp_Params);
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const querystring = Object.entries(vnp_Params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    return {
      paymentUrl: `${vnp_Url}?${querystring}`,
    };
  }

  async createMoMoPayment(order) {
    throw new Error("MoMo payment not implemented yet");
  }

  async createZaloPayment(order) {
    throw new Error("ZaloPay payment not implemented yet");
  }

  async handleVNPayIPN(ipnData) {
    const vnp_HashSecret = process.env.VNP_HASH_SECRET;
    const secureHash = ipnData.vnp_SecureHash;

    delete ipnData.vnp_SecureHash;
    delete ipnData.vnp_SecureHashType;

    const sortedParams = this.sortObject(ipnData);
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const orderId = parseInt(ipnData.vnp_TxnRef);
      if (!orderId || isNaN(orderId)) {
        return { RspCode: "97", Message: "Invalid order ID" };
      }

      const rspCode = ipnData.vnp_ResponseCode;
      const newStatus = rspCode === "00" ? 2 : 4; // 2 = Confirmed, 4 = Payment failed

      await db.execute("UPDATE donhang SET TrangThai = ? WHERE id = ?", [
        newStatus,
        orderId,
      ]);

      return { RspCode: "00", Message: "success" };
    } else {
      return { RspCode: "97", Message: "Invalid signature" };
    }
  }

  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }
}

module.exports = new PaymentService();
