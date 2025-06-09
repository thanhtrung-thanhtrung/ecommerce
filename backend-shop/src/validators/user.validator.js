const { body } = require("express-validator");

const updateProfileValidator = [
  body("hoTen")
    .optional()
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .trim(),
  body("soDienThoai")
    .optional()
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("diaChi")
    .optional()
    .notEmpty()
    .withMessage("Địa chỉ không được để trống")
    .trim(),
];

const changePasswordValidator = [
  body("matKhauCu").notEmpty().withMessage("Mật khẩu cũ không được để trống"),
  body("matKhauMoi")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
  body("xacNhanMatKhau").custom((value, { req }) => {
    if (value !== req.body.matKhauMoi) {
      throw new Error("Mật khẩu xác nhận không khớp");
    }
    return true;
  }),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
};
