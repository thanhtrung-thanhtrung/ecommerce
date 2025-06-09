const { body } = require("express-validator");

const registerValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("matKhau")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("hoTen").notEmpty().withMessage("Họ tên không được để trống").trim(),
  body("soDienThoai")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("diaChi").notEmpty().withMessage("Địa chỉ không được để trống").trim(),
];

const loginValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("matKhau").notEmpty().withMessage("Mật khẩu không được để trống"),
];

const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
];

const resetPasswordValidator = [
  body("matKhau")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("xacNhanMatKhau").custom((value, { req }) => {
    if (value !== req.body.matKhau) {
      throw new Error("Mật khẩu xác nhận không khớp");
    }
    return true;
  }),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
