const { Review, User, Order, Product, sequelize } = require("../models");
const { Op } = require("sequelize");

class ReviewService {
  // Thêm đánh giá mới
  async themDanhGia(danhGiaData) {
    // Kiểm tra trạng thái đơn hàng
    const order = await Order.findOne({
      where: {
        id: danhGiaData.id_DonHang,
        id_NguoiMua: danhGiaData.id_NguoiDung,
        TrangThai: 4,
      },
    });

    if (!order) {
      throw new Error("Đơn hàng không hợp lệ hoặc chưa hoàn tất");
    }

    // Thêm đánh giá
    const result = await Review.create({
      id_SanPham: danhGiaData.id_SanPham,
      id_NguoiDung: danhGiaData.id_NguoiDung,
      id_DonHang: danhGiaData.id_DonHang,
      NoiDung: danhGiaData.NoiDung,
      SoSao: danhGiaData.SoSao,
      TrangThai: danhGiaData.TrangThai || 1,
    });

    return {
      id: result.id,
      ...danhGiaData,
    };
  }

  // Lấy chi tiết đánh giá
  async layChiTietDanhGia(id) {
    const review = await Review.findByPk(id);

    if (!review) {
      throw new Error("Không tìm thấy đánh giá");
    }

    return review.toJSON();
  }

  async layDanhSachDanhGia(id_SanPham) {
    const reviews = await Review.findAll({
      where: {
        id_SanPham,
        TrangThai: 1,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["HoTen"],
        },
      ],
      order: [["NgayDanhGia", "DESC"]],
    });

    if (reviews.length === 0) {
      throw new Error("Không tìm thấy đánh giá cho sản phẩm này");
    }

    return reviews.map((review) => ({
      id: review.id,
      id_SanPham: review.id_SanPham,
      id_NguoiDung: review.id_NguoiDung,
      NoiDung: review.NoiDung,
      SoSao: review.SoSao,
      TrangThai: review.TrangThai,
      NgayDanhGia: review.NgayDanhGia,
      HoTen: review.user ? review.user.HoTen : null,
    }));
  }
}

module.exports = new ReviewService();
