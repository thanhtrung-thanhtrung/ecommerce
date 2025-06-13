const { body, param, query } = require("express-validator");
const { validateResult } = require("../utils/validator.util");

// Validator cho tạo phiếu nhập
const createPhieuNhapValidator = [
  body("id_NhaCungCap")
    .notEmpty()
    .withMessage("Vui lòng chọn nhà cung cấp")
    .isInt()
    .withMessage("ID nhà cung cấp không hợp lệ"),

  body("chiTietPhieuNhap")
    .isArray({ min: 1 })
    .withMessage("Vui lòng thêm ít nhất một sản phẩm"),

  body("chiTietPhieuNhap.*.id_ChiTietSanPham")
    .notEmpty()
    .withMessage("Vui lòng chọn sản phẩm")
    .isInt()
    .withMessage("ID chi tiết sản phẩm không hợp lệ"),

  body("chiTietPhieuNhap.*.SoLuong")
    .notEmpty()
    .withMessage("Vui lòng nhập số lượng")
    .isInt({ min: 1 })
    .withMessage("Số lượng phải lớn hơn 0"),

  body("chiTietPhieuNhap.*.DonGia")
    .notEmpty()
    .withMessage("Vui lòng nhập đơn giá")
    .isFloat({ min: 0 })
    .withMessage("Đơn giá không hợp lệ"),

  body("GhiChu").optional().isString().withMessage("Ghi chú không hợp lệ"),

  body("hinhAnh")
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        // Kiểm tra kích thước file (tối đa 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
          throw new Error("Kích thước file không được vượt quá 5MB");
        }
        // Kiểm tra định dạng file
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, JPG)");
        }
      }
      return true;
    }),

  validateResult,
];

// Validator cho cập nhật trạng thái phiếu nhập
const updatePhieuNhapStatusValidator = [
  param("maPhieuNhap")
    .notEmpty()
    .withMessage("Mã phiếu nhập không được để trống")
    .matches(/^PN-\d{6}-\d{3}$/)
    .withMessage("Mã phiếu nhập không đúng định dạng"),

  body("trangThai")
    .isIn(["Chờ duyệt", "Đã duyệt", "Từ chối"])
    .withMessage("Trạng thái không hợp lệ"),

  validateResult,
];

// Validator cho lấy danh sách phiếu nhập
const getPhieuNhapListValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang không hợp lệ"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi mỗi trang phải từ 1 đến 100"),

  query("search")
    .optional()
    .isString()
    .withMessage("Từ khóa tìm kiếm không hợp lệ"),

  query("trangThai")
    .optional()
    .isIn(["Chờ duyệt", "Đã duyệt", "Từ chối"])
    .withMessage("Trạng thái không hợp lệ"),

  validateResult,
];

// Validator cho lấy chi tiết phiếu nhập
const getPhieuNhapDetailValidator = [
  param("maPhieuNhap")
    .notEmpty()
    .withMessage("Mã phiếu nhập không được để trống")
    .matches(/^PN-\d{6}-\d{3}$/)
    .withMessage("Mã phiếu nhập không đúng định dạng"),

  validateResult,
];

// Validator cho thống kê tồn kho
const thongKeTonKhoValidator = [
  query("id_DanhMuc")
    .optional()
    .isInt()
    .withMessage("ID danh mục không hợp lệ"),

  query("id_ThuongHieu")
    .optional()
    .isInt()
    .withMessage("ID thương hiệu không hợp lệ"),

  query("tuKhoa")
    .optional()
    .isString()
    .withMessage("Từ khóa tìm kiếm không hợp lệ"),

  validateResult,
];

// Validator cho lấy lịch sử nhập kho của sản phẩm
const getProductImportHistoryValidator = [
  param("chiTietSanPhamId")
    .notEmpty()
    .withMessage("ID chi tiết sản phẩm không được để trống")
    .isInt()
    .withMessage("ID chi tiết sản phẩm không hợp lệ"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang không hợp lệ"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi mỗi trang phải từ 1 đến 100"),

  validateResult,
];

// Validator cho thống kê nhập kho theo thời gian
const thongKeNhapKhoTheoThoiGianValidator = [
  query("tuNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày bắt đầu")
    .isDate()
    .withMessage("Ngày bắt đầu không hợp lệ"),

  query("denNgay")
    .notEmpty()
    .withMessage("Vui lòng chọn ngày kết thúc")
    .isDate()
    .withMessage("Ngày kết thúc không hợp lệ")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.tuNgay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),

  validateResult,
];

module.exports = {
  createPhieuNhapValidator,
  updatePhieuNhapStatusValidator,
  getPhieuNhapListValidator,
  getPhieuNhapDetailValidator,
  thongKeTonKhoValidator,
  getProductImportHistoryValidator,
  thongKeNhapKhoTheoThoiGianValidator,
};
