const { body } = require("express-validator");

const reviewProductValidator = [
  body("noiDung")
    .notEmpty()
    .withMessage("Nội dung đánh giá không được để trống")
    .trim(),
  body("diem")
    .isInt({ min: 1, max: 5 })
    .withMessage("Điểm đánh giá phải từ 1 đến 5"),
];

const searchProductValidator = [
  body("tuKhoa").optional().trim(),
  body("id_DanhMuc").optional().isInt().withMessage("Mã danh mục không hợp lệ"),
  body("id_ThuongHieu")
    .optional()
    .isInt()
    .withMessage("Mã thương hiệu không hợp lệ"),
  body("giaMin")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Giá tối thiểu không hợp lệ"),
  body("giaMax")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Giá tối đa không hợp lệ")
    .custom((value, { req }) => {
      if (req.body.giaMin && value < req.body.giaMin) {
        throw new Error("Giá tối đa phải lớn hơn giá tối thiểu");
      }
      return true;
    }),
];

module.exports = {
  reviewProductValidator,
  searchProductValidator,
};
