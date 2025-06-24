const db = require("../config/database");

class InventoryService {
  // Tạo mã phiếu nhập tự động
  async generateMaPhieuNhap() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Lấy số phiếu nhập trong ngày
    const [result] = await db.execute(
      "SELECT COUNT(*) as count FROM phieunhap WHERE DATE(NgayNhap) = CURDATE()"
    );
    const count = result[0].count + 1;

    // Format: PN-YYMMDD-XXX (XXX là số thứ tự trong ngày)
    return `PN-${year}${month}${day}-${count.toString().padStart(3, "0")}`;
  }

  // Tạo phiếu nhập mới
  async createPhieuNhap(phieuNhapData, userId) {
    const { id_NhaCungCap, chiTietPhieuNhap, GhiChu } = phieuNhapData;
    const maPhieuNhap = await this.generateMaPhieuNhap();

    try {
      // Tính tổng tiền
      const tongTien = chiTietPhieuNhap.reduce(
        (sum, item) => sum + item.SoLuong * item.GiaNhap,
        0
      );

      // Tạo phiếu nhập
      const [result] = await db.execute(
        `INSERT INTO phieunhap (
          MaPhieuNhap, NgayNhap, TongTien, id_NhaCungCap, 
          id_NguoiTao, TrangThai, GhiChu
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
        [
          maPhieuNhap,
          tongTien,
          id_NhaCungCap,
          userId,
          1, // TrangThai = 1 (Chờ xác nhận)
          GhiChu,
        ]
      );

      const phieuNhapId = result.insertId;

      // Thêm chi tiết phiếu nhập
      for (const item of chiTietPhieuNhap) {
        const { id_ChiTietSanPham, SoLuong, GiaNhap } = item;
        const thanhTien = SoLuong * GiaNhap;

        await db.execute(
          `INSERT INTO chitietphieunhap (
            id_PhieuNhap, id_ChiTietSanPham, 
            SoLuong, GiaNhap, ThanhTien
          ) VALUES (?, ?, ?, ?, ?)`,
          [phieuNhapId, id_ChiTietSanPham, SoLuong, GiaNhap, thanhTien]
        );
      }

      return {
        success: true,
        message: "Tạo phiếu nhập thành công",
        data: { id: phieuNhapId, MaPhieuNhap: maPhieuNhap },
      };
    } catch (error) {
      console.error("Error creating phieu nhap:", error);
      throw new Error("Không thể tạo phiếu nhập: " + error.message);
    }
  }

  // Thống kê tồn kho
  async thongKeTonKho(query = {}) {
    try {
      let whereClause = "WHERE 1=1";
      let queryParams = [];

      // Lọc theo danh mục
      if (query.danhMuc) {
        whereClause += " AND sp.id_DanhMuc = ?";
        queryParams.push(query.danhMuc);
      }

      // Lọc theo thương hiệu
      if (query.thuongHieu) {
        whereClause += " AND sp.id_ThuongHieu = ?";
        queryParams.push(query.thuongHieu);
      }

      // Xử lý tham số sapHet một cách chính xác
      const sapHet = query.sapHet === "true" || query.sapHet === true;
      const tatCa = query.tatCa === "true" || query.tatCa === true;

      if (sapHet) {
        // Chỉ lấy sản phẩm sắp hết hàng (≤ 10)
        whereClause += " AND cts.TonKho <= 10 AND cts.TonKho > 0";
      } else if (!tatCa) {
        // Mặc định: chỉ lấy sản phẩm còn hàng (> 0)
        whereClause += " AND cts.TonKho >= 0";
      }
      // Nếu tatCa = true thì không thêm filter nào về tồn kho

      const sqlQuery = `
        SELECT 
          cts.id,
          sp.Ten as TenSanPham,
          th.Ten as TenThuongHieu,
          dm.Ten as TenDanhMuc,
          kc.Ten as KichCo,
          ms.Ten as MauSac,
          cts.MaSanPham,
          cts.TonKho,
          sp.Gia
        FROM chitietsanpham cts
        JOIN sanpham sp ON cts.id_SanPham = sp.id
        JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
        JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
        JOIN kichco kc ON cts.id_KichCo = kc.id
        JOIN mausac ms ON cts.id_MauSac = ms.id
        ${whereClause}
        AND sp.TrangThai = 1
        ORDER BY cts.TonKho ASC, sp.Ten
      `;

      const [results] = await db.execute(sqlQuery, queryParams);
      return {
        success: true,
        data: results,
        filter: {
          sapHet: sapHet,
          tatCa: tatCa,
          count: results.length,
        },
      };
    } catch (error) {
      throw new Error("Không thể thống kê tồn kho: " + error.message);
    }
  }

  // Kiểm tra số lượng tồn kho
  async checkStock(productVariantId, requestedQuantity) {
    try {
      // Sử dụng trực tiếp trường TonKho từ bảng chitietsanpham
      const [result] = await db.execute(
        "SELECT TonKho FROM chitietsanpham WHERE id = ?",
        [productVariantId]
      );

      if (result.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      const tonKho = result[0].TonKho || 0;
      const isAvailable = tonKho >= requestedQuantity;

      return {
        success: true,
        data: {
          tonKho,
          isAvailable,
          thieu: isAvailable ? 0 : requestedQuantity - tonKho,
        },
      };
    } catch (error) {
      throw new Error("Không thể kiểm tra tồn kho: " + error.message);
    }
  }

  // Cập nhật phiếu nhập
  async updatePhieuNhap(phieuNhapId, updateData) {
    try {
      // Kiểm tra phiếu nhập tồn tại
      const [phieuNhap] = await db.execute(
        "SELECT * FROM phieunhap WHERE id = ?",
        [phieuNhapId]
      );

      if (phieuNhap.length === 0) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      // Cập nhật thông tin phiếu nhập
      const { GhiChu, TrangThai } = updateData;
      await db.execute(
        "UPDATE phieunhap SET GhiChu = ?, TrangThai = ? WHERE id = ?",
        [
          GhiChu || phieuNhap[0].GhiChu,
          TrangThai || phieuNhap[0].TrangThai,
          phieuNhapId,
        ]
      );

      // Nếu phiếu nhập được xác nhận (TrangThai = 2), cập nhật tồn kho
      if (TrangThai === 2 && phieuNhap[0].TrangThai !== 2) {
        await this.updateStockAfterImport(phieuNhapId);
      }

      return {
        success: true,
        message: "Cập nhật phiếu nhập thành công",
      };
    } catch (error) {
      throw new Error("Không thể cập nhật phiếu nhập: " + error.message);
    }
  }

  // Cập nhật tồn kho sau khi nhập hàng
  async updateStockAfterImport(phieuNhapId) {
    try {
      // Lấy chi tiết phiếu nhập
      const [chiTietList] = await db.execute(
        "SELECT id_ChiTietSanPham, SoLuong FROM chitietphieunhap WHERE id_PhieuNhap = ?",
        [phieuNhapId]
      );

      // Cập nhật tồn kho cho từng sản phẩm
      for (const item of chiTietList) {
        await db.execute(
          "UPDATE chitietsanpham SET TonKho = TonKho + ? WHERE id = ?",
          [item.SoLuong, item.id_ChiTietSanPham]
        );
      }
    } catch (error) {
      throw new Error("Không thể cập nhật tồn kho: " + error.message);
    }
  }

  // Lấy danh sách phiếu nhập
  async getPhieuNhapList(query = {}) {
    try {
      let whereClause = "WHERE 1=1";
      let queryParams = [];

      // Lọc theo trạng thái
      if (query.trangThai) {
        whereClause += " AND pn.TrangThai = ?";
        queryParams.push(query.trangThai);
      }

      // Lọc theo nhà cung cấp
      if (query.nhaCungCap) {
        whereClause += " AND pn.id_NhaCungCap = ?";
        queryParams.push(query.nhaCungCap);
      }

      // Lọc theo thời gian
      if (query.tuNgay) {
        whereClause += " AND DATE(pn.NgayNhap) >= ?";
        queryParams.push(query.tuNgay);
      }

      if (query.denNgay) {
        whereClause += " AND DATE(pn.NgayNhap) <= ?";
        queryParams.push(query.denNgay);
      }

      const sqlQuery = `
        SELECT 
          pn.id,
          pn.MaPhieuNhap,
          pn.NgayNhap,
          pn.TongTien,
          pn.TrangThai,
          pn.GhiChu,
          ncc.Ten as TenNhaCungCap,
          nd.HoTen as NguoiTao
        FROM phieunhap pn
        JOIN nhacungcap ncc ON pn.id_NhaCungCap = ncc.id
        JOIN nguoidung nd ON pn.id_NguoiTao = nd.id
        ${whereClause}
        ORDER BY pn.NgayNhap DESC
      `;

      const [results] = await db.execute(sqlQuery, queryParams);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new Error("Không thể lấy danh sách phiếu nhập: " + error.message);
    }
  }

  // Lấy chi tiết phiếu nhập
  async getPhieuNhapDetail(phieuNhapId) {
    try {
      // Lấy thông tin phiếu nhập
      const [phieuNhap] = await db.execute(
        `SELECT 
          pn.*,
          ncc.Ten as TenNhaCungCap,
          nd.HoTen as NguoiTao
        FROM phieunhap pn
        JOIN nhacungcap ncc ON pn.id_NhaCungCap = ncc.id
        JOIN nguoidung nd ON pn.id_NguoiTao = nd.id
        WHERE pn.id = ?`,
        [phieuNhapId]
      );

      if (phieuNhap.length === 0) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      // Lấy chi tiết phiếu nhập
      const [chiTiet] = await db.execute(
        `SELECT 
          ctpn.*,
          sp.Ten as TenSanPham,
          kc.Ten as KichCo,
          ms.Ten as MauSac,
          cts.MaSanPham
        FROM chitietphieunhap ctpn
        JOIN chitietsanpham cts ON ctpn.id_ChiTietSanPham = cts.id
        JOIN sanpham sp ON cts.id_SanPham = sp.id
        JOIN kichco kc ON cts.id_KichCo = kc.id
        JOIN mausac ms ON cts.id_MauSac = ms.id
        WHERE ctpn.id_PhieuNhap = ?`,
        [phieuNhapId]
      );

      return {
        success: true,
        data: {
          phieuNhap: phieuNhap[0],
          chiTiet: chiTiet,
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy chi tiết phiếu nhập: " + error.message);
    }
  }

  // Thống kê nhập kho theo thời gian
  async thongKeNhapKhoTheoThoiGian(query = {}) {
    try {
      let whereClause = "WHERE pn.TrangThai = 2";
      let queryParams = [];

      if (query.tuNgay) {
        whereClause += " AND DATE(pn.NgayNhap) >= ?";
        queryParams.push(query.tuNgay);
      }

      if (query.denNgay) {
        whereClause += " AND DATE(pn.NgayNhap) <= ?";
        queryParams.push(query.denNgay);
      }

      const sqlQuery = `
        SELECT 
          DATE(pn.NgayNhap) as NgayNhap,
          COUNT(pn.id) as SoPhieuNhap,
          SUM(pn.TongTien) as TongTien,
          COUNT(DISTINCT pn.id_NhaCungCap) as SoNhaCungCap
        FROM phieunhap pn
        ${whereClause}
        GROUP BY DATE(pn.NgayNhap)
        ORDER BY NgayNhap DESC
      `;

      const [results] = await db.execute(sqlQuery, queryParams);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new Error("Không thể thống kê nhập kho: " + error.message);
    }
  }

  // Lấy lịch sử nhập kho của sản phẩm
  async getProductImportHistory(chiTietSanPhamId, query = {}) {
    try {
      let whereClause = "WHERE ctpn.id_ChiTietSanPham = ? AND pn.TrangThai = 2";
      let queryParams = [chiTietSanPhamId];

      if (query.tuNgay) {
        whereClause += " AND DATE(pn.NgayNhap) >= ?";
        queryParams.push(query.tuNgay);
      }

      if (query.denNgay) {
        whereClause += " AND DATE(pn.NgayNhap) <= ?";
        queryParams.push(query.denNgay);
      }

      const sqlQuery = `
        SELECT 
          ctpn.id,
          pn.MaPhieuNhap,
          pn.NgayNhap,
          ctpn.SoLuong,
          ctpn.GiaNhap,
          ctpn.ThanhTien,
          ncc.Ten as TenNhaCungCap,
          nd.HoTen as NguoiTao
        FROM chitietphieunhap ctpn
        JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
        JOIN nhacungcap ncc ON pn.id_NhaCungCap = ncc.id
        JOIN nguoidung nd ON pn.id_NguoiTao = nd.id
        ${whereClause}
        ORDER BY pn.NgayNhap DESC
      `;

      const [results] = await db.execute(sqlQuery, queryParams);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new Error("Không thể lấy lịch sử nhập kho: " + error.message);
    }
  }
}

module.exports = new InventoryService();
