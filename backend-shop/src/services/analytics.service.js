const { Op } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const {
  User,
  Order,
  Product,
  Category,
  Brand,
  Voucher,
  OrderDetail,
} = require("../models/sequelize");

class AnalyticsService {
  // Get dashboard overview statistics
  async getDashboardOverview(startDate, endDate) {
    const whereClause = {};
    if (startDate || endDate) {
      whereClause.NgayDatHang = {};
      if (startDate) whereClause.NgayDatHang[Op.gte] = new Date(startDate);
      if (endDate) whereClause.NgayDatHang[Op.lte] = new Date(endDate);
    }

    // Total revenue (completed orders only)
    const totalRevenue = await Order.sum("TongThanhToan", {
      where: { ...whereClause, TrangThai: 4 },
    });

    // Total orders
    const totalOrders = await Order.count({ where: whereClause });

    // Total customers
    const totalCustomers = await User.count({
      where: { TrangThai: 1 },
      include: [
        {
          model: Order,
          as: "orders",
          where: whereClause,
          required: true,
        },
      ],
      distinct: true,
    });

    // Total products
    const totalProducts = await Product.count({
      where: { TrangThai: 1 },
    });

    // Order status breakdown
    const orderStatusStats = await Order.findAll({
      where: whereClause,
      attributes: [
        "TrangThai",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("TongThanhToan")), "total"],
      ],
      group: ["TrangThai"],
      raw: true,
    });

    // Recent orders
    const recentOrders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "buyer",
          attributes: ["HoTen", "Email"],
        },
      ],
      limit: 10,
      order: [["NgayDatHang", "DESC"]],
    });

    return {
      overview: {
        totalRevenue: totalRevenue || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
      },
      orderStatusStats,
      recentOrders,
    };
  }

  // Get sales analytics
  async getSalesAnalytics(period = "month", startDate, endDate) {
    let groupBy, selectFormat;

    switch (period) {
      case "day":
        groupBy = sequelize.fn("DATE", sequelize.col("NgayDatHang"));
        selectFormat = sequelize.fn("DATE", sequelize.col("NgayDatHang"));
        break;
      case "week":
        groupBy = sequelize.fn("YEARWEEK", sequelize.col("NgayDatHang"));
        selectFormat = sequelize.fn("YEARWEEK", sequelize.col("NgayDatHang"));
        break;
      case "month":
        groupBy = sequelize.fn(
          "DATE_FORMAT",
          sequelize.col("NgayDatHang"),
          "%Y-%m"
        );
        selectFormat = sequelize.fn(
          "DATE_FORMAT",
          sequelize.col("NgayDatHang"),
          "%Y-%m"
        );
        break;
      case "year":
        groupBy = sequelize.fn("YEAR", sequelize.col("NgayDatHang"));
        selectFormat = sequelize.fn("YEAR", sequelize.col("NgayDatHang"));
        break;
      default:
        groupBy = sequelize.fn(
          "DATE_FORMAT",
          sequelize.col("NgayDatHang"),
          "%Y-%m"
        );
        selectFormat = sequelize.fn(
          "DATE_FORMAT",
          sequelize.col("NgayDatHang"),
          "%Y-%m"
        );
    }

    const whereClause = { TrangThai: 4 }; // Only completed orders
    if (startDate || endDate) {
      whereClause.NgayDatHang = {};
      if (startDate) whereClause.NgayDatHang[Op.gte] = new Date(startDate);
      if (endDate) whereClause.NgayDatHang[Op.lte] = new Date(endDate);
    }

    const salesData = await Order.findAll({
      where: whereClause,
      attributes: [
        [selectFormat, "period"],
        [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
        [sequelize.fn("SUM", sequelize.col("TongThanhToan")), "revenue"],
        [sequelize.fn("AVG", sequelize.col("TongThanhToan")), "avgOrderValue"],
      ],
      group: [groupBy],
      order: [[selectFormat, "ASC"]],
      raw: true,
    });

    return salesData;
  }

  // Get product analytics
  async getProductAnalytics(limit = 10) {
    // Best selling products
    const bestSellingProducts = await Product.findAll({
      where: { TrangThai: 1 },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["Ten"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["Ten"],
        },
      ],
      attributes: [
        "id",
        "Ten",
        "SoLuongDaBan",
        "Gia",
        [sequelize.literal("SoLuongDaBan * Gia"), "totalRevenue"],
      ],
      order: [["SoLuongDaBan", "DESC"]],
      limit: parseInt(limit),
    });

    // Low stock products
    const lowStockProducts = await Product.findAll({
      where: {
        TrangThai: 1,
        SoLuong: { [Op.lte]: 10 },
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["Ten"],
        },
      ],
      attributes: ["id", "Ten", "SoLuong"],
      order: [["SoLuong", "ASC"]],
      limit: parseInt(limit),
    });

    // Category performance
    const categoryPerformance = await Category.findAll({
      where: { TrangThai: 1 },
      include: [
        {
          model: Product,
          as: "products",
          attributes: [],
          where: { TrangThai: 1 },
          required: false,
        },
      ],
      attributes: [
        "id",
        "Ten",
        [sequelize.fn("COUNT", sequelize.col("products.id")), "productCount"],
        [
          sequelize.fn("SUM", sequelize.col("products.SoLuongDaBan")),
          "totalSold",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("products.SoLuongDaBan * products.Gia")
          ),
          "totalRevenue",
        ],
      ],
      group: ["Category.id"],
      order: [
        [sequelize.fn("SUM", sequelize.col("products.SoLuongDaBan")), "DESC"],
      ],
      limit: parseInt(limit),
    });

    return {
      bestSellingProducts,
      lowStockProducts,
      categoryPerformance,
    };
  }

  // Get customer analytics
  async getCustomerAnalytics(limit = 10) {
    // Top customers by spending
    const topCustomers = await User.findAll({
      where: { TrangThai: 1 },
      include: [
        {
          model: Order,
          as: "orders",
          attributes: [],
          where: { TrangThai: 4 },
          required: true,
        },
      ],
      attributes: [
        "id",
        "HoTen",
        "Email",
        [sequelize.fn("COUNT", sequelize.col("orders.id")), "orderCount"],
        [
          sequelize.fn("SUM", sequelize.col("orders.TongThanhToan")),
          "totalSpent",
        ],
        [
          sequelize.fn("AVG", sequelize.col("orders.TongThanhToan")),
          "avgOrderValue",
        ],
      ],
      group: ["User.id"],
      order: [
        [sequelize.fn("SUM", sequelize.col("orders.TongThanhToan")), "DESC"],
      ],
      limit: parseInt(limit),
    });

    // Customer acquisition by month
    const customerAcquisition = await User.findAll({
      where: { TrangThai: 1 },
      attributes: [
        [
          sequelize.fn("DATE_FORMAT", sequelize.col("NgayTao"), "%Y-%m"),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "newCustomers"],
      ],
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("NgayTao"), "%Y-%m")],
      order: [
        [
          sequelize.fn("DATE_FORMAT", sequelize.col("NgayTao"), "%Y-%m"),
          "DESC",
        ],
      ],
      limit: 12,
      raw: true,
    });

    return {
      topCustomers,
      customerAcquisition,
    };
  }

  // Get voucher analytics
  async getVoucherAnalytics() {
    const currentDate = new Date();

    // Active vouchers
    const activeVouchers = await Voucher.count({
      where: {
        TrangThai: 1,
        NgayBatDau: { [Op.lte]: currentDate },
        NgayKetThuc: { [Op.gte]: currentDate },
        SoLuongConLai: { [Op.gt]: 0 },
      },
    });

    // Most used vouchers
    const mostUsedVouchers = await Voucher.findAll({
      attributes: [
        "Ma",
        "Ten",
        "LoaiGiamGia",
        "GiaTri",
        [sequelize.literal("SoLuong - SoLuongConLai"), "usedCount"],
        [sequelize.fn("COUNT", sequelize.col("orders.id")), "orderCount"],
      ],
      include: [
        {
          model: Order,
          as: "orders",
          attributes: [],
          required: false,
        },
      ],
      group: ["Voucher.id"],
      order: [[sequelize.literal("SoLuong - SoLuongConLai"), "DESC"]],
      limit: 10,
    });

    return {
      activeVouchers,
      mostUsedVouchers,
    };
  }

  // Get revenue comparison
  async getRevenueComparison(
    currentStart,
    currentEnd,
    previousStart,
    previousEnd
  ) {
    const currentRevenue = await Order.sum("TongThanhToan", {
      where: {
        TrangThai: 4,
        NgayDatHang: {
          [Op.gte]: new Date(currentStart),
          [Op.lte]: new Date(currentEnd),
        },
      },
    });

    const previousRevenue = await Order.sum("TongThanhToan", {
      where: {
        TrangThai: 4,
        NgayDatHang: {
          [Op.gte]: new Date(previousStart),
          [Op.lte]: new Date(previousEnd),
        },
      },
    });

    const currentOrders = await Order.count({
      where: {
        NgayDatHang: {
          [Op.gte]: new Date(currentStart),
          [Op.lte]: new Date(currentEnd),
        },
      },
    });

    const previousOrders = await Order.count({
      where: {
        NgayDatHang: {
          [Op.gte]: new Date(previousStart),
          [Op.lte]: new Date(previousEnd),
        },
      },
    });

    const revenueGrowth = previousRevenue
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const orderGrowth = previousOrders
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

    return {
      current: {
        revenue: currentRevenue || 0,
        orders: currentOrders,
        avgOrderValue: currentOrders
          ? (currentRevenue || 0) / currentOrders
          : 0,
      },
      previous: {
        revenue: previousRevenue || 0,
        orders: previousOrders,
        avgOrderValue: previousOrders
          ? (previousRevenue || 0) / previousOrders
          : 0,
      },
      growth: {
        revenue: revenueGrowth,
        orders: orderGrowth,
      },
    };
  }

  // Get export data for reports
  async getExportData(type, startDate, endDate) {
    const whereClause = {};
    if (startDate || endDate) {
      whereClause.NgayDatHang = {};
      if (startDate) whereClause.NgayDatHang[Op.gte] = new Date(startDate);
      if (endDate) whereClause.NgayDatHang[Op.lte] = new Date(endDate);
    }

    switch (type) {
      case "orders":
        return await Order.findAll({
          where: whereClause,
          include: [
            {
              model: User,
              as: "buyer",
              attributes: ["HoTen", "Email", "SDT"],
            },
          ],
          order: [["NgayDatHang", "DESC"]],
        });

      case "products":
        return await Product.findAll({
          where: { TrangThai: 1 },
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["Ten"],
            },
            {
              model: Brand,
              as: "brand",
              attributes: ["Ten"],
            },
          ],
          order: [["SoLuongDaBan", "DESC"]],
        });

      case "customers":
        return await User.findAll({
          where: { TrangThai: 1 },
          include: [
            {
              model: Order,
              as: "orders",
              attributes: [],
              where: { TrangThai: 4 },
              required: false,
            },
          ],
          attributes: [
            "id",
            "HoTen",
            "Email",
            "SDT",
            "NgayTao",
            [sequelize.fn("COUNT", sequelize.col("orders.id")), "orderCount"],
            [
              sequelize.fn("SUM", sequelize.col("orders.TongThanhToan")),
              "totalSpent",
            ],
          ],
          group: ["User.id"],
          order: [["NgayTao", "DESC"]],
        });

      default:
        throw new Error("Invalid export type");
    }
  }
}

module.exports = new AnalyticsService();
