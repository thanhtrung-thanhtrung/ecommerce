const db = require("../config/database");

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
      "SELECT id FROM nhacungcap WHERE SDT = ?",
      [supplierData.SDT]
    );

    if (existingPhone.length > 0) {
      throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
    }

    const [result] = await db.execute(
      `INSERT INTO nhacungcap (
        Ten, Email, SDT, DiaChi, TrangThai
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        supplierData.Ten,
        supplierData.Email,
        supplierData.SDT,
        supplierData.DiaChi,
        supplierData.TrangThai ?? 1,
      ]
    );

    return {
      success: true,
      message: "Tạo nhà cung cấp thành công",
      data: {
        id: result.insertId,
        ...supplierData,
        TrangThai: supplierData.TrangThai ?? 1,
      },
    };
  }

  // Cập nhật nhà cung cấp
  async capNhatNhaCungCap(id, supplierData) {
    // Kiểm tra nhà cung cấp tồn tại
    const [existing] = await db.execute(
      "SELECT id FROM nhacungcap WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    // Kiểm tra email đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    if (supplierData.Email) {
      const [existingEmail] = await db.execute(
        "SELECT id FROM nhacungcap WHERE Email = ? AND id != ?",
        [supplierData.Email, id]
      );

      if (existingEmail.length > 0) {
        throw new Error("Email đã được sử dụng bởi nhà cung cấp khác");
      }
    }

    // Kiểm tra số điện thoại đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    if (supplierData.SDT) {
      const [existingPhone] = await db.execute(
        "SELECT id FROM nhacungcap WHERE SDT = ? AND id != ?",
        [supplierData.SDT, id]
      );

      if (existingPhone.length > 0) {
        throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
      }
    }

    const [result] = await db.execute(
      `UPDATE nhacungcap SET 
        Ten = ?, Email = ?, SDT = ?, 
        DiaChi = ?, TrangThai = ?
      WHERE id = ?`,
      [
        supplierData.Ten,
        supplierData.Email,
        supplierData.SDT,
        supplierData.DiaChi,
        supplierData.TrangThai ?? 1,
        id,
      ]
    );

    const updatedSupplier = await this.layChiTietNhaCungCap(id);

    return {
      success: true,
      message: "Cập nhật nhà cung cấp thành công",
      data: updatedSupplier.data,
    };
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

    // Kiểm tra xem nhà cung cấp có đang được sử dụng trong sản phẩm không
    const [products] = await db.execute(
      "SELECT COUNT(*) as count FROM sanpham WHERE id_NhaCungCap = ?",
      [id]
    );

    if (products[0].count > 0) {
      throw new Error("Không thể xóa nhà cung cấp đang có sản phẩm");
    }

    const [result] = await db.execute("DELETE FROM nhacungcap WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return {
      success: true,
      message: "Xóa nhà cung cấp thành công",
    };
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

    return {
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: { id, TrangThai: trangThai },
    };
  }

  // Lấy chi tiết nhà cung cấp
  async layChiTietNhaCungCap(id) {
    const [suppliers] = await db.execute(
      `SELECT ncc.*, 
        COUNT(DISTINCT pn.id) as soPhieuNhap,
        COALESCE(SUM(CASE WHEN pn.TrangThai = 2 THEN pn.TongTien ELSE 0 END), 0) as tongGiaTriNhap,
        COUNT(DISTINCT sp.id) as soSanPham
      FROM nhacungcap ncc
      LEFT JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      LEFT JOIN sanpham sp ON ncc.id = sp.id_NhaCungCap
      WHERE ncc.id = ?
      GROUP BY ncc.id`,
      [id]
    );

    if (suppliers.length === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return {
      success: true,
      data: suppliers[0],
    };
  }

  // Lấy danh sách nhà cung cấp
  async layDanhSachNhaCungCap(filters = {}) {
    let query = `
      SELECT ncc.*, 
        COUNT(DISTINCT pn.id) as soPhieuNhap,
        COALESCE(SUM(CASE WHEN pn.TrangThai = 2 THEN pn.TongTien ELSE 0 END), 0) as tongGiaTriNhap,
        COUNT(DISTINCT sp.id) as soSanPham
      FROM nhacungcap ncc
      LEFT JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      LEFT JOIN sanpham sp ON ncc.id = sp.id_NhaCungCap
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
        ncc.SDT LIKE ? OR 
        ncc.Email LIKE ?
      )`;
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " GROUP BY ncc.id ORDER BY ncc.id DESC";

    // Phân trang
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(parseInt(filters.offset));
      }
    }

    const [suppliers] = await db.execute(query, params);

    // Đếm tổng số bản ghi
    let countQuery = `
      SELECT COUNT(DISTINCT ncc.id) as total
      FROM nhacungcap ncc
      WHERE 1=1
    `;
    const countParams = [];

    if (filters.trangThai !== undefined) {
      countQuery += " AND ncc.TrangThai = ?";
      countParams.push(filters.trangThai);
    }

    if (filters.tuKhoa) {
      countQuery += ` AND (
        ncc.Ten LIKE ? OR 
        ncc.DiaChi LIKE ? OR 
        ncc.SDT LIKE ? OR 
        ncc.Email LIKE ?
      )`;
      const searchTerm = `%${filters.tuKhoa}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    return {
      success: true,
      data: suppliers,
      pagination: {
        total: countResult[0].total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: filters.limit ? parseInt(filters.limit) : suppliers.length,
        totalPages: filters.limit
          ? Math.ceil(countResult[0].total / parseInt(filters.limit))
          : 1,
      },
    };
  }

  // Thống kê nhà cung cấp
  async thongKeNhaCungCap() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as tongSoNhaCungCap,
        SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as soNhaCungCapHoatDong,
        SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as soNhaCungCapKhongHoatDong
      FROM nhacungcap
    `);

    // Thống kê phiếu nhập trong năm
    const [importStats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT id_NhaCungCap) as soNhaCungCapTrongNam,
        COUNT(*) as soPhieuNhapTrongNam,
        SUM(TongTien) as tongGiaTriNhapTrongNam
      FROM phieunhap 
      WHERE YEAR(NgayNhap) = YEAR(CURRENT_DATE)
        AND TrangThai = 2
    `);

    // Top nhà cung cấp theo giá trị nhập
    const [topSuppliers] = await db.execute(`
      SELECT 
        ncc.id,
        ncc.Ten,
        COUNT(pn.id) as soPhieuNhap,
        SUM(pn.TongTien) as tongGiaTriNhap
      FROM nhacungcap ncc
      INNER JOIN phieunhap pn ON ncc.id = pn.id_NhaCungCap
      WHERE YEAR(pn.NgayNhap) = YEAR(CURRENT_DATE)
        AND pn.TrangThai = 2
      GROUP BY ncc.id, ncc.Ten
      ORDER BY tongGiaTriNhap DESC
      LIMIT 5
    `);

    // Thống kê theo tháng trong năm
    const [monthlyStats] = await db.execute(`
      SELECT 
        MONTH(NgayNhap) as thang,
        COUNT(DISTINCT id_NhaCungCap) as soNhaCungCap,
        COUNT(*) as soPhieuNhap,
        SUM(TongTien) as tongGiaTri
      FROM phieunhap 
      WHERE YEAR(NgayNhap) = YEAR(CURRENT_DATE)
        AND TrangThai = 2
      GROUP BY MONTH(NgayNhap)
      ORDER BY thang
    `);

    return {
      success: true,
      data: {
        tongQuat: {
          ...stats[0],
          ...importStats[0],
        },
        topNhaCungCap: topSuppliers,
        thongKeTheoThang: monthlyStats,
      },
    };
  }

  // Lấy danh sách nhà cung cấp hoạt động (cho dropdown)
  async layDanhSachNhaCungCapHoatDong() {
    const [suppliers] = await db.execute(
      "SELECT id, Ten FROM nhacungcap WHERE TrangThai = 1 ORDER BY Ten ASC"
    );

    return {
      success: true,
      data: suppliers,
    };
  }
}

module.exports = new SupplierService();
