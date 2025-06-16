const { body, param } = require("express-validator");

// Validator cho tạo/cập nhật nhà cung cấp
const supplierValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên nhà cung cấp")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên nhà cung cấp phải từ 2-100 ký tự"),

  body("DiaChi")
    .notEmpty()
    .withMessage("Vui lòng nhập địa chỉ")
    .isLength({ max: 255 })
    .withMessage("Địa chỉ không được vượt quá 255 ký tự"),

  body("SoDienThoai")
    .notEmpty()
    .withMessage("Vui lòng nhập số điện thoại")
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ"),

  body("Email")
    .notEmpty()
    .withMessage("Vui lòng nhập email")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 100 })
    .withMessage("Email không được vượt quá 100 ký tự"),

  body("MoTa")
    .optional()
    .isString()
    .withMessage("Mô tả không hợp lệ")
    .isLength({ max: 500 })
    .withMessage("Mô tả không được vượt quá 500 ký tự"),

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

// Validator cho tìm kiếm nhà cung cấp
const searchValidator = [
  param("tuKhoa")
    .optional()
    .isString()
    .withMessage("Từ khóa tìm kiếm không hợp lệ"),

  param("trangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),
];

module.exports = {
  supplierValidator,
  updateStatusValidator,
  searchValidator,
};
