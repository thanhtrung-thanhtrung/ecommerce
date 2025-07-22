const {
  Product,
  ProductDetail,
  Category,
  Brand,
  Supplier,
  Size,
  Color,
  Review,
  User,
  Order,
  OrderDetail,
  Cart,
  ImportReceipt,
  ImportReceiptDetail,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const cloudinaryUtil = require("../utils/cloudinary.util");

class ProductService {
  async getAllProducts(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Lấy products với associations
    const { rows: products, count: total } = await Product.findAndCountAll({
      where: { TrangThai: 1 },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "Ten"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "Ten"],
        },
        {
          model: ProductDetail,
          as: "productDetails",
          include: [
            {
              model: Size,
              as: "size",
              attributes: ["id", "Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["id", "Ten", "MaMau"],
            },
          ],
        },
        {
          model: Review,
          as: "reviews",
          where: { TrangThai: 1 },
          required: false,
          attributes: ["SoSao"],
        },
      ],
      limit,
      offset,
      order: [["NgayTao", "DESC"]],
      distinct: true,
    });

    // Tính toán điểm đánh giá và số lượt đánh giá
    const productsWithRating = products.map((product) => {
      const productData = product.toJSON();
      const reviews = productData.reviews || [];

      productData.diemDanhGia =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.SoSao, 0) / reviews.length
          : null;
      productData.luotDanhGia = reviews.length;
      productData.tenDanhMuc = productData.category?.Ten;
      productData.tenThuongHieu = productData.brand?.Ten;
      productData.bienThe =
        productData.productDetails?.map((detail) => ({
          ...detail,
          tenKichCo: detail.size?.Ten,
          tenMau: detail.color?.Ten,
        })) || [];

      // Cleanup
      delete productData.reviews;
      delete productData.productDetails;

      return productData;
    });

    return {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async searchProducts(searchData, page = 1, limit = 10) {
    const { tuKhoa, id_DanhMuc, id_ThuongHieu, giaMin, giaMax } = searchData;
    const offset = (page - 1) * limit;

    // Xây dựng where conditions
    const whereConditions = { TrangThai: 1 };

    if (tuKhoa) {
      whereConditions[Op.or] = [
        { Ten: { [Op.like]: `%${tuKhoa}%` } },
        { MoTa: { [Op.like]: `%${tuKhoa}%` } },
      ];
    }

    if (id_DanhMuc) {
      whereConditions.id_DanhMuc = id_DanhMuc;
    }

    if (id_ThuongHieu) {
      whereConditions.id_ThuongHieu = id_ThuongHieu;
    }

    if (giaMin) {
      whereConditions.Gia = { ...whereConditions.Gia, [Op.gte]: giaMin };
    }

    if (giaMax) {
      whereConditions.Gia = { ...whereConditions.Gia, [Op.lte]: giaMax };
    }

    const { rows: products, count: total } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "Ten"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "Ten"],
        },
        {
          model: ProductDetail,
          as: "productDetails",
          include: [
            {
              model: Size,
              as: "size",
              attributes: ["id", "Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["id", "Ten", "MaMau"],
            },
          ],
        },
        {
          model: Review,
          as: "reviews",
          where: { TrangThai: 1 },
          required: false,
          attributes: ["SoSao"],
        },
      ],
      limit,
      offset,
      distinct: true,
    });

    // Tính toán điểm đánh giá và format data
    const productsWithRating = products.map((product) => {
      const productData = product.toJSON();
      const reviews = productData.reviews || [];

      productData.diemDanhGia =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.SoSao, 0) / reviews.length
          : null;
      productData.luotDanhGia = reviews.length;
      productData.tenDanhMuc = productData.category?.Ten;
      productData.tenThuongHieu = productData.brand?.Ten;
      productData.bienThe =
        productData.productDetails?.map((detail) => ({
          ...detail,
          tenKichCo: detail.size?.Ten,
          tenMau: detail.color?.Ten,
        })) || [];

      // Cleanup
      delete productData.reviews;
      delete productData.productDetails;

      return productData;
    });

    return {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async getProductDetail(productId) {
    try {
      const product = await Product.findOne({
        where: { id: productId, TrangThai: 1 },
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "Ten"],
          },
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "Ten"],
          },
          {
            model: ProductDetail,
            as: "productDetails",
            include: [
              {
                model: Size,
                as: "size",
                attributes: ["id", "Ten"],
              },
              {
                model: Color,
                as: "color",
                attributes: ["id", "Ten", "MaMau"],
              },
            ],
          },
          {
            model: Review,
            as: "reviews",
            where: { TrangThai: 1 },
            required: false,
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "HoTen", "Avatar"],
              },
            ],
            order: [["NgayDanhGia", "DESC"]],
          },
        ],
      });

      if (!product) {
        throw new Error("Sản phẩm không tồn tại");
      }

      const productData = product.toJSON();

      // Parse ThongSoKyThuat một cách an toàn
      try {
        if (
          productData.ThongSoKyThuat &&
          typeof productData.ThongSoKyThuat === "string"
        ) {
          productData.ThongSoKyThuat = JSON.parse(productData.ThongSoKyThuat);
        }
      } catch (error) {
        console.error(
          "Error parsing ThongSoKyThuat for product",
          productId,
          ":",
          error
        );
        productData.ThongSoKyThuat = {};
      }

      // Parse HinhAnh một cách an toàn
      try {
        if (productData.HinhAnh && typeof productData.HinhAnh === "string") {
          productData.HinhAnh = JSON.parse(productData.HinhAnh);
        }
      } catch (error) {
        console.error(
          "Error parsing HinhAnh for product",
          productId,
          ":",
          error
        );
        productData.HinhAnh = {
          anhChinh: null,
          anhChinh_public_id: null,
          anhPhu: [],
          anhPhu_public_ids: [],
        };
      }

      // Tính toán tồn kho real-time cho từng biến thể bằng Sequelize
      if (
        productData.productDetails &&
        Array.isArray(productData.productDetails)
      ) {
        for (let variant of productData.productDetails) {
          try {
            // Tính tổng số lượng nhập từ phiếu nhập
            const totalImported =
              (await ImportReceiptDetail.sum("SoLuong", {
                where: { id_ChiTietSanPham: variant.id },
                include: [
                  {
                    model: ImportReceipt,
                    as: "importReceipt",
                    where: { TrangThai: 2 }, // Chỉ tính phiếu nhập đã xác nhận
                  },
                ],
              })) || 0;

            // Tính tổng số lượng đã bán từ đơn hàng hoàn thành
            const totalSold =
              (await OrderDetail.sum("SoLuong", {
                where: { id_ChiTietSanPham: variant.id },
                include: [
                  {
                    model: Order,
                    as: "order",
                    where: { TrangThai: 4 }, // Chỉ tính đơn hàng đã hoàn thành
                  },
                ],
              })) || 0;

            // Tính số lượng đang chờ xử lý (đơn hàng chờ xác nhận)
            const pendingOrders =
              (await OrderDetail.sum("SoLuong", {
                where: { id_ChiTietSanPham: variant.id },
                include: [
                  {
                    model: Order,
                    as: "order",
                    where: { TrangThai: 1 }, // Đơn hàng chờ xác nhận
                  },
                ],
              })) || 0;

            // Tính tồn kho thực tế
            const realStock = Math.max(0, totalImported - totalSold);
            const availableStock = Math.max(0, realStock - pendingOrders);

            variant.TonKho = realStock;
            variant.SoLuongDangCho = pendingOrders;
            variant.CoTheBan = availableStock;
            variant.tenKichCo = variant.size?.Ten || "";
            variant.tenMau = variant.color?.Ten || "";
          } catch (stockError) {
            console.error(
              "Error calculating stock for variant",
              variant.id,
              ":",
              stockError
            );
            // Set default values if calculation fails
            variant.TonKho = 0;
            variant.SoLuongDangCho = 0;
            variant.CoTheBan = 0;
            variant.tenKichCo = variant.size?.Ten || "";
            variant.tenMau = variant.color?.Ten || "";
          }
        }
      }

      // Tính điểm đánh giá
      const reviews = productData.reviews || [];
      productData.diemDanhGia =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.SoSao, 0) / reviews.length
          : null;
      productData.luotDanhGia = reviews.length;
      productData.tenDanhMuc = productData.category?.Ten || "";
      productData.tenThuongHieu = productData.brand?.Ten || "";
      productData.bienThe = productData.productDetails || [];
      productData.danhGia = reviews.map((review) => ({
        ...review,
        avatar: review.user?.Avatar,
      }));

      // Lấy sản phẩm liên quan
      try {
        const relatedProducts = await Product.findAll({
          where: {
            id_DanhMuc: product.id_DanhMuc,
            id: { [Op.ne]: productId },
            TrangThai: 1,
          },
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "Ten"],
            },
            {
              model: Brand,
              as: "brand",
              attributes: ["id", "Ten"],
            },
            {
              model: Review,
              as: "reviews",
              where: { TrangThai: 1 },
              required: false,
              attributes: ["SoSao"],
            },
          ],
          limit: 4,
        });

        productData.sanPhamLienQuan = relatedProducts.map((relatedProduct) => {
          const relatedData = relatedProduct.toJSON();
          const relatedReviews = relatedData.reviews || [];

          relatedData.diemDanhGia =
            relatedReviews.length > 0
              ? relatedReviews.reduce((sum, r) => sum + r.SoSao, 0) /
                relatedReviews.length
              : null;
          relatedData.tenDanhMuc = relatedData.category?.Ten || "";
          relatedData.tenThuongHieu = relatedData.brand?.Ten || "";

          delete relatedData.reviews;
          return relatedData;
        });
      } catch (relatedError) {
        console.error("Error getting related products:", relatedError);
        productData.sanPhamLienQuan = [];
      }

      // Cleanup
      delete productData.productDetails;
      delete productData.reviews;

      return productData;
    } catch (error) {
      console.error(
        "Error in getProductDetail for product",
        productId,
        ":",
        error
      );
      throw new Error("Không thể lấy chi tiết sản phẩm: " + error.message);
    }
  }

  async reviewProduct(productId, userId, reviewData) {
    const { noiDung, diem } = reviewData;

    // Kiểm tra đã mua sản phẩm chưa
    const orders = await Order.findAll({
      include: [
        {
          model: OrderDetail,
          as: "orderDetails",
          include: [
            {
              model: ProductDetail,
              as: "productDetail",
              where: { id_SanPham: productId },
            },
          ],
        },
      ],
      where: {
        id_NguoiMua: userId,
        TrangThai: 4, // Đã hoàn thành
      },
    });

    if (orders.length === 0) {
      throw new Error("Bạn cần mua sản phẩm trước khi đánh giá");
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await Review.findOne({
      where: {
        id_NguoiDung: userId,
        id_SanPham: productId,
      },
    });

    if (existingReview) {
      throw new Error("Bạn đã đánh giá sản phẩm này");
    }

    // Tạo đánh giá mới
    await Review.create({
      id_SanPham: productId,
      id_NguoiDung: userId,
      NoiDung: noiDung,
      SoSao: diem,
      NgayDanhGia: new Date(),
      TrangThai: 1,
    });

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

    const transaction = await sequelize.transaction();

    try {
      // Khởi tạo imageData với structure chuẩn
      let imageData = {
        anhChinh: null,
        anhChinh_public_id: null,
        anhPhu: [],
        anhPhu_public_ids: [],
      };

      // Upload hình ảnh lên Cloudinary (nếu có)
      if (hinhAnh) {
        // Xử lý ảnh chính
        if (hinhAnh.anhChinh) {
          try {
            const anhChinh = await cloudinaryUtil.uploadImage(
              hinhAnh.anhChinh,
              "shoes_shop/products"
            );
            imageData.anhChinh = anhChinh.url;
            imageData.anhChinh_public_id = anhChinh.public_id;
          } catch (error) {
            console.error("Error uploading main image:", error);
            throw new Error("Lỗi khi upload ảnh chính: " + error.message);
          }
        }

        // Xử lý ảnh phụ
        if (
          hinhAnh.anhPhu &&
          Array.isArray(hinhAnh.anhPhu) &&
          hinhAnh.anhPhu.length > 0
        ) {
          try {
            const anhPhuResults = await cloudinaryUtil.uploadMultipleImages(
              hinhAnh.anhPhu,
              "shoes_shop/products"
            );
            imageData.anhPhu = anhPhuResults.map((img) => img.url);
            imageData.anhPhu_public_ids = anhPhuResults.map(
              (img) => img.public_id
            );
          } catch (error) {
            console.error("Error uploading sub images:", error);
            throw new Error("Lỗi khi upload ảnh phụ: " + error.message);
          }
        }
      }

      // Tạo sản phẩm mới - STRINGIFY cả ThongSoKyThuat và HinhAnh
      const newProduct = await Product.create(
        {
          Ten,
          MoTa,
          MoTaChiTiet,
          ThongSoKyThuat: JSON.stringify(ThongSoKyThuat), // Stringify ThongSoKyThuat
          Gia,
          GiaKhuyenMai: GiaKhuyenMai || null,
          id_DanhMuc,
          id_ThuongHieu,
          id_NhaCungCap,
          HinhAnh: JSON.stringify(imageData), // Stringify HinhAnh
          TrangThai: 1,
          NgayTao: new Date(),
        },
        { transaction }
      );

      // Thêm các biến thể sản phẩm
      if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
        const variantData = bienThe.map((variant) => ({
          id_SanPham: newProduct.id,
          id_KichCo: variant.id_KichCo,
          id_MauSac: variant.id_MauSac,
          MaSanPham: variant.MaSanPham,
        }));

        await ProductDetail.bulkCreate(variantData, { transaction });
      }

      await transaction.commit();

      return {
        id: newProduct.id,
        message: "Sản phẩm đã được tạo thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating product:", error);
      throw new Error("Không thể tạo sản phẩm: " + error.message);
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

    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra sản phẩm có tồn tại không
      const currentProduct = await Product.findByPk(productId, { transaction });

      if (!currentProduct) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Parse current image data và đảm bảo có cấu trúc chuẩn
      let currentImageData = currentProduct.HinhAnh || {};

      // Nếu HinhAnh là string, parse nó
      if (typeof currentImageData === "string") {
        try {
          currentImageData = JSON.parse(currentImageData);
        } catch (error) {
          console.error("Error parsing current image data:", error);
          currentImageData = {};
        }
      }

      // Khởi tạo newImageData với structure chuẩn
      let newImageData = {
        anhChinh: currentImageData.anhChinh || null,
        anhChinh_public_id: currentImageData.anhChinh_public_id || null,
        anhPhu: currentImageData.anhPhu || [],
        anhPhu_public_ids: currentImageData.anhPhu_public_ids || [],
      };

      // Xử lý cập nhật hình ảnh nếu có
      if (hinhAnh) {
        // Xử lý ảnh chính
        if (hinhAnh.anhChinh) {
          try {
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
          } catch (error) {
            console.error("Error updating main image:", error);
            throw new Error("Lỗi khi cập nhật ảnh chính: " + error.message);
          }
        }

        // Xử lý ảnh phụ
        if (
          hinhAnh.anhPhu &&
          Array.isArray(hinhAnh.anhPhu) &&
          hinhAnh.anhPhu.length > 0
        ) {
          try {
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
          } catch (error) {
            console.error("Error updating sub images:", error);
            throw new Error("Lỗi khi cập nhật ảnh phụ: " + error.message);
          }
        }
      }

      // Cập nhật thông tin sản phẩm - STRINGIFY cả ThongSoKyThuat và HinhAnh
      await currentProduct.update(
        {
          Ten,
          MoTa,
          MoTaChiTiet,
          ThongSoKyThuat: JSON.stringify(ThongSoKyThuat), // Stringify ThongSoKyThuat
          Gia,
          GiaKhuyenMai: GiaKhuyenMai || null,
          id_DanhMuc,
          id_ThuongHieu,
          id_NhaCungCap,
          HinhAnh: JSON.stringify(newImageData), // Stringify HinhAnh
          TrangThai: TrangThai || 1,
          NgayCapNhat: new Date(),
        },
        { transaction }
      );

      // Cập nhật biến thể sản phẩm nếu có
      if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
        // Xóa tất cả biến thể cũ
        await ProductDetail.destroy({
          where: { id_SanPham: productId },
          transaction,
        });

        // Thêm biến thể mới
        const variantData = bienThe.map((variant) => ({
          id_SanPham: productId,
          id_KichCo: variant.id_KichCo,
          id_MauSac: variant.id_MauSac,
          MaSanPham: variant.MaSanPham,
        }));

        await ProductDetail.bulkCreate(variantData, { transaction });
      }

      await transaction.commit();

      return {
        id: productId,
        message: "Sản phẩm đã được cập nhật thành công",
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating product:", error);
      throw new Error("Không thể cập nhật sản phẩm: " + error.message);
    }
  }

  async updateProductInfo(productId, productData) {
    // ...existing code...
    // Tương tự updateProduct nhưng chỉ cập nhật thông tin cơ bản
    return this.updateProduct(productId, productData);
  }

  async getProductImageData(productId) {
    const product = await Product.findByPk(productId, {
      attributes: ["HinhAnh"],
    });
    return product ? JSON.parse(product.HinhAnh || "{}") : {};
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
    const existingVariants = await ProductDetail.findAll({
      where: { id_SanPham: productId },
    });

    const existingMap = new Map();
    for (const variant of existingVariants) {
      const key = `${variant.id_KichCo}-${variant.id_MauSac}`;
      existingMap.set(key, variant.id);
    }

    const transaction = await sequelize.transaction();

    try {
      // Cập nhật hoặc thêm mới biến thể
      for (const variant of variants) {
        const { id, id_KichCo, id_MauSac, MaSanPham } = variant;
        const key = `${id_KichCo}-${id_MauSac}`;

        if (id && existingMap.has(key)) {
          // Cập nhật biến thể hiện có
          await ProductDetail.update(
            { MaSanPham },
            { where: { id }, transaction }
          );
          existingMap.delete(key);
        } else {
          // Thêm biến thể mới
          await ProductDetail.create(
            {
              id_SanPham: productId,
              id_KichCo,
              id_MauSac,
              MaSanPham,
            },
            { transaction }
          );
        }
      }

      // Xóa các biến thể không còn sử dụng
      for (const variantId of existingMap.values()) {
        await ProductDetail.destroy({
          where: { id: variantId },
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      // Kiểm tra sản phẩm có tồn tại không
      const existingProduct = await Product.findByPk(productId);

      if (!existingProduct) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Kiểm tra sản phẩm có trong đơn hàng hay không
      const hasOrders = await this.checkProductInOrders(productId);

      if (hasOrders) {
        throw new Error(
          "Không thể xóa sản phẩm này vì đã có khách hàng mua. Bạn chỉ có thể ẩn sản phẩm bằng cách đổi trạng thái thành 'Ngừng bán'."
        );
      }

      // Nếu không có trong đơn hàng, thực hiện soft delete
      await existingProduct.update({
        TrangThai: 0,
        NgayCapNhat: new Date(),
      });

      return {
        success: true,
        message: "Xóa sản phẩm thành công",
        productName: existingProduct.Ten,
      };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  async checkProductInOrders(productId) {
    try {
      const count = await OrderDetail.count({
        include: [
          {
            model: ProductDetail,
            as: "productDetail",
            where: { id_SanPham: productId },
          },
        ],
      });

      return count > 0;
    } catch (error) {
      console.error("Error checking product in orders:", error);
      throw new Error("Lỗi khi kiểm tra sản phẩm trong đơn hàng");
    }
  }

  async getAllProductsAdmin(page = 1, limit = 10, search = "", status = null) {
    const offset = (page - 1) * limit;

    // Xây dựng where conditions
    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { Ten: { [Op.like]: `%${search}%` } },
        { MoTa: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status !== null) {
      whereConditions.TrangThai = status;
    }

    // Lấy products với subQuery: false để tránh vấn đề với GROUP BY
    const { rows: products, count } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "Ten"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "Ten"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "Ten"],
        },
        {
          model: ProductDetail,
          as: "productDetails",
          attributes: ["id"],
          required: false,
        },
      ],
      limit,
      offset,
      order: [["NgayTao", "DESC"]],
      distinct: true, // Đảm bảo count chính xác khi có JOIN
    });

    // Format data và tính số biến thể
    const formattedProducts = products.map((product) => {
      const productData = product.toJSON();
      productData.tenDanhMuc = productData.category?.Ten;
      productData.tenThuongHieu = productData.brand?.Ten;
      productData.tenNhaCungCap = productData.supplier?.Ten;
      productData.soBienThe = productData.productDetails?.length || 0;

      // Cleanup
      delete productData.category;
      delete productData.brand;
      delete productData.supplier;
      delete productData.productDetails;

      return productData;
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total: count,
      },
    };
  }

  async updateProductStatus(productId, status) {
    try {
      const existingProduct = await Product.findByPk(productId);

      if (!existingProduct) {
        throw new Error("Sản phẩm không tồn tại");
      }

      await existingProduct.update({
        TrangThai: status,
        NgayCapNhat: new Date(),
      });

      return {
        success: true,
        message: status === 1 ? "Đã kích hoạt sản phẩm" : "Đã ẩn sản phẩm",
        productName: existingProduct.Ten,
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
      const colors = await Color.findAll({
        attributes: ["id", "Ten", "MaMau"],
        order: [["id", "ASC"]],
      });
      return colors;
    } catch (error) {
      console.error("Error getting colors:", error);
      throw new Error("Không thể lấy danh sách màu sắc");
    }
  }

  async getColorById(colorId) {
    try {
      const color = await Color.findByPk(colorId, {
        attributes: ["id", "Ten", "MaMau"],
      });

      if (!color) {
        throw new Error("Màu sắc không tồn tại");
      }
      return color;
    } catch (error) {
      console.error("Error getting color by ID:", error);
      throw new Error("Không thể lấy thông tin màu sắc");
    }
  }

  async getAllSizes() {
    try {
      const sizes = await Size.findAll({
        attributes: ["id", "Ten"],
        order: [[sequelize.cast(sequelize.col("Ten"), "UNSIGNED"), "ASC"]],
      });
      return sizes;
    } catch (error) {
      console.error("Error getting sizes:", error);
      throw new Error("Không thể lấy danh sách kích cỡ");
    }
  }

  async createColor(colorData) {
    try {
      const { Ten, MaMau } = colorData;
      const newColor = await Color.create({ Ten, MaMau });

      return {
        id: newColor.id,
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
      const newSize = await Size.create({ Ten });

      return {
        id: newSize.id,
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
      await Color.update({ Ten, MaMau }, { where: { id: colorId } });

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
      await Size.update({ Ten }, { where: { id: sizeId } });

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
      const usage = await ProductDetail.count({
        where: { id_MauSac: colorId },
      });

      if (usage > 0) {
        throw new Error(
          "Không thể xóa màu sắc này vì đang được sử dụng trong sản phẩm"
        );
      }

      await Color.destroy({ where: { id: colorId } });

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
      const usage = await ProductDetail.count({
        where: { id_KichCo: sizeId },
      });

      if (usage > 0) {
        throw new Error(
          "Không thể xóa kích cỡ này vì đang được sử dụng trong sản phẩm"
        );
      }

      await Size.destroy({ where: { id: sizeId } });

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
    const variants = await ProductDetail.findAll({
      where: { id_SanPham: productId },
      include: [
        {
          model: Size,
          as: "size",
          attributes: ["id", "Ten"],
        },
        {
          model: Color,
          as: "color",
          attributes: ["id", "Ten", "MaMau"],
        },
      ],
    });

    return variants.map((variant) => {
      const variantData = variant.toJSON();
      variantData.tenKichCo = variantData.size?.Ten;
      variantData.tenMauSac = variantData.color?.Ten;
      return variantData;
    });
  }

  // Lấy tồn kho real-time cho biến thể sản phẩm bằng Sequelize
  async getProductStockInfo(productId) {
    try {
      const productDetails = await ProductDetail.findAll({
        where: { id_SanPham: productId },
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["Ten"],
          },
          {
            model: Size,
            as: "size",
            attributes: ["Ten"],
          },
          {
            model: Color,
            as: "color",
            attributes: ["Ten", "MaMau"],
          },
        ],
      });

      const stockInfo = [];

      for (const variant of productDetails) {
        // Tính tổng số lượng nhập
        const totalImported =
          (await ImportReceiptDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: variant.id },
            include: [
              {
                model: ImportReceipt,
                as: "importReceipt",
                where: { TrangThai: 2 },
              },
            ],
          })) || 0;

        // Tính tổng số lượng đã bán
        const totalSold =
          (await OrderDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: variant.id },
            include: [
              {
                model: Order,
                as: "order",
                where: { TrangThai: 4 },
              },
            ],
          })) || 0;

        // Tính số lượng đang chờ
        const pendingOrders =
          (await OrderDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: variant.id },
            include: [
              {
                model: Order,
                as: "order",
                where: { TrangThai: 1 },
              },
            ],
          })) || 0;

        const realStock = Math.max(0, totalImported - totalSold);
        const availableStock = Math.max(0, realStock - pendingOrders);

        stockInfo.push({
          id: variant.id,
          MaSanPham: variant.MaSanPham,
          TenSanPham: variant.product.Ten,
          TenKichCo: variant.size.Ten,
          TenMauSac: variant.color.Ten,
          TonKhoThucTe: realStock,
          SoLuongDangCho: pendingOrders,
          CoTheBan: availableStock,
        });
      }

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

  // Kiểm tra tồn kho trước khi đặt hàng bằng Sequelize
  async checkStockBeforeOrder(productVariantId, requestedQuantity) {
    try {
      const variant = await ProductDetail.findByPk(productVariantId, {
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["Ten"],
          },
          {
            model: Size,
            as: "size",
            attributes: ["Ten"],
          },
          {
            model: Color,
            as: "color",
            attributes: ["Ten"],
          },
        ],
      });

      if (!variant) {
        throw new Error("Biến thể sản phẩm không tồn tại");
      }

      // Tính tổng số lượng nhập
      const totalImported =
        (await ImportReceiptDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: productVariantId },
          include: [
            {
              model: ImportReceipt,
              as: "importReceipt",
              where: { TrangThai: 2 },
            },
          ],
        })) || 0;

      // Tính tổng số lượng đã bán
      const totalSold =
        (await OrderDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: productVariantId },
          include: [
            {
              model: Order,
              as: "order",
              where: { TrangThai: 4 },
            },
          ],
        })) || 0;

      // Tính số lượng đang chờ
      const pendingOrders =
        (await OrderDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: productVariantId },
          include: [
            {
              model: Order,
              as: "order",
              where: { TrangThai: 1 },
            },
          ],
        })) || 0;

      const realStock = Math.max(0, totalImported - totalSold);
      const availableStock = Math.max(0, realStock - pendingOrders);
      const canSell = availableStock >= requestedQuantity;

      return {
        success: true,
        data: {
          id_ChiTietSanPham: variant.id,
          TenSanPham: variant.product.Ten,
          MaSanPham: variant.MaSanPham,
          KichCo: variant.size.Ten,
          MauSac: variant.color.Ten,
          TonKhoThucTe: realStock,
          SoLuongCanKiem: requestedQuantity,
          SoLuongDangCho: pendingOrders,
          SoLuongCoTheBan: availableStock,
          CoTheBan: canSell,
          isAvailable: canSell,
          message: canSell
            ? "Có thể đặt hàng"
            : `Không đủ hàng. Tồn kho: ${realStock}, Đang chờ: ${pendingOrders}, Còn lại: ${availableStock}`,
        },
      };
    } catch (error) {
      console.error("Error checking stock before order:", error);
      throw new Error("Không thể kiểm tra tồn kho: " + error.message);
    }
  }

  // Thêm method để lấy tồn kho đơn giản cho một variant
  async getVariantStock(variantId) {
    try {
      // Tính tổng số lượng nhập
      const totalImported =
        (await ImportReceiptDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: variantId },
          include: [
            {
              model: ImportReceipt,
              as: "importReceipt",
              where: { TrangThai: 2 },
            },
          ],
        })) || 0;

      // Tính tổng số lượng đã bán
      const totalSold =
        (await OrderDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: variantId },
          include: [
            {
              model: Order,
              as: "order",
              where: { TrangThai: 4 },
            },
          ],
        })) || 0;

      // Tính số lượng đang chờ
      const pendingOrders =
        (await OrderDetail.sum("SoLuong", {
          where: { id_ChiTietSanPham: variantId },
          include: [
            {
              model: Order,
              as: "order",
              where: { TrangThai: 1 },
            },
          ],
        })) || 0;

      const realStock = Math.max(0, totalImported - totalSold);
      const availableStock = Math.max(0, realStock - pendingOrders);

      return {
        totalImported,
        totalSold,
        pendingOrders,
        realStock,
        availableStock,
      };
    } catch (error) {
      console.error("Error getting variant stock:", error);
      throw new Error("Không thể lấy tồn kho variant: " + error.message);
    }
  }

  // ...existing code...
}

module.exports = new ProductService();
