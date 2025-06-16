const db = require("../config/db");

class RevenueService {
  // Thống kê doanh thu theo thời gian
  async thongKeDoanhThu(tuNgay, denNgay, loaiThongKe = "ngay") {
    let groupByClause, dateFormat;
    switch (loaiThongKe) {
      case "ngay":
        groupByClause = "DATE(dh.NgayDat)";
        dateFormat = "%Y-%m-%d";
        break;
      case "thang":
        groupByClause = "DATE_FORMAT(dh.NgayDat, '%Y-%m')";
        dateFormat = "%Y-%m";
        break;
      case "nam":
        groupByClause = "YEAR(dh.NgayDat)";
        dateFormat = "%Y";
        break;
    }

    const [doanhThu] = await db.execute(
      `SELECT 
        DATE_FORMAT(dh.NgayDat, ?) as thoiGian,
        COUNT(DISTINCT dh.id) as soDonHang,
        SUM(dh.TongTien) as tongDoanhThu,
        SUM(dh.TienGiamGia) as tongGiamGia,
        SUM(dh.PhiVanChuyen) as tongPhiVanChuyen,
        SUM(dh.ThanhTien) as tongThanhTien,
        COUNT(DISTINCT dh.id_NguoiMua) as soKhachHang
      FROM donhang dh
      WHERE dh.NgayDat BETWEEN ? AND ?
        AND dh.TrangThai != 'Đã hủy'
      GROUP BY ${groupByClause}
      ORDER BY dh.NgayDat ASC`,
      [dateFormat, tuNgay, denNgay]
    );

    // Thống kê theo hình thức thanh toán
    const [thanhToan] = await db.execute(
      `SELECT 
        httt.Ten as hinhThucThanhToan,
        COUNT(DISTINCT dh.id) as soDonHang,
        SUM(dh.ThanhTien) as tongThanhTien
      FROM donhang dh
      JOIN hinhthucthanhtoan httt ON dh.id_HinhThucThanhToan = httt.id
      WHERE dh.NgayDat BETWEEN ? AND ?
        AND dh.TrangThai != 'Đã hủy'
      GROUP BY httt.id, httt.Ten
      ORDER BY tongThanhTien DESC`,
      [tuNgay, denNgay]
    );

    // Tính tổng doanh thu
    const tongDoanhThu = doanhThu.reduce(
      (sum, item) => sum + item.tongDoanhThu,
      0
    );
    const tongThanhTien = doanhThu.reduce(
      (sum, item) => sum + item.tongThanhTien,
      0
    );
    const tongGiamGia = doanhThu.reduce(
      (sum, item) => sum + item.tongGiamGia,
      0
    );
    const tongPhiVanChuyen = doanhThu.reduce(
      (sum, item) => sum + item.tongPhiVanChuyen,
      0
    );

    return {
      doanhThuTheoThoiGian: doanhThu,
      thanhToanTheoHinhThuc: thanhToan,
      tongHop: {
        tongDoanhThu,
        tongThanhTien,
        tongGiamGia,
        tongPhiVanChuyen,
        tongSoDonHang: doanhThu.reduce((sum, item) => sum + item.soDonHang, 0),
        tongSoKhachHang: doanhThu.reduce(
          (sum, item) => sum + item.soKhachHang,
          0
        ),
      },
    };
  }

  // Báo cáo doanh thu chi tiết
  async baoCaoDoanhThu(filters) {
    const {
      tuNgay,
      denNgay,
      id_DanhMuc,
      id_ThuongHieu,
      id_HinhThucThanhToan,
      trangThai,
    } = filters;

    let query = `
      SELECT 
        dh.MaDonHang,
        dh.NgayDat,
        dh.TrangThai,
        dh.TongTien,
        dh.TienGiamGia,
        dh.PhiVanChuyen,
        dh.ThanhTien,
        httt.Ten as hinhThucThanhToan,
        nd.HoTen as tenKhachHang,
        nd.SoDienThoai as sdtKhachHang,
        GROUP_CONCAT(
          CONCAT(
            sp.Ten, ' (', kc.Ten, ' - ', ms.Ten, ') x', ctdh.SoLuong
          ) SEPARATOR '; '
        ) as chiTietSanPham
      FROM donhang dh
      JOIN hinhthucthanhtoan httt ON dh.id_HinhThucThanhToan = httt.id
      JOIN nguoidung nd ON dh.id_NguoiMua = nd.id
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN kichco kc ON ctsp.id_KichCo = kc.id
      JOIN mausac ms ON ctsp.id_MauSac = ms.id
      WHERE dh.NgayDat BETWEEN ? AND ?
    `;

    const params = [tuNgay, denNgay];

    if (id_DanhMuc) {
      query += " AND sp.id_DanhMuc = ?";
      params.push(id_DanhMuc);
    }

    if (id_ThuongHieu) {
      query += " AND sp.id_ThuongHieu = ?";
      params.push(id_ThuongHieu);
    }

    if (id_HinhThucThanhToan) {
      query += " AND dh.id_HinhThucThanhToan = ?";
      params.push(id_HinhThucThanhToan);
    }

    if (trangThai) {
      query += " AND dh.TrangThai = ?";
      params.push(trangThai);
    }

    query += " GROUP BY dh.id ORDER BY dh.NgayDat DESC";

    const [chiTietDonHang] = await db.execute(query, params);

    // Thống kê theo danh mục
    const [thongKeDanhMuc] = await db.execute(
      `SELECT 
        dm.Ten as tenDanhMuc,
        COUNT(DISTINCT dh.id) as soDonHang,
        SUM(ctdh.SoLuong) as tongSoLuong,
        SUM(ctdh.ThanhTien) as tongDoanhThu
      FROM donhang dh
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      WHERE dh.NgayDat BETWEEN ? AND ?
        AND dh.TrangThai != 'Đã hủy'
      GROUP BY dm.id, dm.Ten
      ORDER BY tongDoanhThu DESC`,
      [tuNgay, denNgay]
    );

    // Thống kê theo thương hiệu
    const [thongKeThuongHieu] = await db.execute(
      `SELECT 
        th.Ten as tenThuongHieu,
        COUNT(DISTINCT dh.id) as soDonHang,
        SUM(ctdh.SoLuong) as tongSoLuong,
        SUM(ctdh.ThanhTien) as tongDoanhThu
      FROM donhang dh
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      WHERE dh.NgayDat BETWEEN ? AND ?
        AND dh.TrangThai != 'Đã hủy'
      GROUP BY th.id, th.Ten
      ORDER BY tongDoanhThu DESC`,
      [tuNgay, denNgay]
    );

    // Tính tổng doanh thu
    const tongDoanhThu = chiTietDonHang.reduce(
      (sum, item) => sum + item.TongTien,
      0
    );
    const tongThanhTien = chiTietDonHang.reduce(
      (sum, item) => sum + item.ThanhTien,
      0
    );
    const tongGiamGia = chiTietDonHang.reduce(
      (sum, item) => sum + item.TienGiamGia,
      0
    );
    const tongPhiVanChuyen = chiTietDonHang.reduce(
      (sum, item) => sum + item.PhiVanChuyen,
      0
    );

    return {
      chiTietDonHang,
      thongKeDanhMuc,
      thongKeThuongHieu,
      tongHop: {
        tongDoanhThu,
        tongThanhTien,
        tongGiamGia,
        tongPhiVanChuyen,
        tongSoDonHang: chiTietDonHang.length,
      },
    };
  }
}

module.exports = new RevenueService();
