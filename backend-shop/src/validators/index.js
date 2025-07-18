const { body, param, query } = require("express-validator");

// Auth validation schemas
const authValidation = {
  register: [
    body("HoTen")
      .notEmpty()
      .withMessage("Họ tên không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

    body("Email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),

    body("SDT")
      .isMobilePhone("vi-VN")
      .withMessage("Số điện thoại không hợp lệ"),

    body("DiaChi")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Địa chỉ không được quá 255 ký tự"),

    body("MatKhau")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số"),
  ],

  login: [
    body("Email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),

    body("MatKhau").notEmpty().withMessage("Mật khẩu không được để trống"),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Mật khẩu hiện tại không được để trống"),

    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 số"),
  ],

  updateProfile: [
    body("HoTen")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

    body("SDT")
      .optional()
      .isMobilePhone("vi-VN")
      .withMessage("Số điện thoại không hợp lệ"),

    body("DiaChi")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Địa chỉ không được quá 255 ký tự"),
  ],

  refreshToken: [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token không được để trống"),
  ],
};

// Product validation schemas
const productValidation = {
  create: [
    body("Ten")
      .notEmpty()
      .withMessage("Tên sản phẩm không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên sản phẩm phải từ 2 đến 100 ký tự"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),

    body("MoTaChiTiet")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Mô tả chi tiết không được quá 2000 ký tự"),

    body("Gia").isFloat({ min: 0 }).withMessage("Giá phải là số dương"),

    body("GiaKhuyenMai")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Giá khuyến mãi phải là số dương")
      .custom((value, { req }) => {
        if (value && parseFloat(value) >= parseFloat(req.body.Gia)) {
          throw new Error("Giá khuyến mãi phải nhỏ hơn giá gốc");
        }
        return true;
      }),

    body("id_DanhMuc").isInt({ min: 1 }).withMessage("Danh mục không hợp lệ"),

    body("id_ThuongHieu")
      .isInt({ min: 1 })
      .withMessage("Thương hiệu không hợp lệ"),

    body("id_NhaCungCap")
      .isInt({ min: 1 })
      .withMessage("Nhà cung cấp không hợp lệ"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("ID sản phẩm không hợp lệ"),

    body("Ten")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên sản phẩm phải từ 2 đến 100 ký tự"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),

    body("MoTaChiTiet")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Mô tả chi tiết không được quá 2000 ký tự"),

    body("Gia")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Giá phải là số dương"),

    body("GiaKhuyenMai")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Giá khuyến mãi phải là số dương")
      .custom((value, { req }) => {
        if (
          value &&
          req.body.Gia &&
          parseFloat(value) >= parseFloat(req.body.Gia)
        ) {
          throw new Error("Giá khuyến mãi phải nhỏ hơn giá gốc");
        }
        return true;
      }),

    body("id_DanhMuc")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Danh mục không hợp lệ"),

    body("id_ThuongHieu")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Thương hiệu không hợp lệ"),

    body("id_NhaCungCap")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Nhà cung cấp không hợp lệ"),
  ],

  getById: [
    param("id").isInt({ min: 1 }).withMessage("ID sản phẩm không hợp lệ"),
  ],

  delete: [
    param("id").isInt({ min: 1 }).withMessage("ID sản phẩm không hợp lệ"),
  ],

  createVariant: [
    param("productId")
      .isInt({ min: 1 })
      .withMessage("ID sản phẩm không hợp lệ"),

    body("id_KichCo").isInt({ min: 1 }).withMessage("Kích cỡ không hợp lệ"),

    body("id_MauSac").isInt({ min: 1 }).withMessage("Màu sắc không hợp lệ"),

    body("MaSanPham")
      .notEmpty()
      .withMessage("Mã sản phẩm không được để trống")
      .isLength({ max: 50 })
      .withMessage("Mã sản phẩm không được quá 50 ký tự"),
  ],

  updateVariant: [
    param("variantId")
      .isInt({ min: 1 })
      .withMessage("ID biến thể không hợp lệ"),

    body("MaSanPham")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Mã sản phẩm không được quá 50 ký tự"),
  ],

  deleteVariant: [
    param("variantId")
      .isInt({ min: 1 })
      .withMessage("ID biến thể không hợp lệ"),
  ],
};

// Category validation schemas
const categoryValidation = {
  create: [
    body("Ten")
      .notEmpty()
      .withMessage("Tên danh mục không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên danh mục phải từ 2 đến 100 ký tự"),

    body("id_DanhMucCha")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Danh mục cha không hợp lệ"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("ID danh mục không hợp lệ"),

    body("Ten")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên danh mục phải từ 2 đến 100 ký tự"),

    body("id_DanhMucCha")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Danh mục cha không hợp lệ"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),
  ],

  getById: [
    param("id").isInt({ min: 1 }).withMessage("ID danh mục không hợp lệ"),
  ],

  delete: [
    param("id").isInt({ min: 1 }).withMessage("ID danh mục không hợp lệ"),
  ],
};

// Brand validation schemas
const brandValidation = {
  create: [
    body("Ten")
      .notEmpty()
      .withMessage("Tên thương hiệu không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên thương hiệu phải từ 2 đến 100 ký tự"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("ID thương hiệu không hợp lệ"),

    body("Ten")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên thương hiệu phải từ 2 đến 100 ký tự"),

    body("MoTa")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Mô tả không được quá 500 ký tự"),
  ],

  getById: [
    param("id").isInt({ min: 1 }).withMessage("ID thương hiệu không hợp lệ"),
  ],

  delete: [
    param("id").isInt({ min: 1 }).withMessage("ID thương hiệu không hợp lệ"),
  ],
};

// Order validation schemas
const orderValidation = {
  create: [
    body("TenNguoiNhan")
      .notEmpty()
      .withMessage("Tên người nhận không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên người nhận phải từ 2 đến 100 ký tự"),

    body("SDTNguoiNhan")
      .isMobilePhone("vi-VN")
      .withMessage("Số điện thoại người nhận không hợp lệ"),

    body("DiaChiNhan")
      .notEmpty()
      .withMessage("Địa chỉ nhận không được để trống")
      .isLength({ max: 255 })
      .withMessage("Địa chỉ nhận không được quá 255 ký tự"),

    body("EmailNguoiNhan")
      .isEmail()
      .withMessage("Email người nhận không hợp lệ")
      .normalizeEmail(),

    body("id_ThanhToan")
      .isInt({ min: 1 })
      .withMessage("Hình thức thanh toán không hợp lệ"),

    body("id_VanChuyen")
      .isInt({ min: 1 })
      .withMessage("Hình thức vận chuyển không hợp lệ"),

    body("MaGiamGia")
      .optional()
      .isLength({ max: 20 })
      .withMessage("Mã giảm giá không hợp lệ"),

    body("GhiChu")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),

    body("items")
      .isArray({ min: 1 })
      .withMessage("Đơn hàng phải có ít nhất 1 sản phẩm"),

    body("items.*.id_ChiTietSanPham")
      .isInt({ min: 1 })
      .withMessage("Biến thể sản phẩm không hợp lệ"),

    body("items.*.SoLuong")
      .isInt({ min: 1 })
      .withMessage("Số lượng phải lớn hơn 0"),
  ],

  updateStatus: [
    param("id").isInt({ min: 1 }).withMessage("ID đơn hàng không hợp lệ"),

    body("TrangThai")
      .isIn([1, 2, 3, 4, 5])
      .withMessage("Trạng thái đơn hàng không hợp lệ"),

    body("LyDoHuy")
      .if(body("TrangThai").equals("5"))
      .notEmpty()
      .withMessage("Lý do hủy không được để trống khi hủy đơn hàng"),
  ],
};

// Cart validation schemas
const cartValidation = {
  addItem: [
    body("id_ChiTietSanPham")
      .isInt({ min: 1 })
      .withMessage("Biến thể sản phẩm không hợp lệ"),

    body("SoLuong")
      .isInt({ min: 1, max: 10 })
      .withMessage("Số lượng phải từ 1 đến 10"),
  ],

  updateItem: [
    param("itemId")
      .isInt({ min: 1 })
      .withMessage("ID sản phẩm trong giỏ hàng không hợp lệ"),

    body("SoLuong")
      .isInt({ min: 1, max: 10 })
      .withMessage("Số lượng phải từ 1 đến 10"),
  ],

  removeItem: [
    param("itemId")
      .isInt({ min: 1 })
      .withMessage("ID sản phẩm trong giỏ hàng không hợp lệ"),
  ],
};

// Pagination validation
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Giới hạn phải từ 1 đến 100"),
];

module.exports = {
  authValidation,
  productValidation,
  categoryValidation,
  brandValidation,
  orderValidation,
  cartValidation,
  paginationValidation,
};
