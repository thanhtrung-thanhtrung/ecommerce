const {
  Order,
  OrderDetail,
  ProductDetail,
  Product,
  Brand,
  Category,
  Color,
  Size,
  User,
  PaymentMethod,
  ShippingMethod,
  Voucher,
  sequelize,
} = require("../models");
const { Op, fn, col, literal } = require("sequelize");

class RevenueService {
  // Thống kê doanh thu theo thời gian
  async thongKeDoanhThu(tuNgay, denNgay, loaiThongKe = "ngay") {
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];

    let groupByClause, dateFormat;
    switch (loaiThongKe) {
      case "ngay":
        groupByClause = fn("DATE", col("NgayDatHang"));
        dateFormat = "%Y-%m-%d";
        break;
      case "thang":
        groupByClause = fn("DATE_FORMAT", col("NgayDatHang"), "%Y-%m");
        dateFormat = "%Y-%m";
        break;
      case "nam":
        groupByClause = fn("YEAR", col("NgayDatHang"));
        dateFormat = "%Y";
        break;
      default:
        groupByClause = fn("DATE", col("NgayDatHang"));
        dateFormat = "%Y-%m-%d";
    }

    // Truy vấn doanh thu chính
    const doanhThu = await Order.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("NgayDatHang"), dateFormat), "thoiGian"],
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("COALESCE", fn("SUM", col("TongTienHang")), 0), "tongTienHang"],
        [fn("COALESCE", fn("SUM", col("GiamGia")), 0), "tongGiamGia"],
        [fn("COALESCE", fn("SUM", col("PhiVanChuyen")), 0), "tongPhiVanChuyen"],
        [fn("COALESCE", fn("SUM", col("TongThanhToan")), 0), "tongThanhToan"],
        [fn("COUNT", fn("DISTINCT", col("id_NguoiMua"))), "soKhachHang"],
        [
          fn(
            "COUNT",
            fn(
              "DISTINCT",
              literal("CASE WHEN id_NguoiMua IS NULL THEN session_id END")
            )
          ),
          "soKhachVangLai",
        ],
      ],
      where: {
        NgayDatHang: {
          [Op.between]: [startDate, endDate],
        },
        TrangThai: 4,
      },
      group: [groupByClause],
      order: [["thoiGian", "ASC"]],
      raw: true,
    });

    // Truy vấn theo hình thức thanh toán
    const thanhToan = await Order.findAll({
      attributes: [
        [
          fn("COALESCE", col("paymentMethod.Ten"), "Không xác định"),
          "hinhThucThanhToan",
        ],
        [fn("COUNT", fn("DISTINCT", col("Order.id"))), "soDonHang"],
        [fn("COALESCE", fn("SUM", col("TongThanhToan")), 0), "tongThanhToan"],
      ],
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: [],
          required: false,
        },
      ],
      where: {
        NgayDatHang: {
          [Op.between]: [startDate, endDate],
        },
        TrangThai: 4,
      },
      group: ["paymentMethod.id", "paymentMethod.Ten"],
      order: [[fn("SUM", col("TongThanhToan")), "DESC"]],
      raw: true,
    });

    // Truy vấn theo hình thức vận chuyển
    const vanChuyen = await Order.findAll({
      attributes: [
        [
          fn("COALESCE", col("shippingMethod.Ten"), "Không xác định"),
          "hinhThucVanChuyen",
        ],
        [fn("COUNT", fn("DISTINCT", col("Order.id"))), "soDonHang"],
        [
          fn("COALESCE", fn("SUM", col("Order.PhiVanChuyen")), 0),
          "tongPhiVanChuyen",
        ],
        [
          fn("COALESCE", fn("SUM", col("Order.TongThanhToan")), 0),
          "tongThanhToan",
        ],
      ],
      include: [
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: [],
          required: false,
        },
      ],
      where: {
        NgayDatHang: {
          [Op.between]: [startDate, endDate],
        },
        TrangThai: { [Op.ne]: 5 },
      },
      group: ["shippingMethod.id", "shippingMethod.Ten"],
      order: [[fn("SUM", col("Order.TongThanhToan")), "DESC"]],
      raw: true,
    });

    // Truy vấn theo trạng thái đơn hàng
    const trangThaiDonHang = await Order.findAll({
      attributes: [
        [
          literal(`CASE TrangThai
          WHEN 1 THEN 'Chờ xác nhận'
          WHEN 2 THEN 'Đã xác nhận'
          WHEN 3 THEN 'Đang giao'
          WHEN 4 THEN 'Đã giao'
          WHEN 5 THEN 'Đã hủy'
          ELSE 'Không xác định'
        END`),
          "trangThai",
        ],
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("COALESCE", fn("SUM", col("TongThanhToan")), 0), "tongThanhToan"],
      ],
      where: {
        NgayDatHang: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ["TrangThai"],
      order: [["TrangThai", "ASC"]],
      raw: true,
    });

    // Tính tổng
    const tongTienHang = doanhThu.reduce(
      (sum, r) => sum + (+r.tongTienHang || 0),
      0
    );
    const tongThanhToan = doanhThu.reduce(
      (sum, r) => sum + (+r.tongThanhToan || 0),
      0
    );
    const tongGiamGia = doanhThu.reduce(
      (sum, r) => sum + (+r.tongGiamGia || 0),
      0
    );
    const tongPhiVanChuyen = doanhThu.reduce(
      (sum, r) => sum + (+r.tongPhiVanChuyen || 0),
      0
    );

    return {
      success: true,
      data: {
        doanhThuTheoThoiGian: doanhThu,
        thanhToanTheoHinhThuc: thanhToan,
        vanChuyenTheoHinhThuc: vanChuyen,
        trangThaiDonHang,
        tongHop: {
          tongTienHang,
          tongThanhToan,
          tongGiamGia,
          tongPhiVanChuyen,
          tongSoDonHang: doanhThu.reduce((s, r) => s + (+r.soDonHang || 0), 0),
          tongSoKhachHang: doanhThu.reduce(
            (s, r) => s + (+r.soKhachHang || 0),
            0
          ),
          tongSoKhachVangLai: doanhThu.reduce(
            (s, r) => s + (+r.soKhachVangLai || 0),
            0
          ),
        },
      },
    };
  }

  // Báo cáo doanh thu chi tiết
  async baoCaoDoanhThu(filters) {
    const {
      tuNgay,
      denNgay,
      id_DanhMuc,
      id_ThuongHieu,
      id_ThanhToan,
      id_VanChuyen,
      trangThai,
      page = 1,
      limit = 20,
    } = filters;

    // Validate required parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    // Format dates
    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {
      NgayDatHang: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (id_ThanhToan && !isNaN(parseInt(id_ThanhToan))) {
      whereConditions.id_ThanhToan = parseInt(id_ThanhToan);
    }

    if (id_VanChuyen && !isNaN(parseInt(id_VanChuyen))) {
      whereConditions.id_VanChuyen = parseInt(id_VanChuyen);
    }

    if (trangThai && !isNaN(parseInt(trangThai))) {
      whereConditions.TrangThai = parseInt(trangThai);
    }

    // Build include conditions for category/brand filtering
    const includeConditions = [];
    if (
      (id_DanhMuc && !isNaN(parseInt(id_DanhMuc))) ||
      (id_ThuongHieu && !isNaN(parseInt(id_ThuongHieu)))
    ) {
      const productWhere = {};
      if (id_DanhMuc && !isNaN(parseInt(id_DanhMuc))) {
        productWhere.id_DanhMuc = parseInt(id_DanhMuc);
      }
      if (id_ThuongHieu && !isNaN(parseInt(id_ThuongHieu))) {
        productWhere.id_ThuongHieu = parseInt(id_ThuongHieu);
      }

      includeConditions.push({
        model: OrderDetail,
        include: [
          {
            model: ProductDetail,
            include: [
              {
                model: Product,
                where: productWhere,
                attributes: [],
              },
            ],
            attributes: [],
          },
        ],
        attributes: [],
      });
    }

    // Get total count
    const total = await Order.count({
      where: whereConditions,
      include: includeConditions,
      distinct: true,
    });

    // Get detailed orders
    const chiTietDonHang = await Order.findAll({
      attributes: [
        "id",
        "MaDonHang",
        "NgayDatHang",
        [
          literal(`CASE TrangThai
          WHEN 1 THEN 'Chờ xác nhận'
          WHEN 2 THEN 'Đã xác nhận'
          WHEN 3 THEN 'Đang giao'
          WHEN 4 THEN 'Đã giao'
          WHEN 5 THEN 'Đã hủy'
          ELSE 'Không xác định'
        END`),
          "trangThai",
        ],
        [fn("COALESCE", col("TongTienHang"), 0), "TongTienHang"],
        [fn("COALESCE", col("GiamGia"), 0), "GiamGia"],
        [fn("COALESCE", col("PhiVanChuyen"), 0), "PhiVanChuyen"],
        [fn("COALESCE", col("TongThanhToan"), 0), "TongThanhToan"],
        "TenNguoiNhan",
        "DiaChiNhan",
        "EmailNguoiNhan",
        "MaGiamGia",
        "GhiChu",
      ],
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: [["Ten", "hinhThucThanhToan"]],
          required: false,
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: [["Ten", "hinhThucVanChuyen"]],
          required: false,
        },
        {
          model: User,
          as: "buyer",
          attributes: [
            ["HoTen", "tenKhachHang"],
            ["SDT", "sdtKhachHang"],
          ],
          required: false,
        },
        ...includeConditions,
      ],
      where: whereConditions,
      order: [["NgayDatHang", "DESC"]],
      limit: parseInt(limit),
      offset,
      subQuery: false,
    });

    // Get order details for each order
    for (let donHang of chiTietDonHang) {
      const sanPham = await OrderDetail.findAll({
        attributes: [
          "SoLuong",
          [fn("COALESCE", col("GiaBan"), 0), "GiaBan"],
          [fn("COALESCE", col("ThanhTien"), 0), "ThanhTien"],
        ],
        include: [
          {
            model: ProductDetail,
            include: [
              {
                model: Product,
                attributes: [["Ten", "tenSanPham"]],
                include: [
                  {
                    model: Brand,
                    attributes: [["Ten", "thuongHieu"]],
                  },
                  {
                    model: Category,
                    attributes: [["Ten", "danhMuc"]],
                  },
                ],
              },
              {
                model: Color,
                attributes: [["Ten", "mauSac"]],
              },
              {
                model: Size,
                attributes: [["Ten", "kichCo"]],
              },
            ],
          },
        ],
        where: { id_DonHang: donHang.id },
      });

      donHang.dataValues.chiTietSanPham = sanPham.map((sp) => ({
        tenSanPham: sp.ProductDetail?.Product?.Ten,
        thuongHieu: sp.ProductDetail?.Product?.Brand?.Ten,
        danhMuc: sp.ProductDetail?.Product?.Category?.Ten,
        mauSac: sp.ProductDetail?.Color?.Ten,
        kichCo: sp.ProductDetail?.Size?.Ten,
        SoLuong: sp.SoLuong,
        GiaBan: sp.dataValues.GiaBan,
        ThanhTien: sp.dataValues.ThanhTien,
      }));
    }

    // Thống kê theo danh mục
    const thongKeDanhMuc = await OrderDetail.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("SoLuong")), 0), "tongSoLuong"],
        [fn("COALESCE", fn("SUM", col("ThanhTien")), 0), "tongDoanhThu"],
        [fn("COUNT", fn("DISTINCT", col("id_DonHang"))), "soDonHang"],
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: {
            NgayDatHang: {
              [Op.between]: [startDate, endDate],
            },
            TrangThai: 4,
          },
        },
        {
          model: ProductDetail,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Category,
                  attributes: [["Ten", "tenDanhMuc"]],
                },
              ],
            },
          ],
        },
      ],
      group: [
        "ProductDetail.Product.Category.id",
        "ProductDetail.Product.Category.Ten",
      ],
      order: [[fn("SUM", col("ThanhTien")), "DESC"]],
      raw: true,
    });

    // Thống kê theo thương hiệu
    const thongKeThuongHieu = await OrderDetail.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("SoLuong")), 0), "tongSoLuong"],
        [fn("COALESCE", fn("SUM", col("ThanhTien")), 0), "tongDoanhThu"],
        [fn("COUNT", fn("DISTINCT", col("id_DonHang"))), "soDonHang"],
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: {
            NgayDatHang: {
              [Op.between]: [startDate, endDate],
            },
            TrangThai: 4,
          },
        },
        {
          model: ProductDetail,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Brand,
                  attributes: [["Ten", "tenThuongHieu"]],
                },
              ],
            },
          ],
        },
      ],
      group: [
        "ProductDetail.Product.Brand.id",
        "ProductDetail.Product.Brand.Ten",
      ],
      order: [[fn("SUM", col("ThanhTien")), "DESC"]],
      raw: true,
    });

    // Sản phẩm bán chạy
    const sanPhamBanChay = await OrderDetail.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("SoLuong")), 0), "tongSoLuong"],
        [fn("COALESCE", fn("SUM", col("ThanhTien")), 0), "tongDoanhThu"],
        [fn("COUNT", fn("DISTINCT", col("id_DonHang"))), "soDonHang"],
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: {
            NgayDatHang: {
              [Op.between]: [startDate, endDate],
            },
            TrangThai: 4,
          },
        },
        {
          model: ProductDetail,
          include: [
            {
              model: Product,
              attributes: [["Ten", "tenSanPham"]],
              include: [
                {
                  model: Brand,
                  attributes: [["Ten", "thuongHieu"]],
                },
                {
                  model: Category,
                  attributes: [["Ten", "danhMuc"]],
                },
              ],
            },
          ],
        },
      ],
      group: [
        "ProductDetail.Product.id",
        "ProductDetail.Product.Ten",
        "ProductDetail.Product.Brand.Ten",
        "ProductDetail.Product.Category.Ten",
      ],
      order: [[fn("SUM", col("SoLuong")), "DESC"]],
      limit: 10,
      raw: true,
    });

    // Tính tổng với null checks
    const tongTienHang = chiTietDonHang.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.dataValues?.TongTienHang || item.TongTienHang) || 0),
      0
    );
    const tongThanhToan = chiTietDonHang.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.dataValues?.TongThanhToan || item.TongThanhToan) || 0),
      0
    );
    const tongGiamGia = chiTietDonHang.reduce(
      (sum, item) =>
        sum + (parseFloat(item.dataValues?.GiamGia || item.GiamGia) || 0),
      0
    );
    const tongPhiVanChuyen = chiTietDonHang.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.dataValues?.PhiVanChuyen || item.PhiVanChuyen) || 0),
      0
    );

    return {
      success: true,
      data: {
        chiTietDonHang: chiTietDonHang.map((order) => ({
          ...order.dataValues,
          tenKhachHang:
            order.User?.dataValues?.tenKhachHang || "Khách vãng lai",
          sdtKhachHang:
            order.User?.dataValues?.sdtKhachHang || order.SDTNguoiNhan,
          hinhThucThanhToan:
            order.PaymentMethod?.dataValues?.hinhThucThanhToan ||
            "Không xác định",
          hinhThucVanChuyen:
            order.ShippingMethod?.dataValues?.hinhThucVanChuyen ||
            "Không xác định",
        })),
        thongKeDanhMuc,
        thongKeThuongHieu,
        sanPhamBanChay,
        tongHop: {
          tongTienHang,
          tongThanhToan,
          tongGiamGia,
          tongPhiVanChuyen,
          tongSoDonHang: chiTietDonHang.length,
        },
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Thống kê khách hàng theo doanh thu
  async thongKeKhachHang(tuNgay, denNgay, limit = 10) {
    // Validate parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];
    const limitValue = parseInt(limit) || 10;

    const khachHangVip = await User.findAll({
      attributes: [
        "id",
        "HoTen",
        "Email",
        "SDT",
        [fn("COUNT", fn("DISTINCT", col("Orders.id"))), "soDonHang"],
        [
          fn("COALESCE", fn("SUM", col("Orders.TongThanhToan")), 0),
          "tongChiTieu",
        ],
        [
          fn("COALESCE", fn("AVG", col("Orders.TongThanhToan")), 0),
          "giaTriTrungBinh",
        ],
        [fn("MAX", col("Orders.NgayDatHang")), "donHangCuoi"],
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: {
            NgayDatHang: {
              [Op.between]: [startDate, endDate],
            },
            TrangThai: 4,
          },
        },
      ],
      group: ["User.id", "User.HoTen", "User.Email", "User.SDT"],
      order: [[fn("SUM", col("Orders.TongThanhToan")), "DESC"]],
      limit: limitValue,
      raw: true,
    });

    return {
      success: true,
      data: khachHangVip,
    };
  }

  // Thống kê mã giảm giá
  async thongKeMaGiamGia(tuNgay, denNgay) {
    // Validate parameters
    if (!tuNgay || !denNgay) {
      throw new Error("Vui lòng cung cấp đầy đủ ngày bắt đầu và ngày kết thúc");
    }

    const startDate = new Date(tuNgay).toISOString().split("T")[0];
    const endDate = new Date(denNgay).toISOString().split("T")[0];

    const maGiamGia = await Order.findAll({
      attributes: [
        "MaGiamGia",
        [fn("COUNT", fn("DISTINCT", col("Order.id"))), "soLanSuDung"],
        [fn("COALESCE", fn("SUM", col("GiamGia")), 0), "tongGiaTriGiam"],
        [fn("COALESCE", fn("AVG", col("GiamGia")), 0), "giaTriTrungBinh"],
      ],
      include: [
        {
          model: Voucher,
          attributes: [["Ten", "Ten"]],
          where: { Ma: col("Order.MaGiamGia") },
          required: true,
        },
      ],
      where: {
        NgayDatHang: {
          [Op.between]: [startDate, endDate],
        },
        TrangThai: 4,
        GiamGia: { [Op.gt]: 0 },
        MaGiamGia: { [Op.ne]: null },
      },
      group: ["MaGiamGia", "Voucher.Ten"],
      order: [[fn("SUM", col("GiamGia")), "DESC"]],
      raw: true,
    });

    return {
      success: true,
      data: maGiamGia.map((item) => ({
        Ma: item.MaGiamGia,
        Ten: item["Voucher.Ten"],
        soLanSuDung: item.soLanSuDung,
        tongGiaTriGiam: item.tongGiaTriGiam,
        giaTriTrungBinh: item.giaTriTrungBinh,
      })),
    };
  }

  // Dashboard thống kê tổng quan
  async dashboardThongKe() {
    // Thống kê hôm nay
    const homNay = await Order.findOne({
      attributes: [
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("SUM", col("TongThanhToan")), "doanhThu"],
        [
          fn(
            "COUNT",
            fn(
              "DISTINCT",
              literal("CASE WHEN id_NguoiMua IS NOT NULL THEN id_NguoiMua END")
            )
          ),
          "khachHangMoi",
        ],
      ],
      where: {
        NgayDatHang: {
          [Op.gte]: fn("CURDATE"),
        },
        TrangThai: { [Op.ne]: 5 },
      },
      raw: true,
    });

    // Thống kê tháng này
    const thangNay = await Order.findOne({
      attributes: [
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("SUM", col("TongThanhToan")), "doanhThu"],
        [
          fn(
            "COUNT",
            fn(
              "DISTINCT",
              literal("CASE WHEN id_NguoiMua IS NOT NULL THEN id_NguoiMua END")
            )
          ),
          "khachHang",
        ],
      ],
      where: {
        [Op.and]: [
          fn("MONTH", col("NgayDatHang")),
          fn("MONTH", fn("CURDATE")),
          fn("YEAR", col("NgayDatHang")),
          fn("YEAR", fn("CURDATE")),
        ],
        TrangThai: { [Op.ne]: 5 },
      },
      raw: true,
    });

    // Thống kê năm nay
    const namNay = await Order.findOne({
      attributes: [
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("SUM", col("TongThanhToan")), "doanhThu"],
      ],
      where: {
        [Op.and]: [fn("YEAR", col("NgayDatHang")), fn("YEAR", fn("CURDATE"))],
        TrangThai: { [Op.ne]: 5 },
      },
      raw: true,
    });

    // Đơn hàng cần xử lý
    const donHangCanXuLy = await Order.findOne({
      attributes: [
        [
          fn("SUM", literal("CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END")),
          "choXacNhan",
        ],
        [
          fn("SUM", literal("CASE WHEN TrangThai = 2 THEN 1 ELSE 0 END")),
          "daXacNhan",
        ],
        [
          fn("SUM", literal("CASE WHEN TrangThai = 3 THEN 1 ELSE 0 END")),
          "dangGiao",
        ],
      ],
      where: {
        TrangThai: { [Op.in]: [1, 2, 3] },
      },
      raw: true,
    });

    // Thống kê doanh thu 7 ngày gần đây
    const doanhThu7Ngay = await Order.findAll({
      attributes: [
        [fn("DATE", col("NgayDatHang")), "ngay"],
        [fn("COUNT", fn("DISTINCT", col("id"))), "soDonHang"],
        [fn("SUM", col("TongThanhToan")), "doanhThu"],
      ],
      where: {
        NgayDatHang: {
          [Op.gte]: literal("DATE_SUB(CURDATE(), INTERVAL 7 DAY)"),
        },
        TrangThai: { [Op.ne]: 5 },
      },
      group: [fn("DATE", col("NgayDatHang"))],
      order: [["ngay", "ASC"]],
      raw: true,
    });

    return {
      success: true,
      data: {
        homNay: homNay,
        thangNay: thangNay,
        namNay: namNay,
        donHangCanXuLy: donHangCanXuLy,
        doanhThu7Ngay,
      },
    };
  }
}

module.exports = new RevenueService();
