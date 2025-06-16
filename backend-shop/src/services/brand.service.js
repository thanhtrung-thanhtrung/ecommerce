const db = require("../config/db");

class BrandService {
  // Tạo thương hiệu mới
  async taoThuongHieu(brandData) {
    // Kiểm tra tên thương hiệu đã tồn tại chưa
    const [existingName] = await db.execute(
      "SELECT id FROM thuonghieu WHERE Ten = ?",
      [brandData.Ten]
    );

    if (existingName.length > 0) {
      throw new Error("Tên thương hiệu đã tồn tại");
    }

    const [result] = await db.execute(
      `INSERT INTO thuonghieu (Ten, MoTa, TrangThai) 
       VALUES (?, ?, ?)`,
      [brandData.Ten, brandData.MoTa || null, brandData.TrangThai ?? 1]
    );

    return {
      id: result.insertId,
      ...brandData,
      TrangThai: brandData.TrangThai ?? 1,
    };
  }

  // Cập nhật thương hiệu
  async capNhatThuongHieu(id, brandData) {
    // Kiểm tra tên thương hiệu đã tồn tại chưa (trừ thương hiệu hiện tại)
    const [existingName] = await db.execute(
      "SELECT id FROM thuonghieu WHERE Ten = ? AND id != ?",
      [brandData.Ten, id]
    );

    if (existingName.length > 0) {
      throw new Error("Tên thương hiệu đã tồn tại");
    }

    const [result] = await db.execute(
      `UPDATE thuonghieu SET 
        Ten = ?, MoTa = ?, TrangThai = ?
      WHERE id = ?`,
      [brandData.Ten, brandData.MoTa || null, brandData.TrangThai ?? 1, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return this.layChiTietThuongHieu(id);
  }

  // Xóa thương hiệu
  async xoaThuongHieu(id) {
    // Kiểm tra xem thương hiệu có sản phẩm không
    const [products] = await db.execute(
      "SELECT COUNT(*) as count FROM sanpham WHERE id_ThuongHieu = ?",
      [id]
    );

    if (products[0].count > 0) {
      throw new Error("Không thể xóa thương hiệu đang có sản phẩm");
    }

    const [result] = await db.execute("DELETE FROM thuonghieu WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return { message: "Xóa thương hiệu thành công" };
  }

  // Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [result] = await db.execute(
      "UPDATE thuonghieu SET TrangThai = ? WHERE id = ?",
      [trangThai, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return { id, TrangThai: trangThai };
  }

  // Lấy chi tiết thương hiệu
  async layChiTietThuongHieu(id) {
    const [brands] = await db.execute(
      `SELECT th.*, 
        COUNT(DISTINCT sp.id) as soSanPham,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 1 THEN sp.id END) as soSanPhamHoatDong,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 0 THEN sp.id END) as soSanPhamKhongHoatDong,
        SUM(sp.SoLuongDaBan) as tongSoLuongBan,
        SUM(sp.SoLuongDaBan * sp.Gia) as tongDoanhThu
      FROM thuonghieu th
      LEFT JOIN sanpham sp ON th.id = sp.id_ThuongHieu
      WHERE th.id = ?
      GROUP BY th.id`,
      [id]
    );

    if (brands.length === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    // Lấy danh sách sản phẩm bán chạy nhất của thương hiệu
    const [topProducts] = await db.execute(
      `SELECT id, Ten, Gia, HinhAnh, TrangThai, SoLuongDaBan
       FROM sanpham
       WHERE id_ThuongHieu = ?
       ORDER BY SoLuongDaBan DESC
       LIMIT 5`,
      [id]
    );

    // Lấy danh sách danh mục có sản phẩm của thương hiệu
    const [categories] = await db.execute(
      `SELECT DISTINCT dm.id, dm.Ten, 
        COUNT(sp.id) as soSanPham
       FROM danhmuc dm
       JOIN sanpham sp ON dm.id = sp.id_DanhMuc
       WHERE sp.id_ThuongHieu = ?
       GROUP BY dm.id`,
      [id]
    );

    return {
      ...brands[0],
      sanPhamBanChay: topProducts,
      danhMuc: categories,
    };
  }

  // Lấy danh sách thương hiệu
  async layDanhSachThuongHieu(filters = {}) {
    let query = `
      SELECT th.*, 
        COUNT(DISTINCT sp.id) as soSanPham,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 1 THEN sp.id END) as soSanPhamHoatDong,
        COUNT(DISTINCT CASE WHEN sp.TrangThai = 0 THEN sp.id END) as soSanPhamKhongHoatDong,
        SUM(sp.SoLuongDaBan) as tongSoLuongBan,
        SUM(sp.SoLuongDaBan * sp.Gia) as tongDoanhThu
      FROM thuonghieu th
      LEFT JOIN sanpham sp ON th.id = sp.id_ThuongHieu
      WHERE 1=1
    `;
    const params = [];

    if (filters.trangThai !== undefined) {
      query += " AND th.TrangThai = ?";
      params.push(filters.trangThai);
    }

    if (filters.tuKhoa) {
      query += " AND (th.Ten LIKE ? OR th.MoTa LIKE ?)";
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " GROUP BY th.id ORDER BY th.id DESC";

    const [brands] = await db.execute(query, params);
    return brands;
  }

  // Thống kê thương hiệu
  async thongKeThuongHieu() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as tongSoThuongHieu,
        SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as soThuongHieuHoatDong,
        SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as soThuongHieuKhongHoatDong
      FROM thuonghieu
    `);

    const [topBrands] = await db.execute(`
      SELECT 
        th.id,
        th.Ten,
        COUNT(sp.id) as soSanPham,
        SUM(sp.SoLuongDaBan) as tongSoLuongBan,
        SUM(sp.SoLuongDaBan * sp.Gia) as tongDoanhThu
      FROM thuonghieu th
      LEFT JOIN sanpham sp ON th.id = sp.id_ThuongHieu
      WHERE YEAR(sp.NgayTao) = YEAR(CURRENT_DATE)
      GROUP BY th.id
      ORDER BY tongDoanhThu DESC
      LIMIT 5
    `);

    const [brandDistribution] = await db.execute(`
      SELECT 
        th.Ten,
        COUNT(sp.id) as soSanPham,
        ROUND(COUNT(sp.id) * 100.0 / (SELECT COUNT(*) FROM sanpham), 2) as phanTram
      FROM thuonghieu th
      LEFT JOIN sanpham sp ON th.id = sp.id_ThuongHieu
      GROUP BY th.id
      ORDER BY soSanPham DESC
    `);

    return {
      tongQuat: stats[0],
      topThuongHieu: topBrands,
      phanBoThuongHieu: brandDistribution,
    };
  }
}

module.exports = new BrandService();
