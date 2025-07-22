const { Brand, Product, Category } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const cloudinaryUtil = require("../utils/cloudinary.util");

class BrandService {
  // Tạo thương hiệu mới
  async taoThuongHieu(brandData) {
    // Kiểm tra tên thương hiệu đã tồn tại chưa
    const existingBrand = await Brand.findOne({
      where: { Ten: brandData.Ten },
    });

    if (existingBrand) {
      throw new Error("Tên thương hiệu đã tồn tại");
    }

    if (brandData.Logo) {
      const uploadResult = await cloudinaryUtil.uploadImage(
        brandData.Logo,
        "brands"
      );
      brandData.Logo = uploadResult.url;
    }

    const newBrand = await Brand.create({
      Ten: brandData.Ten,
      MoTa: brandData.MoTa || null,
      TrangThai: brandData.TrangThai ?? 1,
      Website: brandData.Website || null,
      Logo: brandData.Logo || null,
    });

    return newBrand;
  }

  // Cập nhật thương hiệu
  async capNhatThuongHieu(id, brandData) {
    // Kiểm tra tên thương hiệu đã tồn tại chưa (trừ thương hiệu hiện tại)
    const existingBrand = await Brand.findOne({
      where: {
        Ten: brandData.Ten,
        id: { [Op.ne]: id },
      },
    });

    if (existingBrand) {
      throw new Error("Tên thương hiệu đã tồn tại");
    }

    if (brandData.Logo) {
      const uploadResult = await cloudinaryUtil.uploadImage(
        brandData.Logo,
        "brands"
      );
      brandData.Logo = uploadResult.url;
    }

    const [updatedRowsCount] = await Brand.update(
      {
        Ten: brandData.Ten,
        MoTa: brandData.MoTa || null,
        TrangThai: brandData.TrangThai ?? 1,
        Website: brandData.Website || null,
        Logo: brandData.Logo || null,
      },
      {
        where: { id },
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return this.layChiTietThuongHieu(id);
  }

  // Xóa thương hiệu
  async xoaThuongHieu(id) {
    // Kiểm tra xem thương hiệu có sản phẩm không
    const productCount = await Product.count({
      where: { id_ThuongHieu: id },
    });

    if (productCount > 0) {
      throw new Error("Không thể xóa thương hiệu đang có sản phẩm");
    }

    const deletedRowsCount = await Brand.destroy({
      where: { id },
    });

    if (deletedRowsCount === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return { message: "Xóa thương hiệu thành công" };
  }

  // Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [updatedRowsCount] = await Brand.update(
      { TrangThai: trangThai },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    return { id, TrangThai: trangThai };
  }

  // Lấy chi tiết thương hiệu
  async layChiTietThuongHieu(id) {
    const brand = await Brand.findByPk(id, {
      attributes: [
        "id",
        "Ten",
        "MoTa",
        "TrangThai",
        "Website",
        "Logo",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "soSanPham"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN products.TrangThai = 1 THEN products.id END"
            )
          ),
          "soSanPhamHoatDong",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN products.TrangThai = 0 THEN products.id END"
            )
          ),
          "soSanPhamKhongHoatDong",
        ],
        [
          sequelize.fn("SUM", sequelize.col("products.SoLuongDaBan")),
          "tongSoLuongBan",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("products.SoLuongDaBan * products.Gia")
          ),
          "tongDoanhThu",
        ],
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      group: ["Brand.id"],
    });

    if (!brand) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    // Lấy danh sách sản phẩm bán chạy nhất của thương hiệu
    const topProducts = await Product.findAll({
      where: { id_ThuongHieu: id },
      attributes: ["id", "Ten", "Gia", "HinhAnh", "TrangThai", "SoLuongDaBan"],
      order: [["SoLuongDaBan", "DESC"]],
      limit: 5,
    });

    // Lấy danh sách danh mục có sản phẩm của thương hiệu
    const categories = await Category.findAll({
      attributes: [
        "id",
        "Ten",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "soSanPham"],
      ],
      include: [
        {
          model: Product,
          as: "products",
          where: { id_ThuongHieu: id },
          attributes: [],
          required: true,
        },
      ],
      group: ["Category.id"],
    });

    return {
      ...brand.get({ plain: true }),
      sanPhamBanChay: topProducts,
      danhMuc: categories,
    };
  }

  // Lấy danh sách thương hiệu
  async layDanhSachThuongHieu(filters = {}) {
    const whereClause = {};

    if (filters.trangThai !== undefined) {
      whereClause.TrangThai = filters.trangThai;
    }

    if (filters.tuKhoa) {
      whereClause[Op.or] = [
        { Ten: { [Op.like]: `%${filters.tuKhoa}%` } },
        { MoTa: { [Op.like]: `%${filters.tuKhoa}%` } },
      ];
    }

    const brands = await Brand.findAll({
      where: whereClause,
      attributes: [
        "id",
        "Ten",
        "MoTa",
        "TrangThai",
        "Website",
        "Logo",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "soSanPham"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN products.TrangThai = 1 THEN products.id END"
            )
          ),
          "soSanPhamHoatDong",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              "CASE WHEN products.TrangThai = 0 THEN products.id END"
            )
          ),
          "soSanPhamKhongHoatDong",
        ],
        [
          sequelize.fn("SUM", sequelize.col("products.SoLuongDaBan")),
          "tongSoLuongBan",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("products.SoLuongDaBan * products.Gia")
          ),
          "tongDoanhThu",
        ],
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      group: ["Brand.id"],
      order: [["id", "DESC"]],
    });

    return brands;
  }

  // Thống kê thương hiệu
  async thongKeThuongHieu() {
    // Thống kê tổng quan
    const stats = await Brand.findOne({
      attributes: [
        [sequelize.fn("COUNT", "*"), "tongSoThuongHieu"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END")
          ),
          "soThuongHieuHoatDong",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END")
          ),
          "soThuongHieuKhongHoatDong",
        ],
      ],
      raw: true,
    });

    // Top thương hiệu theo doanh thu năm hiện tại
    const topBrands = await Brand.findAll({
      attributes: [
        "id",
        "Ten",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "soSanPham"],
        [
          sequelize.fn("SUM", sequelize.col("products.SoLuongDaBan")),
          "tongSoLuongBan",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("products.SoLuongDaBan * products.Gia")
          ),
          "tongDoanhThu",
        ],
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          where: sequelize.where(
            sequelize.fn("YEAR", sequelize.col("products.NgayTao")),
            sequelize.fn("YEAR", sequelize.fn("NOW"))
          ),
          required: false,
        },
      ],
      group: ["Brand.id"],
      order: [[sequelize.literal("tongDoanhThu"), "DESC"]],
      limit: 5,
    });

    // Phân bố thương hiệu theo số sản phẩm
    const brandDistribution = await Brand.findAll({
      attributes: [
        "Ten",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "soSanPham"],
        [
          sequelize.literal(
            "ROUND(COUNT(products.id) * 100.0 / (SELECT COUNT(*) FROM sanpham), 2)"
          ),
          "phanTram",
        ],
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      group: ["Brand.id"],
      order: [[sequelize.literal("soSanPham"), "DESC"]],
    });

    return {
      tongQuat: stats,
      topThuongHieu: topBrands,
      phanBoThuongHieu: brandDistribution,
    };
  }
}

module.exports = new BrandService();
