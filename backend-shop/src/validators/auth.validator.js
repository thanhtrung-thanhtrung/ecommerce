const { body } = require("express-validator");

const registerValidator = [
  body("Email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("MatKhau")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("HoTen").notEmpty().withMessage("Họ tên không được để trống").trim(),
  body("SDT")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("DiaChi").notEmpty().withMessage("Địa chỉ không được để trống").trim(),
];

const loginValidator = [
  body("Email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("MatKhau").notEmpty().withMessage("Mật khẩu không được để trống"),
];

const forgotPasswordValidator = [
  body("Email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
];

const resetPasswordValidator = [
  body("MatKhau")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("XacNhanMatKhau").custom((value, { req }) => {
    if (value !== req.body.MatKhau) {
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
