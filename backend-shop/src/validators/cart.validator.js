const { body } = require("express-validator");

const addToCartValidator = [
  body("id_ChiTietSanPham")
    .isInt()
    .withMessage("Chi tiết sản phẩm không hợp lệ"),
  body("SoLuong").isInt({ min: 1 }).withMessage("Số lượng phải lớn hơn 0"),
];

const updateCartValidator = [
  body("SoLuong").isInt({ min: 1 }).withMessage("Số lượng phải lớn hơn 0"),
];

module.exports = {
  addToCartValidator,
  updateCartValidator,
};
