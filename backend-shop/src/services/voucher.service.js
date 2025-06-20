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

    return { Ma: maVoucher, TrangThai: trangThai };
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

    // Lọc theo thời gian hiệu lực
    if (filters.dangHieuLuc) {
      const now = new Date().toISOString().split("T")[0];
      query += " AND NgayBatDau <= ? AND NgayKetThuc >= ? AND TrangThai = 1";
      params.push(now, now);
    }

    query += " ORDER BY NgayBatDau DESC";

    const [vouchers] = await db.execute(query, params);
    return vouchers;
  }

  // Kiểm tra và áp dụng voucher
  async kiemTraVoucher(maVoucher, tongTien) {
    const voucher = await this.layChiTietVoucher(maVoucher);
    const now = new Date();

    // Kiểm tra thời gian hiệu lực
    if (
      now < new Date(voucher.NgayBatDau) ||
      now > new Date(voucher.NgayKetThuc)
    ) {
      throw new Error("Voucher đã hết hạn hoặc chưa đến thời gian sử dụng");
    }

    // Kiểm tra trạng thái
    if (voucher.TrangThai !== 1) {
      throw new Error("Voucher không còn hiệu lực");
    }

    // Kiểm tra số lượng
    if (voucher.SoLuotDaSuDung >= voucher.SoLuotSuDung) {
      throw new Error("Voucher đã hết lượt sử dụng");
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (tongTien < voucher.DieuKienApDung) {
      throw new Error(
        `Đơn hàng phải có giá trị tối thiểu ${voucher.DieuKienApDung}đ`
      );
    }

    // Tính giá trị giảm giá
    let giaTriGiam = (tongTien * voucher.PhanTramGiam) / 100;
    if (voucher.GiaTriGiamToiDa && giaTriGiam > voucher.GiaTriGiamToiDa) {
      giaTriGiam = voucher.GiaTriGiamToiDa;
    }

    return {
      voucher,
      giaTriGiam,
      tongTienSauGiam: tongTien - giaTriGiam,
    };
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
}

module.exports = new VoucherService();
