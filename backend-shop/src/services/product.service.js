const db = require("../config/database");
const cloudinaryUtil = require("../utils/cloudinary.util");

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
      `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMau,
              fn_TinhTonKhoRealTime(ctsp.id) as TonKho,
              COALESCE(cho.TongCho, 0) as SoLuongDangCho,
              GREATEST(0, fn_TinhTonKhoRealTime(ctsp.id) - COALESCE(cho.TongCho, 0)) as CoTheBan
        FROM chitietsanpham ctsp
        JOIN kichco kc ON ctsp.id_KichCo = kc.id
        JOIN mausac ms ON ctsp.id_MauSac = ms.id
        LEFT JOIN (
          SELECT ctdh.id_ChiTietSanPham, SUM(ctdh.SoLuong) as TongCho
          FROM chitietdonhang ctdh
          JOIN donhang dh ON ctdh.id_DonHang = dh.id
          WHERE dh.TrangThai = 1
          GROUP BY ctdh.id_ChiTietSanPham
        ) cho ON ctsp.id = cho.id_ChiTietSanPham
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
        WHERE dh.id_NguoiMua = ? AND ctdh.id_ChiTietSanPham IN (SELECT id FROM chitietsanpham WHERE id_SanPham = ?) AND dh.TrangThai = 4`,
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

  ///////////////////////// Admin methods for product management////////////////////////////

  async createProduct(productData, userId) {
    const {
      Ten,
      MoTa,
      MoTaChiTiet,
      ThongSoKyThuat,
      Gia,
      GiaKhuyenMai,
      id_DanhMuc,
      id_ThuongHieu,
      id_NhaCungCap,
      hinhAnh,
      bienThe,
    } = productData;

    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Upload hình ảnh lên Cloudinary (nếu có)
      let imageData = {};
      if (hinhAnh) {
        // Xử lý ảnh chính
        if (hinhAnh.anhChinh) {
          const anhChinh = await cloudinaryUtil.uploadImage(
            hinhAnh.anhChinh,
            "shoes_shop/products"
          );
          imageData.anhChinh = anhChinh.url;
          imageData.anhChinh_public_id = anhChinh.public_id;
        }

        // Xử lý ảnh phụ
        if (hinhAnh.anhPhu && Array.isArray(hinhAnh.anhPhu)) {
          const anhPhuResults = await cloudinaryUtil.uploadMultipleImages(
            hinhAnh.anhPhu,
            "shoes_shop/products"
          );
          imageData.anhPhu = anhPhuResults.map((img) => img.url);
          imageData.anhPhu_public_ids = anhPhuResults.map(
            (img) => img.public_id
          );
        }
      }

      // Insert vào bảng sanpham
      const [result] = await connection.execute(
        `INSERT INTO sanpham (Ten, MoTa, MoTaChiTiet, ThongSoKyThuat, Gia, 
          GiaKhuyenMai, id_DanhMuc, id_ThuongHieu, id_NhaCungCap, HinhAnh, 
          TrangThai, NgayTao) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [
          Ten,
          MoTa,
          MoTaChiTiet,
          JSON.stringify(ThongSoKyThuat),
          Gia,
          GiaKhuyenMai || null,
          id_DanhMuc,
          id_ThuongHieu,
          id_NhaCungCap,
          JSON.stringify(imageData),
        ]
      );

      const productId = result.insertId;

      // Thêm các biến thể sản phẩm
      if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
        for (const variant of bienThe) {
          const { id_KichCo, id_MauSac, MaSanPham, SoLuong } = variant;

          // ✅ SỬA: Không cần khởi tạo TonKho nữa, sẽ dùng real-time calculation
          await connection.execute(
            `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham) 
             VALUES (?, ?, ?, ?)`,
            [productId, id_KichCo, id_MauSac, MaSanPham]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      return {
        id: productId,
        message: "Sản phẩm đã được tạo thành công",
      };
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error creating product:", error);
      throw new Error("Không thể tạo sản phẩm: " + error.message);
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  async updateProduct(productId, productData, userId) {
    const {
      Ten,
      MoTa,
      MoTaChiTiet,
      ThongSoKyThuat,
      Gia,
      GiaKhuyenMai,
      id_DanhMuc,
      id_ThuongHieu,
      id_NhaCungCap,
      hinhAnh,
      bienThe,
      TrangThai,
    } = productData;

    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Kiểm tra sản phẩm có tồn tại không
      const [currentProduct] = await connection.execute(
        "SELECT id, HinhAnh FROM sanpham WHERE id = ?",
        [productId]
      );

      if (currentProduct.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      let currentImageData = JSON.parse(currentProduct[0].HinhAnh || "{}");
      let newImageData = { ...currentImageData };

      // Xử lý cập nhật hình ảnh nếu có
      if (hinhAnh) {
        // Xử lý ảnh chính
        if (hinhAnh.anhChinh) {
          // Xóa ảnh cũ nếu có
          if (currentImageData.anhChinh_public_id) {
            await cloudinaryUtil.deleteImage(
              currentImageData.anhChinh_public_id
            );
          }
          // Upload ảnh mới
          const anhChinh = await cloudinaryUtil.uploadImage(
            hinhAnh.anhChinh,
            "shoes_shop/products"
          );
          newImageData.anhChinh = anhChinh.url;
          newImageData.anhChinh_public_id = anhChinh.public_id;
        }

        // Xử lý ảnh phụ
        if (hinhAnh.anhPhu && Array.isArray(hinhAnh.anhPhu)) {
          // Xóa ảnh phụ cũ nếu có
          if (
            currentImageData.anhPhu_public_ids &&
            Array.isArray(currentImageData.anhPhu_public_ids)
          ) {
            for (const publicId of currentImageData.anhPhu_public_ids) {
              await cloudinaryUtil.deleteImage(publicId);
            }
          }
          // Upload ảnh phụ mới
          const anhPhuResults = await cloudinaryUtil.uploadMultipleImages(
            hinhAnh.anhPhu,
            "shoes_shop/products"
          );
          newImageData.anhPhu = anhPhuResults.map((img) => img.url);
          newImageData.anhPhu_public_ids = anhPhuResults.map(
            (img) => img.public_id
          );
        }
      }

      // Cập nhật thông tin sản phẩm
      await connection.execute(
        `UPDATE sanpham SET 
          Ten = ?, MoTa = ?, MoTaChiTiet = ?, ThongSoKyThuat = ?, 
          Gia = ?, GiaKhuyenMai = ?, id_DanhMuc = ?, id_ThuongHieu = ?, 
          id_NhaCungCap = ?, HinhAnh = ?, TrangThai = ?, NgayCapNhat = NOW()
          WHERE id = ?`,
        [
          Ten,
          MoTa,
          MoTaChiTiet,
          JSON.stringify(ThongSoKyThuat),
          Gia,
          GiaKhuyenMai || null,
          id_DanhMuc,
          id_ThuongHieu,
          id_NhaCungCap,
          JSON.stringify(newImageData),
          TrangThai || 1,
          productId,
        ]
      );

      // Cập nhật biến thể sản phẩm nếu có
      if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
        // Xóa tất cả biến thể cũ
        await connection.execute(
          "DELETE FROM chitietsanpham WHERE id_SanPham = ?",
          [productId]
        );

        // Thêm biến thể mới
        for (const variant of bienThe) {
          const { id_KichCo, id_MauSac, MaSanPham, SoLuong } = variant;

          await connection.execute(
            `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham) 
             VALUES (?, ?, ?, ?)`,
            [productId, id_KichCo, id_MauSac, MaSanPham]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      return {
        id: productId,
        message: "Sản phẩm đã được cập nhật thành công",
      };
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error updating product:", error);
      throw new Error("Không thể cập nhật sản phẩm: " + error.message);
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  async updateProductInfo(productId, productData) {
    const {
      Ten,
      MoTa,
      MoTaChiTiet,
      ThongSoKyThuat,
      Gia,
      GiaKhuyenMai,
      id_DanhMuc,
      id_ThuongHieu,
      id_NhaCungCap,
      hinhAnh,
      bienThe,
      TrangThai,
    } = productData;

    let connection;
    try {
      // Lấy connection từ pool
      connection = await db.getConnection();

      // Bắt đầu transaction
      await connection.beginTransaction();

      // Lấy thông tin hình ảnh hiện tại
      const [currentProduct] = await connection.execute(
        "SELECT HinhAnh FROM sanpham WHERE id = ?",
        [productId]
      );

      if (currentProduct.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      let currentImageData = JSON.parse(currentProduct[0].HinhAnh || "{}");
      let newImageData = { ...currentImageData };

      // Xử lý cập nhật hình ảnh nếu có
      if (hinhAnh) {
        // Xử lý ảnh chính
        if (hinhAnh.anhChinh) {
          // Xóa ảnh cũ nếu có
          if (currentImageData.anhChinh_public_id) {
            await cloudinaryUtil.deleteImage(
              currentImageData.anhChinh_public_id
            );
          }
          // Upload ảnh mới
          const anhChinh = await cloudinaryUtil.uploadImage(
            hinhAnh.anhChinh,
            "shoes_shop/products"
          );
          newImageData.anhChinh = cloudinaryUtil.getProductPreviewUrl(
            anhChinh.public_id
          );
          newImageData.anhChinh_public_id = anhChinh.public_id;
        }

        // Xử lý ảnh phụ
        if (hinhAnh.anhPhu && Array.isArray(hinhAnh.anhPhu)) {
          // Xóa ảnh phụ cũ nếu có
          if (
            currentImageData.anhPhu_public_ids &&
            Array.isArray(currentImageData.anhPhu_public_ids)
          ) {
            for (const publicId of currentImageData.anhPhu_public_ids) {
              await cloudinaryUtil.deleteImage(publicId);
            }
          }
          // Upload ảnh phụ mới
          const anhPhuResults = await cloudinaryUtil.uploadMultipleImages(
            hinhAnh.anhPhu,
            "shoes_shop/products"
          );
          newImageData.anhPhu = anhPhuResults.map((img) =>
            cloudinaryUtil.getProductPreviewUrl(img.public_id)
          );
          newImageData.anhPhu_public_ids = anhPhuResults.map(
            (img) => img.public_id
          );
        }
      }

      // Cập nhật thông tin sản phẩm
      await connection.execute(
        `UPDATE sanpham SET 
          Ten = ?, MoTa = ?, MoTaChiTiet = ?, ThongSoKyThuat = ?, 
          Gia = ?, GiaKhuyenMai = ?, id_DanhMuc = ?, id_ThuongHieu = ?, 
          id_NhaCungCap = ?, HinhAnh = ?, TrangThai = ?, NgayCapNhat = NOW()
          WHERE id = ?`,
        [
          Ten,
          MoTa,
          MoTaChiTiet,
          JSON.stringify(ThongSoKyThuat),
          Gia,
          GiaKhuyenMai || null,
          id_DanhMuc,
          id_ThuongHieu,
          id_NhaCungCap,
          JSON.stringify(newImageData),
          TrangThai || 1,
          productId,
        ]
      );

      // Cập nhật biến thể sản phẩm nếu có
      if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
        // Xóa tất cả biến thể cũ
        await connection.execute(
          "DELETE FROM chitietsanpham WHERE id_SanPham = ?",
          [productId]
        );

        // Thêm biến thể mới
        for (const variant of bienThe) {
          const { id_KichCo, id_MauSac, MaSanPham, SoLuong } = variant;

          await connection.execute(
            `INSERT INTO chitietsanpham (id_SanPham, id_KichCo, id_MauSac, MaSanPham) 
             VALUES (?, ?, ?, ?)`,
            [productId, id_KichCo, id_MauSac, MaSanPham]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      return {
        id: productId,
        message: "Thông tin sản phẩm đã được cập nhật thành công",
      };
    } catch (error) {
      // Rollback nếu có lỗi
      if (connection) {
        await connection.rollback();
      }

      console.error("Error updating product info:", error);
      throw new Error(
        "Không thể cập nhật thông tin sản phẩm: " + error.message
      );
    } finally {
      // Trả connection về pool
      if (connection) {
        connection.release();
      }
    }
  }

  async getProductImageData(productId) {
    const [product] = await db.execute(
      "SELECT HinhAnh FROM sanpham WHERE id = ?",
      [productId]
    );
    return product.length > 0 ? JSON.parse(product[0].HinhAnh || "{}") : {};
  }

  async updateProductImages(productId, newImages, currentImageData) {
    try {
      // Xử lý ảnh chính
      if (newImages.anhChinh) {
        if (currentImageData.anhChinh_public_id) {
          await cloudinaryUtil.deleteImage(currentImageData.anhChinh_public_id);
        }
        const anhChinh = await cloudinaryUtil.uploadImage(
          newImages.anhChinh,
          "shoes_shop/products"
        );
        currentImageData.anhChinh = anhChinh.url;
        currentImageData.anhChinh_public_id = anhChinh.public_id;
      }

      // Xử lý ảnh phụ
      if (newImages.anhPhu && newImages.anhPhu.length > 0) {
        if (currentImageData.anhPhu_public_ids) {
          for (const publicId of currentImageData.anhPhu_public_ids) {
            await cloudinaryUtil.deleteImage(publicId);
          }
        }
        const anhPhu = await cloudinaryUtil.uploadMultipleImages(
          newImages.anhPhu,
          "shoes_shop/products"
        );
        currentImageData.anhPhu = anhPhu.map((img) => img.url);
        currentImageData.anhPhu_public_ids = anhPhu.map((img) => img.public_id);
      }

      return currentImageData;
    } catch (error) {
      throw new Error("Lỗi khi cập nhật hình ảnh: " + error.message);
    }
  }

  async updateProductVariants(productId, variants, defaultPrice) {
    // Lấy biến thể hiện tại
    const [existingVariants] = await db.execute(
      "SELECT id, id_KichCo, id_MauSac FROM chitietsanpham WHERE id_SanPham = ?",
      [productId]
    );

    const existingMap = new Map();
    for (const variant of existingVariants) {
      const key = `${variant.id_KichCo}-${variant.id_MauSac}`;
      existingMap.set(key, variant.id);
    }

    // Cập nhật hoặc thêm mới biến thể
    for (const variant of variants) {
      const { id, id_KichCo, id_MauSac, MaSanPham } = variant;
      const key = `${id_KichCo}-${id_MauSac}`;

      if (id && existingMap.has(key)) {
        // Cập nhật biến thể hiện có
        await db.execute(
          `UPDATE chitietsanpham SET 
          MaSanPham = ?
          WHERE id = ?`,
          [MaSanPham, id]
        );
        existingMap.delete(key);
      } else {
        // Thêm biến thể mới
        await db.execute(
          `INSERT INTO chitietsanpham (
          id_SanPham, id_KichCo, id_MauSac, MaSanPham
        ) VALUES (?, ?, ?, ?)`,
          [productId, id_KichCo, id_MauSac, MaSanPham]
        );
      }
    }

    // Xóa các biến thể không còn sử dụng
    for (const variantId of existingMap.values()) {
      await db.execute("DELETE FROM chitietsanpham WHERE id = ?", [variantId]);
    }
  }

  async deleteProduct(productId) {
    try {
      // Kiểm tra sản phẩm có tồn tại không
      const [existingProduct] = await db.execute(
        "SELECT id, Ten FROM sanpham WHERE id = ?",
        [productId]
      );

      if (existingProduct.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Kiểm tra sản phẩm có trong đơn hàng hay không
      const hasOrders = await this.checkProductInOrders(productId);

      if (hasOrders) {
        throw new Error(
          "Không thể xóa sản phẩm này vì đã có khách hàng mua. Bạn chỉ có thể ẩn sản phẩm bằng cách đổi trạng thái thành 'Ngừng bán'."
        );
      }

      // Nếu không có trong đơn hàng, thực hiện soft delete chỉ bảng sanpham
      await db.execute(
        "UPDATE sanpham SET TrangThai = 0, NgayCapNhat = NOW() WHERE id = ?",
        [productId]
      );

      return {
        success: true,
        message: "Xóa sản phẩm thành công",
        productName: existingProduct[0].Ten,
      };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Phương thức mới: Kiểm tra sản phẩm có trong đơn hàng hay không
  async checkProductInOrders(productId) {
    try {
      const [orders] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM chitietdonhang ctdh 
         JOIN chitietsanpham ctsp ON ctdh.id_ChiTietSanPham = ctsp.id 
         WHERE ctsp.id_SanPham = ?`,
        [productId]
      );

      return orders[0].count > 0;
    } catch (error) {
      console.error("Error checking product in orders:", error);
      throw new Error("Lỗi khi kiểm tra sản phẩm trong đơn hàng");
    }
  }

  async getAllProductsAdmin(page = 1, limit = 10, search = "", status = null) {
    const offset = (page - 1) * limit;

    let query = `
      SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu, ncc.Ten as tenNhaCungCap,
             COUNT(ctsp.id) as soBienThe,
             COALESCE(SUM(ctdh.SoLuong), 0) as SoLuongDaBan
      FROM sanpham sp
      LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
      LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
      LEFT JOIN nhacungcap ncc ON sp.id_NhaCungCap = ncc.id
      LEFT JOIN chitietsanpham ctsp ON sp.id = ctsp.id_SanPham
      LEFT JOIN chitietdonhang ctdh ON ctsp.id = ctdh.id_ChiTietSanPham
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += " AND (sp.Ten LIKE ? OR sp.MoTa LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== null) {
      query += " AND sp.TrangThai = ?";
      params.push(status);
    }

    query += " GROUP BY sp.id ORDER BY sp.NgayTao DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [products] = await db.execute(query, params);

    // Count total
    let countQuery =
      "SELECT COUNT(DISTINCT sp.id) as total FROM sanpham sp WHERE 1=1";
    const countParams = [];

    if (search) {
      countQuery += " AND (sp.Ten LIKE ? OR sp.MoTa LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status !== null) {
      countQuery += " AND sp.TrangThai = ?";
      countParams.push(status);
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

  async updateProductStatus(productId, status) {
    try {
      // Kiểm tra sản phẩm có tồn tại không
      const [existingProduct] = await db.execute(
        "SELECT id, Ten FROM sanpham WHERE id = ?",
        [productId]
      );

      if (existingProduct.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Cập nhật trạng thái sản phẩm
      await db.execute(
        "UPDATE sanpham SET TrangThai = ?, NgayCapNhat = NOW() WHERE id = ?",
        [status, productId]
      );

      return {
        success: true,
        message: status === 1 ? "Đã kích hoạt sản phẩm" : "Đã ẩn sản phẩm",
        productName: existingProduct[0].Ten,
        newStatus: status,
      };
    } catch (error) {
      console.error("Error updating product status:", error);
      throw error;
    }
  }

  ///////////////////////// Colors and Sizes API methods ////////////////////////////

  async getAllColors() {
    try {
      const [colors] = await db.execute(
        "SELECT id, Ten as Ten, MaMau FROM mausac ORDER BY id ASC"
      );
      return colors;
    } catch (error) {
      console.error("Error getting colors:", error);
      throw new Error("Không thể lấy danh sách màu sắc");
    }
  }
  async getColorById(colorId) {
    try {
      const [color] = await db.execute(
        "SELECT id, Ten as Ten, MaMau FROM mausac WHERE id = ?",
        [colorId]
      );
      if (color.length === 0) {
        throw new Error("Màu sắc không tồn tại");
      }
      return color[0];
    } catch (error) {
      console.error("Error getting color by ID:", error);
      throw new Error("Không thể lấy thông tin màu sắc");
    }
  }
  async getAllSizes() {
    try {
      const [sizes] = await db.execute(
        "SELECT id, Ten FROM kichco ORDER BY CAST(Ten AS UNSIGNED) ASC"
      );
      return sizes;
    } catch (error) {
      console.error("Error getting sizes:", error);
      throw new Error("Không thể lấy danh sách kích cỡ");
    }
  }

  async createColor(colorData) {
    try {
      const { Ten, MaMau } = colorData;
      const [result] = await db.execute(
        "INSERT INTO mausac (Ten, MaMau) VALUES (?, ?)",
        [Ten, MaMau]
      );

      return {
        id: result.insertId,
        message: "Thêm màu sắc thành công",
      };
    } catch (error) {
      console.error("Error creating color:", error);
      throw new Error("Không thể tạo màu sắc mới");
    }
  }

  async createSize(sizeData) {
    try {
      const { Ten } = sizeData;
      const [result] = await db.execute("INSERT INTO kichco (Ten) VALUES (?)", [
        Ten,
      ]);

      return {
        id: result.insertId,
        message: "Thêm kích cỡ thành công",
      };
    } catch (error) {
      console.error("Error creating size:", error);
      throw new Error("Không thể tạo kích cỡ mới");
    }
  }

  async updateColor(colorId, colorData) {
    try {
      const { Ten, MaMau } = colorData;
      await db.execute("UPDATE mausac SET Ten = ?, MaMau = ? WHERE id = ?", [
        Ten,
        MaMau,
        colorId,
      ]);

      return {
        message: "Cập nhật màu sắc thành công",
      };
    } catch (error) {
      console.error("Error updating color:", error);
      throw new Error("Không thể cập nhật màu sắc");
    }
  }

  async updateSize(sizeId, sizeData) {
    try {
      const { Ten } = sizeData;
      await db.execute("UPDATE kichco SET Ten = ? WHERE id = ?", [Ten, sizeId]);

      return {
        message: "Cập nhật kích cỡ thành công",
      };
    } catch (error) {
      console.error("Error updating size:", error);
      throw new Error("Không thể cập nhật kích cỡ");
    }
  }

  async deleteColor(colorId) {
    try {
      // Kiểm tra xem màu sắc có được sử dụng trong sản phẩm hay không
      const [usage] = await db.execute(
        "SELECT COUNT(*) as count FROM chitietsanpham WHERE id_MauSac = ?",
        [colorId]
      );

      if (usage[0].count > 0) {
        throw new Error(
          "Không thể xóa màu sắc này vì đang được sử dụng trong sản phẩm"
        );
      }

      await db.execute("DELETE FROM mausac WHERE id = ?", [colorId]);

      return {
        message: "Xóa màu sắc thành công",
      };
    } catch (error) {
      console.error("Error deleting color:", error);
      throw error;
    }
  }

  async deleteSize(sizeId) {
    try {
      // Kiểm tra xem kích cỡ có được sử dụng trong sản phẩm hay không
      const [usage] = await db.execute(
        "SELECT COUNT(*) as count FROM chitietsanpham WHERE id_KichCo = ?",
        [sizeId]
      );

      if (usage[0].count > 0) {
        throw new Error(
          "Không thể xóa kích cỡ này vì đang được sử dụng trong sản phẩm"
        );
      }

      await db.execute("DELETE FROM kichco WHERE id = ?", [sizeId]);

      return {
        message: "Xóa kích cỡ thành công",
      };
    } catch (error) {
      console.error("Error deleting size:", error);
      throw error;
    }
  }

  async getProductVariants(productId) {
    // Lấy danh sách biến thể của sản phẩm theo productId
    const [variants] = await db.execute(
      `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMauSac
       FROM chitietsanpham ctsp
       JOIN kichco kc ON ctsp.id_KichCo = kc.id
       JOIN mausac ms ON ctsp.id_MauSac = ms.id
       WHERE ctsp.id_SanPham = ?`,
      [productId]
    );
    return variants;
  }

  // Lấy tồn kho real-time cho biến thể sản phẩm
  async getProductStockInfo(productId) {
    try {
      const [stockInfo] = await db.execute(
        `SELECT 
          cts.id,
          cts.MaSanPham,
          sp.Ten as TenSanPham,
          kc.Ten as TenKichCo,
          ms.Ten as TenMauSac,
          -- Sử dụng function tính tồn kho real-time
          fn_TinhTonKhoRealTime(cts.id) as TonKhoThucTe,
          -- Tính số lượng đang chờ xác nhận
          COALESCE(cho.TongCho, 0) as SoLuongDangCho,
          -- Tồn kho có thể bán = Tồn kho - Đang chờ
          GREATEST(0, fn_TinhTonKhoRealTime(cts.id) - COALESCE(cho.TongCho, 0)) as CoTheBan
        FROM chitietsanpham cts
        JOIN sanpham sp ON cts.id_SanPham = sp.id
        JOIN kichco kc ON cts.id_KichCo = kc.id
        JOIN mausac ms ON cts.id_MauSac = ms.id
        
        -- Tính số lượng đang chờ xác nhận
        LEFT JOIN (
          SELECT ctdh.id_ChiTietSanPham, SUM(ctdh.SoLuong) as TongCho
          FROM chitietdonhang ctdh
          JOIN donhang dh ON ctdh.id_DonHang = dh.id
          WHERE dh.TrangThai = 1
          GROUP BY ctdh.id_ChiTietSanPham
        ) cho ON cts.id = cho.id_ChiTietSanPham
        
        WHERE cts.id_SanPham = ?
        ORDER BY kc.Ten, ms.Ten`,
        [productId]
      );

      return {
        success: true,
        data: stockInfo,
        productId: productId,
      };
    } catch (error) {
      console.error("Error getting product stock info:", error);
      throw new Error("Không thể lấy thông tin tồn kho: " + error.message);
    }
  }

  // Kiểm tra tồn kho trước khi đặt hàng - DÙNG REAL-TIME
  async checkStockBeforeOrder(productVariantId, requestedQuantity) {
    try {
      const [stockCheck] = await db.execute(
        `SELECT 
          cts.id,
          cts.MaSanPham,
          sp.Ten as TenSanPham,
          kc.Ten as TenKichCo,
          ms.Ten as TenMauSac,
          -- Sử dụng function tính tồn kho real-time
          fn_TinhTonKhoRealTime(cts.id) as TonKhoThucTe,
          -- Sử dụng function kiểm tra có thể bán
          fn_CoTheBan(cts.id, ?) as CoTheBan,
          -- Tính số lượng đang chờ xác nhận
          COALESCE(cho.TongCho, 0) as SoLuongDangCho
        FROM chitietsanpham cts
        JOIN sanpham sp ON cts.id_SanPham = sp.id
        JOIN kichco kc ON cts.id_KichCo = kc.id
        JOIN mausac ms ON cts.id_MauSac = ms.id
        
        -- Tính số lượng đang chờ xác nhận
        LEFT JOIN (
          SELECT ctdh.id_ChiTietSanPham, SUM(ctdh.SoLuong) as TongCho
          FROM chitietdonhang ctdh
          JOIN donhang dh ON ctdh.id_DonHang = dh.id
          WHERE dh.TrangThai = 1
          GROUP BY ctdh.id_ChiTietSanPham
        ) cho ON cts.id = cho.id_ChiTietSanPham
        
        WHERE cts.id = ?`,
        [requestedQuantity, productVariantId]
      );

      if (stockCheck.length === 0) {
        throw new Error("Biến thể sản phẩm không tồn tại");
      }

      const product = stockCheck[0];
      const canSell = product.CoTheBan === 1;

      return {
        success: true,
        data: {
          id_ChiTietSanPham: product.id,
          TenSanPham: product.TenSanPham,
          MaSanPham: product.MaSanPham,
          KichCo: product.TenKichCo,
          MauSac: product.TenMauSac,
          TonKhoThucTe: product.TonKhoThucTe,
          SoLuongCanKiem: requestedQuantity,
          SoLuongDangCho: product.SoLuongDangCho,
          CoTheBan: canSell,
          isAvailable: canSell,
          message: canSell
            ? "Có thể đặt hàng"
            : `Không đủ hàng. Tồn kho: ${product.TonKhoThucTe}, Đang chờ: ${product.SoLuongDangCho}`,
        },
      };
    } catch (error) {
      console.error("Error checking stock before order:", error);
      throw new Error("Không thể kiểm tra tồn kho: " + error.message);
    }
  }
}

module.exports = new ProductService();
