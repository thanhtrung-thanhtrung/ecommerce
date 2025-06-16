const { body, param } = require("express-validator");

// Validator cho tạo/cập nhật phương thức thanh toán
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

// Validator cho cập nhật trạng thái
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

// Validator cho tạo thanh toán
const createPaymentValidator = [
  body("id")
    .notEmpty()
    .withMessage("Mã đơn hàng không được để trống")
    .isInt()
    .withMessage("Mã đơn hàng không hợp lệ"),

  body("id_ThanhToan")
    .notEmpty()
    .withMessage("Hình thức thanh toán không được để trống")
    .isInt()
    .withMessage("Hình thức thanh toán không hợp lệ"),
];

module.exports = {
  paymentMethodValidator,
  updateStatusValidator,
  createPaymentValidator,
};
