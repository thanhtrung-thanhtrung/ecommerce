const revenueService = require("../services/revenue.service");

class RevenueController {
  // GET /api/revenue/stats - Thống kê doanh thu theo thời gian
  async thongKeDoanhThu(req, res) {
    try {
      const { tuNgay, denNgay, loaiThongKe = "ngay" } = req.query;

      const result = await revenueService.thongKeDoanhThu(
        tuNgay,
        denNgay,
        loaiThongKe
      );

      res.status(200).json({
        success: true,
        message: "Lấy thống kê doanh thu thành công",
        data: result.data,
      });
    } catch (error) {
      console.error("Lỗi thống kê doanh thu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thống kê doanh thu",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/report - Báo cáo doanh thu chi tiết
  async baoCaoDoanhThu(req, res) {
    try {
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        id_DanhMuc: req.query.id_DanhMuc,
        id_ThuongHieu: req.query.id_ThuongHieu,
        id_ThanhToan: req.query.id_ThanhToan,
        id_VanChuyen: req.query.id_VanChuyen,
        trangThai: req.query.trangThai,
        page: req.query.page || 1,
        limit: req.query.limit || 20,
      };

      const result = await revenueService.baoCaoDoanhThu(filters);

      res.status(200).json({
        success: true,
        message: "Lấy báo cáo doanh thu thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Lỗi báo cáo doanh thu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo báo cáo doanh thu",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/customers - Thống kê khách hàng VIP
  async thongKeKhachHang(req, res) {
    try {
      const { tuNgay, denNgay, limit = 10 } = req.query;

      const result = await revenueService.thongKeKhachHang(
        tuNgay,
        denNgay,
        limit
      );

      res.status(200).json({
        success: true,
        message: "Lấy thống kê khách hàng thành công",
        data: result.data,
      });
    } catch (error) {
      console.error("Lỗi thống kê khách hàng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thống kê khách hàng",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/vouchers - Thống kê mã giảm giá
  async thongKeMaGiamGia(req, res) {
    try {
      const { tuNgay, denNgay } = req.query;

      const result = await revenueService.thongKeMaGiamGia(tuNgay, denNgay);

      res.status(200).json({
        success: true,
        message: "Lấy thống kê mã giảm giá thành công",
        data: result.data,
      });
    } catch (error) {
      console.error("Lỗi thống kê mã giảm giá:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thống kê mã giảm giá",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/dashboard - Dashboard thống kê tổng quan
  async dashboardThongKe(req, res) {
    try {
      const result = await revenueService.dashboardThongKe();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê dashboard thành công",
        data: result.data,
      });
    } catch (error) {
      console.error("Lỗi dashboard thống kê:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê dashboard",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/export - Xuất báo cáo
  async xuatBaoCao(req, res) {
    try {
      const { tuNgay, denNgay, loaiBaoCao, format = "excel" } = req.query;

      // Tạm thời trả về thông báo chức năng đang phát triển
      // Trong thực tế, bạn sẽ cần implement logic xuất file Excel/PDF/CSV

      res.status(200).json({
        success: true,
        message: "Chức năng xuất báo cáo đang được phát triển",
        data: {
          tuNgay,
          denNgay,
          loaiBaoCao,
          format,
          note: "Sẽ được implement với thư viện như ExcelJS, PDFKit, hoặc csv-writer",
        },
      });
    } catch (error) {
      console.error("Lỗi xuất báo cáo:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xuất báo cáo",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/compare - So sánh doanh thu giữa 2 kỳ
  async soSanhDoanhThu(req, res) {
    try {
      const { tuNgay1, denNgay1, tuNgay2, denNgay2 } = req.query;

      // Lấy doanh thu kỳ 1
      const ky1 = await revenueService.thongKeDoanhThu(
        tuNgay1,
        denNgay1,
        "ngay"
      );

      // Lấy doanh thu kỳ 2
      const ky2 = await revenueService.thongKeDoanhThu(
        tuNgay2,
        denNgay2,
        "ngay"
      );

      // Tính toán chênh lệch
      const tongThanhToanKy1 = ky1.data.tongHop.tongThanhToan;
      const tongThanhToanKy2 = ky2.data.tongHop.tongThanhToan;
      const chenhLech = tongThanhToanKy1 - tongThanhToanKy2;
      const phanTramChenhLech =
        tongThanhToanKy2 > 0
          ? ((chenhLech / tongThanhToanKy2) * 100).toFixed(2)
          : 0;

      res.status(200).json({
        success: true,
        message: "So sánh doanh thu thành công",
        data: {
          ky1: {
            tuNgay: tuNgay1,
            denNgay: denNgay1,
            doanhThu: ky1.data,
          },
          ky2: {
            tuNgay: tuNgay2,
            denNgay: denNgay2,
            doanhThu: ky2.data,
          },
          soSanh: {
            chenhLechAbsolute: chenhLech,
            chenhLechPercent: phanTramChenhLech,
            tangTruong:
              chenhLech > 0 ? "Tăng" : chenhLech < 0 ? "Giảm" : "Không đổi",
          },
        },
      });
    } catch (error) {
      console.error("Lỗi so sánh doanh thu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi so sánh doanh thu",
        error: error.message,
      });
    }
  }

  // GET /api/revenue/overview - Tổng quan doanh thu (cho admin dashboard)
  async tongQuanDoanhThu(req, res) {
    try {
      const { period = "month" } = req.query; // day, week, month, year

      let tuNgay, denNgay;
      const now = new Date();

      switch (period) {
        case "day":
          tuNgay = new Date(now.setHours(0, 0, 0, 0))
            .toISOString()
            .split("T")[0];
          denNgay = new Date(now.setHours(23, 59, 59, 999))
            .toISOString()
            .split("T")[0];
          break;
        case "week":
          const startOfWeek = new Date(
            now.setDate(now.getDate() - now.getDay())
          );
          tuNgay = startOfWeek.toISOString().split("T")[0];
          denNgay = new Date().toISOString().split("T")[0];
          break;
        case "month":
          tuNgay = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
          denNgay = new Date().toISOString().split("T")[0];
          break;
        case "year":
          tuNgay = new Date(now.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
          denNgay = new Date().toISOString().split("T")[0];
          break;
        default:
          tuNgay = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
          denNgay = new Date().toISOString().split("T")[0];
      }

      const result = await revenueService.thongKeDoanhThu(
        tuNgay,
        denNgay,
        "ngay"
      );

      res.status(200).json({
        success: true,
        message: "Lấy tổng quan doanh thu thành công",
        data: {
          period,
          tuNgay,
          denNgay,
          ...result.data,
        },
      });
    } catch (error) {
      console.error("Lỗi tổng quan doanh thu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy tổng quan doanh thu",
        error: error.message,
      });
    }
  }
}

module.exports = new RevenueController();
