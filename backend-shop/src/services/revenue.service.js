const db = require("../config/database");

class RevenueService {
  // Thống kê doanh thu theo thời gian
  async thongKeDoanhThu(tuNgay, denNgay, loaiThongKe = "ngay") {
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];

    let groupByClause, dateFormat;
    switch (loaiThongKe) {
      case "ngay":
        groupByClause = "DATE(dh.NgayDatHang)";
        dateFormat = "%Y-%m-%d";
        break;
      case "thang":
        groupByClause = "DATE_FORMAT(dh.NgayDatHang, '%Y-%m')";
        dateFormat = "%Y-%m";
        break;
      case "nam":
        groupByClause = "YEAR(dh.NgayDatHang)";
        dateFormat = "%Y";
        break;
      default:
        groupByClause = "DATE(dh.NgayDatHang)";
        dateFormat = "%Y-%m-%d";
    }

    // Truy vấn doanh thu chính
    const [doanhThu] = await db.execute(
      `SELECT 
        DATE_FORMAT(dh.NgayDatHang, ?) AS thoiGian,
        COUNT(DISTINCT dh.id) AS soDonHang,
        COALESCE(SUM(dh.TongTienHang), 0) AS tongTienHang,
        COALESCE(SUM(dh.GiamGia), 0) AS tongGiamGia,
        COALESCE(SUM(dh.PhiVanChuyen), 0) AS tongPhiVanChuyen,
        COALESCE(SUM(dh.TongThanhToan), 0) AS tongThanhToan,
        COUNT(DISTINCT dh.id_NguoiMua) AS soKhachHang,
        COUNT(DISTINCT CASE WHEN dh.id_NguoiMua IS NULL THEN dh.session_id END) AS soKhachVangLai
      FROM donhang dh
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY ${groupByClause}
      ORDER BY thoiGian ASC`,
      [dateFormat, startDate, endDate]
    );

    // Truy vấn theo hình thức thanh toán
    const [thanhToan] = await db.execute(
      `SELECT 
        COALESCE(httt.Ten, 'Không xác định') AS hinhThucThanhToan,
        COUNT(DISTINCT dh.id) AS soDonHang,
        COALESCE(SUM(dh.TongThanhToan), 0) AS tongThanhToan
      FROM donhang dh
      LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY httt.id, httt.Ten
      ORDER BY tongThanhToan DESC`,
      [startDate, endDate]
    );

    // Truy vấn theo hình thức vận chuyển
    const [vanChuyen] = await db.execute(
      `SELECT 
        COALESCE(htvc.Ten, 'Không xác định') AS hinhThucVanChuyen,
        COUNT(DISTINCT dh.id) AS soDonHang,
        COALESCE(SUM(dh.PhiVanChuyen), 0) AS tongPhiVanChuyen,
        COALESCE(SUM(dh.TongThanhToan), 0) AS tongThanhToan
      FROM donhang dh
      LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY htvc.id, htvc.Ten
      ORDER BY tongThanhToan DESC`,
      [startDate, endDate]
    );

    // Truy vấn theo trạng thái đơn hàng
    const [trangThaiDonHang] = await db.execute(
      `SELECT 
        CASE dh.TrangThai
          WHEN 1 THEN 'Chờ xác nhận'
          WHEN 2 THEN 'Đã xác nhận'
          WHEN 3 THEN 'Đang giao'
          WHEN 4 THEN 'Đã giao'
          WHEN 5 THEN 'Đã hủy'
          ELSE 'Không xác định'
        END AS trangThai,
        COUNT(DISTINCT dh.id) AS soDonHang,
        COALESCE(SUM(dh.TongThanhToan), 0) AS tongThanhToan
      FROM donhang dh
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
      GROUP BY dh.TrangThai
      ORDER BY dh.TrangThai`,
      [startDate, endDate]
    );

    // Tính tổng
    const tongTienHang = doanhThu.reduce(
      (sum, r) => sum + (+r.tongTienHang || 0),
      0
    );
    const tongThanhToan = doanhThu.reduce(
      (sum, r) => sum + (+r.tongThanhToan || 0),
      0
    );
    const tongGiamGia = doanhThu.reduce(
      (sum, r) => sum + (+r.tongGiamGia || 0),
      0
    );
    const tongPhiVanChuyen = doanhThu.reduce(
      (sum, r) => sum + (+r.tongPhiVanChuyen || 0),
      0
    );

    return {
      success: true,
      data: {
        doanhThuTheoThoiGian: doanhThu,
        thanhToanTheoHinhThuc: thanhToan,
        vanChuyenTheoHinhThuc: vanChuyen,
        trangThaiDonHang,
        tongHop: {
          tongTienHang,
          tongThanhToan,
          tongGiamGia,
          tongPhiVanChuyen,
          tongSoDonHang: doanhThu.reduce((s, r) => s + (+r.soDonHang || 0), 0),
          tongSoKhachHang: doanhThu.reduce(
            (s, r) => s + (+r.soKhachHang || 0),
            0
          ),
          tongSoKhachVangLai: doanhThu.reduce(
            (s, r) => s + (+r.soKhachVangLai || 0),
            0
          ),
        },
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
      id_ThanhToan,
      id_VanChuyen,
      trangThai,
      page = 1,
      limit = 20,
    } = filters;

    // Validate required parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    // Format dates
    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];

    let query = `
      SELECT 
        dh.id,
        dh.MaDonHang,
        dh.NgayDatHang,
        CASE dh.TrangThai
          WHEN 1 THEN 'Chờ xác nhận'
          WHEN 2 THEN 'Đã xác nhận'
          WHEN 3 THEN 'Đang giao'
          WHEN 4 THEN 'Đã giao'
          WHEN 5 THEN 'Đã hủy'
          ELSE 'Không xác định'
        END as trangThai,
        COALESCE(dh.TongTienHang, 0) as TongTienHang,
        COALESCE(dh.GiamGia, 0) as GiamGia,
        COALESCE(dh.PhiVanChuyen, 0) as PhiVanChuyen,
        COALESCE(dh.TongThanhToan, 0) as TongThanhToan,
        COALESCE(httt.Ten, 'Không xác định') as hinhThucThanhToan,
        COALESCE(htvc.Ten, 'Không xác định') as hinhThucVanChuyen,
        COALESCE(nd.HoTen, 'Khách vãng lai') as tenKhachHang,
        COALESCE(nd.SDT, dh.SDTNguoiNhan) as sdtKhachHang,
        dh.TenNguoiNhan,
        dh.DiaChiNhan,
        dh.EmailNguoiNhan,
        dh.MaGiamGia,
        dh.GhiChu
      FROM donhang dh
      LEFT JOIN hinhthucthanhtoan httt ON dh.id_ThanhToan = httt.id
      LEFT JOIN hinhthucvanchuyen htvc ON dh.id_VanChuyen = htvc.id
      LEFT JOIN nguoidung nd ON dh.id_NguoiMua = nd.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    // Add optional filters only if they have valid values
    if (id_ThanhToan && !isNaN(parseInt(id_ThanhToan))) {
      query += " AND dh.id_ThanhToan = ?";
      params.push(parseInt(id_ThanhToan));
    }

    if (id_VanChuyen && !isNaN(parseInt(id_VanChuyen))) {
      query += " AND dh.id_VanChuyen = ?";
      params.push(parseInt(id_VanChuyen));
    }

    if (trangThai && !isNaN(parseInt(trangThai))) {
      query += " AND dh.TrangThai = ?";
      params.push(parseInt(trangThai));
    }

    // Lọc theo danh mục hoặc thương hiệu (qua chi tiết đơn hàng)
    if (
      (id_DanhMuc && !isNaN(parseInt(id_DanhMuc))) ||
      (id_ThuongHieu && !isNaN(parseInt(id_ThuongHieu)))
    ) {
      query += ` AND dh.id IN (
        SELECT DISTINCT ctdh.id_DonHang
        FROM chitietdonhang ctdh
        JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
        JOIN sanpham sp ON ctsp.id_SanPham = sp.id
        WHERE 1=1`;

      if (id_DanhMuc && !isNaN(parseInt(id_DanhMuc))) {
        query += " AND sp.id_DanhMuc = ?";
        params.push(parseInt(id_DanhMuc));
      }

      if (id_ThuongHieu && !isNaN(parseInt(id_ThuongHieu))) {
        query += " AND sp.id_ThuongHieu = ?";
        params.push(parseInt(id_ThuongHieu));
      }

      query += ")";
    }

    // Đếm tổng số bản ghi
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(DISTINCT dh.id) as total FROM"
    );
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total || 0;

    // Phân trang
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " ORDER BY dh.NgayDatHang DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [chiTietDonHang] = await db.execute(query, params);

    // Lấy chi tiết sản phẩm cho từng đơn hàng
    for (let donHang of chiTietDonHang) {
      const [sanPham] = await db.execute(
        `SELECT 
          sp.Ten as tenSanPham,
          th.Ten as thuongHieu,
          dm.Ten as danhMuc,
          ms.Ten as mauSac,
          kc.Ten as kichCo,
          ctdh.SoLuong,
          COALESCE(ctdh.GiaBan, 0) as GiaBan,
          COALESCE(ctdh.ThanhTien, 0) as ThanhTien
        FROM chitietdonhang ctdh
        JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
        JOIN sanpham sp ON ctsp.id_SanPham = sp.id
        JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
        JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
        JOIN mausac ms ON ctsp.id_MauSac = ms.id
        JOIN kichco kc ON ctsp.id_KichCo = kc.id
        WHERE ctdh.id_DonHang = ?`,
        [donHang.id]
      );
      donHang.chiTietSanPham = sanPham;
    }

    // Thống kê theo danh mục
    const [thongKeDanhMuc] = await db.execute(
      `SELECT 
        dm.Ten as tenDanhMuc,
        COUNT(DISTINCT dh.id) as soDonHang,
        COALESCE(SUM(ctdh.SoLuong), 0) as tongSoLuong,
        COALESCE(SUM(ctdh.ThanhTien), 0) as tongDoanhThu
      FROM donhang dh
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY dm.id, dm.Ten
      ORDER BY tongDoanhThu DESC`,
      [startDate, endDate]
    );

    // Thống kê theo thương hiệu
    const [thongKeThuongHieu] = await db.execute(
      `SELECT 
        th.Ten as tenThuongHieu,
        COUNT(DISTINCT dh.id) as soDonHang,
        COALESCE(SUM(ctdh.SoLuong), 0) as tongSoLuong,
        COALESCE(SUM(ctdh.ThanhTien), 0) as tongDoanhThu
      FROM donhang dh
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY th.id, th.Ten
      ORDER BY tongDoanhThu DESC`,
      [startDate, endDate]
    );

    // Sản phẩm bán chạy
    const [sanPhamBanChay] = await db.execute(
      `SELECT 
        sp.Ten as tenSanPham,
        th.Ten as thuongHieu,
        dm.Ten as danhMuc,
        COALESCE(SUM(ctdh.SoLuong), 0) as tongSoLuong,
        COALESCE(SUM(ctdh.ThanhTien), 0) as tongDoanhThu,
        COUNT(DISTINCT dh.id) as soDonHang
      FROM donhang dh
      JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
      JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id
      JOIN sanpham sp ON ctsp.id_SanPham = sp.id
      JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY sp.id, sp.Ten, th.Ten, dm.Ten
      ORDER BY tongSoLuong DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Tính tổng với null checks
    const tongTienHang = chiTietDonHang.reduce(
      (sum, item) => sum + (parseFloat(item.TongTienHang) || 0),
      0
    );
    const tongThanhToan = chiTietDonHang.reduce(
      (sum, item) => sum + (parseFloat(item.TongThanhToan) || 0),
      0
    );
    const tongGiamGia = chiTietDonHang.reduce(
      (sum, item) => sum + (parseFloat(item.GiamGia) || 0),
      0
    );
    const tongPhiVanChuyen = chiTietDonHang.reduce(
      (sum, item) => sum + (parseFloat(item.PhiVanChuyen) || 0),
      0
    );

    return {
      success: true,
      data: {
        chiTietDonHang,
        thongKeDanhMuc,
        thongKeThuongHieu,
        sanPhamBanChay,
        tongHop: {
          tongTienHang,
          tongThanhToan,
          tongGiamGia,
          tongPhiVanChuyen,
          tongSoDonHang: chiTietDonHang.length,
        },
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Thống kê khách hàng theo doanh thu
  async thongKeKhachHang(tuNgay, denNgay, limit = 10) {
    // Validate parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];
    const limitValue = parseInt(limit) || 10;

    const [khachHangVip] = await db.execute(
      `SELECT 
        nd.id,
        nd.HoTen,
        nd.Email,
        nd.SDT,
        COUNT(DISTINCT dh.id) as soDonHang,
        COALESCE(SUM(dh.TongThanhToan), 0) as tongChiTieu,
        COALESCE(AVG(dh.TongThanhToan), 0) as giaTriTrungBinh,
        MAX(dh.NgayDatHang) as donHangCuoi
      FROM nguoidung nd
      JOIN donhang dh ON nd.id = dh.id_NguoiMua
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
      GROUP BY nd.id, nd.HoTen, nd.Email, nd.SDT
      ORDER BY tongChiTieu DESC
      LIMIT ?`,
      [startDate, endDate, limitValue]
    );

    return {
      success: true,
      data: khachHangVip,
    };
  }

  // Thống kê mã giảm giá
  async thongKeMaGiamGia(tuNgay, denNgay) {
    // Validate parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];

    const [maGiamGia] = await db.execute(
      `SELECT 
        mgg.Ma,
        mgg.Ten,
        COUNT(DISTINCT dh.id) as soLanSuDung,
        COALESCE(SUM(dh.GiamGia), 0) as tongGiaTriGiam,
        COALESCE(AVG(dh.GiamGia), 0) as giaTriTrungBinh
      FROM donhang dh
      JOIN magiamgia mgg ON dh.MaGiamGia = mgg.Ma
      WHERE DATE(dh.NgayDatHang) BETWEEN ? AND ?
        AND dh.TrangThai != 5
        AND dh.GiamGia > 0
      GROUP BY mgg.Ma, mgg.Ten
      ORDER BY tongGiaTriGiam DESC`,
      [startDate, endDate]
    );

    return {
      success: true,
      data: maGiamGia,
    };
  }

  // Dashboard thống kê tổng quan
  async dashboardThongKe() {
    // Thống kê hôm nay
    const [homNay] = await db.execute(`
      SELECT 
        COUNT(DISTINCT id) as soDonHang,
        SUM(TongThanhToan) as doanhThu,
        COUNT(DISTINCT CASE WHEN id_NguoiMua IS NOT NULL THEN id_NguoiMua END) as khachHangMoi
      FROM donhang 
      WHERE DATE(NgayDatHang) = CURDATE()
        AND TrangThai != 5
    `);

    // Thống kê tháng này
    const [thangNay] = await db.execute(`
      SELECT 
        COUNT(DISTINCT id) as soDonHang,
        SUM(TongThanhToan) as doanhThu,
        COUNT(DISTINCT CASE WHEN id_NguoiMua IS NOT NULL THEN id_NguoiMua END) as khachHang
      FROM donhang 
      WHERE MONTH(NgayDatHang) = MONTH(CURDATE())
        AND YEAR(NgayDatHang) = YEAR(CURDATE())
        AND TrangThai != 5
    `);

    // Thống kê năm nay
    const [namNay] = await db.execute(`
      SELECT 
        COUNT(DISTINCT id) as soDonHang,
        SUM(TongThanhToan) as doanhThu
      FROM donhang 
      WHERE YEAR(NgayDatHang) = YEAR(CURDATE())
        AND TrangThai != 5
    `);

    // Đơn hàng cần xử lý
    const [donHangCanXuLy] = await db.execute(`
      SELECT 
        SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as choXacNhan,
        SUM(CASE WHEN TrangThai = 2 THEN 1 ELSE 0 END) as daXacNhan,
        SUM(CASE WHEN TrangThai = 3 THEN 1 ELSE 0 END) as dangGiao
      FROM donhang 
      WHERE TrangThai IN (1, 2, 3)
    `);

    // Thống kê doanh thu 7 ngày gần đây
    const [doanhThu7Ngay] = await db.execute(`
      SELECT 
        DATE(NgayDatHang) as ngay,
        COUNT(DISTINCT id) as soDonHang,
        SUM(TongThanhToan) as doanhThu
      FROM donhang 
      WHERE NgayDatHang >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND TrangThai != 5
      GROUP BY DATE(NgayDatHang)
      ORDER BY ngay ASC
    `);

    return {
      success: true,
      data: {
        homNay: homNay[0],
        thangNay: thangNay[0],
        namNay: namNay[0],
        donHangCanXuLy: donHangCanXuLy[0],
        doanhThu7Ngay,
      },
    };
  }
}

module.exports = new RevenueService();
