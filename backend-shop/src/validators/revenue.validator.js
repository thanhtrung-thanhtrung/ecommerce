const { query } = require("express-validator");

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
    .withMessage("Loại thống kê không hợp lệ (ngay, thang, nam)"),
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
    .isInt({ min: 1 })
    .withMessage("ID danh mục không hợp lệ"),

  query("id_ThuongHieu")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID thương hiệu không hợp lệ"),

  query("id_ThanhToan")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID hình thức thanh toán không hợp lệ"),

  query("id_VanChuyen")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID hình thức vận chuyển không hợp lệ"),

  query("trangThai")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Trạng thái không hợp lệ (1-5)"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang không hợp lệ"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi trên trang không hợp lệ (1-100)"),
];

// Validator cho thống kê khách hàng VIP
const thongKeKhachHangValidator = [
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

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Số lượng khách hàng không hợp lệ (1-50)"),
];

// Validator cho thống kê mã giảm giá
const thongKeMaGiamGiaValidator = [
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
];

// Validator cho xuất báo cáo
const xuatBaoCaoValidator = [
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
      // Giới hạn khoảng thời gian xuất báo cáo (tối đa 3 tháng)
      const daysDiff = Math.ceil(
        (new Date(value) - new Date(req.query.tuNgay)) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 90) {
        throw new Error(
          "Khoảng thời gian xuất báo cáo không được vượt quá 90 ngày"
        );
      }
      return true;
    }),

  query("loaiBaoCao")
    .notEmpty()
    .withMessage("Vui lòng chọn loại báo cáo")
    .isIn(["doanhthu", "sanpham", "khachhang", "donhang"])
    .withMessage("Loại báo cáo không hợp lệ"),

  query("format")
    .optional()
    .isIn(["pdf", "excel", "csv"])
    .withMessage("Định dạng file không hợp lệ (pdf, excel, csv)"),
];

// Validator cho so sánh doanh thu theo kỳ
const soSanhDoanhThuValidator = [
  query("tuNgay1")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu kỳ 1")
    .isDate()
    .withMessage("Định dạng ngày kỳ 1 không hợp lệ"),

  query("denNgay1")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc kỳ 1")
    .isDate()
    .withMessage("Định dạng ngày kỳ 1 không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.tuNgay1)) {
        throw new Error("Ngày kết thúc kỳ 1 phải sau ngày bắt đầu kỳ 1");
      }
      return true;
    }),

  query("tuNgay2")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu kỳ 2")
    .isDate()
    .withMessage("Định dạng ngày kỳ 2 không hợp lệ"),

  query("denNgay2")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc kỳ 2")
    .isDate()
    .withMessage("Định dạng ngày kỳ 2 không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.tuNgay2)) {
        throw new Error("Ngày kết thúc kỳ 2 phải sau ngày bắt đầu kỳ 2");
      }
      return true;
    }),
];
const tongQuanDoanhThuValidator = [
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
];
module.exports = {
  thongKeDoanhThuValidator,
  baoCaoDoanhThuValidator,
  thongKeKhachHangValidator,
  thongKeMaGiamGiaValidator,
  xuatBaoCaoValidator,
  soSanhDoanhThuValidator,
  tongQuanDoanhThuValidator,
};
