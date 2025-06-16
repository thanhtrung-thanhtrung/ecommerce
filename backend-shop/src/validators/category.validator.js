const { body, param } = require("express-validator");

// Validator cho tạo/cập nhật danh mục
const categoryValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên danh mục")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên danh mục phải từ 2-100 ký tự"),

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

// Validator cho tìm kiếm danh mục
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
  categoryValidator,
  updateStatusValidator,
  searchValidator,
};
