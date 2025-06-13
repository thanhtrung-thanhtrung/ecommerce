const { body, param } = require("express-validator");

// Validator for adding product to wishlist
const addToWishlistValidator = [
  body("id_SanPham")
    .notEmpty()
    .withMessage("Vui lòng chọn sản phẩm")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),
];

// Validator for removing product from wishlist
const removeFromWishlistValidator = [
  param("id_SanPham")
    .notEmpty()
    .withMessage("Vui lòng chọn sản phẩm")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),
];

// Validator for checking product in wishlist
const checkWishlistValidator = [
  param("id_SanPham")
    .notEmpty()
    .withMessage("Vui lòng chọn sản phẩm")
    .isInt()
    .withMessage("ID sản phẩm không hợp lệ"),
];

module.exports = {
  addToWishlistValidator,
  removeFromWishlistValidator,
  checkWishlistValidator,
};
