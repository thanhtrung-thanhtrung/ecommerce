const reviewService = require("../services/review.service");
class reviewController {
  // Thêm đánh giá mới
  async themDanhGia(req, res) {
    try {
      const danhGiaData = req.body;
      const newDanhGia = await reviewService.themDanhGia(danhGiaData);
      return res.status(201).json({
        success: true,
        message: "Thêm đánh giá thành công",
        data: newDanhGia,
      });
    } catch (error) {
      return res
        .status(error.message === "Đánh giá đã tồn tại" ? 400 : 500)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi thêm đánh giá",
        });
    }
  }

  async layDanhSachDanhGia(req, res) {
    try {
      const { id_SanPham } = req.query;
      if (!id_SanPham) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp id_SanPham để lấy danh sách đánh giá",
        });
      }

      const danhSachDanhGia = await reviewService.layDanhSachDanhGia(
        id_SanPham
      );
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách đánh giá thành công",
        data: danhSachDanhGia,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra khi lấy danh sách đánh giá",
      });
    }
  }
}

module.exports = new reviewController();
