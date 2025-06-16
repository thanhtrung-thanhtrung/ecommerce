const db = require("../config/db");

class CategoryService {
  // Tạo danh mục mới
  async taoDanhMuc(categoryData) {
    // Kiểm tra tên danh mục đã tồn tại chưa
    const [existingName] = await db.execute(
      "SELECT id FROM danhmuc WHERE Ten = ?",
      [categoryData.Ten]
    );

    if (existingName.length > 0) {
      throw new Error("Tên danh mục đã tồn tại");
    }

    const [result] = await db.execute(
      `INSERT INTO danhmuc (Ten, MoTa, TrangThai) 
       VALUES (?, ?, ?)`,
      [categoryData.Ten, categoryData.MoTa || null, categoryData.TrangThai ?? 1]
    );

    return {
      id: result.insertId,
      ...categoryData,
      TrangThai: categoryData.TrangThai ?? 1,
    };
  }

  // Cập nhật danh mục
  async capNhatDanhMuc(id, categoryData) {
    // Kiểm tra tên danh mục đã tồn tại chưa (trừ danh mục hiện tại)
    const [existingName] = await db.execute(
      "SELECT id FROM danhmuc WHERE Ten = ? AND id != ?",
      [categoryData.Ten, id]
    );

    if (existingName.length > 0) {
      throw new Error("Tên danh mục đã tồn tại");
    }

    const [result] = await db.execute(
      `UPDATE danhmuc SET 
        Ten = ?, MoTa = ?, TrangThai = ?
      WHERE id = ?`,
      [
        categoryData.Ten,
        categoryData.MoTa || null,
        categoryData.TrangThai ?? 1,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return this.layChiTietDanhMuc(id);
  }

  // Xóa danh mục
  async xoaDanhMuc(id) {
    // Kiểm tra xem danh mục có sản phẩm không
    const [products] = await db.execute(
      "SELECT COUNT(*) as count FROM sanpham WHERE id_DanhMuc = ?",
      [id]
    );

    if (products[0].count > 0) {
      throw new Error("Không thể xóa danh mục đang có sản phẩm");
    }

    const [result] = await db.execute("DELETE FROM danhmuc WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return { message: "Xóa danh mục thành công" };
  }

  // Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [result] = await db.execute(
      "UPDATE danhmuc SET TrangThai = ? WHERE id = ?",
      [trangThai, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return { id, TrangThai: trangThai };
  }

  // Lấy chi tiết danh mục
  async layChiTietDanhMuc(id) {
    const [categories] = await db.execute(
      `SELECT dm.*, 
        COUNT(DISTINCT sp.id) as soSanPham,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 1 THEN sp.id END) as soSanPhamHoatDong,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 0 THEN sp.id END) as soSanPhamKhongHoatDong
      FROM danhmuc dm
      LEFT JOIN sanpham sp ON dm.id = sp.id_DanhMuc
      WHERE dm.id = ?
      GROUP BY dm.id`,
      [id]
    );

    if (categories.length === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    // Lấy danh sách sản phẩm mới nhất trong danh mục
    const [latestProducts] = await db.execute(
      `SELECT id, Ten, Gia, HinhAnh, TrangThai
       FROM sanpham
       WHERE id_DanhMuc = ?
       ORDER BY NgayTao DESC
       LIMIT 5`,
      [id]
    );

    return {
      ...categories[0],
      sanPhamMoiNhat: latestProducts,
    };
  }

  // Lấy danh sách danh mục
  async layDanhSachDanhMuc(filters = {}) {
    let query = `
      SELECT dm.*, 
        COUNT(DISTINCT sp.id) as soSanPham,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 1 THEN sp.id END) as soSanPhamHoatDong,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 0 THEN sp.id END) as soSanPhamKhongHoatDong
      FROM danhmuc dm
      LEFT JOIN sanpham sp ON dm.id = sp.id_DanhMuc
      WHERE 1=1
    `;
    const params = [];

    if (filters.trangThai !== undefined) {
      query += " AND dm.TrangThai = ?";
      params.push(filters.trangThai);
    }

    if (filters.tuKhoa) {
      query += " AND (dm.Ten LIKE ? OR dm.MoTa LIKE ?)";
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " GROUP BY dm.id ORDER BY dm.id DESC";

    const [categories] = await db.execute(query, params);
    return categories;
  }

  // Thống kê danh mục
  async thongKeDanhMuc() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as tongSoDanhMuc,
        SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as soDanhMucHoatDong,
        SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as soDanhMucKhongHoatDong
      FROM danhmuc
    `);

    const [topCategories] = await db.execute(`
      SELECT 
        dm.id,
        dm.Ten,
        COUNT(sp.id) as soSanPham,
        COALESCE(SUM(sp.SoLuongDaBan), 0) as tongSoLuongBan,
        COALESCE(SUM(sp.SoLuongDaBan * sp.Gia), 0) as tongDoanhThu
      FROM danhmuc dm
      LEFT JOIN sanpham sp ON dm.id = sp.id_DanhMuc
      WHERE sp.id IS NOT NULL AND YEAR(sp.NgayTao) = YEAR(CURRENT_DATE)
      GROUP BY dm.id
      ORDER BY tongDoanhThu DESC
      LIMIT 5
    `);

    const [categoryDistribution] = await db.execute(`
      SELECT 
        dm.Ten,
        COUNT(sp.id) as soSanPham,
        ROUND(COUNT(sp.id) * 100.0 / (SELECT COUNT(*) FROM sanpham), 2) as phanTram
      FROM danhmuc dm
      LEFT JOIN sanpham sp ON dm.id = sp.id_DanhMuc
      GROUP BY dm.id
      ORDER BY soSanPham DESC
    `);

    return {
      tongQuat: stats[0],
      topDanhMuc: topCategories,
      phanBoDanhMuc: categoryDistribution,
    };
  }
}

module.exports = new CategoryService();
