const { Supplier, ImportReceipt, Product, sequelize } = require("../models");
const { Op } = require("sequelize");

class SupplierService {
  // Tạo nhà cung cấp mới
  async taoNhaCungCap(supplierData) {
    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await Supplier.findOne({
      where: { Email: supplierData.Email },
    });

    if (existingEmail) {
      throw new Error("Email đã được sử dụng bởi nhà cung cấp khác");
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingPhone = await Supplier.findOne({
      where: { SDT: supplierData.SDT },
    });

    if (existingPhone) {
      throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
    }

    const result = await Supplier.create({
      Ten: supplierData.Ten,
      Email: supplierData.Email,
      SDT: supplierData.SDT,
      DiaChi: supplierData.DiaChi,
      TrangThai: supplierData.TrangThai ?? 1,
    });

    return {
      success: true,
      message: "Tạo nhà cung cấp thành công",
      data: result.toJSON(),
    };
  }

  // Cập nhật nhà cung cấp
  async capNhatNhaCungCap(id, supplierData) {
    // Kiểm tra nhà cung cấp tồn tại
    const existing = await Supplier.findByPk(id);

    if (!existing) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    // Kiểm tra email đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    if (supplierData.Email) {
      const existingEmail = await Supplier.findOne({
        where: {
          Email: supplierData.Email,
          id: { [Op.ne]: id },
        },
      });

      if (existingEmail) {
        throw new Error("Email đã được sử dụng bởi nhà cung cấp khác");
      }
    }

    // Kiểm tra số điện thoại đã tồn tại chưa (trừ nhà cung cấp hiện tại)
    if (supplierData.SDT) {
      const existingPhone = await Supplier.findOne({
        where: {
          SDT: supplierData.SDT,
          id: { [Op.ne]: id },
        },
      });

      if (existingPhone) {
        throw new Error("Số điện thoại đã được sử dụng bởi nhà cung cấp khác");
      }
    }

    await existing.update({
      Ten: supplierData.Ten,
      Email: supplierData.Email,
      SDT: supplierData.SDT,
      DiaChi: supplierData.DiaChi,
      TrangThai: supplierData.TrangThai ?? 1,
    });

    const updatedSupplier = await this.layChiTietNhaCungCap(id);

    return {
      success: true,
      message: "Cập nhật nhà cung cấp thành công",
      data: updatedSupplier.data,
    };
  }

  // Xóa nhà cung cấp
  async xoaNhaCungCap(id) {
    // Kiểm tra xem nhà cung cấp có đang được sử dụng trong phiếu nhập không
    const importCount = await ImportReceipt.count({
      where: { id_NhaCungCap: id },
    });

    if (importCount > 0) {
      throw new Error("Không thể xóa nhà cung cấp đang có phiếu nhập");
    }

    // Kiểm tra xem nhà cung cấp có đang được sử dụng trong sản phẩm không
    const productCount = await Product.count({
      where: { id_NhaCungCap: id },
    });

    if (productCount > 0) {
      throw new Error("Không thể xóa nhà cung cấp đang có sản phẩm");
    }

    const result = await Supplier.destroy({
      where: { id },
    });

    if (result === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return {
      success: true,
      message: "Xóa nhà cung cấp thành công",
    };
  }

  // Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [affectedRows] = await Supplier.update(
      { TrangThai: trangThai },
      { where: { id } }
    );

    if (affectedRows === 0) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return {
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: { id, TrangThai: trangThai },
    };
  }

  // Lấy chi tiết nhà cung cấp
  async layChiTietNhaCungCap(id) {
    const supplier = await Supplier.findOne({
      where: { id },
      include: [
        {
          model: ImportReceipt,
          as: "importReceipts",
          attributes: [],
          required: false,
        },
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "Ten",
        "Email",
        "SDT",
        "DiaChi",
        "TrangThai",
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("importReceipts.id"))
          ),
          "soPhieuNhap",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN importReceipts.TrangThai = 2 THEN importReceipts.TongTien ELSE 0 END"
              )
            ),
            0
          ),
          "tongGiaTriNhap",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("products.id"))
          ),
          "soSanPham",
        ],
      ],
      group: ["Supplier.id"],
      raw: false,
    });

    if (!supplier) {
      throw new Error("Không tìm thấy nhà cung cấp");
    }

    return {
      success: true,
      data: supplier.toJSON(),
    };
  }

  // Lấy danh sách nhà cung cấp
  async layDanhSachNhaCungCap(filters = {}) {
    const whereConditions = {};

    if (filters.trangThai !== undefined) {
      whereConditions.TrangThai = filters.trangThai;
    }

    if (filters.tuKhoa) {
      whereConditions[Op.or] = [
        { Ten: { [Op.like]: `%${filters.tuKhoa}%` } },
        { DiaChi: { [Op.like]: `%${filters.tuKhoa}%` } },
        { SDT: { [Op.like]: `%${filters.tuKhoa}%` } },
        { Email: { [Op.like]: `%${filters.tuKhoa}%` } },
      ];
    }

    const queryOptions = {
      where: whereConditions,
      include: [
        {
          model: ImportReceipt,
          as: "importReceipts",
          attributes: [],
          required: false,
        },
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "Ten",
        "Email",
        "SDT",
        "DiaChi",
        "TrangThai",
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("importReceipts.id"))
          ),
          "soPhieuNhap",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN importReceipts.TrangThai = 2 THEN importReceipts.TongTien ELSE 0 END"
              )
            ),
            0
          ),
          "tongGiaTriNhap",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("products.id"))
          ),
          "soSanPham",
        ],
      ],
      group: ["Supplier.id"],
      order: [["id", "DESC"]],
      subQuery: false,
      raw: false,
    };

    // Phân trang
    if (filters.limit) {
      queryOptions.limit = parseInt(filters.limit);

      if (filters.offset) {
        queryOptions.offset = parseInt(filters.offset);
      }
    }

    const suppliers = await Supplier.findAll(queryOptions);

    // Đếm tổng số bản ghi
    const total = await Supplier.count({
      where: whereConditions,
    });

    return {
      success: true,
      data: suppliers.map((s) => s.toJSON()),
      pagination: {
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: filters.limit ? parseInt(filters.limit) : suppliers.length,
        totalPages: filters.limit
          ? Math.ceil(total / parseInt(filters.limit))
          : 1,
      },
    };
  }

  // Thống kê nhà cung cấp
  async thongKeNhaCungCap() {
    const stats = await Supplier.findOne({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "tongSoNhaCungCap"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END")
          ),
          "soNhaCungCapHoatDong",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END")
          ),
          "soNhaCungCapKhongHoatDong",
        ],
      ],
      raw: true,
    });

    // Thống kê phiếu nhập trong năm
    const importStats = await ImportReceipt.findOne({
      where: {
        NgayNhap: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("YEAR", sequelize.col("NgayNhap")),
              sequelize.fn("YEAR", sequelize.fn("NOW"))
            ),
          ],
        },
        TrangThai: 2,
      },
      attributes: [
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("id_NhaCungCap"))
          ),
          "soNhaCungCapTrongNam",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "soPhieuNhapTrongNam"],
        [
          sequelize.fn("SUM", sequelize.col("TongTien")),
          "tongGiaTriNhapTrongNam",
        ],
      ],
      raw: true,
    });

    // Top nhà cung cấp theo giá trị nhập
    const topSuppliers = await Supplier.findAll({
      include: [
        {
          model: ImportReceipt,
          as: "importReceipts",
          where: {
            NgayNhap: {
              [Op.and]: [
                sequelize.where(
                  sequelize.fn(
                    "YEAR",
                    sequelize.col("importReceipts.NgayNhap")
                  ),
                  sequelize.fn("YEAR", sequelize.fn("NOW"))
                ),
              ],
            },
            TrangThai: 2,
          },
          attributes: [],
          required: true,
        },
      ],
      attributes: [
        "id",
        "Ten",
        [
          sequelize.fn("COUNT", sequelize.col("importReceipts.id")),
          "soPhieuNhap",
        ],
        [
          sequelize.fn("SUM", sequelize.col("importReceipts.TongTien")),
          "tongGiaTriNhap",
        ],
      ],
      group: ["Supplier.id", "Supplier.Ten"],
      order: [[sequelize.literal("tongGiaTriNhap"), "DESC"]],
      limit: 5,
      subQuery: false,
      raw: true,
    });

    // Thống kê theo tháng trong năm
    const monthlyStats = await ImportReceipt.findAll({
      where: {
        NgayNhap: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("YEAR", sequelize.col("NgayNhap")),
              sequelize.fn("YEAR", sequelize.fn("NOW"))
            ),
          ],
        },
        TrangThai: 2,
      },
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("NgayNhap")), "thang"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("id_NhaCungCap"))
          ),
          "soNhaCungCap",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "soPhieuNhap"],
        [sequelize.fn("SUM", sequelize.col("TongTien")), "tongGiaTri"],
      ],
      group: [sequelize.fn("MONTH", sequelize.col("NgayNhap"))],
      order: [[sequelize.literal("thang"), "ASC"]],
      raw: true,
    });

    return {
      success: true,
      data: {
        tongQuat: {
          ...stats,
          ...importStats,
        },
        topNhaCungCap: topSuppliers,
        thongKeTheoThang: monthlyStats,
      },
    };
  }

  // Lấy danh sách nhà cung cấp hoạt động (cho dropdown)
  async layDanhSachNhaCungCapHoatDong() {
    const suppliers = await Supplier.findAll({
      where: { TrangThai: 1 },
      attributes: ["id", "Ten"],
      order: [["Ten", "ASC"]],
    });

    return {
      success: true,
      data: suppliers.map((s) => s.toJSON()),
    };
  }
}

module.exports = new SupplierService();
