const db = require("../config/db");
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
          const { id_KichCo, id_MauSac, MaSanPham } = variant;

          // Chỉ sử dụng các cột tồn tại trong bảng chitietsanpham theo cấu trúc database
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

    try {
      await db.beginTransaction();

      // Lấy thông tin hình ảnh hiện tại
      const [currentProduct] = await db.execute(
        "SELECT HinhAnh FROM sanpham WHERE id = ?",
        [productId]
      );

      if (currentProduct.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      let currentImageData = JSON.parse(currentProduct[0].HinhAnh || "{}");
      let newImageData = { ...currentImageData };

      // Xử lý cập nhật hình ảnh
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
          newImageData.anhChinh_thumbnail = cloudinaryUtil.getThumbnailUrl(
            anhChinh.public_id
          );
        }

        // Xử lý ảnh phụ
        if (hinhAnh.anhPhu && hinhAnh.anhPhu.length > 0) {
          // Xóa ảnh phụ cũ nếu có
          if (currentImageData.anhPhu) {
            await cloudinaryUtil.deleteMultipleImages(
              currentImageData.anhPhu.map((img) => img.public_id)
            );
          }
          // Upload ảnh phụ mới
          const anhPhu = await cloudinaryUtil.uploadMultipleImages(
            hinhAnh.anhPhu,
            "shoes_shop/products"
          );
          newImageData.anhPhu = anhPhu.map((img) => ({
            url: cloudinaryUtil.getProductPreviewUrl(img.public_id),
            thumbnail: cloudinaryUtil.getThumbnailUrl(img.public_id),
            public_id: img.public_id,
          }));
        }
      }

      // Cập nhật thông tin sản phẩm
      await db.execute(
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

      // Cập nhật biến thể sản phẩm
      if (bienThe && bienThe.length > 0) {
        await this.updateProductVariants(productId, bienThe, Gia);
      }

      await db.commit();

      return {
        id: productId,
        message: "Thông tin sản phẩm đã được cập nhật thành công",
      };
    } catch (error) {
      await db.rollback();
      throw new Error(
        "Không thể cập nhật thông tin sản phẩm: " + error.message
      );
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
      await db.beginTransaction();

      // Lấy thông tin sản phẩm
      const [product] = await db.execute(
        "SELECT HinhAnh FROM sanpham WHERE id = ?",
        [productId]
      );

      if (product.length === 0) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Xóa hình ảnh trên Cloudinary
      const imageData = JSON.parse(product[0].HinhAnh || "{}");

      if (imageData.anhChinh_public_id) {
        await cloudinaryUtil.deleteImage(imageData.anhChinh_public_id);
      }

      if (imageData.anhPhu && imageData.anhPhu.length > 0) {
        await cloudinaryUtil.deleteMultipleImages(
          imageData.anhPhu.map((img) => img.public_id)
        );
      }

      // Cập nhật trạng thái sản phẩm
      await db.execute(
        "UPDATE sanpham SET TrangThai = 0, NgayCapNhat = NOW() WHERE id = ?",
        [productId]
      );

      // Xóa các biến thể sản phẩm hoặc giữ lại nhưng đánh dấu là đã xóa
      // Vì bảng chitietsanpham không có cột TrangThai, nên ta sẽ xóa hoàn toàn các biến thể
      await db.execute("DELETE FROM chitietsanpham WHERE id_SanPham = ?", [
        productId,
      ]);

      await db.commit();

      return {
        id: productId,
        message: "Sản phẩm đã được xóa thành công",
      };
    } catch (error) {
      await db.rollback();
      throw new Error("Không thể xóa sản phẩm: " + error.message);
    }
  }

  async getAllProductsAdmin(page = 1, limit = 10, search = "", status = null) {
    const offset = (page - 1) * limit;

    let query = `
        SELECT sp.*, dm.Ten as tenDanhMuc, th.Ten as tenThuongHieu, ncc.Ten as tenNhaCungCap,
              (SELECT COUNT(*) FROM chitietsanpham WHERE id_SanPham = sp.id) as soBienThe
        FROM sanpham sp
        LEFT JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
        LEFT JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
        LEFT JOIN nhacungcap ncc ON sp.id_NhaCungCap = ncc.id
        WHERE 1=1
      `;

    const params = [];

    // Add search condition if provided
    if (search) {
      query += " AND (sp.Ten LIKE ? OR sp.MoTa LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add status condition if provided
    if (status !== null) {
      query += " AND sp.TrangThai = ?";
      params.push(status);
    }

    query += " ORDER BY sp.NgayCapNhat DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [products] = await db.execute(query, params);

    // Count total for pagination
    let countQuery = `
        SELECT COUNT(*) as total
        FROM sanpham sp
        WHERE 1=1
      `;

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

  async getProductVariants(productId) {
    const [variants] = await db.execute(
      `SELECT ctsp.*, kc.Ten as tenKichCo, ms.Ten as tenMau, ms.MaMau
        FROM chitietsanpham ctsp
        JOIN kichco kc ON ctsp.id_KichCo = kc.id
        JOIN mausac ms ON ctsp.id_MauSac = ms.id
        WHERE ctsp.id_SanPham = ?
        ORDER BY kc.Ten, ms.Ten`,
      [productId]
    );

    return variants;
  }

  async updateProductStatus(productId, status) {
    try {
      await db.execute(
        "UPDATE sanpham SET TrangThai = ?, NgayCapNhat = NOW() WHERE id = ?",
        [status, productId]
      );

      return {
        id: productId,
        message: `Trạng thái sản phẩm đã được cập nhật thành ${
          status === 1 ? "hoạt động" : "ngừng kinh doanh"
        }`,
      };
    } catch (error) {
      console.error("Error updating product status:", error);
      throw new Error(
        "Không thể cập nhật trạng thái sản phẩm: " + error.message
      );
    }
  }

  async checkStockBeforeOrder(productId, soLuong) {
    try {
      // Lấy thông tin chi tiết sản phẩm và kiểm tra trạng thái sản phẩm
      const [product] = await db.execute(
        `SELECT cts.id, sp.TrangThai 
             FROM chitietsanpham cts
             INNER JOIN sanpham sp ON cts.id_SanPham = sp.id
             WHERE sp.id = ? AND sp.TrangThai = 1
             LIMIT 1`,
        [productId]
      );

      if (!product.length) {
        throw new Error(
          "Không tìm thấy sản phẩm hoặc sản phẩm đã bị vô hiệu hóa"
        );
      }

      const chiTietSanPhamId = product[0].id;

      // Gọi stored procedure kiểm tra tồn kho
      const [result] = await db.execute(
        "CALL sp_KiemTraTonKho(?, ?, @p_TonKho, @p_CoTheBan)",
        [chiTietSanPhamId, soLuong]
      );

      // Lấy kết quả từ biến session
      const [stockResult] = await db.execute(
        "SELECT @p_TonKho as tonKho, @p_CoTheBan as coTheBan"
      );

      return {
        tonKho: stockResult[0].tonKho,
        coTheBan: stockResult[0].coTheBan === 1,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProductStatusIfOutOfStock(productId) {
    try {
      const [result] = await db.execute(
        `SELECT TonKho FROM chitietsanpham WHERE id_SanPham = ?`,
        [productId]
      );

      const totalStock = result.reduce((sum, item) => sum + item.TonKho, 0);
      if (totalStock === 0) {
        await db.execute(`UPDATE sanpham SET TrangThai = 0 WHERE id = ?`, [
          productId,
        ]);
      }
    } catch (error) {
      throw new Error("Lỗi khi cập nhật trạng thái sản phẩm: " + error.message);
    }
  }

  // Phương thức mới: Cập nhật tồn kho sau khi bán hàng
  async updateStockAfterSale(chiTietSanPhamId, soLuong) {
    try {
      await db.beginTransaction();

      // Cập nhật tồn kho
      const [result] = await db.execute(
        `UPDATE chitietsanpham 
         SET TonKho = TonKho - ? 
         WHERE id = ? AND TonKho >= ?`,
        [soLuong, chiTietSanPhamId, soLuong]
      );

      if (result.affectedRows === 0) {
        throw new Error("Không đủ số lượng tồn kho");
      }

      // Kiểm tra và cập nhật trạng thái sản phẩm
      await this.updateProductStatusIfOutOfStock(chiTietSanPhamId);

      await db.commit();
      return true;
    } catch (error) {
      await db.rollback();
      throw new Error("Lỗi khi cập nhật tồn kho: " + error.message);
    }
  }

  // Phương thức mới: Kiểm tra tồn kho cho nhiều sản phẩm
  async checkMultipleProductsStock(products) {
    try {
      const stockChecks = await Promise.all(
        products.map(async (product) => {
          const { id_ChiTietSanPham, soLuong } = product;
          const stockInfo = await this.checkStockBeforeOrder(
            id_ChiTietSanPham,
            soLuong
          );
          return {
            id_ChiTietSanPham,
            soLuong,
            ...stockInfo,
          };
        })
      );

      const insufficientStock = stockChecks.filter((check) => !check.coTheBan);
      if (insufficientStock.length > 0) {
        throw new Error("Một số sản phẩm không đủ tồn kho");
      }

      return stockChecks;
    } catch (error) {
      throw new Error("Lỗi khi kiểm tra tồn kho: " + error.message);
    }
  }

  // Phương thức mới: Cập nhật trạng thái sản phẩm dựa trên tồn kho
  async updateProductStatusIfOutOfStock(chiTietSanPhamId) {
    try {
      // Lấy thông tin sản phẩm
      const [productInfo] = await db.execute(
        `SELECT sp.id as id_SanPham, 
                (SELECT SUM(TonKho) FROM chitietsanpham WHERE id_SanPham = sp.id AND TrangThai = 1) as tongTonKho
         FROM chitietsanpham ctsp
         JOIN sanpham sp ON ctsp.id_SanPham = sp.id
         WHERE ctsp.id = ?`,
        [chiTietSanPhamId]
      );

      if (productInfo.length > 0) {
        const { id_SanPham, tongTonKho } = productInfo[0];

        // Cập nhật trạng thái sản phẩm dựa trên tổng tồn kho
        await db.execute(
          `UPDATE sanpham 
           SET TrangThai = ?, 
               NgayCapNhat = NOW() 
           WHERE id = ?`,
          [tongTonKho > 0 ? 1 : 0, id_SanPham]
        );
      }
    } catch (error) {
      throw new Error("Lỗi khi cập nhật trạng thái sản phẩm: " + error.message);
    }
  }

  // Phương thức mới: Lấy thông tin tồn kho chi tiết
  async getProductStockInfo(chiTietSanPhamId) {
    try {
      const [stockInfo] = await db.execute(
        `SELECT ctsp.*, sp.Ten as tenSanPham, 
                kc.Ten as tenKichCo, ms.Ten as tenMauSac,
                sp.TrangThai as trangThaiSanPham
         FROM chitietsanpham ctsp
         JOIN sanpham sp ON ctsp.id_SanPham = sp.id
         JOIN kichco kc ON ctsp.id_KichCo = kc.id
         JOIN mausac ms ON ctsp.id_MauSac = ms.id
         WHERE ctsp.id = ?`,
        [chiTietSanPhamId]
      );

      if (stockInfo.length === 0) {
        throw new Error("Không tìm thấy thông tin sản phẩm");
      }

      return stockInfo[0];
    } catch (error) {
      throw new Error("Lỗi khi lấy thông tin tồn kho: " + error.message);
    }
  }
}

module.exports = new ProductService();
