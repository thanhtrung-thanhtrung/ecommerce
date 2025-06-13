const db = require("../config/db");

class SupplierService {
  // Tạo nhà cung cấp mới
  async taoNhaCungCap(supplierData) {
    // Kiểm tra email đã tồn tại chưa
    const [existingEmail] = await db.execute(
      "SELECT id FROM nhacungcap WHERE Email = ?",
      [supplierData.Email]
    );

    if (existingEmail.length > 0) {
      throw new Error("Email đã được sử dụng bởi nhà cung cấp khác");
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const [existingPhone] = await db.execute(
      "SELECT id FROM nhacungcap WHERE SoDienThoai = ?",
      [supplierData.SoDienThoai]
    );

    if (existingPhone.length > 0) {
      throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
    }

    const [result] = await db.execute(
      `INSERT INTO nhacungcap (
        Ten, DiaChi, SoDienThoai, Email, MoTa, TrangThai
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        supplierData.Ten,
        supplierData.DiaChi,
        supplierData.SoDienThoai,
        supplierData.Email,
        supplierData.MoTa || null,
        supplierData.TrangThai ?? 1,
      ]
    );

    return {
      id: result.insertId,
      ...supplierData,
      TrangThai: supplierData.TrangThai ?? 1,
    };
  }

  // Cập nhật nhà cung cấp
  async capNhatNhaCungCap(id, supplierData) {
    // Kiểm tra email đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    const [existingEmail] = await db.execute(
      "SELECT id FROM nhacungcap WHERE Email = ? AND id != ?",
      [supplierData.Email, id]
    );

    if (existingEmail.length > 0) {
      throw new Error("Email đã được sử dụng bởi nhà cung cấp khác");
    }

    // Kiểm tra số điện thoại đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    const [existingPhone] = await db.execute(
      "SELECT id FROM nhacungcap WHERE SoDienThoai = ? AND id != ?",
      [supplierData.SoDienThoai, id]
    );

    if (existingPhone.length > 0) {
      throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
    }

    const [result] = await db.execute(
      `UPDATE nhacungcap SET 
        Ten = ?, DiaChi = ?, SoDienThoai = ?, 
        Email = ?, MoTa = ?, TrangThai = ?
      WHERE id = ?`,
      [
        supplierData.Ten,
        supplierData.DiaChi,
        supplierData.SoDienThoai,
        supplierData.Email,
        supplierData.MoTa || null,
        supplierData.TrangThai ?? 1,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return this.layChiTietNhaCungCap(id);
  }

  // Xóa nhà cung cấp
  async xoaNhaCungCap(id) {
    // Kiểm tra xem nhà cung cấp có đang được sử dụng trong phiếu nhập không
    const [imports] = await db.execute(
      "SELECT COUNT(*) as count FROM phieunhap WHERE id_NhaCungCap = ?",
      [id]
    );

    if (imports[0].count > 0) {
      throw new Error("Không thể xóa nhà cung cấp đang có phiếu nhập");
    }

    const [result] = await db.execute("DELETE FROM nhacungcap WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return { message: "Xóa nhà cung cấp thành công" };
  }

  // Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [result] = await db.execute(
      "UPDATE nhacungcap SET TrangThai = ? WHERE id = ?",
      [trangThai, id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return { id, TrangThai: trangThai };
  }

  // Lấy chi tiết nhà cung cấp
  async layChiTietNhaCungCap(id) {
    const [suppliers] = await db.execute(
      `SELECT ncc.*, 
        COUNT(DISTINCT pn.id) as soPhieuNhap,
        SUM(pn.TongTien) as tongGiaTriNhap
      FROM nhacungcap ncc
      LEFT JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      WHERE ncc.id = ?
      GROUP BY ncc.id`,
      [id]
    );

    if (suppliers.length === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return suppliers[0];
  }

  // Lấy danh sách nhà cung cấp
  async layDanhSachNhaCungCap(filters = {}) {
    let query = `
      SELECT ncc.*, 
        COUNT(DISTINCT pn.id) as soPhieuNhap,
        SUM(pn.TongTien) as tongGiaTriNhap
      FROM nhacungcap ncc
      LEFT JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      WHERE 1=1
    `;
    const params = [];

    if (filters.trangThai !== undefined) {
      query += " AND ncc.TrangThai = ?";
      params.push(filters.trangThai);
    }

    if (filters.tuKhoa) {
      query += ` AND (
        ncc.Ten LIKE ? OR 
        ncc.DiaChi LIKE ? OR 
        ncc.SoDienThoai LIKE ? OR 
        ncc.Email LIKE ?
      )`;
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " GROUP BY ncc.id ORDER BY ncc.id DESC";

    const [suppliers] = await db.execute(query, params);
    return suppliers;
  }

  // Thống kê nhà cung cấp
  async thongKeNhaCungCap() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as tongSoNhaCungCap,
        SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as soNhaCungCapHoatDong,
        SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as soNhaCungCapKhongHoatDong,
        (
          SELECT COUNT(DISTINCT id_NhaCungCap) 
          FROM phieunhap 
          WHERE YEAR(NgayNhap) = YEAR(CURRENT_DATE)
        ) as soNhaCungCapTrongNam
      FROM nhacungcap
    `);

    const [topSuppliers] = await db.execute(`
      SELECT 
        ncc.id,
        ncc.Ten,
        COUNT(pn.id) as soPhieuNhap,
        SUM(pn.TongTien) as tongGiaTriNhap
      FROM nhacungcap ncc
      LEFT JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      WHERE YEAR(pn.NgayNhap) = YEAR(CURRENT_DATE)
      GROUP BY ncc.id
      ORDER BY tongGiaTriNhap DESC
      LIMIT 5
    `);

    return {
      tongQuat: stats[0],
      topNhaCungCap: topSuppliers,
    };
  }
}

module.exports = new SupplierService();
