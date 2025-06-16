const db = require("../config/database");
const ProductService = require("./product.service");
const cloudinaryUtil = require("../utils/cloudinary.util");

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

  // Thêm phương thức mới: Upload hình ảnh phiếu nhập
  async uploadPhieuNhapImage(file) {
    try {
      const result = await cloudinaryUtil.uploadImage(
        file,
        "shoes_shop/phieunhap"
      );
      return {
        url: cloudinaryUtil.getImageUrl(result.public_id, {
          width: 800,
          height: 600,
          crop: "fill",
        }),
        public_id: result.public_id,
      };
    } catch (error) {
      throw new Error("Không thể upload hình ảnh phiếu nhập: " + error.message);
    }
  }

  // Tạo phiếu nhập mới
  async createPhieuNhap(phieuNhapData, userId) {
    const { id_NhaCungCap, chiTietPhieuNhap, GhiChu, hinhAnh } = phieuNhapData;
    const maPhieuNhap = await this.generateMaPhieuNhap();

    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Tính tổng tiền
      const tongTien = chiTietPhieuNhap.reduce(
        (sum, item) => sum + item.SoLuong * item.GiaNhap,
        0
      );

      // Xử lý hình ảnh nếu có
      let imageData = null;
      if (hinhAnh) {
        const uploadedImage = await this.uploadPhieuNhapImage(hinhAnh);
        imageData = JSON.stringify({
          url: uploadedImage.url,
          public_id: uploadedImage.public_id,
        });
      }

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
        const { id_ChiTietSanPham, SoLuong, GiaNhap } = item;
        const thanhTien = SoLuong * GiaNhap;

        await connection.execute(
          `INSERT INTO chitietphieunhap (
            id_PhieuNhap, id_ChiTietSanPham, 
            SoLuong, GiaNhap, ThanhTien
          ) VALUES (?, ?, ?, ?, ?)`,
          [phieuNhapId, id_ChiTietSanPham, SoLuong, GiaNhap, thanhTien]
        );
      }

      // Commit transaction
      await connection.commit();
      return { id: phieuNhapId, MaPhieuNhap: maPhieuNhap };
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error creating phieu nhap:", error);
      throw error;
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  // Xác nhận phiếu nhập và cập nhật tồn kho
  async confirmPhieuNhap(phieuNhapId) {
    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Kiểm tra trạng thái hiện tại
      const [phieuNhap] = await connection.execute(
        "SELECT TrangThai FROM phieunhap WHERE id = ?",
        [phieuNhapId]
      );

      if (phieuNhap.length === 0) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      if (phieuNhap[0].TrangThai !== 1) {
        throw new Error("Phiếu nhập không ở trạng thái chờ xác nhận");
      }

      // Lấy chi tiết phiếu nhập
      const [chiTietPhieuNhap] = await connection.execute(
        "SELECT * FROM chitietphieunhap WHERE id_PhieuNhap = ?",
        [phieuNhapId]
      );

      // Cập nhật tồn kho cho từng sản phẩm
      for (const item of chiTietPhieuNhap) {
        const { id_ChiTietSanPham, SoLuong } = item;

        // Cập nhật tồn kho - database đã có sẵn cột TonKho
        await connection.execute(
          "UPDATE chitietsanpham SET TonKho = TonKho + ? WHERE id = ?",
          [SoLuong, id_ChiTietSanPham]
        );
      }

      // Cập nhật trạng thái phiếu nhập
      await connection.execute(
        "UPDATE phieunhap SET TrangThai = 2 WHERE id = ?",
        [phieuNhapId]
      );

      // Commit transaction
      await connection.commit();
      return true;
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error confirming phieu nhap:", error);
      throw error;
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  // Hủy phiếu nhập
  async cancelPhieuNhap(phieuNhapId, lyDoHuy) {
    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Kiểm tra trạng thái hiện tại
      const [phieuNhap] = await connection.execute(
        "SELECT TrangThai FROM phieunhap WHERE id = ?",
        [phieuNhapId]
      );

      if (phieuNhap.length === 0) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      if (phieuNhap[0].TrangThai !== 1) {
        throw new Error(
          "Chỉ có thể hủy phiếu nhập đang ở trạng thái chờ xác nhận"
        );
      }

      // Cập nhật trạng thái phiếu nhập
      await connection.execute(
        "UPDATE phieunhap SET TrangThai = 3, GhiChu = CONCAT(IFNULL(GhiChu, ''), ' | Lý do hủy: ', ?) WHERE id = ?",
        [lyDoHuy || "Không có lý do", phieuNhapId]
      );

      // Commit transaction
      await connection.commit();
      return true;
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error canceling phieu nhap:", error);
      throw error;
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  // Kiểm tra số lượng tồn kho
  async checkStock(productVariantId, requestedQuantity) {
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
      tonKho,
      isAvailable,
      thieu: isAvailable ? 0 : requestedQuantity - tonKho,
    };
  }

  // Cập nhật số lượng tồn kho (tăng hoặc giảm)
  async updateStock(productVariantId, quantity, increase = true) {
    if (increase) {
      await db.execute(
        "UPDATE chitietsanpham SET TonKho = TonKho + ? WHERE id = ?",
        [quantity, productVariantId]
      );
    } else {
      // Kiểm tra đủ số lượng trước khi giảm
      const stockCheck = await this.checkStock(productVariantId, quantity);
      if (!stockCheck.isAvailable) {
        throw new Error(
          `Số lượng tồn kho không đủ. Hiện có ${stockCheck.tonKho} sản phẩm.`
        );
      }

      await db.execute(
        "UPDATE chitietsanpham SET TonKho = TonKho - ? WHERE id = ?",
        [quantity, productVariantId]
      );
    }

    return true;
  }

  // Cập nhật số lượng tồn kho hàng loạt
  async bulkUpdateStock(items, increase = true) {
    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      for (const item of items) {
        const { id_ChiTietSanPham, SoLuong } = item;

        if (increase) {
          await connection.execute(
            "UPDATE chitietsanpham SET TonKho = TonKho + ? WHERE id = ?",
            [SoLuong, id_ChiTietSanPham]
          );
        } else {
          // Kiểm tra đủ số lượng trước khi giảm
          const [result] = await connection.execute(
            "SELECT TonKho FROM chitietsanpham WHERE id = ?",
            [id_ChiTietSanPham]
          );

          if (result.length === 0) {
            throw new Error("Sản phẩm không tồn tại");
          }

          const tonKho = result[0].TonKho || 0;
          if (tonKho < SoLuong) {
            throw new Error(
              `Sản phẩm ${id_ChiTietSanPham} không đủ tồn kho. Hiện có ${tonKho} sản phẩm.`
            );
          }

          await connection.execute(
            "UPDATE chitietsanpham SET TonKho = TonKho - ? WHERE id = ?",
            [SoLuong, id_ChiTietSanPham]
          );
        }
      }

      // Commit transaction
      await connection.commit();
      return true;
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error bulk updating stock:", error);
      throw error;
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  // Báo cáo tồn kho
  async getInventoryReport(filter = {}) {
    let whereClause = "";
    let queryParams = [];

    // Lọc theo danh mục
    if (filter.categoryId) {
      whereClause += " AND sp.id_DanhMuc = ?";
      queryParams.push(filter.categoryId);
    }

    // Lọc theo thương hiệu
    if (filter.brandId) {
      whereClause += " AND sp.id_ThuongHieu = ?";
      queryParams.push(filter.brandId);
    }

    // Lọc theo trạng thái tồn kho
    if (filter.stockStatus === "low") {
      whereClause += " AND ctsp.TonKho > 0 AND ctsp.TonKho <= 5";
    } else if (filter.stockStatus === "out") {
      whereClause += " AND ctsp.TonKho = 0";
    } else if (filter.stockStatus === "in") {
      whereClause += " AND ctsp.TonKho > 5";
    }

    const query = `
      SELECT 
        ctsp.id,
        sp.id as id_SanPham,
        sp.Ten as TenSanPham,
        th.Ten as TenThuongHieu,
        dm.Ten as TenDanhMuc,
        kc.Ten as KichCo,
        ms.Ten as MauSac,
        ctsp.MaSanPham,
        IFNULL(ctsp.TonKho, 0) as TonKho,
        sp.Gia
      FROM chitietsanpham ctsp
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      JOIN kichco kc ON ctsp.id_KichCo = kc.id
      JOIN mausac ms ON ctsp.id_MauSac = ms.id
      WHERE 1=1 ${whereClause}
      ORDER BY TonKho ASC, sp.Ten
    `;

    const [results] = await db.execute(query, queryParams);
    return results;
  }

  // Thống kê tồn kho theo thương hiệu
  async getInventorySummaryByBrand() {
    const query = `
      SELECT 
        th.id as id_ThuongHieu,
        th.Ten as TenThuongHieu,
        SUM(IFNULL(ctsp.TonKho, 0)) as TongTonKho,
        COUNT(DISTINCT sp.id) as SoSanPham
      FROM chitietsanpham ctsp
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      GROUP BY th.id
      ORDER BY TongTonKho DESC
    `;

    const [results] = await db.execute(query);
    return results;
  }

  // Thống kê tồn kho theo danh mục
  async getInventorySummaryByCategory() {
    const query = `
      SELECT 
        dm.id as id_DanhMuc,
        dm.Ten as TenDanhMuc,
        SUM(IFNULL(ctsp.TonKho, 0)) as TongTonKho,
        COUNT(DISTINCT sp.id) as SoSanPham
      FROM chitietsanpham ctsp
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      GROUP BY dm.id
      ORDER BY TongTonKho DESC
    `;

    const [results] = await db.execute(query);
    return results;
  }

  // Kiểm tra sản phẩm sắp hết hàng
  async getLowStockProducts(threshold = 5) {
    const query = `
      SELECT 
        ctsp.id,
        sp.id as id_SanPham,
        sp.Ten as TenSanPham,
        th.Ten as TenThuongHieu,
        dm.Ten as TenDanhMuc,
        kc.Ten as KichCo,
        ms.Ten as MauSac,
        ctsp.MaSanPham,
        IFNULL(ctsp.TonKho, 0) as TonKho,
        sp.Gia
      FROM chitietsanpham ctsp
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      JOIN kichco kc ON ctsp.id_KichCo = kc.id
      JOIN mausac ms ON ctsp.id_MauSac = ms.id
      WHERE IFNULL(ctsp.TonKho, 0) > 0 AND IFNULL(ctsp.TonKho, 0) <= ?
      ORDER BY TonKho ASC, sp.Ten
    `;

    const [results] = await db.execute(query, [threshold]);
    return results;
  }

  // Lấy lịch sử nhập kho của một sản phẩm
  async getProductStockHistory(productVariantId) {
    const query = `
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
      WHERE ctpn.id_ChiTietSanPham = ? AND pn.TrangThai = 2
      ORDER BY pn.NgayNhap DESC
    `;

    const [results] = await db.execute(query, [productVariantId]);
    return results;
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
        "UPDATE phieunhap SET GhiChu = ?, TrangThai = ?, NgayCapNhat = NOW() WHERE id = ?",
        [
          GhiChu || phieuNhap[0].GhiChu,
          TrangThai || phieuNhap[0].TrangThai,
          phieuNhapId,
        ]
      );

      return { success: true, message: "Cập nhật phiếu nhập thành công" };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryService();
