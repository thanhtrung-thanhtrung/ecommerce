const { body, param, query } = require("express-validator");

// Validator cho danh sách sản phẩm
const getAllProductsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang không hợp lệ"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi mỗi trang phải từ 1 đến 100"),
];

// Validator cho tìm kiếm sản phẩm
const searchProductsValidator = [
  query("tuKhoa")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Từ khóa tìm kiếm quá dài"),

  query("id_DanhMuc")
    .optional()
    .isInt()
    .withMessage("Mã danh mục không hợp lệ"),

  query("id_ThuongHieu")
    .optional()
    .isInt()
    .withMessage("Mã thương hiệu không hợp lệ"),

  query("giaMin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá tối thiểu không hợp lệ"),

  query("giaMax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá tối đa không hợp lệ")
    .custom((value, { req }) => {
      if (
        req.query.giaMin &&
        parseFloat(value) < parseFloat(req.query.giaMin)
      ) {
        throw new Error("Giá tối đa phải lớn hơn giá tối thiểu");
      }
      return true;
    }),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang không hợp lệ"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng bản ghi mỗi trang phải từ 1 đến 100"),
];

// Validator cho chi tiết sản phẩm
const getProductDetailValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),
];

// Validator cho đánh giá sản phẩm
const reviewProductValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),

  body("noiDung")
    .notEmpty()
    .withMessage("Nội dung đánh giá không được để trống")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Nội dung đánh giá phải từ 10 đến 1000 ký tự"),

  body("diem")
    .notEmpty()
    .withMessage("Điểm đánh giá không được để trống")
    .isInt({ min: 1, max: 5 })
    .withMessage("Điểm đánh giá phải từ 1 đến 5"),
];

// Validator cho tạo sản phẩm mới
const createProductValidator = [
  body("Ten")
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống")
    .trim()
    .isLength({ max: 255 })
    .withMessage("Tên sản phẩm không được vượt quá 255 ký tự"),

  body("MoTa")
    .notEmpty()
    .withMessage("Mô tả không được để trống")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Mô tả phải từ 10 đến 1000 ký tự"),

  body("MoTaChiTiet")
    .notEmpty()
    .withMessage("Mô tả chi tiết không được để trống")
    .trim()
    .isLength({ min: 50 })
    .withMessage("Mô tả chi tiết phải có ít nhất 50 ký tự"),

  body("ThongSoKyThuat")
    .notEmpty()
    .withMessage("Thông số kỹ thuật không được để trống")
    .custom((value, { req }) => {
      try {
        // Nếu đã là object, không cần parse
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          req.body.ThongSoKyThuat = value;
          return true;
        }

        // Nếu là chuỗi, thử parse thành object
        const parsed = JSON.parse(value);
        if (
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          parsed === null
        ) {
          throw new Error("Thông số kỹ thuật phải là đối tượng JSON hợp lệ");
        }
        req.body.ThongSoKyThuat = parsed;
        return true;
      } catch (e) {
        throw new Error(
          "Thông số kỹ thuật phải là chuỗi JSON hoặc đối tượng hợp lệ"
        );
      }
    }),

  body("Gia")
    .notEmpty()
    .withMessage("Giá không được để trống")
    .isFloat({ min: 0 })
    .withMessage("Giá phải là số dương"),

  body("GiaKhuyenMai")
    .optional()
    .isNumeric()
    .withMessage("Giá khuyến mãi phải là số"),

  body("id_DanhMuc")
    .notEmpty()
    .withMessage("Danh mục không được để trống")
    .isInt()
    .withMessage("Mã danh mục không hợp lệ"),

  body("id_ThuongHieu")
    .notEmpty()
    .withMessage("Thương hiệu không được để trống")
    .isInt()
    .withMessage("Mã thương hiệu không hợp lệ"),

  body("id_NhaCungCap")
    .notEmpty()
    .withMessage("Nhà cung cấp không được để trống")
    .isInt()
    .withMessage("Mã nhà cung cấp không hợp lệ"),

  body("bienThe")
    .notEmpty()
    .withMessage("Phải có ít nhất một biến thể sản phẩm")
    .custom((value, { req }) => {
      try {
        // Nếu đã là mảng, kiểm tra độ dài
        if (Array.isArray(value)) {
          if (value.length < 1) {
            throw new Error("Phải có ít nhất một biến thể sản phẩm");
          }
          return true;
        }

        // Nếu là chuỗi, thử parse thành mảng
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.length < 1) {
          throw new Error("Phải có ít nhất một biến thể sản phẩm");
        }
        req.body.bienThe = parsed; // Cập nhật lại giá trị đã parse
        return true;
      } catch (e) {
        throw new Error(
          "Biến thể sản phẩm phải là mảng JSON hợp lệ và có ít nhất một phần tử"
        );
      }
    }),

  body("bienThe.*.id_KichCo").custom((value, { req }) => {
    // Nếu bienThe là chuỗi, cần kiểm tra sau khi đã parse
    const bienThe = req.body.bienThe;

    if (!bienThe) return true; // Sẽ được xử lý bởi validator bienThe

    if (Array.isArray(bienThe)) {
      for (const variant of bienThe) {
        if (!variant.id_KichCo) {
          throw new Error("Kích cỡ không được để trống");
        }
        if (isNaN(parseInt(variant.id_KichCo))) {
          throw new Error("Mã kích cỡ không hợp lệ");
        }
      }
    }
    return true;
  }),

  body("bienThe.*.id_MauSac").custom((value, { req }) => {
    // Nếu bienThe là chuỗi, cần kiểm tra sau khi đã parse
    const bienThe = req.body.bienThe;

    if (!bienThe) return true; // Sẽ được xử lý bởi validator bienThe

    if (Array.isArray(bienThe)) {
      for (const variant of bienThe) {
        if (!variant.id_MauSac) {
          throw new Error("Màu sắc không được để trống");
        }
        if (isNaN(parseInt(variant.id_MauSac))) {
          throw new Error("Mã màu sắc không hợp lệ");
        }
      }
    }
    return true;
  }),

  body("bienThe.*.MaSanPham").custom((value, { req }) => {
    // Nếu bienThe là chuỗi, cần kiểm tra sau khi đã parse
    const bienThe = req.body.bienThe;

    if (!bienThe) return true; // Sẽ được xử lý bởi validator bienThe

    if (Array.isArray(bienThe)) {
      for (const variant of bienThe) {
        if (!variant.MaSanPham) {
          throw new Error("Mã sản phẩm không được để trống");
        }
        if (!/^[A-Z0-9\-]+$/.test(variant.MaSanPham)) {
          throw new Error(
            "Mã sản phẩm chỉ được chứa chữ in hoa, số và dấu gạch ngang"
          );
        }
        if (variant.MaSanPham.length < 3 || variant.MaSanPham.length > 20) {
          throw new Error("Mã sản phẩm phải từ 3 đến 20 ký tự");
        }
      }
    }
    return true;
  }),

  body("bienThe.*.GiaBienThe").custom((value, { req }) => {
    // Nếu bienThe là chuỗi, cần kiểm tra sau khi đã parse
    const bienThe = req.body.bienThe;

    if (!bienThe) return true; // Sẽ được xử lý bởi validator bienThe

    if (Array.isArray(bienThe)) {
      for (const variant of bienThe) {
        if (
          variant.GiaBienThe !== undefined &&
          (isNaN(parseFloat(variant.GiaBienThe)) ||
            parseFloat(variant.GiaBienThe) < 0)
        ) {
          throw new Error("Giá biến thể phải là số dương");
        }
      }
    }
    return true;
  }),

  body("bienThe.*.id")
    .optional()
    .isInt()
    .withMessage("ID biến thể không hợp lệ"),

  body("bienThe.*.id_KichCo")
    .optional()
    .isInt()
    .withMessage("Mã kích cỡ không hợp lệ"),

  body("bienThe.*.id_MauSac")
    .optional()
    .isInt()
    .withMessage("Mã màu sắc không hợp lệ"),

  body("bienThe.*.MaSanPham")
    .optional()
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage("Mã sản phẩm chỉ được chứa chữ in hoa, số và dấu gạch ngang")
    .isLength({ min: 3, max: 20 })
    .withMessage("Mã sản phẩm phải từ 3 đến 20 ký tự"),

  body("bienThe.*.GiaBienThe")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá biến thể phải là số dương"),

  body("bienThe.*.TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái biến thể không hợp lệ"),

  body("TrangThai")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái sản phẩm không hợp lệ"),
];

// Validator cho xóa sản phẩm
const deleteProductValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),
];

// Validator cho danh sách sản phẩm (admin)
const getAllProductsAdminValidator = [
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
    .trim()
    .isLength({ max: 255 })
    .withMessage("Từ khóa tìm kiếm quá dài"),

  query("status")
    .optional()
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),
];

// Validator cho cập nhật trạng thái sản phẩm
const updateProductStatusValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),

  body("status")
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn([0, 1])
    .withMessage("Trạng thái không hợp lệ"),
];

// Validator cho kiểm tra tồn kho
const checkStockValidator = [
  param("productId")
    .notEmpty()
    .withMessage("ID sản phẩm không được để trống")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),

  body("soLuong")
    .notEmpty()
    .withMessage("Số lượng không được để trống")
    .isInt({ min: 1 })
    .withMessage("Số lượng phải lớn hơn 0"),
];

// Validator cho việc tạo sản phẩm (admin)
const createProductAdminValidator = [
  body("Ten").notEmpty().withMessage("Tên sản phẩm không được để trống"),

  body("MoTa").notEmpty().withMessage("Mô tả sản phẩm không được để trống"),

  body("Gia")
    .notEmpty()
    .withMessage("Giá sản phẩm không được để trống")
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số"),

  body("id_DanhMuc")
    .notEmpty()
    .withMessage("Danh mục không được để trống")
    .isNumeric()
    .withMessage("ID danh mục không hợp lệ"),

  body("id_ThuongHieu")
    .notEmpty()
    .withMessage("Thương hiệu không được để trống")
    .isNumeric()
    .withMessage("ID thương hiệu không hợp lệ"),

  body("bienThe").isArray().withMessage("Biến thể sản phẩm phải là mảng"),

  body("bienThe.*.id_KichCo")
    .notEmpty()
    .withMessage("Kích cỡ không được để trống")
    .isNumeric()
    .withMessage("ID kích cỡ không hợp lệ"),

  body("bienThe.*.id_MauSac")
    .notEmpty()
    .withMessage("Màu sắc không được để trống")
    .isNumeric()
    .withMessage("Mã màu sắc không hợp lệ"),

  body("bienThe.*.MaSanPham")
    .notEmpty()
    .withMessage("Mã sản phẩm không được để trống")
    .isLength({ min: 3, max: 20 })
    .withMessage("Mã sản phẩm phải từ 3 đến 20 ký tự")
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage("Mã sản phẩm chỉ được chứa chữ in hoa, số và dấu gạch ngang"),

  body("bienThe.*.SoLuong")
    .notEmpty()
    .withMessage("Số lượng không được để trống")
    .isNumeric()
    .withMessage("Số lượng phải là số"),
];

// Validator cho việc cập nhật sản phẩm (admin)
const updateProductAdminValidator = [
  param("id").isNumeric().withMessage("ID sản phẩm không hợp lệ"),

  body("Ten")
    .optional()
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống"),

  body("MoTa")
    .optional()
    .notEmpty()
    .withMessage("Mô tả sản phẩm không được để trống"),

  body("Gia").optional().isNumeric().withMessage("Giá sản phẩm phải là số"),

  body("id_DanhMuc")
    .optional()
    .isNumeric()
    .withMessage("ID danh mục không hợp lệ"),

  body("id_ThuongHieu")
    .optional()
    .isNumeric()
    .withMessage("ID thương hiệu không hợp lệ"),

  body("bienThe")
    .optional()
    .isArray()
    .withMessage("Biến thể sản phẩm phải là mảng"),

  body("bienThe.*.id_KichCo")
    .optional()
    .isNumeric()
    .withMessage("ID kích cỡ không hợp lệ"),

  body("bienThe.*.id_MauSac")
    .optional()
    .isNumeric()
    .withMessage("Mã màu sắc không hợp lệ"),

  body("bienThe.*.MaSanPham")
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage("Mã sản phẩm phải từ 3 đến 20 ký tự")
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage("Mã sản phẩm chỉ được chứa chữ in hoa, số và dấu gạch ngang"),

  body("bienThe.*.SoLuong")
    .optional()
    .isNumeric()
    .withMessage("Số lượng phải là số"),
];

module.exports = {
  getAllProductsValidator,
  searchProductsValidator,
  getProductDetailValidator,
  reviewProductValidator,
  createProductValidator,
  deleteProductValidator,
  getAllProductsAdminValidator,
  updateProductStatusValidator,
  checkStockValidator,
  createProductAdminValidator,
  updateProductAdminValidator,
};
