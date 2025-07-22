const {
  ImportReceipt,
  ImportReceiptDetail,
  ProductDetail,
  Product,
  Size,
  Color,
  Brand,
  Category,
  Supplier,
  User,
  Order,
  OrderDetail,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

class InventoryService {
  // Constants cho trạng thái đơn hàng theo database schema
  static ORDER_STATUS = {
    PENDING: 1, // Chờ xác nhận - KHÔNG trừ tồn kho
    CONFIRMED: 2, // Đã xác nhận - ĐÃ trừ tồn kho
    SHIPPING: 3, // Đang giao - ĐÃ trừ tồn kho
    DELIVERED: 4, // Đã giao - ĐÃ trừ tồn kho
    CANCELLED: 5, // Đã hủy - KHÔNG trừ tồn kho (hoàn lại nếu đã trừ)
  };

  // Kiểm tra trạng thái có cần trừ tồn kho không
  shouldDeductStock(status) {
    const statusesToDeduct = [
      this.constructor.ORDER_STATUS.CONFIRMED, // 2
      this.constructor.ORDER_STATUS.SHIPPING, // 3
      this.constructor.ORDER_STATUS.DELIVERED, // 4
    ];
    return statusesToDeduct.includes(parseInt(status));
  }

  // Cập nhật tồn kho khi thay đổi trạng thái đơn hàng - SỬ DỤNG SEQUELIZE
  async updateStockAfterOrderStatusChange(orderId, oldStatus, newStatus) {
    try {
      // Lấy chi tiết đơn hàng sử dụng Sequelize
      const orderItems = await OrderDetail.findAll({
        where: { id_DonHang: orderId },
        attributes: ["id_ChiTietSanPham", "SoLuong"],
      });

      if (orderItems.length === 0) {
        throw new Error("Không tìm thấy chi tiết đơn hàng");
      }

      // Logic tồn kho được tính real-time từ database trigger và functions
      const shouldDeductOld = this.shouldDeductStock(oldStatus);
      const shouldDeductNew = this.shouldDeductStock(newStatus);

      let logMessage = "";
      if (!shouldDeductOld && shouldDeductNew) {
        logMessage = `Đơn hàng chuyển từ KHÔNG TRỪ (${oldStatus}) sang TRỪ tồn kho (${newStatus})`;
      } else if (shouldDeductOld && !shouldDeductNew) {
        logMessage = `Đơn hàng chuyển từ TRỪ (${oldStatus}) sang KHÔNG TRỪ tồn kho (${newStatus})`;
      } else {
        logMessage = `Đơn hàng giữ nguyên trạng thái ảnh hưởng tồn kho (${oldStatus} -> ${newStatus})`;
      }

      console.log(`[INVENTORY REAL-TIME] ${logMessage} - Đơn hàng #${orderId}`);

      // Lấy tồn kho real-time cho từng item
      for (const item of orderItems) {
        const stockInfo = await this.calculateRealTimeStock(
          item.id_ChiTietSanPham
        );
        console.log(
          `[INVENTORY REAL-TIME] Sản phẩm ${item.id_ChiTietSanPham}: Tồn kho hiện tại = ${stockInfo}`
        );
      }

      return {
        success: true,
        message: `Cập nhật trạng thái thành công: ${oldStatus} -> ${newStatus} (Real-time calculation)`,
        details: {
          orderId,
          oldStatus,
          newStatus,
          itemsUpdated: orderItems.length,
          note: "Tồn kho được tính real-time từ Sequelize aggregations, không cập nhật trực tiếp",
        },
      };
    } catch (error) {
      console.error("Error updating stock after order status change:", error);
      throw new Error("Không thể xử lý cập nhật tồn kho: " + error.message);
    }
  }

  // Tạo mã phiếu nhập tự động
  async generateMaPhieuNhap() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Lấy số phiếu nhập trong ngày sử dụng Sequelize
    const count = await ImportReceipt.count({
      where: sequelize.where(
        sequelize.fn("DATE", sequelize.col("NgayNhap")),
        sequelize.fn("CURDATE")
      ),
    });

    // Format: PN-YYMMDD-XXX (XXX là số thứ tự trong ngày)
    return `PN-${year}${month}${day}-${(count + 1)
      .toString()
      .padStart(3, "0")}`;
  }

  // Tạo phiếu nhập mới sử dụng Sequelize
  async createPhieuNhap(phieuNhapData, userId) {
    const { id_NhaCungCap, chiTietPhieuNhap, GhiChu } = phieuNhapData;
    const maPhieuNhap = await this.generateMaPhieuNhap();

    const transaction = await sequelize.transaction();

    try {
      const tongTien = chiTietPhieuNhap.reduce(
        (sum, item) => sum + item.SoLuong * item.GiaNhap,
        0
      );

      // Tạo phiếu nhập sử dụng Sequelize
      const newImportReceipt = await ImportReceipt.create(
        {
          MaPhieuNhap: maPhieuNhap,
          NgayNhap: new Date(),
          TongTien: tongTien,
          id_NhaCungCap,
          id_NguoiTao: userId,
          TrangThai: 1, // Chờ xác nhận
          GhiChu,
        },
        { transaction }
      );

      for (const item of chiTietPhieuNhap) {
        let {
          id_ChiTietSanPham,
          SoLuong,
          GiaNhap,
          id_SanPham,
          id_KichCo,
          id_MauSac,
          MaSanPham,
          bienThe,
        } = item;
        const thanhTien = SoLuong * GiaNhap;

        // Tạo biến thể mới nếu cần
        if (
          !id_ChiTietSanPham &&
          id_SanPham &&
          id_KichCo &&
          id_MauSac &&
          MaSanPham
        ) {
          const newVariant = await ProductDetail.create(
            {
              id_SanPham,
              id_KichCo,
              id_MauSac,
              MaSanPham,
            },
            { transaction }
          );
          id_ChiTietSanPham = newVariant.id;
        }

        // Xử lý nhiều biến thể
        if (bienThe && Array.isArray(bienThe) && bienThe.length > 0) {
          for (const variant of bienThe) {
            const {
              id_KichCo: variantSize,
              id_MauSac: variantColor,
              MaSanPham: variantCode,
              SoLuong: variantQty,
            } = variant;

            await ProductDetail.create(
              {
                id_SanPham,
                id_KichCo: variantSize,
                id_MauSac: variantColor,
                MaSanPham: variantCode,
              },
              { transaction }
            );
          }
        }

        // Thêm chi tiết phiếu nhập
        await ImportReceiptDetail.create(
          {
            id_PhieuNhap: newImportReceipt.id,
            id_ChiTietSanPham,
            SoLuong,
            GiaNhap,
            ThanhTien: thanhTien,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        success: true,
        message: "Tạo phiếu nhập thành công",
        data: { id: newImportReceipt.id, MaPhieuNhap: maPhieuNhap },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating phieu nhap:", error);
      throw new Error("Không thể tạo phiếu nhập: " + error.message);
    }
  }

  // Tạo phiếu nhập thông minh với tự động tạo/cập nhật biến thể - SEQUELIZE
  async createSmartPhieuNhap(phieuNhapData, userId) {
    const { id_NhaCungCap, chiTietPhieuNhap, GhiChu } = phieuNhapData;
    const maPhieuNhap = await this.generateMaPhieuNhap();

    const transaction = await sequelize.transaction();

    try {
      const tongTien = chiTietPhieuNhap.reduce((sum, item) => {
        return (
          sum +
          item.variants.reduce(
            (variantSum, variant) =>
              variantSum + variant.SoLuong * item.GiaNhap,
            0
          )
        );
      }, 0);

      // Tạo phiếu nhập
      const newImportReceipt = await ImportReceipt.create(
        {
          MaPhieuNhap: maPhieuNhap,
          NgayNhap: new Date(),
          TongTien: tongTien,
          id_NhaCungCap,
          id_NguoiTao: userId,
          TrangThai: 1,
          GhiChu,
        },
        { transaction }
      );

      for (const item of chiTietPhieuNhap) {
        const { id_SanPham, variants, GiaNhap } = item;

        for (const variant of variants) {
          const { id_KichCo, id_MauSac, SoLuong, MaSanPham } = variant;
          let id_ChiTietSanPham = null;

          // Tìm biến thể có sẵn sử dụng Sequelize
          const existingVariant = await ProductDetail.findOne({
            where: {
              id_SanPham,
              id_KichCo,
              id_MauSac,
            },
            transaction,
          });

          if (existingVariant) {
            // Biến thể đã tồn tại
            id_ChiTietSanPham = existingVariant.id;
          } else {
            // Tạo biến thể mới
            const newVariant = await ProductDetail.create(
              {
                id_SanPham,
                id_KichCo,
                id_MauSac,
                MaSanPham,
              },
              { transaction }
            );
            id_ChiTietSanPham = newVariant.id;
          }

          // Thêm chi tiết phiếu nhập
          const thanhTien = SoLuong * GiaNhap;
          await ImportReceiptDetail.create(
            {
              id_PhieuNhap: newImportReceipt.id,
              id_ChiTietSanPham,
              SoLuong,
              GiaNhap,
              ThanhTien: thanhTien,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: "Tạo phiếu nhập thông minh thành công",
        data: { id: newImportReceipt.id, MaPhieuNhap: maPhieuNhap },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating smart phieu nhap:", error);
      throw new Error("Không thể tạo phiếu nhập thông minh: " + error.message);
    }
  }

  // Tạo mã sản phẩm tự động cho biến thể - SEQUELIZE
  async generateVariantCode(productId, colorId, sizeId) {
    try {
      // Lấy thông tin sử dụng Sequelize include
      const product = await Product.findByPk(productId, {
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["Ten"],
          },
        ],
      });

      const color = await Color.findByPk(colorId);
      const size = await Size.findByPk(sizeId);

      if (!product || !color || !size) {
        throw new Error("Không thể tạo mã sản phẩm");
      }

      const { brand } = product;
      const ThuongHieu = brand?.Ten || "UNKNOWN";
      const MauSac = color.Ten;
      const KichCo = size.Ten;

      // Tạo mã theo format: THUONGHIEU-MAUSAC-KICHCO-TIMESTAMP
      const timestamp = Date.now().toString().slice(-4);
      const code = `${ThuongHieu.replace(
        /\s+/g,
        ""
      ).toUpperCase()}-${MauSac.replace(
        /\s+/g,
        ""
      ).toUpperCase()}-${KichCo}-${timestamp}`;

      return code;
    } catch (error) {
      // Fallback: tạo mã đơn giản
      return `SP${productId}-C${colorId}-S${sizeId}-${Date.now()
        .toString()
        .slice(-4)}`;
    }
  }

  // Thống kê tồn kho sử dụng Sequelize ORM
  async thongKeTonKho(query = {}) {
    try {
      let whereClause = {};
      let productWhereClause = { TrangThai: 1 };

      // Lọc theo danh mục
      if (query.danhMuc) {
        productWhereClause.id_DanhMuc = query.danhMuc;
      }

      // Lọc theo thương hiệu
      if (query.thuongHieu) {
        productWhereClause.id_ThuongHieu = query.thuongHieu;
      }

      // Xử lý tham số sapHet một cách chính xác
      const sapHet = query.sapHet === "true" || query.sapHet === true;
      const tatCa = query.tatCa === "true" || query.tatCa === true;

      // Query với Sequelize includes
      const productDetails = await ProductDetail.findAll({
        attributes: ["id", "MaSanPham"],
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "Ten", "HinhAnh", "Gia"],
            where: productWhereClause,
            include: [
              {
                model: Brand,
                as: "brand",
                attributes: ["Ten"],
              },
              {
                model: Category,
                as: "category",
                attributes: ["Ten"],
              },
            ],
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
        where: whereClause,
      });

      // Lấy tồn kho real-time cho từng sản phẩm
      const results = await Promise.all(
        productDetails.map(async (item) => {
          const tonKho = await this.calculateRealTimeStock(item.id);

          return {
            id: item.id,
            TenSanPham: item.product.Ten,
            HinhAnh: item.product.HinhAnh,
            TenThuongHieu: item.product.brand?.Ten || null,
            TenDanhMuc: item.product.category?.Ten || null,
            KichCo: item.size.Ten,
            MauSac: item.color.Ten,
            MaSanPham: item.MaSanPham,
            TonKho: tonKho,
            Gia: item.product.Gia,
          };
        })
      );

      // Filter sau khi đã có tồn kho real-time
      let filteredResults = results;

      if (sapHet) {
        // Chỉ lấy sản phẩm sắp hết hàng (≤ 10)
        filteredResults = results.filter(
          (item) => item.TonKho <= 10 && item.TonKho > 0
        );
      } else if (!tatCa) {
        // Mặc định: chỉ lấy sản phẩm còn hàng (>= 0)
        filteredResults = results.filter((item) => item.TonKho >= 0);
      }

      // Sắp xếp theo tồn kho tăng dần
      filteredResults.sort((a, b) => a.TonKho - b.TonKho);

      return {
        success: true,
        data: filteredResults,
        filter: {
          sapHet: sapHet,
          tatCa: tatCa,
          count: filteredResults.length,
        },
      };
    } catch (error) {
      throw new Error("Không thể thống kê tồn kho: " + error.message);
    }
  }

  // Kiểm tra số lượng tồn kho sử dụng Sequelize calculations
  async checkStock(productVariantId, requestedQuantity) {
    try {
      // Sử dụng Sequelize thay vì raw SQL
      const tonKho = await this.calculateRealTimeStock(productVariantId);
      const isAvailable = tonKho >= requestedQuantity;

      return {
        success: true,
        data: {
          tonKho,
          isAvailable,
          thieu: isAvailable ? 0 : requestedQuantity - tonKho,
        },
      };
    } catch (error) {
      throw new Error("Không thể kiểm tra tồn kho: " + error.message);
    }
  }

  // Cập nhật phiếu nhập sử dụng Sequelize
  async updatePhieuNhap(phieuNhapId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra phiếu nhập tồn tại
      const phieuNhap = await ImportReceipt.findByPk(phieuNhapId, {
        transaction,
      });

      if (!phieuNhap) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      // Cập nhật thông tin phiếu nhập
      const { GhiChu, TrangThai } = updateData;
      await phieuNhap.update(
        {
          GhiChu: GhiChu || phieuNhap.GhiChu,
          TrangThai: TrangThai || phieuNhap.TrangThai,
        },
        { transaction }
      );

      // Nếu phiếu nhập được xác nhận (TrangThai = 2), log thông tin
      if (TrangThai === 2 && phieuNhap.TrangThai !== 2) {
        await this.logImportConfirmation(phieuNhapId);
      }

      await transaction.commit();

      return {
        success: true,
        message: "Cập nhật phiếu nhập thành công",
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error("Không thể cập nhật phiếu nhập: " + error.message);
    }
  }

  // Log xác nhận phiếu nhập sử dụng Sequelize
  async logImportConfirmation(phieuNhapId) {
    try {
      // Lấy chi tiết phiếu nhập sử dụng Sequelize
      const chiTietList = await ImportReceiptDetail.findAll({
        where: { id_PhieuNhap: phieuNhapId },
        attributes: ["id_ChiTietSanPham", "SoLuong"],
      });

      console.log(
        `[INVENTORY REAL-TIME] Phiếu nhập #${phieuNhapId} đã được xác nhận. Tồn kho được tính real-time từ Sequelize.`
      );

      // Log chi tiết cho theo dõi
      for (const item of chiTietList) {
        const tonKhoSauNhap = await this.calculateRealTimeStock(
          item.id_ChiTietSanPham
        );
        console.log(
          `[INVENTORY REAL-TIME] Sản phẩm ${item.id_ChiTietSanPham}: +${item.SoLuong} (từ phiếu nhập), tồn kho hiện tại: ${tonKhoSauNhap}`
        );
      }

      return {
        success: true,
        message: "Phiếu nhập đã được xác nhận. Tồn kho được tính real-time.",
        itemsAffected: chiTietList.length,
      };
    } catch (error) {
      throw new Error("Không thể xử lý phiếu nhập: " + error.message);
    }
  }

  // Lấy danh sách phiếu nhập sử dụng Sequelize
  async getPhieuNhapList(query = {}) {
    try {
      const whereClause = {};

      // Lọc theo trạng thái
      if (query.trangThai) {
        whereClause.TrangThai = query.trangThai;
      }

      // Lọc theo nhà cung cấp
      if (query.nhaCungCap) {
        whereClause.id_NhaCungCap = query.nhaCungCap;
      }

      // Lọc theo thời gian
      if (query.tuNgay || query.denNgay) {
        const dateFilter = {};
        if (query.tuNgay) {
          dateFilter[Op.gte] = new Date(query.tuNgay);
        }
        if (query.denNgay) {
          dateFilter[Op.lte] = new Date(query.denNgay + " 23:59:59");
        }
        whereClause.NgayNhap = dateFilter;
      }

      const results = await ImportReceipt.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: "supplier",
            attributes: ["Ten"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["HoTen"],
          },
        ],
        order: [["NgayNhap", "DESC"]],
        attributes: [
          "id",
          "MaPhieuNhap",
          "NgayNhap",
          "TongTien",
          "TrangThai",
          "GhiChu",
        ],
      });

      return {
        success: true,
        data: results.map((item) => ({
          id: item.id,
          MaPhieuNhap: item.MaPhieuNhap,
          NgayNhap: item.NgayNhap,
          TongTien: item.TongTien,
          TrangThai: item.TrangThai,
          GhiChu: item.GhiChu,
          TenNhaCungCap: item.supplier?.Ten,
          NguoiTao: item.creator?.HoTen,
        })),
      };
    } catch (error) {
      throw new Error("Không thể lấy danh sách phiếu nhập: " + error.message);
    }
  }

  // Lấy chi tiết phiếu nhập sử dụng Sequelize
  async getPhieuNhapDetail(phieuNhapId) {
    try {
      // Lấy thông tin phiếu nhập
      const phieuNhap = await ImportReceipt.findByPk(phieuNhapId, {
        include: [
          {
            model: Supplier,
            as: "supplier",
            attributes: ["Ten"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["HoTen"],
          },
        ],
      });

      if (!phieuNhap) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      // Lấy chi tiết phiếu nhập
      const chiTiet = await ImportReceiptDetail.findAll({
        where: { id_PhieuNhap: phieuNhapId },
        include: [
          {
            model: ProductDetail,
            as: "productDetail",
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
          },
        ],
      });

      return {
        success: true,
        data: {
          phieuNhap: {
            ...phieuNhap.toJSON(),
            TenNhaCungCap: phieuNhap.supplier?.Ten,
            NguoiTao: phieuNhap.creator?.HoTen,
          },
          chiTiet: chiTiet.map((item) => ({
            ...item.toJSON(),
            TenSanPham: item.productDetail?.product?.Ten,
            KichCo: item.productDetail?.size?.Ten,
            MauSac: item.productDetail?.color?.Ten,
            MaSanPham: item.productDetail?.MaSanPham,
          })),
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy chi tiết phiếu nhập: " + error.message);
    }
  }

  // Thống kê nhập kho theo thời gian sử dụng Sequelize
  async thongKeNhapKhoTheoThoiGian(query = {}) {
    try {
      const whereClause = { TrangThai: 2 }; // Chỉ lấy phiếu đã xác nhận

      if (query.tuNgay || query.denNgay) {
        const dateFilter = {};
        if (query.tuNgay) {
          dateFilter[Op.gte] = new Date(query.tuNgay);
        }
        if (query.denNgay) {
          dateFilter[Op.lte] = new Date(query.denNgay + " 23:59:59");
        }
        whereClause.NgayNhap = dateFilter;
      }

      const results = await ImportReceipt.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn("DATE", sequelize.col("NgayNhap")), "NgayNhap"],
          [sequelize.fn("COUNT", sequelize.col("id")), "SoPhieuNhap"],
          [sequelize.fn("SUM", sequelize.col("TongTien")), "TongTien"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("id_NhaCungCap"))
            ),
            "SoNhaCungCap",
          ],
        ],
        group: [sequelize.fn("DATE", sequelize.col("NgayNhap"))],
        order: [[sequelize.fn("DATE", sequelize.col("NgayNhap")), "DESC"]],
        raw: true,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new Error("Không thể thống kê nhập kho: " + error.message);
    }
  }

  // Lấy lịch sử nhập kho của sản phẩm sử dụng Sequelize
  async getProductImportHistory(chiTietSanPhamId, query = {}) {
    try {
      const whereClause = {
        id_ChiTietSanPham: chiTietSanPhamId,
      };

      const includeClause = [
        {
          model: ImportReceipt,
          as: "importReceipt",
          attributes: ["MaPhieuNhap", "NgayNhap"],
          where: { TrangThai: 2 },
          include: [
            {
              model: Supplier,
              as: "supplier",
              attributes: ["Ten"],
            },
            {
              model: User,
              as: "creator",
              attributes: ["HoTen"],
            },
          ],
        },
      ];

      if (query.tuNgay || query.denNgay) {
        const dateFilter = {};
        if (query.tuNgay) {
          dateFilter[Op.gte] = new Date(query.tuNgay);
        }
        if (query.denNgay) {
          dateFilter[Op.lte] = new Date(query.denNgay + " 23:59:59");
        }
        includeClause[0].where.NgayNhap = dateFilter;
      }

      const results = await ImportReceiptDetail.findAll({
        where: whereClause,
        include: includeClause,
        order: [["importReceipt", "NgayNhap", "DESC"]],
        attributes: ["id", "SoLuong", "GiaNhap", "ThanhTien"],
      });

      return {
        success: true,
        data: results.map((item) => ({
          id: item.id,
          MaPhieuNhap: item.importReceipt?.MaPhieuNhap,
          NgayNhap: item.importReceipt?.NgayNhap,
          SoLuong: item.SoLuong,
          GiaNhap: item.GiaNhap,
          ThanhTien: item.ThanhTien,
          TenNhaCungCap: item.importReceipt?.supplier?.Ten,
          NguoiTao: item.importReceipt?.creator?.HoTen,
        })),
      };
    } catch (error) {
      throw new Error("Không thể lấy lịch sử nhập kho: " + error.message);
    }
  }

  // Tìm kiếm sản phẩm cho phiếu nhập sử dụng Sequelize
  async searchProductsForImport(query = {}) {
    try {
      const whereClause = { TrangThai: 1 };

      // Lọc theo danh mục
      if (query.danhMuc) {
        whereClause.id_DanhMuc = query.danhMuc;
      }

      // Lọc theo thương hiệu
      if (query.thuongHieu) {
        whereClause.id_ThuongHieu = query.thuongHieu;
      }

      // Tìm kiếm theo tên sản phẩm
      if (query.keyword) {
        whereClause.Ten = {
          [Op.like]: `%${query.keyword}%`,
        };
      }

      // Lọc theo nhà cung cấp
      if (query.nhaCungCap) {
        whereClause.id_NhaCungCap = query.nhaCungCap;
      }

      // Pagination
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["Ten"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["Ten"],
          },
          {
            model: Supplier,
            as: "supplier",
            attributes: ["Ten"],
          },
          {
            model: ProductDetail,
            as: "productDetails",
            attributes: ["id"],
            required: false,
          },
        ],
        attributes: [
          "id",
          "Ten",
          "Gia",
          "HinhAnh",
          [
            sequelize.fn("COUNT", sequelize.col("productDetails.id")),
            "SoBienTheHienTai",
          ],
        ],
        group: ["Product.id", "brand.id", "category.id", "supplier.id"],
        order: [["Ten", "ASC"]],
        limit,
        offset,
        subQuery: false,
        distinct: true,
      });

      return {
        success: true,
        data: products.map((product) => ({
          id: product.id,
          TenSanPham: product.Ten,
          Gia: product.Gia,
          HinhAnh: this.parseProductImage(product.HinhAnh),
          TenThuongHieu: product.brand?.Ten,
          TenDanhMuc: product.category?.Ten,
          TenNhaCungCap: product.supplier?.Ten,
          SoBienTheHienTai: product.getDataValue("SoBienTheHienTai") || 0,
        })),
        pagination: {
          page,
          limit,
          total: count.length || count,
          totalPages: Math.ceil((count.length || count) / limit),
        },
      };
    } catch (error) {
      throw new Error("Không thể tìm kiếm sản phẩm: " + error.message);
    }
  }

  // Lấy thông tin chi tiết sản phẩm và các biến thể hiện có sử dụng Sequelize
  async getProductVariantsForImport(productId) {
    try {
      // Lấy thông tin sản phẩm
      const product = await Product.findOne({
        where: { id: productId, TrangThai: 1 },
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["Ten"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["Ten"],
          },
          {
            model: Supplier,
            as: "supplier",
            attributes: ["Ten"],
          },
        ],
      });

      if (!product) {
        throw new Error("Sản phẩm không tồn tại");
      }

      // Lấy các biến thể hiện có
      const existingVariants = await ProductDetail.findAll({
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
        attributes: ["id", "MaSanPham"],
        order: [
          ["size", "Ten"],
          ["color", "Ten"],
        ],
      });

      // Lấy tồn kho real-time cho từng biến thể
      const variantsWithStock = await Promise.all(
        existingVariants.map(async (variant) => {
          const tonKho = await this.calculateRealTimeStock(variant.id);

          return {
            id: variant.id,
            MaSanPham: variant.MaSanPham,
            TonKho: tonKho,
            id_KichCo: variant.size?.id,
            TenKichCo: variant.size?.Ten,
            id_MauSac: variant.color?.id,
            TenMauSac: variant.color?.Ten,
            MaMau: variant.color?.MaMau,
          };
        })
      );

      // Lấy tất cả kích cỡ và màu sắc có sẵn
      const allSizes = await Size.findAll({
        order: [["Ten", "ASC"]],
      });

      const allColors = await Color.findAll({
        order: [["Ten", "ASC"]],
      });

      return {
        success: true,
        data: {
          product: {
            ...product.toJSON(),
            TenThuongHieu: product.brand?.Ten,
            TenDanhMuc: product.category?.Ten,
            TenNhaCungCap: product.supplier?.Ten,
            HinhAnh: this.parseProductImage(product.HinhAnh),
          },
          existingVariants: variantsWithStock,
          allSizes,
          allColors,
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy thông tin sản phẩm: " + error.message);
    }
  }

  // Kiểm tra tồn kho trước khi đặt hàng sử dụng Sequelize
  async checkStockBeforeOrder(orderItems) {
    try {
      const stockCheck = [];

      for (const { id_ChiTietSanPham, SoLuong } of orderItems) {
        // Lấy thông tin sản phẩm sử dụng Sequelize
        const productDetail = await ProductDetail.findOne({
          where: { id: id_ChiTietSanPham },
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

        if (!productDetail) {
          stockCheck.push({
            id_ChiTietSanPham,
            error: "Sản phẩm không tồn tại",
            isAvailable: false,
          });
          continue;
        }

        // Tính tồn kho và số lượng đang chờ
        const tonKhoThucTe = await this.calculateRealTimeStock(
          id_ChiTietSanPham
        );
        const soLuongDangCho = await this.calculatePendingQuantity(
          id_ChiTietSanPham
        );
        const coTheBan = tonKhoThucTe - soLuongDangCho >= SoLuong;

        stockCheck.push({
          id_ChiTietSanPham,
          TenSanPham: productDetail.product.Ten,
          MaSanPham: productDetail.MaSanPham,
          KichCo: productDetail.size.Ten,
          MauSac: productDetail.color.Ten,
          TonKhoThucTe: tonKhoThucTe,
          SoLuongCanBan: SoLuong,
          SoLuongDangCho: soLuongDangCho,
          CoTheBan: coTheBan,
          isAvailable: coTheBan,
          message: coTheBan
            ? "Có thể đặt hàng"
            : `Không đủ hàng. Tồn kho: ${tonKhoThucTe}, Đang chờ: ${soLuongDangCho}`,
        });
      }

      const allAvailable = stockCheck.every((item) => item.isAvailable);

      return {
        success: allAvailable,
        message: allAvailable
          ? "Tất cả sản phẩm đều có sẵn"
          : "Một số sản phẩm không đủ hàng",
        stockCheck,
      };
    } catch (error) {
      throw new Error("Không thể kiểm tra tồn kho: " + error.message);
    }
  }

  // Cập nhật phiếu nhập sử dụng Sequelize
  async updatePhieuNhap(phieuNhapId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      // Kiểm tra phiếu nhập tồn tại
      const phieuNhap = await ImportReceipt.findByPk(phieuNhapId, {
        transaction,
      });

      if (!phieuNhap) {
        throw new Error("Phiếu nhập không tồn tại");
      }

      // Cập nhật thông tin phiếu nhập
      const { GhiChu, TrangThai } = updateData;
      await phieuNhap.update(
        {
          GhiChu: GhiChu || phieuNhap.GhiChu,
          TrangThai: TrangThai || phieuNhap.TrangThai,
        },
        { transaction }
      );

      // Nếu phiếu nhập được xác nhận (TrangThai = 2), log thông tin
      if (TrangThai === 2 && phieuNhap.TrangThai !== 2) {
        await this.logImportConfirmation(phieuNhapId);
      }

      await transaction.commit();

      return {
        success: true,
        message: "Cập nhật phiếu nhập thành công",
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error("Không thể cập nhật phiếu nhập: " + error.message);
    }
  }

  // Log xác nhận phiếu nhập sử dụng Sequelize
  async logImportConfirmation(phieuNhapId) {
    try {
      // Lấy chi tiết phiếu nhập sử dụng Sequelize
      const chiTietList = await ImportReceiptDetail.findAll({
        where: { id_PhieuNhap: phieuNhapId },
        attributes: ["id_ChiTietSanPham", "SoLuong"],
      });

      console.log(
        `[INVENTORY REAL-TIME] Phiếu nhập #${phieuNhapId} đã được xác nhận. Tồn kho được tính real-time từ Sequelize.`
      );

      // Log chi tiết cho theo dõi
      for (const item of chiTietList) {
        const tonKhoSauNhap = await this.calculateRealTimeStock(
          item.id_ChiTietSanPham
        );
        console.log(
          `[INVENTORY REAL-TIME] Sản phẩm ${item.id_ChiTietSanPham}: +${item.SoLuong} (từ phiếu nhập), tồn kho hiện tại: ${tonKhoSauNhap}`
        );
      }

      return {
        success: true,
        message: "Phiếu nhập đã được xác nhận. Tồn kho được tính real-time.",
        itemsAffected: chiTietList.length,
      };
    } catch (error) {
      throw new Error("Không thể xử lý phiếu nhập: " + error.message);
    }
  }

  // Lấy báo cáo tồn kho chi tiết sử dụng Sequelize
  async getTonKhoReport(query = {}) {
    try {
      let productWhereClause = {};

      // Lọc theo sản phẩm
      if (query.sanPham) {
        productWhereClause.Ten = {
          [Op.like]: `%${query.sanPham}%`,
        };
      }

      const productDetails = await ProductDetail.findAll({
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["Ten"],
            where: productWhereClause,
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
        attributes: ["id", "MaSanPham"],
        order: [["product", "Ten"]],
      });

      // Lấy tồn kho real-time cho từng sản phẩm
      const results = await Promise.all(
        productDetails.map(async (item) => {
          const tonKho = await this.calculateRealTimeStock(item.id);

          return {
            id_ChiTietSanPham: item.id,
            TenSanPham: item.product?.Ten,
            KichCo: item.size?.Ten,
            MauSac: item.color?.Ten,
            MaSanPham: item.MaSanPham,
            TonKho: tonKho,
          };
        })
      );

      // Lọc theo tồn kho thấp nếu có
      let filteredResults = results;
      if (query.tonKhoThap) {
        const threshold = parseInt(query.tonKhoThap) || 10;
        filteredResults = results.filter((item) => item.TonKho <= threshold);
      }

      // Sắp xếp theo tồn kho tăng dần
      filteredResults.sort((a, b) => a.TonKho - b.TonKho);

      // Thống kê tổng quan
      const tongSanPham = filteredResults.length;
      const sapHetHang = filteredResults.filter(
        (item) => item.TonKho <= 10 && item.TonKho > 0
      ).length;
      const hetHang = filteredResults.filter(
        (item) => item.TonKho === 0
      ).length;
      const tonKhoTong = filteredResults.reduce(
        (sum, item) => sum + item.TonKho,
        0
      );

      return {
        success: true,
        data: filteredResults,
        thongKe: {
          tongSanPham,
          sapHetHang,
          hetHang,
          tonKhoTong,
        },
      };
    } catch (error) {
      throw new Error("Không thể lấy báo cáo tồn kho: " + error.message);
    }
  }

  // Utility function để parse hình ảnh
  parseProductImage(hinhAnh) {
    try {
      if (hinhAnh) {
        const imageData = JSON.parse(hinhAnh);
        return imageData.anhChinh || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Tính tồn kho thực tế của một chi tiết sản phẩm sử dụng Sequelize
  async calculateRealTimeStock(productDetailId) {
    try {
      // Tổng số lượng đã nhập kho (từ phiếu nhập đã xác nhận)
      const importedResult = await ImportReceiptDetail.sum("SoLuong", {
        where: { id_ChiTietSanPham: productDetailId },
        include: [
          {
            model: ImportReceipt,
            as: "importReceipt",
            where: { TrangThai: 2 },
            attributes: [],
          },
        ],
      });

      // Tổng số lượng đã bán (từ đơn hàng đã giao)
      const soldResult = await OrderDetail.sum("SoLuong", {
        where: { id_ChiTietSanPham: productDetailId },
        include: [
          {
            model: Order,
            as: "order",
            where: { TrangThai: 4 },
            attributes: [],
          },
        ],
      });

      const imported = importedResult || 0;
      const sold = soldResult || 0;

      return Math.max(0, imported - sold);
    } catch (error) {
      console.error("Error calculating real-time stock:", error);
      return 0;
    }
  }

  // Tính số lượng đang chờ (trong đơn hàng chờ xác nhận) sử dụng Sequelize
  async calculatePendingQuantity(productDetailId) {
    try {
      const result = await OrderDetail.sum("SoLuong", {
        where: { id_ChiTietSanPham: productDetailId },
        include: [
          {
            model: Order,
            as: "order",
            where: { TrangThai: 1 },
            attributes: [],
          },
        ],
      });

      return result || 0;
    } catch (error) {
      console.error("Error calculating pending quantity:", error);
      return 0;
    }
  }

  // Kiểm tra có thể bán hay không sử dụng Sequelize
  async canSell(productDetailId, requestedQuantity) {
    try {
      const realTimeStock = await this.calculateRealTimeStock(productDetailId);
      const pendingQuantity = await this.calculatePendingQuantity(
        productDetailId
      );

      // Tồn kho khả dụng = Tồn kho thực tế - Số lượng đang chờ
      const availableStock = realTimeStock - pendingQuantity;

      return {
        canSell: availableStock >= requestedQuantity,
        realTimeStock,
        pendingQuantity,
        availableStock,
        requestedQuantity,
      };
    } catch (error) {
      console.error("Error checking if can sell:", error);
      return {
        canSell: false,
        realTimeStock: 0,
        pendingQuantity: 0,
        availableStock: 0,
        requestedQuantity,
      };
    }
  }

  // Lấy thông tin tồn kho chi tiết của một sản phẩm
  async getStockInfo(productDetailId) {
    try {
      const realTimeStock = await this.calculateRealTimeStock(productDetailId);
      const pendingQuantity = await this.calculatePendingQuantity(
        productDetailId
      );

      return {
        productDetailId,
        realTimeStock,
        pendingQuantity,
        availableStock: realTimeStock - pendingQuantity,
      };
    } catch (error) {
      console.error("Error getting stock info:", error);
      return {
        productDetailId,
        realTimeStock: 0,
        pendingQuantity: 0,
        availableStock: 0,
      };
    }
  }

  // Lấy danh sách sản phẩm sắp hết hàng sử dụng Sequelize
  async getLowStockProducts(threshold = 10) {
    try {
      const productDetails = await ProductDetail.findAll({
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["Ten"],
            where: { TrangThai: 1 },
            include: [
              {
                model: Brand,
                as: "brand",
                attributes: ["Ten"],
              },
            ],
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
        attributes: ["id", "MaSanPham"],
      });

      const results = [];

      for (const item of productDetails) {
        const tongNhap =
          (await ImportReceiptDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: item.id },
            include: [
              {
                model: ImportReceipt,
                as: "importReceipt",
                where: { TrangThai: 2 },
                attributes: [],
              },
            ],
          })) || 0;

        const tongBan =
          (await OrderDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: item.id },
            include: [
              {
                model: Order,
                as: "order",
                where: { TrangThai: 4 },
                attributes: [],
              },
            ],
          })) || 0;

        const soLuongCho =
          (await OrderDetail.sum("SoLuong", {
            where: { id_ChiTietSanPham: item.id },
            include: [
              {
                model: Order,
                as: "order",
                where: { TrangThai: 1 },
                attributes: [],
              },
            ],
          })) || 0;

        const tonKhoThucTe = tongNhap - tongBan;

        if (tonKhoThucTe <= threshold && tonKhoThucTe > 0) {
          results.push({
            id_ChiTietSanPham: item.id,
            MaSanPham: item.MaSanPham,
            TenSanPham: item.product.Ten,
            ThuongHieu: item.product.brand?.Ten,
            KichCo: item.size.Ten,
            MauSac: item.color.Ten,
            TongNhap: tongNhap,
            TongBan: tongBan,
            SoLuongCho: soLuongCho,
            TonKhoThucTe: tonKhoThucTe,
            TonKhoKhaDung: tonKhoThucTe - soLuongCho,
          });
        }
      }

      // Sắp xếp theo tồn kho tăng dần
      results.sort((a, b) => a.TonKhoThucTe - b.TonKhoThucTe);

      return results;
    } catch (error) {
      console.error("Error getting low stock products:", error);
      return [];
    }
  }

  // Đồng bộ tồn kho (không cần thiết với real-time calculation)
  async syncInventoryFromOrders() {
    console.log(
      "🔄 Hệ thống đã chuyển sang Real-time calculation với Sequelize ORM. Function sync không cần thiết nữa."
    );

    return {
      success: true,
      message:
        "Hệ thống đã sử dụng Real-time calculation với Sequelize. Không cần đồng bộ cột TonKho nữa.",
      note: "Tồn kho được tính real-time từ Sequelize aggregations dựa trên phiếu nhập và đơn hàng.",
    };
  }
}

module.exports = new InventoryService();
