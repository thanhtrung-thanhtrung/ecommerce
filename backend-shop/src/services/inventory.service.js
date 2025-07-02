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

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const tongTien = chiTietPhieuNhap.reduce(
        (sum, item) => sum + item.SoLuong * item.GiaNhap,
        0
      );

      // Tạo phiếu nhập
      const [result] = await connection.execute(
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
        let {
          id_ChiTietSanPham,
          SoLuong,
          GiaNhap,
          id_SanPham,
          id_KichCo,
          id_MauSac,
          MaSanPham,
          bienThe,
        } = item;
        const thanhTien = SoLuong * GiaNhap;

        // Nếu chưa có id_ChiTietSanPham thì tạo mới biến thể sản phẩm
        if (
          !id_ChiTietSanPham &&
          id_SanPham &&
          id_KichCo &&
          id_MauSac &&
          MaSanPham
        ) {
          const [resultVariant] = await connection.execute(
            `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham, TonKho)
             VALUES (?, ?, ?, ?, 0)`,
            [id_SanPham, id_KichCo, id_MauSac, MaSanPham]
          );
          id_ChiTietSanPham = resultVariant.insertId;
        }

        // Thêm các biến thể sản phẩm
        if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
          for (const variant of bienThe) {
            const {
              id_KichCo: variantSize,
              id_MauSac: variantColor,
              MaSanPham: variantCode,
              SoLuong: variantQty,
            } = variant;

            // Thêm biến thể sản phẩm với tồn kho ban đầu = 0
            await connection.execute(
              `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham, TonKho) 
               VALUES (?, ?, ?, ?, 0)`,
              [id_SanPham, variantSize, variantColor, variantCode]
            );
          }
        }

        // Thêm chi tiết phiếu nhập
        await connection.execute(
          `INSERT INTO chitietphieunhap (
            id_PhieuNhap, id_ChiTietSanPham, 
            SoLuong, GiaNhap, ThanhTien
          ) VALUES (?, ?, ?, ?, ?)`,
          [phieuNhapId, id_ChiTietSanPham, SoLuong, GiaNhap, thanhTien]
        );
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: "Tạo phiếu nhập thành công",
        data: { id: phieuNhapId, MaPhieuNhap: maPhieuNhap },
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error creating phieu nhap:", error);
      throw new Error("Không thể tạo phiếu nhập: " + error.message);
    }
  }

  // Tạo phiếu nhập thông minh với tự động tạo/cập nhật biến thể
  async createSmartPhieuNhap(phieuNhapData, userId) {
    const { id_NhaCungCap, chiTietPhieuNhap, GhiChu } = phieuNhapData;
    const maPhieuNhap = await this.generateMaPhieuNhap();

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const tongTien = chiTietPhieuNhap.reduce(
        (sum, item) => sum + item.SoLuong * item.GiaNhap,
        0
      );

      // Tạo phiếu nhập
      const [result] = await connection.execute(
        `INSERT INTO phieunhap (
          MaPhieuNhap, NgayNhap, TongTien, id_NhaCungCap, 
          id_NguoiTao, TrangThai, GhiChu
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
        [maPhieuNhap, tongTien, id_NhaCungCap, userId, 1, GhiChu]
      );

      const phieuNhapId = result.insertId;

      // Xử lý từng item trong chi tiết phiếu nhập
      for (const item of chiTietPhieuNhap) {
        const { id_SanPham, variants, GiaNhap } = item;

        // Xử lý từng biến thể
        for (const variant of variants) {
          const { id_KichCo, id_MauSac, SoLuong, MaSanPham } = variant;
          let id_ChiTietSanPham = null;

          // Kiểm tra xem biến thể đã tồn tại chưa
          const [existingVariant] = await connection.execute(
            `SELECT id FROM chitietsanpham 
             WHERE id_SanPham = ? AND id_KichCo = ? AND id_MauSac = ?`,
            [id_SanPham, id_KichCo, id_MauSac]
          );

          if (existingVariant.length > 0) {
            // Biến thể đã tồn tại
            id_ChiTietSanPham = existingVariant[0].id;
          } else {
            // Tạo biến thể mới
            const [newVariant] = await connection.execute(
              `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham, TonKho)
               VALUES (?, ?, ?, ?, 0)`,
              [id_SanPham, id_KichCo, id_MauSac, MaSanPham]
            );
            id_ChiTietSanPham = newVariant.insertId;
          }

          // Thêm chi tiết phiếu nhập
          const thanhTien = SoLuong * GiaNhap;
          await connection.execute(
            `INSERT INTO chitietphieunhap (
              id_PhieuNhap, id_ChiTietSanPham, 
              SoLuong, GiaNhap, ThanhTien
            ) VALUES (?, ?, ?, ?, ?)`,
            [phieuNhapId, id_ChiTietSanPham, SoLuong, GiaNhap, thanhTien]
          );
        }
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: "Tạo phiếu nhập thông minh thành công",
        data: { id: phieuNhapId, MaPhieuNhap: maPhieuNhap },
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error creating smart phieu nhap:", error);
      throw new Error("Không thể tạo phiếu nhập thông minh: " + error.message);
    }
  }

  // Tạo mã sản phẩm tự động cho biến thể
  async generateVariantCode(productId, colorId, sizeId) {
    try {
      // Lấy thông tin sản phẩm, màu sắc và kích cỡ
      const [productInfo] = await db.execute(
        `SELECT sp.Ten, th.Ten as ThuongHieu, ms.Ten as MauSac, kc.Ten as KichCo
         FROM sanpham sp
         JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
         CROSS JOIN mausac ms
         CROSS JOIN kichco kc
         WHERE sp.id = ? AND ms.id = ? AND kc.id = ?`,
        [productId, colorId, sizeId]
      );

      if (productInfo.length === 0) {
        throw new Error("Không thể tạo mã sản phẩm");
      }

      const { ThuongHieu, MauSac, KichCo } = productInfo[0];

      // Tạo mã theo format: THUONGHIEU-MAUSAC-KICHCO-TIMESTAMP
      const timestamp = Date.now().toString().slice(-4);
      const code = `${ThuongHieu.replace(
        /\s+/g,
        ""
      ).toUpperCase()}-${MauSac.replace(
        /\s+/g,
        ""
      ).toUpperCase()}-${KichCo}-${timestamp}`;

      return code;
    } catch (error) {
      // Fallback: tạo mã đơn giản
      return `SP${productId}-C${colorId}-S${sizeId}-${Date.now()
        .toString()
        .slice(-4)}`;
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

  // Lấy báo cáo tồn kho chi tiết sử dụng view
  async getTonKhoReport(query = {}) {
    try {
      let whereClause = "WHERE 1=1";
      let queryParams = [];

      // Lọc theo sản phẩm
      if (query.sanPham) {
        whereClause += " AND TenSanPham LIKE ?";
        queryParams.push(`%${query.sanPham}%`);
      }

      // Lọc theo tồn kho thấp
      if (query.tonKhoThap) {
        whereClause += " AND TonKho <= ?";
        queryParams.push(parseInt(query.tonKhoThap) || 10);
      }

      const sqlQuery = `
        SELECT 
          id_ChiTietSanPham,
          TenSanPham,
          KichCo,
          MauSac,
          MaSanPham,
          SoLuongNhap,
          SoLuongBan,
          TonKho,
          (SoLuongNhap - SoLuongBan) as TonKhoTinhToan
        FROM v_tonkho_sanpham
        ${whereClause}
        ORDER BY TonKho ASC, TenSanPham
      `;

      const [results] = await db.execute(sqlQuery, queryParams);

      // Thống kê tổng quan
      const tongSanPham = results.length;
      const sapHetHang = results.filter(
        (item) => item.TonKho <= 10 && item.TonKho > 0
      ).length;
      const hetHang = results.filter((item) => item.TonKho === 0).length;
      const tonKhoTong = results.reduce((sum, item) => sum + item.TonKho, 0);

      return {
        success: true,
        data: results,
        thongKe: {
          tongSanPham,
          sapHetHang,
          hetHang,
          tonKhoTong,
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy báo cáo tồn kho: " + error.message);
    }
  }

  // Đồng bộ tồn kho (sử dụng khi cần thiết)
  async syncTonKho() {
    try {
      // Gọi stored procedure để đồng bộ tồn kho
      const [result] = await db.execute("CALL sp_DongBoTonKho()");

      return {
        success: true,
        message: "Đồng bộ tồn kho thành công",
        data: result,
      };
    } catch (error) {
      throw new Error("Không thể đồng bộ tồn kho: " + error.message);
    }
  }

  // Tìm kiếm sản phẩm cho phiếu nhập (có filter và pagination)
  async searchProductsForImport(query = {}) {
    try {
      let whereClause = "WHERE sp.TrangThai = 1";
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

      // Tìm kiếm theo tên sản phẩm
      if (query.keyword) {
        whereClause += " AND sp.Ten LIKE ?";
        queryParams.push(`%${query.keyword}%`);
      }

      // Lọc theo nhà cung cấp
      if (query.nhaCungCap) {
        whereClause += " AND sp.id_NhaCungCap = ?";
        queryParams.push(query.nhaCungCap);
      }

      // Pagination
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const offset = (page - 1) * limit;

      const sqlQuery = `
        SELECT 
          sp.id,
          sp.Ten as TenSanPham,
          sp.Gia,
          sp.HinhAnh,
          th.Ten as TenThuongHieu,
          dm.Ten as TenDanhMuc,
          ncc.Ten as TenNhaCungCap,
          COUNT(cts.id) as SoBienTheHienTai
        FROM sanpham sp
        JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
        JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
        JOIN nhacungcap ncc ON sp.id_NhaCungCap = ncc.id
        LEFT JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
        ${whereClause}
        GROUP BY sp.id, sp.Ten, sp.Gia, sp.HinhAnh, th.Ten, dm.Ten, ncc.Ten
        ORDER BY sp.Ten ASC
        LIMIT ? OFFSET ?
      `;

      const [products] = await db.execute(sqlQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      // Đếm tổng số sản phẩm
      const [countResult] = await db.execute(
        `SELECT COUNT(DISTINCT sp.id) as total FROM sanpham sp 
         JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
         JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
         JOIN nhacungcap ncc ON sp.id_NhaCungCap = ncc.id
         ${whereClause}`,
        queryParams
      );

      return {
        success: true,
        data: products.map((product) => ({
          ...product,
          HinhAnh: this.parseProductImage(product.HinhAnh),
        })),
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      };
    } catch (error) {
      throw new Error("Không thể tìm kiếm sản phẩm: " + error.message);
    }
  }

  // Lấy thông tin chi tiết sản phẩm và các biến thể hiện có
  async getProductVariantsForImport(productId) {
    try {
      // Lấy thông tin sản phẩm
      const [product] = await db.execute(
        `SELECT sp.*, th.Ten as TenThuongHieu, dm.Ten as TenDanhMuc, ncc.Ten as TenNhaCungCap
         FROM sanpham sp
         JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
         JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
         JOIN nhacungcap ncc ON sp.id_NhaCungCap = ncc.id
         WHERE sp.id = ? AND sp.TrangThai = 1`,
        [productId]
      );

      if (product.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Lấy các biến thể hiện có
      const [existingVariants] = await db.execute(
        `SELECT 
          cts.id,
          cts.MaSanPham,
          cts.TonKho,
          kc.id as id_KichCo,
          kc.Ten as TenKichCo,
          ms.id as id_MauSac,
          ms.Ten as TenMauSac,
          ms.MaMau
         FROM chitietsanpham cts
         JOIN kichco kc ON cts.id_KichCo = kc.id
         JOIN mausac ms ON cts.id_MauSac = ms.id
         WHERE cts.id_SanPham = ?
         ORDER BY kc.Ten, ms.Ten`,
        [productId]
      );

      // Lấy tất cả kích cỡ và màu sắc có sẵn
      const [allSizes] = await db.execute("SELECT * FROM kichco ORDER BY Ten");
      const [allColors] = await db.execute("SELECT * FROM mausac ORDER BY Ten");

      return {
        success: true,
        data: {
          product: {
            ...product[0],
            HinhAnh: this.parseProductImage(product[0].HinhAnh),
          },
          existingVariants,
          allSizes,
          allColors,
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy thông tin sản phẩm: " + error.message);
    }
  }

  // Utility function để parse hình ảnh
  parseProductImage(hinhAnh) {
    try {
      if (hinhAnh) {
        const imageData = JSON.parse(hinhAnh);
        return imageData.anhChinh || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new InventoryService();
