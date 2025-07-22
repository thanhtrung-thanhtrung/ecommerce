const { PaymentMethod, Order, sequelize } = require("../models");
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
    try {
      const paymentMethod = await PaymentMethod.create({
        Ten: paymentData.Ten,
        MoTa: paymentData.MoTa || null,
        TrangThai: paymentData.TrangThai ?? 1,
      });

      return paymentMethod.toJSON();
    } catch (error) {
      throw new Error("Không thể tạo phương thức thanh toán: " + error.message);
    }
  }

  async capNhatPhuongThucThanhToan(id, paymentData) {
    try {
      const paymentMethod = await PaymentMethod.findByPk(id);

      if (!paymentMethod) {
        throw new Error("Không tìm thấy phương thức thanh toán");
      }

      await paymentMethod.update({
        Ten: paymentData.Ten,
        MoTa: paymentData.MoTa || null,
        TrangThai: paymentData.TrangThai ?? 1,
      });

      return paymentMethod.toJSON();
    } catch (error) {
      throw new Error(
        "Không thể cập nhật phương thức thanh toán: " + error.message
      );
    }
  }

  async xoaPhuongThucThanhToan(id) {
    try {
      // Kiểm tra xem có đơn hàng nào đang sử dụng phương thức này không
      const orderCount = await Order.count({
        where: { id_ThanhToan: id },
      });

      if (orderCount > 0) {
        throw new Error(
          "Không thể xóa phương thức thanh toán đang được sử dụng"
        );
      }

      const paymentMethod = await PaymentMethod.findByPk(id);

      if (!paymentMethod) {
        throw new Error("Không tìm thấy phương thức thanh toán");
      }

      await paymentMethod.destroy();

      return { message: "Xóa phương thức thanh toán thành công" };
    } catch (error) {
      throw new Error("Không thể xóa phương thức thanh toán: " + error.message);
    }
  }

  async capNhatTrangThai(id, trangThai) {
    try {
      const paymentMethod = await PaymentMethod.findByPk(id);

      if (!paymentMethod) {
        throw new Error("Không tìm thấy phương thức thanh toán");
      }

      await paymentMethod.update({ TrangThai: trangThai });

      return { id, TrangThai: trangThai };
    } catch (error) {
      throw new Error("Không thể cập nhật trạng thái: " + error.message);
    }
  }

  async layChiTietPhuongThucThanhToan(id) {
    try {
      const paymentMethod = await PaymentMethod.findByPk(id);

      if (!paymentMethod) {
        throw new Error("Không tìm thấy phương thức thanh toán");
      }

      return paymentMethod.toJSON();
    } catch (error) {
      throw new Error(
        "Không thể lấy chi tiết phương thức thanh toán: " + error.message
      );
    }
  }

  async layDanhSachPhuongThucThanhToan(filters = {}) {
    try {
      const whereClause = {};

      if (filters.trangThai !== undefined) {
        whereClause.TrangThai = filters.trangThai;
      }

      if (filters.tuKhoa) {
        const { Op } = require("sequelize");
        whereClause[Op.or] = [
          { Ten: { [Op.like]: `%${filters.tuKhoa}%` } },
          { MoTa: { [Op.like]: `%${filters.tuKhoa}%` } },
        ];
      }

      const paymentMethods = await PaymentMethod.findAll({
        where: whereClause,
        order: [["id", "DESC"]],
      });

      return paymentMethods.map((method) => method.toJSON());
    } catch (error) {
      throw new Error(
        "Không thể lấy danh sách phương thức thanh toán: " + error.message
      );
    }
  }

  async createPayment(
    orderId,
    userId,
    paymentMethodId,
    clientIp = "127.0.0.1"
  ) {
    try {
      orderId = orderId ?? null;
      userId = userId ?? null;
      paymentMethodId = paymentMethodId ?? null;

      const order = await Order.findByPk(orderId);

      if (!order) {
        throw new Error(
          `Đơn hàng với ID ${orderId} không tồn tại trong hệ thống`
        );
      }

      if (userId && order.id_NguoiMua && order.id_NguoiMua !== userId) {
        throw new Error("Bạn không có quyền truy cập đơn hàng này");
      }

      if (order.TrangThai !== 1) {
        throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");
      }

      const paymentMethod = await PaymentMethod.findOne({
        where: {
          id: paymentMethodId,
          TrangThai: 1,
        },
      });

      if (!paymentMethod) {
        throw new Error(
          "Phương thức thanh toán không hợp lệ hoặc đã bị vô hiệu hóa"
        );
      }

      let paymentData = {};

      switch (paymentMethod.Ten) {
        case "VNPay":
          paymentData = await this.createVNPayPayment(order, clientIp);
          break;
        case "Tiền mặt mặt ":
        case "COD":
          if (!order.EmailNguoiNhan || !order.SDTNguoiNhan) {
            throw new Error("COD yêu cầu thông tin liên lạc hợp lệ");
          }
          await order.update({ TrangThai: 2 });
          paymentData = { message: "Đặt hàng thành công với thanh toán COD" };
          break;
        default:
          throw new Error("Phương thức thanh toán không được hỗ trợ");
      }

      return paymentData;
    } catch (error) {
      throw new Error("Không thể tạo thanh toán: " + error.message);
    }
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
      const expire = new Date(now.getTime() + 30 * 60 * 1000); // 30 phút

      const customerReturnUrl = "http://localhost:5714/vnpay-return";

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

      const order = await Order.findByPk(orderId);

      if (!order) {
        return { RspCode: "01", Message: "Order not found" };
      }

      if (Math.abs(order.TongThanhToan - amount) > 1) {
        return { RspCode: "04", Message: "Invalid amount" };
      }

      if (rspCode === "00") {
        await order.update({
          TrangThai: 2,
          TrangThaiThanhToan: 1,
          ThoiGianThanhToan: new Date(),
        });
      } else {
        await order.update({
          TrangThai: 5,
          TrangThaiThanhToan: 0,
          LyDoHuy: `Thanh toán VNPay thất bại - Mã lỗi: ${rspCode}`,
        });
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

      const order = await Order.findByPk(orderId);

      if (!order) {
        return { success: false, message: "Không tìm thấy đơn hàng", orderId };
      }

      if (rspCode === "00") {
        await order.update({
          TrangThai: 2,
          TrangThaiThanhToan: 1,
          ThoiGianThanhToan: new Date(),
        });
      } else {
        await order.update({
          TrangThai: 5,
          TrangThaiThanhToan: 2,
          LyDoHuy: `Thanh toán VNPay thất bại - Mã lỗi: ${rspCode}`,
        });
      }

      // Lấy lại thông tin đơn hàng sau khi cập nhật
      await order.reload();

      const response = {
        orderId,
        amount,
        order: {
          id: order.id,
          MaDonHang: order.MaDonHang,
          TrangThai: order.TrangThai,
          TrangThaiThanhToan: order.TrangThaiThanhToan,
          TongThanhToan: order.TongThanhToan,
          TenNguoiNhan: order.TenNguoiNhan,
          EmailNguoiNhan: order.EmailNguoiNhan,
          DiaChiNhan: order.DiaChiNhan,
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
