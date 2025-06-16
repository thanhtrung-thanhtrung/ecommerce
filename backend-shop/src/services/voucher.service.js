const db = require("../config/db");
const { generateCode } = require("../utils/helper.util");

class VoucherService {
  // Tạo voucher mới
  async taoVoucher(voucherData) {
    const maVoucher = await generateCode("VOUCHER");

    const [result] = await db.execute(
      `INSERT INTO magiamgia (
        MaGiamGia, Ten, MoTa, LoaiGiamGia, GiaTri, 
        GiaTriToiThieu, GiaTriToiDa, SoLuong, DaSuDung,
        NgayBatDau, NgayKetThuc, TrangThai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      [
        maVoucher,
        voucherData.Ten,
        voucherData.MoTa,
        voucherData.LoaiGiamGia,
        voucherData.GiaTri,
        voucherData.GiaTriToiThieu,
        voucherData.GiaTriToiDa || null,
        voucherData.SoLuong,
        voucherData.NgayBatDau,
        voucherData.NgayKetThuc,
      ]
    );

    return {
      id: result.insertId,
      MaGiamGia: maVoucher,
      ...voucherData,
      DaSuDung: 0,
      TrangThai: 1,
    };
  }

  // Cập nhật voucher
  async capNhatVoucher(maVoucher, voucherData) {
    const [result] = await db.execute(
      `UPDATE magiamgia SET 
        Ten = ?, MoTa = ?, LoaiGiamGia = ?, GiaTri = ?,
        GiaTriToiThieu = ?, GiaTriToiDa = ?, SoLuong = ?,
        NgayBatDau = ?, NgayKetThuc = ?
      WHERE MaGiamGia = ?`,
      [
        voucherData.Ten,
        voucherData.MoTa,
        voucherData.LoaiGiamGia,
        voucherData.GiaTri,
        voucherData.GiaTriToiThieu,
        voucherData.GiaTriToiDa || null,
        voucherData.SoLuong,
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
      "UPDATE magiamgia SET TrangThai = ? WHERE MaGiamGia = ?",
      [trangThai, maVoucher]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return { MaGiamGia: maVoucher, TrangThai: trangThai };
  }

  // Lấy chi tiết voucher
  async layChiTietVoucher(maVoucher) {
    const [vouchers] = await db.execute(
      `SELECT * FROM magiamgia WHERE MaGiamGia = ?`,
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
      query += " AND (MaGiamGia LIKE ? OR Ten LIKE ? OR MoTa LIKE ?)";
      const searchTerm = `%${filters.tuKhoa}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.trangThai !== undefined) {
      query += " AND TrangThai = ?";
      params.push(filters.trangThai);
    }

    if (filters.loaiGiamGia) {
      query += " AND LoaiGiamGia = ?";
      params.push(filters.loaiGiamGia);
    }

    // Lọc theo thời gian hiệu lực
    if (filters.dangHieuLuc) {
      const now = new Date().toISOString().split("T")[0];
      query += " AND NgayBatDau <= ? AND NgayKetThuc >= ? AND TrangThai = 1";
      params.push(now, now);
    }

    query += " ORDER BY NgayTao DESC";

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
    if (voucher.DaSuDung >= voucher.SoLuong) {
      throw new Error("Voucher đã hết lượt sử dụng");
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (tongTien < voucher.GiaTriToiThieu) {
      throw new Error(
        `Đơn hàng phải có giá trị tối thiểu ${voucher.GiaTriToiThieu}đ`
      );
    }

    // Tính giá trị giảm giá
    let giaTriGiam = 0;
    if (voucher.LoaiGiamGia === "Phần trăm") {
      giaTriGiam = (tongTien * voucher.GiaTri) / 100;
      if (voucher.GiaTriToiDa && giaTriGiam > voucher.GiaTriToiDa) {
        giaTriGiam = voucher.GiaTriToiDa;
      }
    } else {
      giaTriGiam = voucher.GiaTri;
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
      "UPDATE magiamgia SET DaSuDung = DaSuDung + 1 WHERE MaGiamGia = ?",
      [maVoucher]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }
}

module.exports = new VoucherService();
