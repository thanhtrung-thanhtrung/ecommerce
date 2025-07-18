const db = require("../config/database");

class ReviewService {
  // Thêm đánh giá mới
  async themDanhGia(danhGiaData) {
    // Kiểm tra trạng thái đơn hàng
    const [orders] = await db.execute(
      `SELECT * FROM donhang 
       WHERE id = ? AND id_NguoiMua = ? AND TrangThai = 4`,
      [danhGiaData.id_DonHang, danhGiaData.id_NguoiDung]
    );

    if (orders.length === 0) {
      throw new Error("Đơn hàng không hợp lệ hoặc chưa hoàn tất");
    }

    // Thêm đánh giá
    const [result] = await db.execute(
      `INSERT INTO danhgia (id_SanPham, id_NguoiDung, id_DonHang, NoiDung, SoSao, TrangThai) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        danhGiaData.id_SanPham,
        danhGiaData.id_NguoiDung,
        danhGiaData.id_DonHang,
        danhGiaData.NoiDung,
        danhGiaData.SoSao,
        danhGiaData.TrangThai || 1,
      ]
    );

    return {
      id: result.insertId,
      ...danhGiaData,
    };
  }

  // Lấy chi tiết đánh giá
  async layChiTietDanhGia(id) {
    const [rows] = await db.execute("SELECT * FROM danhgia WHERE id = ?", [id]);

    if (rows.length === 0) {
      throw new Error("Không tìm thấy đánh giá");
    }

    return rows[0];
  }

  async layDanhSachDanhGia(id_SanPham) {
    const [rows] = await db.execute(
      "SELECT dg.* , nd.HoTen FROM danhgia dg  JOIN nguoidung nd ON dg.id_NguoiDung = nd.id  WHERE dg.id_SanPham = ? AND dg.TrangThai = 1  ORDER BY dg.NgayDanhGia DESC",
      [id_SanPham]
    );

    if (rows.length === 0) {
      throw new Error("Không tìm thấy đánh giá cho sản phẩm này");
    }

    return rows.map((row) => ({
      id: row.id,
      id_SanPham: row.id_SanPham,
      id_NguoiDung: row.id_NguoiDung,
      NoiDung: row.NoiDung,
      SoSao: row.SoSao,
      TrangThai: row.TrangThai,
      NgayDanhGia: row.NgayDanhGia,
      HoTen: row.HoTen,
    }));
  }
}

module.exports = new ReviewService();
