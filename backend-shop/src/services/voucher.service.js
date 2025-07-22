const { Voucher, Order, sequelize } = require("../models");
const { Op } = require("sequelize");

class VoucherService {
  // Tạo voucher mới
  async taoVoucher(voucherData) {
    // Tạo mã voucher đơn giản
    const maVoucher = `VOUCHER${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = await Voucher.create({
      Ma: maVoucher,
      Ten: voucherData.Ten,
      MoTa: voucherData.MoTa,
      PhanTramGiam: voucherData.PhanTramGiam,
      GiaTriGiamToiDa: voucherData.GiaTriGiamToiDa || null,
      DieuKienApDung: voucherData.DieuKienApDung,
      SoLuotSuDung: voucherData.SoLuotSuDung,
      SoLuotDaSuDung: 0,
      NgayBatDau: voucherData.NgayBatDau,
      NgayKetThuc: voucherData.NgayKetThuc,
      TrangThai: 1,
    });

    return result.toJSON();
  }

  // Cập nhật voucher
  async capNhatVoucher(maVoucher, voucherData) {
    const [affectedRows] = await Voucher.update(
      {
        Ten: voucherData.Ten,
        MoTa: voucherData.MoTa,
        PhanTramGiam: voucherData.PhanTramGiam,
        GiaTriGiamToiDa: voucherData.GiaTriGiamToiDa || null,
        DieuKienApDung: voucherData.DieuKienApDung,
        SoLuotSuDung: voucherData.SoLuotSuDung,
        NgayBatDau: voucherData.NgayBatDau,
        NgayKetThuc: voucherData.NgayKetThuc,
      },
      {
        where: { Ma: maVoucher },
      }
    );

    if (affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }

  // Cập nhật trạng thái voucher
  async capNhatTrangThai(maVoucher, trangThai) {
    const [affectedRows] = await Voucher.update(
      { TrangThai: trangThai },
      { where: { Ma: maVoucher } }
    );

    if (affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    // Trả về chi tiết voucher mới nhất
    return this.layChiTietVoucher(maVoucher);
  }

  // Lấy chi tiết voucher
  async layChiTietVoucher(maVoucher) {
    const voucher = await Voucher.findOne({
      where: { Ma: maVoucher },
    });

    if (!voucher) {
      throw new Error("Không tìm thấy voucher");
    }

    return voucher.toJSON();
  }

  // Tìm kiếm và lọc voucher
  async timKiemVoucher(filters) {
    const whereConditions = {};

    if (filters.tuKhoa) {
      whereConditions[Op.or] = [
        { Ma: { [Op.like]: `%${filters.tuKhoa}%` } },
        { Ten: { [Op.like]: `%${filters.tuKhoa}%` } },
        { MoTa: { [Op.like]: `%${filters.tuKhoa}%` } },
      ];
    }

    if (filters.trangThai !== undefined) {
      whereConditions.TrangThai = filters.trangThai;
    }

    // Lọc theo loại voucher (công khai/bí mật)
    if (filters.loaiVoucher !== undefined) {
      whereConditions.LoaiVoucher = filters.loaiVoucher;
    }

    // Lọc theo thời gian hiệu lực
    if (filters.dangHieuLuc) {
      const now = new Date();
      whereConditions.NgayBatDau = { [Op.lte]: now };
      whereConditions.NgayKetThuc = { [Op.gte]: now };
      whereConditions.TrangThai = 1;
    }

    // Chỉ lấy voucher công khai cho customer
    if (filters.congKhai) {
      const now = new Date();
      whereConditions.NgayBatDau = { [Op.lte]: now };
      whereConditions.NgayKetThuc = { [Op.gte]: now };
      whereConditions.TrangThai = 1;
      whereConditions.LoaiVoucher = 1;
    }

    // Lọc theo số lượt sử dụng còn lại
    if (filters.conHieuLuc) {
      whereConditions[Op.and] = sequelize.where(
        sequelize.col("SoLuotDaSuDung"),
        Op.lt,
        sequelize.col("SoLuotSuDung")
      );
    }

    const vouchers = await Voucher.findAll({
      where: whereConditions,
      order: [["NgayBatDau", "DESC"]],
    });

    return vouchers.map((v) => v.toJSON());
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
        const existingUsage = await Order.count({
          where: {
            id_NguoiMua: userId,
            MaGiamGia: maVoucher,
            TrangThai: { [Op.ne]: 6 },
          },
        });

        if (existingUsage > 0) {
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
    const [affectedRows] = await Voucher.update(
      {
        SoLuotDaSuDung: sequelize.literal("SoLuotDaSuDung + 1"),
      },
      { where: { Ma: maVoucher } }
    );

    if (affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }

  // Giảm số lượt sử dụng voucher (hoàn lại khi đơn bị hủy)
  async giamSoLuotSuDung(maVoucher) {
    const [affectedRows] = await Voucher.update(
      {
        SoLuotDaSuDung: sequelize.literal("GREATEST(SoLuotDaSuDung - 1, 0)"),
      },
      { where: { Ma: maVoucher } }
    );

    if (affectedRows === 0) {
      throw new Error("Không tìm thấy voucher");
    }

    return this.layChiTietVoucher(maVoucher);
  }
}

module.exports = new VoucherService();
