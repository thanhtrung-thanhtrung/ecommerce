const { body } = require("express-validator");

const createOrderValidator = [
  body("diaChiGiao")
    .notEmpty()
    .withMessage("Địa chỉ giao hàng không được để trống")
    .trim(),
  body("soDienThoai")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("id_ThanhToan").isInt().withMessage("Hình thức thanh toán không hợp lệ"),
  body("id_VanChuyen").isInt().withMessage("Hình thức vận chuyển không hợp lệ"),
  body("MaGiamGia")
    .optional()
    .isString()
    .trim()
    .withMessage("Mã giảm giá không hợp lệ"),
  body("ghiChu").optional().trim(),
];

const cancelOrderValidator = [
  body("lyDo")
    .notEmpty()
    .withMessage("Lý do hủy đơn không được để trống")
    .trim(),
];

module.exports = {
  createOrderValidator,
  cancelOrderValidator,
};
