const db = require("../config/database");

class WishlistService {
  // Thêm sản phẩm vào danh sách yêu thích
  async themVaoWishlist(userId, productId) {
    // Kiểm tra sản phẩm đã tồn tại trong wishlist chưa
    const [existing] = await db.execute(
      "SELECT * FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (existing.length > 0) {
      throw new Error("Sản phẩm đã có trong danh sách yêu thích");
    }

    // Kiểm tra sản phẩm có tồn tại không
    const [product] = await db.execute(
      "SELECT id FROM sanpham WHERE id = ? AND TrangThai = 1",
      [productId]
    );

    if (product.length === 0) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Thêm vào wishlist
    const [result] = await db.execute(
      "INSERT INTO wishlist (id_NguoiDung, id_SanPham) VALUES (?, ?)",
      [userId, productId]
    );

    return {
      id: result.insertId,
      id_NguoiDung: userId,
      id_SanPham: productId,
      NgayThem: new Date(),
    };
  }

  // Xóa sản phẩm khỏi danh sách yêu thích
  async xoaKhoiWishlist(userId, productId) {
    const [result] = await db.execute(
      "DELETE FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy sản phẩm trong danh sách yêu thích");
    }

    return true;
  }

  // Lấy danh sách wishlist của người dùng
  async layDanhSachWishlist(userId, options = {}) {
    let query = `
      SELECT 
        w.id,
        w.NgayThem,
        sp.id as id_SanPham,
        sp.Ten as tenSanPham,
        sp.HinhAnh,
        sp.Gia,
        sp.GiaKhuyenMai,
        sp.MoTa,
        sp.TrangThai as trangThaiSanPham,
        dm.Ten as tenDanhMuc,
        th.Ten as tenThuongHieu,
        sp.SoLuongDaBan,
        -- ✅ SỬA: Sử dụng function real-time để kiểm tra tồn kho
        COALESCE(SUM(fn_TinhTonKhoRealTime(cts.id)), 0) as tongTonKho,
        -- Điểm đánh giá trung bình
        ROUND(AVG(dg.SoSao), 1) as diemDanhGia,
        COUNT(DISTINCT dg.id) as soLuotDanhGia
      FROM wishlist w
      JOIN sanpham sp ON w.id_SanPham = sp.id
      LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      LEFT JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
      LEFT JOIN danhgia dg ON sp.id = dg.id_SanPham AND dg.TrangThai = 1
      WHERE w.id_NguoiDung = ?
    `;

    const params = [userId];

    // Lọc theo danh mục
    if (options.danhMuc) {
      query += " AND dm.id = ?";
      params.push(options.danhMuc);
    }

    // Lọc theo thương hiệu
    if (options.thuongHieu) {
      query += " AND th.id = ?";
      params.push(options.thuongHieu);
    }

    query += " GROUP BY w.id, sp.id";
    query += " ORDER BY w.NgayThem DESC";

    // Phân trang
    if (options.limit) {
      query += " LIMIT ?";
      params.push(parseInt(options.limit));

      if (options.offset) {
        query += " OFFSET ?";
        params.push(parseInt(options.offset));
      }
    }

    const [wishlist] = await db.execute(query, params);

    // Parse JSON cho hình ảnh
    const processedWishlist = wishlist.map((item) => ({
      ...item,
      HinhAnh: item.HinhAnh ? JSON.parse(item.HinhAnh) : null,
      coTonKho: item.tongTonKho > 0,
    }));

    return processedWishlist;
  }

  // Kiểm tra sản phẩm có trong wishlist không
  async kiemTraTrongWishlist(userId, productId) {
    const [result] = await db.execute(
      "SELECT id FROM wishlist WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    return result.length > 0;
  }

  // Kiểm tra nhiều sản phẩm có trong wishlist không
  async kiemTraNhieuSanPham(userId, productIds) {
    if (!productIds || productIds.length === 0) {
      return {};
    }

    const placeholders = productIds.map(() => "?").join(",");
    const [results] = await db.execute(
      `SELECT id_SanPham FROM wishlist 
       WHERE id_NguoiDung = ? AND id_SanPham IN (${placeholders})`,
      [userId, ...productIds]
    );

    const wishlistProducts = results.map((row) => row.id_SanPham);
    const wishlistStatus = {};

    productIds.forEach((id) => {
      wishlistStatus[id] = wishlistProducts.includes(id);
    });

    return wishlistStatus;
  }

  // Xóa toàn bộ wishlist
  async xoaToanBoWishlist(userId) {
    const [result] = await db.execute(
      "DELETE FROM wishlist WHERE id_NguoiDung = ?",
      [userId]
    );

    return result.affectedRows;
  }

  // Đếm số lượng sản phẩm trong wishlist
  async demSoLuongWishlist(userId) {
    const [result] = await db.execute(
      "SELECT COUNT(*) as soLuong FROM wishlist WHERE id_NguoiDung = ?",
      [userId]
    );

    return result[0].soLuong;
  }

  // Lấy wishlist với thông tin chi tiết (cho admin)
  async layWishlistChiTiet(options = {}) {
    let query = `
      SELECT 
        w.id,
        w.NgayThem,
        nd.id as id_NguoiDung,
        nd.HoTen as tenNguoiDung,
        nd.Email as emailNguoiDung,
        sp.id as id_SanPham,
        sp.Ten as tenSanPham,
        sp.Gia,
        dm.Ten as tenDanhMuc,
        th.Ten as tenThuongHieu
      FROM wishlist w
      JOIN nguoidung nd ON w.id_NguoiDung = nd.id
      JOIN sanpham sp ON w.id_SanPham = sp.id
      LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      WHERE 1=1
    `;

    const params = [];

    // Lọc theo người dùng
    if (options.userId) {
      query += " AND nd.id = ?";
      params.push(options.userId);
    }

    // Lọc theo sản phẩm
    if (options.productId) {
      query += " AND sp.id = ?";
      params.push(options.productId);
    }

    // Lọc theo thời gian
    if (options.tuNgay) {
      query += " AND DATE(w.NgayThem) >= ?";
      params.push(options.tuNgay);
    }

    if (options.denNgay) {
      query += " AND DATE(w.NgayThem) <= ?";
      params.push(options.denNgay);
    }

    query += " ORDER BY w.NgayThem DESC";

    // Phân trang
    if (options.limit) {
      query += " LIMIT ?";
      params.push(parseInt(options.limit));

      if (options.offset) {
        query += " OFFSET ?";
        params.push(parseInt(options.offset));
      }
    }

    const [wishlist] = await db.execute(query, params);
    return wishlist;
  }

  // Thống kê wishlist
  async thongKeWishlist() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as tongSoWishlist,
        COUNT(DISTINCT w.id_NguoiDung) as soNguoiDungCoWishlist,
        COUNT(DISTINCT w.id_SanPham) as soSanPhamTrongWishlist,
        AVG(wishlist_count.so_wishlist) as trungBinhWishlistMoiNguoi
      FROM wishlist w
      JOIN (
        SELECT id_NguoiDung, COUNT(*) as so_wishlist
        FROM wishlist
        GROUP BY id_NguoiDung
      ) wishlist_count ON w.id_NguoiDung = wishlist_count.id_NguoiDung
    `);

    // Top sản phẩm được yêu thích nhất
    const [topProducts] = await db.execute(`
      SELECT 
        sp.id,
        sp.Ten,
        sp.HinhAnh,
        COUNT(w.id) as soLuotYeuThich
      FROM wishlist w
      JOIN sanpham sp ON w.id_SanPham = sp.id
      GROUP BY sp.id, sp.Ten, sp.HinhAnh
      ORDER BY soLuotYeuThich DESC
      LIMIT 10
    `);

    return {
      thongKeTongQuan: stats[0],
      topSanPhamYeuThich: topProducts.map((item) => ({
        ...item,
        HinhAnh: item.HinhAnh ? JSON.parse(item.HinhAnh) : null,
      })),
    };
  }
  async hienThiWishlist() {
    const [wishlist] = await db.execute(
      `SELECT id_SanPham, COUNT(*) AS so_luot_yeu_thich
FROM wishlist
GROUP BY id_SanPham;
 `
    )
    return  wishlist.map(item => ({
    id_SanPham: item.id_SanPham,
    so_luot_yeu_thich: item.so_luot_yeu_thich
  }));

}
}
module.exports = new WishlistService();
