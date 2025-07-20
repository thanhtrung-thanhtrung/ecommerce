const db = require("../config/database");

class VoucherService {
  // Tạo voucher mới
  async taoVoucher(voucherData) {
    // Tạo mã voucher đơn giản
    const maVoucher = `VOUCHER${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const [result] = await db.execute(
      `INSERT INTO magiamgia (
        Ma, Ten, MoTa, PhanTramGiam, GiaTriGiamToiDa, 
        DieuKienApDung, SoLuotSuDung, SoLuotDaSuDung,
        NgayBatDau, NgayKetThuc, TrangThai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      [
        maVoucher,
        voucherData.Ten,
        voucherData.MoTa,
        voucherData.PhanTramGiam,
        voucherData.GiaTriGiamToiDa || null,
        voucherData.DieuKienApDung,
        voucherData.SoLuotSuDung,
        voucherData.NgayBatDau,
        voucherData.NgayKetThuc,
      ]
    );

    return {
      Ma: maVoucher,
      ...voucherData,
      SoLuotDaSuDung: 0,
      TrangThai: 1,
    };
  }

  // Cập nhật voucher
  async capNhatVoucher(maVoucher, voucherData) {
    const [result] = await db.execute(
      `UPDATE magiamgia SET 
        Ten = ?, MoTa = ?, PhanTramGiam = ?, GiaTriGiamToiDa = ?,
        DieuKienApDung = ?, SoLuotSuDung = ?,
        NgayBatDau = ?, NgayKetThuc = ?
      WHERE Ma = ?`,
      [
        voucherData.Ten,
        voucherData.MoTa,
        voucherData.PhanTramGiam,
        voucherData.GiaTriGiamToiDa || null,
        voucherData.DieuKienApDung,
        voucherData.SoLuotSuDung,
        voucherData.NgayBatDau,
        voucherData.NgayKetThuc,
        maVoucher,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }

  // Cập nhật trạng thái voucher
  async capNhatTrangThai(maVoucher, trangThai) {
    const [result] = await db.execute(
      "UPDATE magiamgia SET TrangThai = ? WHERE Ma = ?",
      [trangThai, maVoucher]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    // Trả về chi tiết voucher mới nhất
    return this.layChiTietVoucher(maVoucher);
  }

  // Lấy chi tiết voucher
  async layChiTietVoucher(maVoucher) {
    const [vouchers] = await db.execute(
      `SELECT * FROM magiamgia WHERE Ma = ?`,
      [maVoucher]
    );

    if (vouchers.length === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return vouchers[0];
  }

  // Tìm kiếm và lọc voucher
  async timKiemVoucher(filters) {
    let query = "SELECT * FROM magiamgia WHERE 1=1";
    const params = [];

    if (filters.tuKhoa) {
      query += " AND (Ma LIKE ? OR Ten LIKE ? OR MoTa LIKE ?)";
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.trangThai !== undefined) {
      query += " AND TrangThai = ?";
      params.push(filters.trangThai);
    }

    // Lọc theo loại voucher (công khai/bí mật)
    if (filters.loaiVoucher !== undefined) {
      query += " AND LoaiVoucher = ?";
      params.push(filters.loaiVoucher);
    }

    // Lọc theo thời gian hiệu lực
    if (filters.dangHieuLuc) {
      const now = new Date().toISOString().split("T")[0];
      query += " AND NgayBatDau <= ? AND NgayKetThuc >= ? AND TrangThai = 1";
      params.push(now, now);
    }

    // Chỉ lấy voucher công khai cho customer
    if (filters.congKhai) {
      const now = new Date().toISOString().split("T")[0];
      query +=
        " AND NgayBatDau <= ? AND NgayKetThuc >= ? AND TrangThai = 1 AND LoaiVoucher = 1";
      params.push(now, now);
    }

    // Lọc theo số lượt sử dụng còn lại
    if (filters.conHieuLuc) {
      query += " AND SoLuotDaSuDung < SoLuotSuDung";
    }

    query += " ORDER BY NgayBatDau DESC";

    const [vouchers] = await db.execute(query, params);
    return vouchers;
  }

  // Enhanced voucher application with comprehensive validation
  async applyVoucher(maVoucher, tongTien, userId = null) {
    try {
      // 1. Kiểm tra voucher có tồn tại không
      const voucher = await this.layChiTietVoucher(maVoucher);
      const now = new Date();

      // 2. Kiểm tra thời gian hiệu lực
      const ngayBatDau = new Date(voucher.NgayBatDau);
      const ngayKetThuc = new Date(voucher.NgayKetThuc);

      if (now < ngayBatDau) {
        throw new Error("Mã giảm giá chưa có hiệu lực");
      }

      if (now > ngayKetThuc) {
        throw new Error("Mã giảm giá đã hết hạn");
      }

      // 3. Kiểm tra trạng thái voucher
      if (voucher.TrangThai !== 1) {
        throw new Error("Mã giảm giá không còn hiệu lực");
      }

      // 4. Kiểm tra số lượt sử dụng
      if (voucher.SoLuotDaSuDung >= voucher.SoLuotSuDung) {
        throw new Error("Mã giảm giá đã hết lượt sử dụng");
      }

      // 5. Kiểm tra điều kiện áp dụng (giá trị đơn hàng tối thiểu)
      if (tongTien < voucher.DieuKienApDung) {
        throw new Error(
          `Đơn hàng phải có giá trị tối thiểu ${voucher.DieuKienApDung.toLocaleString(
            "vi-VN"
          )}đ`
        );
      }

      // 6. Kiểm tra người dùng đã sử dụng voucher này chưa (nếu có userId)
      if (userId) {
        const [existingUsage] = await db.execute(
          `SELECT COUNT(*) as count FROM donhang 
           WHERE id_nguoidung = ? AND MaGiamGia = ? AND TrangThai != 6`,
          [userId, maVoucher]
        );

        if (existingUsage[0].count > 0) {
          throw new Error("Bạn đã sử dụng mã giảm giá này rồi");
        }
      }

      // 7. Tính giá trị giảm giá
      let giaTriGiam = (tongTien * voucher.PhanTramGiam) / 100;

      // Kiểm tra giới hạn giảm giá tối đa
      if (voucher.GiaTriGiamToiDa && giaTriGiam > voucher.GiaTriGiamToiDa) {
        giaTriGiam = voucher.GiaTriGiamToiDa;
      }

      // 8. Tính tổng tiền sau khi giảm
      const tongTienSauGiam = tongTien - giaTriGiam;

      // 9. Trả về kết quả thành công
      return {
        voucher: {
          Ma: voucher.Ma,
          Ten: voucher.Ten,
          PhanTramGiam: voucher.PhanTramGiam,
          GiaTriGiamToiDa: voucher.GiaTriGiamToiDa,
          NgayKetThuc: voucher.NgayKetThuc,
        },
        giaTriGiam: Math.round(giaTriGiam),
        tongTienSauGiam: Math.round(tongTienSauGiam),
        tongTienGoc: tongTien,
        thongTin: {
          phanTramGiam: voucher.PhanTramGiam,
          giaTriGiamToiDa: voucher.GiaTriGiamToiDa,
          dieuKienApDung: voucher.DieuKienApDung,
        },
      };
    } catch (error) {
      // Log error for debugging
      console.error("Voucher application error:", error.message);
      throw error;
    }
  }

  // Tăng số lượt sử dụng voucher
  async tangSoLuotSuDung(maVoucher) {
    const [result] = await db.execute(
      "UPDATE magiamgia SET SoLuotDaSuDung = SoLuotDaSuDung + 1 WHERE Ma = ?",
      [maVoucher]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }

  // Giảm số lượt sử dụng voucher (hoàn lại khi đơn bị hủy)
  async giamSoLuotSuDung(maVoucher) {
    const [result] = await db.execute(
      "UPDATE magiamgia SET SoLuotDaSuDung = GREATEST(SoLuotDaSuDung - 1, 0) WHERE Ma = ?",
      [maVoucher]
    );
    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }
    return this.layChiTietVoucher(maVoucher);
  }
}

module.exports = new VoucherService();
