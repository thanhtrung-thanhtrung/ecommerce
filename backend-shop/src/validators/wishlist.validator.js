const { param, query, body, validationResult } = require("express-validator");

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

// Validator cho thêm/xóa sản phẩm khỏi wishlist
const wishlistValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt({ min: 1 })
    .withMessage("ID sản phẩm phải là số nguyên dương"),

  validateResult,
];

// Validator cho lấy danh sách wishlist
const getWishlistValidator = [
  query("danhMuc")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID danh mục phải là số nguyên dương"),

  query("thuongHieu")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID thương hiệu phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải từ 1-100"),

  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset phải là số không âm"),

  validateResult,
];

// Validator cho kiểm tra nhiều sản phẩm
const checkMultipleProductsValidator = [
  query("productIds")
    .notEmpty()
    .withMessage("Danh sách ID sản phẩm không được để trống")
    .custom((value) => {
      try {
        const ids = JSON.parse(value);
        if (!Array.isArray(ids) || ids.length === 0) {
          throw new Error("Danh sách ID sản phẩm phải là mảng không rỗng");
        }
        if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
          throw new Error("Tất cả ID sản phẩm phải là số nguyên dương");
        }
        return true;
      } catch (error) {
        throw new Error("Định dạng danh sách ID sản phẩm không hợp lệ");
      }
    }),

  validateResult,
];

// Validator cho lấy wishlist chi tiết (admin)
const getWishlistDetailValidator = [
  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID người dùng phải là số nguyên dương"),

  query("productId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID sản phẩm phải là số nguyên dương"),

  query("tuNgay")
    .optional()
    .isDate()
    .withMessage("Định dạng ngày bắt đầu không hợp lệ"),

  query("denNgay")
    .optional()
    .isDate()
    .withMessage("Định dạng ngày kết thúc không hợp lệ")
    .custom((value, { req }) => {
      if (req.query.tuNgay && new Date(value) < new Date(req.query.tuNgay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải từ 1-100"),

  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset phải là số không âm"),

  validateResult,
];

module.exports = {
  wishlistValidator,
  getWishlistValidator,
  checkMultipleProductsValidator,
  getWishlistDetailValidator,
};
