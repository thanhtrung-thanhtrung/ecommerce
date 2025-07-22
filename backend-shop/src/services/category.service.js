const { Category, Product, sequelize } = require("../models");
const { Op } = require("sequelize");

class CategoryService {
  // Tạo danh mục mới
  async taoDanhMuc(categoryData) {
    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({
      where: { Ten: categoryData.Ten },
    });

    if (existingCategory) {
      throw new Error("Tên danh mục đã tồn tại");
    }

    const newCategory = await Category.create({
      Ten: categoryData.Ten,
      MoTa: categoryData.MoTa || null,
      TrangThai: categoryData.TrangThai ?? 1,
    });

    return newCategory;
  }

  // Cập nhật danh mục
  async capNhatDanhMuc(id, categoryData) {
    // Kiểm tra tên danh mục đã tồn tại chưa (trừ danh mục hiện tại)
    const existingCategory = await Category.findOne({
      where: {
        Ten: categoryData.Ten,
        id: { [Op.ne]: id },
      },
    });

    if (existingCategory) {
      throw new Error("Tên danh mục đã tồn tại");
    }

    const [updatedRowsCount] = await Category.update(
      {
        Ten: categoryData.Ten,
        MoTa: categoryData.MoTa || null,
        TrangThai: categoryData.TrangThai ?? 1,
      },
      {
        where: { id },
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return this.layChiTietDanhMuc(id);
  }

  // Xóa danh mục
  async xoaDanhMuc(id) {
    const productCount = await Product.count({
      where: { id_DanhMuc: id },
    });

    if (productCount > 0) {
      throw new Error("Không thể xóa danh mục đang có sản phẩm");
    }

    const deletedRowsCount = await Category.destroy({
      where: { id },
    });

    if (deletedRowsCount === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return { message: "Xóa danh mục thành công" };
  }

  //Cập nhật trạng thái
  async capNhatTrangThai(id, trangThai) {
    const [updatedRowsCount] = await Category.update(
      { TrangThai: trangThai },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      throw new Error("Không tìm thấy danh mục");
    }

    return { id, TrangThai: trangThai };
  }

  // Lấy chi tiết danh mục
  async layChiTietDanhMuc(id) {
    const category = await Category.findByPk(id, {
      attributes: [
        "id",
        "Ten",
        "MoTa",
        "TrangThai",
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
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      group: ["Category.id"],
    });

    if (!category) {
      throw new Error("Không tìm thấy danh mục");
    }

    // Lấy danh sách sản phẩm mới nhất trong danh mục
    const latestProducts = await Product.findAll({
      where: { id_DanhMuc: id },
      attributes: ["id", "Ten", "Gia", "HinhAnh", "TrangThai"],
      order: [["NgayTao", "DESC"]],
      limit: 5,
    });

    return {
      ...category.get({ plain: true }),
      sanPhamMoiNhat: latestProducts,
    };
  }

  // Lấy danh sách danh mục
  async layDanhSachDanhMuc(filters = {}) {
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

    const categories = await Category.findAll({
      where: whereClause,
      attributes: [
        "id",
        "Ten",
        "MoTa",
        "TrangThai",
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
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          required: false,
        },
      ],
      group: ["Category.id"],
      order: [["id", "DESC"]],
    });

    return categories;
  }

  // Thống kê danh mục
  async thongKeDanhMuc() {
    // Thống kê tổng quan
    const stats = await Category.findOne({
      attributes: [
        [sequelize.fn("COUNT", "*"), "tongSoDanhMuc"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END")
          ),
          "soDanhMucHoatDong",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END")
          ),
          "soDanhMucKhongHoatDong",
        ],
      ],
      raw: true,
    });

    // Top danh mục theo doanh thu năm hiện tại
    const topCategories = await Category.findAll({
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
          required: true,
        },
      ],
      group: ["Category.id"],
      order: [[sequelize.literal("tongDoanhThu"), "DESC"]],
      limit: 5,
    });

    // Phân bố danh mục theo số sản phẩm
    const categoryDistribution = await Category.findAll({
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
      group: ["Category.id"],
      order: [[sequelize.literal("soSanPham"), "DESC"]],
    });

    return {
      tongQuat: stats,
      topDanhMuc: topCategories,
      phanBoDanhMuc: categoryDistribution,
    };
  }
}

module.exports = new CategoryService();
