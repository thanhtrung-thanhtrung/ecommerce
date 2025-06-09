const { body } = require("express-validator");

const createPaymentValidator = [
  body("id").notEmpty().isInt().withMessage("Mã đơn hàng không hợp lệ"),
  body("id_ThanhToan")
    .notEmpty()
    .isInt()
    .withMessage("Hình thức thanh toán không hợp lệ"),
];

module.exports = {
  createPaymentValidator,
};
