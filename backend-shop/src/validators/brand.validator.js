const { body, param } = require("express-validator");

// Validator cho tạo/cập nhật thương hiệu
const brandValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên thương hiệu")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên thương hiệu phải từ 2-100 ký tự"),

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

  body("Website")
    .optional()
    .isURL()
    .withMessage("Website không hợp lệ"),

  body("Logo")
    .optional()
    .custom((value, { req }) => {
      if (req.file && !req.file.mimetype.startsWith("image/")) {
        throw new Error("Logo phải là một file hình ảnh hợp lệ");
      }
      return true;
    })
    .withMessage("Logo phải là một chuỗi URL hợp lệ hoặc file hình ảnh"),
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

// Validator cho tìm kiếm thương hiệu
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

// Validator cho xóa thương hiệu
const deleteBrandValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt()
    .withMessage("ID không hợp lệ"),
];

module.exports = {
  brandValidator,
  updateStatusValidator,
  searchValidator,
  deleteBrandValidator,
};
