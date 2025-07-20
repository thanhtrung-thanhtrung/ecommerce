const express = require("express");
const testController = require("../controllers/test.controller");
const { body } = require("express-validator");
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
require("dotenv").config();

const router = express.Router();

router.get("/danhsach", testController.test);

// Test VNPay configuration
router.post("/vnpay/create-payment-url", async (req, res) => {
  try {
    const findCart = {
      totalPrice: 100000 * 100, // VNĐ * 100
      _id: "ORDER" + Date.now(), // unique txnRef
    };

    const now = new Date();
    const expire = new Date(now.getTime() + 60 * 60 * 1000); // +1 giờ

    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: process.env.VNP_URL,
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: findCart.totalPrice,
      vnp_IpAddr:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "127.0.0.1",
      vnp_TxnRef: findCart._id,
      vnp_OrderInfo: `Thanh toan don hang ${findCart._id}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_Locale: "vn",
      vnp_CreateDate: dateFormat(now), // ✅ Dùng dateFormat đúng
      vnp_ExpireDate: dateFormat(expire), // ✅ Dùng dateFormat đúng
    });

    return res.status(200).json({ url: vnpayResponse });
  } catch (error) {
    console.error("VNPay error:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi tạo URL thanh toán.",
    });
  }
});

// Test VNPay configuration với đơn hàng demo
router.post("/vnpay/demo-payment", async (req, res) => {
  try {
    const { amount = 50000, orderInfo = "Don hang demo" } = req.body;

    // Validate amount
    if (amount < 5000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán tối thiểu là 5,000 VND",
      });
    }

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000); // +15 phút

    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: process.env.VNP_URL,
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    console.log("Demo Payment - Original amount:", amount, "VND");

    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: amount, // ✅ FIXED: Không nhân 100 nữa
      vnp_IpAddr:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "127.0.0.1",
      vnp_TxnRef: "DEMO_" + Date.now(),
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl:
        process.env.VNP_RETURN_URL || "http://localhost:3000/vnpay-return",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(expire),
    });

    return res.status(200).json({
      success: true,
      message: "Tạo URL demo thanh toán VNPay thành công",
      data: {
        paymentUrl: paymentUrl,
        amount: amount,
        orderInfo: orderInfo,
        expireTime: expire.toISOString(),
      },
    });
  } catch (error) {
    console.error("VNPay demo error:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo URL thanh toán demo.",
      error: error.message,
    });
  }
});

// Endpoint xử lý VNPay return (cho frontend)
router.get("/vnpay/return", async (req, res) => {
  try {
    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: process.env.VNP_URL,
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    // Verify return URL
    const isValid = vnpay.verifyReturnUrl(req.query);

    if (isValid) {
      const orderId = req.query.vnp_TxnRef;
      const rspCode = req.query.vnp_ResponseCode;
      const amount = parseInt(req.query.vnp_Amount) / 100;

      if (rspCode === "00") {
        return res.json({
          success: true,
          message: "Thanh toán thành công",
          data: {
            orderId: orderId,
            amount: amount,
            responseCode: rspCode,
          },
        });
      } else {
        return res.json({
          success: false,
          message: "Thanh toán thất bại",
          data: {
            orderId: orderId,
            responseCode: rspCode,
          },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ",
      });
    }
  } catch (error) {
    console.error("VNPay return error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý kết quả thanh toán",
      error: error.message,
    });
  }
});

// Endpoint xử lý VNPay IPN (cho VNPay server gửi về)
router.post("/vnpay/ipn", async (req, res) => {
  try {
    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: process.env.VNP_URL,
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    console.log("VNPay IPN received:", req.body);

    // Verify IPN
    const isValid = vnpay.verifyReturnUrl(req.body);

    if (isValid) {
      const orderId = req.body.vnp_TxnRef;
      const rspCode = req.body.vnp_ResponseCode;
      const amount = parseInt(req.body.vnp_Amount) / 100;

      console.log(
        `IPN processed for order ${orderId}, status: ${rspCode}, amount: ${amount}`
      );

      // Ở đây bạn có thể cập nhật database nếu cần
      // Ví dụ: cập nhật trạng thái đơn hàng trong database

      return res.status(200).json({
        RspCode: "00",
        Message: "Confirm Success",
      });
    } else {
      console.log("Invalid IPN signature");
      return res.status(200).json({
        RspCode: "97",
        Message: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("VNPay IPN error:", error);
    return res.status(200).json({
      RspCode: "99",
      Message: "Unknown error",
    });
  }
});

module.exports = router;
