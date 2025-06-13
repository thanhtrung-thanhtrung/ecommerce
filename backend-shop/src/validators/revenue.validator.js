const { query } = require("express-validator");
const { validateResult } = require("../utils/validator.util");

// Validator cho thống kê doanh thu theo thời gian
const thongKeDoanhThuValidator = [
  query("tuNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ"),

  query("denNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.tuNgay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),

  query("loaiThongKe")
    .optional()
    .isIn(["ngay", "thang", "nam"])
    .withMessage("Loại thống kê không hợp lệ"),

  validateResult,
];

// Validator cho báo cáo doanh thu chi tiết
const baoCaoDoanhThuValidator = [
  query("tuNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ"),

  query("denNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc")
    .isDate()
    .withMessage("Định dạng ngày không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.tuNgay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),

  query("id_DanhMuc")
    .optional()
    .isInt()
    .withMessage("ID danh mục không hợp lệ"),

  query("id_ThuongHieu")
    .optional()
    .isInt()
    .withMessage("ID thương hiệu không hợp lệ"),

  query("id_HinhThucThanhToan")
    .optional()
    .isInt()
    .withMessage("ID hình thức thanh toán không hợp lệ"),

  query("trangThai")
    .optional()
    .isIn(["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"])
    .withMessage("Trạng thái không hợp lệ"),

  validateResult,
];

module.exports = {
  thongKeDoanhThuValidator,
  baoCaoDoanhThuValidator,
};
