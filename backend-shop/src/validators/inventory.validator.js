const { body, param, query, validationResult } = require("express-validator");

// Custom middleware to handle validation results
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator cho cập nhật phiếu nhập
const updatePhieuNhapStatusValidator = [
  param("phieuNhapId")
    .notEmpty()
    .withMessage("ID phiếu nhập không được để trống")
    .isInt()
    .withMessage("ID phiếu nhập không hợp lệ"),

  body("TrangThai")
    .optional()
    .isIn([1, 2, 3])
    .withMessage(
      "Trạng thái không hợp lệ (1: Chờ xác nhận, 2: Đã nhập kho, 3: Đã hủy)"
    ),

  body("GhiChu").optional().isString().withMessage("Ghi chú không hợp lệ"),

  handleValidationResult,
];

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

  body("chiTietPhieuNhap.*.GiaNhap")
    .notEmpty()
    .withMessage("Vui lòng nhập giá nhập")
    .isFloat({ min: 0 })
    .withMessage("Giá nhập không hợp lệ"),

  body("GhiChu").optional().isString().withMessage("Ghi chú không hợp lệ"),

  handleValidationResult,
];

// Validator cho lấy danh sách phiếu nhập
const getPhieuNhapListValidator = [
  query("trangThai")
    .optional()
    .isIn(["1", "2", "3"])
    .withMessage("Trạng thái không hợp lệ"),

  query("nhaCungCap")
    .optional()
    .isInt()
    .withMessage("ID nhà cung cấp không hợp lệ"),

  query("tuNgay").optional().isDate().withMessage("Ngày bắt đầu không hợp lệ"),

  query("denNgay")
    .optional()
    .isDate()
    .withMessage("Ngày kết thúc không hợp lệ"),

  handleValidationResult,
];

// Validator cho lấy chi tiết phiếu nhập
const getPhieuNhapDetailValidator = [
  param("phieuNhapId")
    .notEmpty()
    .withMessage("ID phiếu nhập không được để trống")
    .isInt()
    .withMessage("ID phiếu nhập không hợp lệ"),

  handleValidationResult,
];

// Validator cho thống kê tồn kho
const thongKeTonKhoValidator = [
  query("danhMuc").optional().isInt().withMessage("ID danh mục không hợp lệ"),

  query("thuongHieu")
    .optional()
    .isInt()
    .withMessage("ID thương hiệu không hợp lệ"),

  query("sapHet")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Tham số sắp hết hàng phải là true hoặc false"),

  query("tatCa")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Tham số tất cả phải là true hoặc false"),

  handleValidationResult,
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

  handleValidationResult,
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

  handleValidationResult,
];

// Validator cho kiểm tra tồn kho
const checkStockValidator = [
  body("chiTietSanPhamId")
    .notEmpty()
    .withMessage("ID chi tiết sản phẩm không được để trống")
    .isInt()
    .withMessage("ID chi tiết sản phẩm phải là số nguyên"),

  body("soLuong")
    .notEmpty()
    .withMessage("Số lượng không được để trống")
    .isInt({ min: 1 })
    .withMessage("Số lượng phải là số nguyên lớn hơn 0"),

  handleValidationResult,
];

module.exports = {
  createPhieuNhapValidator,
  updatePhieuNhapStatusValidator,
  getPhieuNhapListValidator,
  getPhieuNhapDetailValidator,
  thongKeTonKhoValidator,
  getProductImportHistoryValidator,
  thongKeNhapKhoTheoThoiGianValidator,
  checkStockValidator,
};
