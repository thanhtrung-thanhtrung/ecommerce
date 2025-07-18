const { body, param } = require("express-validator");

const createOrderValidator = [
  // Các trường bắt buộc cho guest order
  body("diaChiGiao")
    .notEmpty()
    .withMessage("Địa chỉ giao hàng không được để trống")
    .trim(),

  body("soDienThoai")
    .notEmpty()
    .withMessage("Số điện thoại không được để trống")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),

  body("hoTen").notEmpty().withMessage("Họ tên không được để trống").trim(),

  body("email")
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  // Fix field name to match frontend
  body("id_ThanhToan")
    .isInt({ min: 1 })
    .withMessage("Hình thức thanh toán không hợp lệ"),

  body("id_VanChuyen")
    .isInt({ min: 1 })
    .withMessage("Hình thức vận chuyển không hợp lệ"),

  // Optional fields
  body("MaGiamGia")
    .optional({ nullable: true, checkFalsy: false })
    .custom((value) => {
      // Chấp nhận null, undefined, hoặc string
      if (value === null || value === undefined || typeof value === "string") {
        return true;
      }
      throw new Error("Mã giảm giá không hợp lệ");
    }),

  body("ghiChu").optional().trim(),

  // Additional fields that might be sent from frontend
  body("tongTien").optional().isNumeric().withMessage("Tổng tiền không hợp lệ"),

  body("tongTienSauGiam")
    .optional()
    .isNumeric()
    .withMessage("Tổng tiền sau giảm không hợp lệ"),

  body("phiVanChuyen")
    .optional()
    .isNumeric()
    .withMessage("Phí vận chuyển không hợp lệ"),

  body("sessionId")
    .optional()
    .isString()
    .withMessage("Session ID không hợp lệ"),
];

const cancelOrderValidator = [
  body("lyDoHuy")
    .notEmpty()
    .withMessage("Lý do hủy đơn không được để trống")
    .trim(),
];

const guestOrderTrackingValidator = [
  param("maDonHang").isInt().withMessage("ID đơn hàng không hợp lệ"),
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
];

// Admin validators
const updateOrderStatusValidator = [
  param("orderId").isInt({ min: 1 }).withMessage("ID đơn hàng không hợp lệ"),
  body("status")
    .custom((value) => {
      // Chấp nhận cả số và string
      const validStatuses = [1, 2, 3, 4, 5, "1", "2", "3", "4", "5"];

      if (validStatuses.includes(value)) {
        return true;
      }

      throw new Error("Trạng thái đơn hàng không hợp lệ");
    })
    .customSanitizer((value) => {
      // Luôn chuyển về số
      return parseInt(value);
    }),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Ghi chú không được vượt quá 500 ký tự"),
];

module.exports = {
  createOrderValidator,
  cancelOrderValidator,
  guestOrderTrackingValidator,
  updateOrderStatusValidator,
};
