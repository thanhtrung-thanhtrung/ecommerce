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
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        1,
        2,
        3,
        4,
        5,
        6,
      ];

      // Nếu là số, chuyển thành string tương ứng
      const statusMap = {
        1: "pending",
        2: "confirmed",
        3: "shipping",
        4: "delivered",
        5: "cancelled",
      };

      if (typeof value === "number" && statusMap[value]) {
        return true;
      }

      if (typeof value === "string" && validStatuses.includes(value)) {
        return true;
      }

      throw new Error("Trạng thái đơn hàng không hợp lệ");
    })
    .customSanitizer((value) => {
      // Chuyển số thành string nếu cần
      const statusMap = {
        1: "pending",
        2: "confirmed",
        3: "shipping",
        4: "delivered",
        5: "cancelled",
      };
      // Nếu value là số thì trả về string key
      if (typeof value === "number" && statusMap[value]) {
        return statusMap[value];
      }
      // Nếu value là string số thì convert sang số rồi lấy key
      if (!isNaN(Number(value)) && statusMap[Number(value)]) {
        return statusMap[Number(value)];
      }
      // Nếu value là string hợp lệ thì giữ nguyên
      return value;
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
