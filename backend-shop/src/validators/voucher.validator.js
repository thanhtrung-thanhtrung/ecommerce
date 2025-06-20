const { body, param, query, validationResult } = require("express-validator");

// Middleware xử lý kết quả validation
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: errors.array(),
    });
  }
  next();
};

// Validator cho tạo/cập nhật voucher
const voucherValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên voucher")
    .isLength({ min: 3, max: 100 })
    .withMessage("Tên voucher phải từ 3-100 ký tự"),

  body("MoTa").optional().isString().withMessage("Mô tả không hợp lệ"),

  body("PhanTramGiam")
    .notEmpty()
    .withMessage("Vui lòng nhập phần trăm giảm giá")
    .isInt({ min: 1, max: 100 })
    .withMessage("Phần trăm giảm giá phải từ 1-100%"),

  body("GiaTriGiamToiDa")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá trị giảm tối đa phải lớn hơn 0"),

  body("DieuKienApDung")
    .notEmpty()
    .withMessage("Vui lòng nhập điều kiện áp dụng")
    .isFloat({ min: 0 })
    .withMessage("Điều kiện áp dụng phải lớn hơn 0"),

  body("SoLuotSuDung")
    .notEmpty()
    .withMessage("Vui lòng nhập số lượt sử dụng")
    .isInt({ min: 1 })
    .withMessage("Số lượt sử dụng phải lớn hơn 0"),

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
    .isIn(["0", "1"])
    .withMessage("Trạng thái không hợp lệ"),

  query("dangHieuLuc")
    .optional()
    .isBoolean()
    .withMessage("Tham số đang hiệu lực không hợp lệ"),

  validateResult,
];

module.exports = {
  voucherValidator,
  updateVoucherStatusValidator,
  searchVoucherValidator,
};
