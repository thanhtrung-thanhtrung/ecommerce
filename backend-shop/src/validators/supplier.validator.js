const { body, param, query, validationResult } = require("express-validator");

// Custom middleware to handle validation results
const handleValidationResult = (req, res, next) => {
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

// Validator cho tạo/cập nhật nhà cung cấp
const supplierValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Vui lòng nhập tên nhà cung cấp")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên nhà cung cấp phải từ 2-100 ký tự")
    .matches(/^[a-zA-ZÀ-ỹ\s0-9]+$/)
    .withMessage("Tên nhà cung cấp chỉ được chứa chữ cái, số và khoảng trắng"),

  body("DiaChi")
    .notEmpty()
    .withMessage("Vui lòng nhập địa chỉ")
    .isLength({ min: 5, max: 255 })
    .withMessage("Địa chỉ phải từ 5-255 ký tự"),

  body("SDT")
    .notEmpty()
    .withMessage("Vui lòng nhập số điện thoại")
    .matches(/^(0[3|5|7|8|9])[0-9]{8}$/)
    .withMessage(
      "Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 số)"
    ),

  body("Email")
    .notEmpty()
    .withMessage("Vui lòng nhập email")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 100 })
    .withMessage("Email không được vượt quá 100 ký tự")
    .normalizeEmail(),

  body("TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái phải là 0 (không hoạt động) hoặc 1 (hoạt động)"),

  handleValidationResult,
];

// Validator cho cập nhật trạng thái
const updateStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID phải là số nguyên dương"),

  body("TrangThai")
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn([0, 1])
    .withMessage("Trạng thái phải là 0 (không hoạt động) hoặc 1 (hoạt động)"),

  handleValidationResult,
];

// Validator cho lấy chi tiết nhà cung cấp
const getSupplierDetailValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID phải là số nguyên dương"),

  handleValidationResult,
];

// Validator cho tìm kiếm và phân trang nhà cung cấp
const getSupplierListValidator = [
  query("tuKhoa")
    .optional()
    .isString()
    .withMessage("Từ khóa tìm kiếm phải là chuỗi")
    .isLength({ max: 100 })
    .withMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự"),

  query("trangThai")
    .optional()
    .isIn(["0", "1"])
    .withMessage("Trạng thái phải là 0 hoặc 1"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi mỗi trang phải từ 1-100"),

  query("sortBy")
    .optional()
    .isIn(["Ten", "Email", "SDT", "id"])
    .withMessage("Trường sắp xếp không hợp lệ"),

  query("sortOrder")
    .optional()
    .isIn(["ASC", "DESC"])
    .withMessage("Thứ tự sắp xếp phải là ASC hoặc DESC"),

  handleValidationResult,
];

// Validator cho xóa nhà cung cấp
const deleteSupplierValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID phải là số nguyên dương"),

  handleValidationResult,
];

// Validator cho cập nhật nhà cung cấp (một số trường có thể optional)
const updateSupplierValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID phải là số nguyên dương"),

  body("Ten")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên nhà cung cấp phải từ 2-100 ký tự")
    .matches(/^[a-zA-ZÀ-ỹ\s0-9]+$/)
    .withMessage("Tên nhà cung cấp chỉ được chứa chữ cái, số và khoảng trắng"),

  body("DiaChi")
    .optional()
    .isLength({ min: 5, max: 255 })
    .withMessage("Địa chỉ phải từ 5-255 ký tự"),

  body("SDT")
    .optional()
    .matches(/^(0[3|5|7|8|9])[0-9]{8}$/)
    .withMessage(
      "Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 số)"
    ),

  body("Email")
    .optional()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 100 })
    .withMessage("Email không được vượt quá 100 ký tự")
    .normalizeEmail(),

  body("TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái phải là 0 (không hoạt động) hoặc 1 (hoạt động)"),

  // Kiểm tra ít nhất một trường được cập nhật
  body().custom((value, { req }) => {
    const allowedFields = ["Ten", "DiaChi", "SDT", "Email", "TrangThai"];
    const hasValidField = allowedFields.some(
      (field) => req.body[field] !== undefined
    );

    if (!hasValidField) {
      throw new Error("Cần ít nhất một trường để cập nhật");
    }
    return true;
  }),

  handleValidationResult,
];

module.exports = {
  supplierValidator,
  updateSupplierValidator,
  updateStatusValidator,
  getSupplierDetailValidator,
  getSupplierListValidator,
  deleteSupplierValidator,
};
