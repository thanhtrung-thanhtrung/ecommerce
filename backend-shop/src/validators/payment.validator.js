const { body, param } = require("express-validator");

const paymentMethodValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên phương thức thanh toán")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phương thức thanh toán phải từ 2-50 ký tự"),

  body("MoTa")
    .optional()
    .isString()
    .withMessage("Mô tả không hợp lệ")
    .isLength({ max: 255 })
    .withMessage("Mô tả không được vượt quá 255 ký tự"),

  body("TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),
];

const updateStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt()
    .withMessage("ID không hợp lệ"),
  body("TrangThai")
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),
];

const createPaymentValidator = [
  body("orderId")
    .notEmpty()
    .withMessage("Mã đơn hàng không được để trống")
    .isInt({ min: 1 })
    .withMessage("Mã đơn hàng không hợp lệ"),
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Phương thức thanh toán không được để trống")
    .isInt({ min: 1 })
    .withMessage("Phương thức thanh toán phải là số nguyên dương"),
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Số tiền phải là số dương"),
  body("returnUrl").optional().isURL().withMessage("Return URL không hợp lệ"),
  body("orderInfo")
    .optional()
    .isString()
    .withMessage("Thông tin đơn hàng phải là chuỗi"),
];

const updatePaymentValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Tên phương thức thanh toán không được để trống")
    .isLength({ min: 3, max: 100 })
    .withMessage("Tên phương thức thanh toán phải từ 3-100 ký tự"),
  body("MoTa")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Mô tả không được vượt quá 500 ký tự"),
  body("TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái phải là 0 (tắt) hoặc 1 (bật)"),
];

const vnpayReturnValidator = [
  body("vnp_TmnCode").notEmpty().withMessage("Mã website không được để trống"),
  body("vnp_Amount").notEmpty().withMessage("Số tiền không được để trống"),
  body("vnp_OrderInfo")
    .notEmpty()
    .withMessage("Thông tin đơn hàng không được để trống"),
  body("vnp_ResponseCode")
    .notEmpty()
    .withMessage("Mã phản hồi không được để trống"),
  body("vnp_TransactionNo").optional(),
  body("vnp_TxnRef").notEmpty().withMessage("Mã giao dịch không được để trống"),
  body("vnp_SecureHash").notEmpty().withMessage("Chữ ký không được để trống"),
];

module.exports = {
  paymentMethodValidator,
  updateStatusValidator,
  createPaymentValidator,
  updatePaymentValidator,
  vnpayReturnValidator,
};
