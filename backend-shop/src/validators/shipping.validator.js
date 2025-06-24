const { body, param, query } = require("express-validator");

class ShippingValidator {
  // Validator cho tạo mới shipping method
  createShippingMethod() {
    return [
      body("Ten")
        .notEmpty()
        .withMessage("Tên phương thức vận chuyển không được để trống")
        .isLength({ min: 3, max: 100 })
        .withMessage("Tên phương thức vận chuyển phải từ 3-100 ký tự")
        .trim(),

      body("MoTa")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Mô tả không được quá 500 ký tự")
        .trim(),

      body("PhiVanChuyen")
        .notEmpty()
        .withMessage("Phí vận chuyển không được để trống")
        .isFloat({ min: 0 })
        .withMessage("Phí vận chuyển phải là số không âm")
        .custom((value) => {
          if (value > 999999999.99) {
            throw new Error("Phí vận chuyển không được quá 999,999,999.99");
          }
          return true;
        }),

      body("ThoiGianDuKien")
        .optional()
        .isLength({ max: 50 })
        .withMessage("Thời gian dự kiến không được quá 50 ký tự")
        .trim(),

      body("TrangThai")
        .optional()
        .isInt({ min: 0, max: 1 })
        .withMessage("Trạng thái phải là 0 hoặc 1"),
    ];
  }

  // Validator cho cập nhật shipping method
  updateShippingMethod() {
    return [
      param("id")
        .notEmpty()
        .withMessage("ID không được để trống")
        .isInt({ min: 1 })
        .withMessage("ID phải là số nguyên dương"),

      body("Ten")
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage("Tên phương thức vận chuyển phải từ 3-100 ký tự")
        .trim(),

      body("MoTa")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Mô tả không được quá 500 ký tự")
        .trim(),

      body("PhiVanChuyen")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Phí vận chuyển phải là số không âm")
        .custom((value) => {
          if (value > 999999999.99) {
            throw new Error("Phí vận chuyển không được quá 999,999,999.99");
          }
          return true;
        }),

      body("ThoiGianDuKien")
        .optional()
        .isLength({ max: 50 })
        .withMessage("Thời gian dự kiến không được quá 50 ký tự")
        .trim(),

      body("TrangThai")
        .optional()
        .isInt({ min: 0, max: 1 })
        .withMessage("Trạng thái phải là 0 hoặc 1"),
    ];
  }

  // Validator cho lấy shipping method theo ID
  getShippingMethodById() {
    return [
      param("id")
        .notEmpty()
        .withMessage("ID không được để trống")
        .isInt({ min: 1 })
        .withMessage("ID phải là số nguyên dương"),
    ];
  }

  // Validator cho xóa cứng phương thức vận chuyển
  hardDeleteShippingMethod() {
    return [
      param("id")
        .notEmpty()
        .withMessage("ID không được để trống")
        .isInt({ min: 1 })
        .withMessage("ID phải là số nguyên dương"),
    ];
  }

  // Validator cho lấy danh sách với phân trang và tìm kiếm
  getShippingMethods() {
    return [
      query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Trang phải là số nguyên dương"),

      query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Giới hạn phải là số từ 1-100"),

      query("search")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Từ khóa tìm kiếm không được quá 100 ký tự")
        .trim(),

      query("status")
        .optional()
        .isInt({ min: 0, max: 1 })
        .withMessage("Trạng thái phải là 0 hoặc 1"),
    ];
  }

  // Validator cho tính phí vận chuyển
  calculateShippingFee() {
    return [
      body("id_VanChuyen")
        .optional()
        .isInt({ min: 1 })
        .withMessage("ID vận chuyển phải là số nguyên dương"),

      body("tongGiaTriDonHang")
        .notEmpty()
        .withMessage("Tổng giá trị đơn hàng không được để trống")
        .isFloat({ min: 0 })
        .withMessage("Tổng giá trị đơn hàng phải là số không âm"),

      body("diaChi")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Địa chỉ không được quá 255 ký tự")
        .trim(),
    ];
  }

  // Validator cho cập nhật trạng thái shipping method
  updateShippingStatus() {
    return [
      param("id")
        .notEmpty()
        .withMessage("ID không được để trống")
        .isInt({ min: 1 })
        .withMessage("ID phải là số nguyên dương"),

      body("TrangThai")
        .notEmpty()
        .withMessage("Trạng thái không được để trống")
        .isInt({ min: 0, max: 1 })
        .withMessage("Trạng thái phải là 0 hoặc 1"),
    ];
  }
}

module.exports = new ShippingValidator();
