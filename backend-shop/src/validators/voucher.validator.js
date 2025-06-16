const { body, param, query } = require("express-validator");
const { validateResult } = require("../utils/validator.util");

// Validator cho tạo/cập nhật voucher
const voucherValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên voucher")
    .isLength({ min: 3, max: 100 })
    .withMessage("Tên voucher phải từ 3-100 ký tự"),

  body("MoTa").optional().isString().withMessage("Mô tả không hợp lệ"),

  body("LoaiGiamGia")
    .notEmpty()
    .withMessage("Vui lòng chọn loại giảm giá")
    .isIn(["Phần trăm", "Cố định"])
    .withMessage("Loại giảm giá không hợp lệ"),

  body("GiaTri")
    .notEmpty()
    .withMessage("Vui lòng nhập giá trị giảm giá")
    .custom((value, { req }) => {
      if (req.body.LoaiGiamGia === "Phần trăm") {
        return value >= 0 && value <= 100;
      }
      return value > 0;
    })
    .withMessage("Giá trị giảm giá không hợp lệ"),

  body("GiaTriToiThieu")
    .notEmpty()
    .withMessage("Vui lòng nhập giá trị đơn hàng tối thiểu")
    .isFloat({ min: 0 })
    .withMessage("Giá trị tối thiểu phải lớn hơn 0"),

  body("GiaTriToiDa")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá trị tối đa phải lớn hơn 0")
    .custom((value, { req }) => {
      if (req.body.LoaiGiamGia === "Phần trăm" && value) {
        return value >= req.body.GiaTriToiThieu;
      }
      return true;
    })
    .withMessage("Giá trị tối đa phải lớn hơn giá trị tối thiểu"),

  body("SoLuong")
    .notEmpty()
    .withMessage("Vui lòng nhập số lượng voucher")
    .isInt({ min: 1 })
    .withMessage("Số lượng phải lớn hơn 0"),

  body("NgayBatDau")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ"),

  body("NgayKetThuc")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.NgayBatDau)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),

  validateResult,
];

// Validator cho cập nhật trạng thái voucher
const updateVoucherStatusValidator = [
  param("maVoucher").notEmpty().withMessage("Mã voucher không được để trống"),

  body("TrangThai").isIn([0, 1]).withMessage("Trạng thái không hợp lệ"),

  validateResult,
];

// Validator cho tìm kiếm voucher
const searchVoucherValidator = [
  query("tuKhoa")
    .optional()
    .isString()
    .withMessage("Từ khóa tìm kiếm không hợp lệ"),

  query("trangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),

  query("loaiGiamGia")
    .optional()
    .isIn(["Phần trăm", "Cố định"])
    .withMessage("Loại giảm giá không hợp lệ"),

  validateResult,
];

module.exports = {
  voucherValidator,
  updateVoucherStatusValidator,
  searchVoucherValidator,
};
