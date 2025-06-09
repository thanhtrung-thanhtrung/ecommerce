const db = require("../config/db");

class ProductService {
  async getAllProducts(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [products] = await db.execute(
      `SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu,
              (SELECT AVG(SoSao) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as diemDanhGia,
              (SELECT COUNT(*) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as luotDanhGia
       FROM sanpham sp
       LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
       LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
       WHERE sp.TrangThai = 1
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [total] = await db.execute(
      "SELECT COUNT(*) as total FROM sanpham WHERE TrangThai = 1"
    );

    for (let product of products) {
      const [variants] = await db.execute(
        `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMau
         FROM chitietsanpham ctsp
         JOIN kichco kc ON ctsp.id_KichCo = kc.id
         JOIN mausac ms ON ctsp.id_MauSac = ms.id
         WHERE ctsp.id_SanPham = ?`,
        [product.id]
      );
      product.bienThe = variants;
    }

    return {
      products,
      pagination: {
        page,
        limit,
        total: total[0].total,
      },
    };
  }

  async searchProducts(searchData, page = 1, limit = 10) {
    const { tuKhoa, id_DanhMuc, id_ThuongHieu, giaMin, giaMax } = searchData;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu,
             (SELECT AVG(SoSao) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as diemDanhGia,
             (SELECT COUNT(*) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as luotDanhGia
      FROM sanpham sp
      LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      WHERE sp.TrangThai = 1
    `;

    const params = [];

    if (tuKhoa) {
      query += " AND (sp.Ten LIKE ? OR sp.MoTa LIKE ?)";
      params.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
    }

    if (id_DanhMuc) {
      query += " AND sp.id_DanhMuc = ?";
      params.push(id_DanhMuc);
    }

    if (id_ThuongHieu) {
      query += " AND sp.id_ThuongHieu = ?";
      params.push(id_ThuongHieu);
    }

    if (giaMin) {
      query += " AND sp.Gia >= ?";
      params.push(giaMin);
    }

    if (giaMax) {
      query += " AND sp.Gia <= ?";
      params.push(giaMax);
    }

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [products] = await db.execute(query, params);

    for (let product of products) {
      const [variants] = await db.execute(
        `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMau
         FROM chitietsanpham ctsp
         JOIN kichco kc ON ctsp.id_KichCo = kc.id
         JOIN mausac ms ON ctsp.id_MauSac = ms.id
         WHERE ctsp.id_SanPham = ?`,
        [product.id]
      );
      product.bienThe = variants;
    }

    let countQuery = `
      SELECT COUNT(*) as total
      FROM sanpham sp
      WHERE sp.TrangThai = 1
    `;

    const countParams = [];

    if (tuKhoa) {
      countQuery += " AND (sp.Ten LIKE ? OR sp.MoTa LIKE ?)";
      countParams.push(`%${tuKhoa}%`, `%${tuKhoa}%`);
    }

    if (id_DanhMuc) {
      countQuery += " AND sp.id_DanhMuc = ?";
      countParams.push(id_DanhMuc);
    }

    if (id_ThuongHieu) {
      countQuery += " AND sp.id_ThuongHieu = ?";
      countParams.push(id_ThuongHieu);
    }

    if (giaMin) {
      countQuery += " AND sp.Gia >= ?";
      countParams.push(giaMin);
    }

    if (giaMax) {
      countQuery += " AND sp.Gia <= ?";
      countParams.push(giaMax);
    }

    const [total] = await db.execute(countQuery, countParams);

    return {
      products,
      pagination: {
        page,
        limit,
        total: total[0].total,
      },
    };
  }

  async getProductDetail(productId) {
    const [products] = await db.execute(
      `SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu,
              (SELECT AVG(SoSao) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as diemDanhGia,
              (SELECT COUNT(*) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as luotDanhGia
       FROM sanpham sp
       LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
       LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
       WHERE sp.id = ? AND sp.TrangThai = 1`,
      [productId]
    );

    if (products.length === 0) {
      throw new Error("Sản phẩm không tồn tại");
    }

    const product = products[0];

    const [variants] = await db.execute(
      `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMau
       FROM chitietsanpham ctsp
       JOIN kichco kc ON ctsp.id_KichCo = kc.id
       JOIN mausac ms ON ctsp.id_MauSac = ms.id
       WHERE ctsp.id_SanPham = ?`,
      [productId]
    );
    product.bienThe = variants;

    const [reviews] = await db.execute(
      `SELECT dg.*, nd.HoTen, nd.Avatar as avatar
       FROM danhgia dg
       JOIN nguoidung nd ON dg.id_NguoiDung = nd.id
       WHERE dg.id_SanPham = ? AND dg.TrangThai = 1
       ORDER BY dg.NgayDanhGia DESC`,
      [productId]
    );
    product.danhGia = reviews;

    const [relatedProducts] = await db.execute(
      `SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu,
              (SELECT AVG(SoSao) FROM danhgia WHERE id_SanPham = sp.id AND TrangThai = 1) as diemDanhGia
       FROM sanpham sp
       LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
       LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
       WHERE sp.id_DanhMuc = ? AND sp.id != ? AND sp.TrangThai = 1
       LIMIT 4`,
      [product.id_DanhMuc, productId]
    );
    product.sanPhamLienQuan = relatedProducts;

    return product;
  }

  async reviewProduct(productId, userId, reviewData) {
    const { noiDung, diem } = reviewData;

    const [orders] = await db.execute(
      `SELECT dh.* 
       FROM donhang dh
       JOIN chitietdonhang ctdh ON dh.id = ctdh.id_DonHang
       WHERE dh.id_NguoiMua = ? AND ctdh.id_ChiTietSanPham IN (SELECT id FROM chitietsanpham WHERE id_SanPham = ?) AND dh.TrangThai = 'Đã giao'`,
      [userId, productId]
    );

    if (orders.length === 0) {
      throw new Error("Bạn cần mua sản phẩm trước khi đánh giá");
    }

    const [existingReview] = await db.execute(
      "SELECT * FROM danhgia WHERE id_NguoiDung = ? AND id_SanPham = ?",
      [userId, productId]
    );

    if (existingReview.length > 0) {
      throw new Error("Bạn đã đánh giá sản phẩm này");
    }

    await db.execute(
      "INSERT INTO danhgia (id_SanPham, id_NguoiDung, NoiDung, SoSao, NgayDanhGia, TrangThai) VALUES (?, ?, ?, ?, NOW(), 1)",
      [productId, userId, noiDung, diem]
    );

    return this.getProductDetail(productId);
  }
}

module.exports = new ProductService();
