const shippingService = require("../services/shipping.service");
const { validationResult } = require("express-validator");

class ShippingController {
  // Lấy danh sách phương thức vận chuyển với phân trang và tìm kiếm
  async getShippingMethods(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, search = "", status } = req.query;
      const result = await shippingService.getShippingMethods(
        parseInt(page),
        parseInt(limit),
        search,
        status ? parseInt(status) : null
      );

      res.json({
        success: true,
        message: "Lấy danh sách phương thức vận chuyển thành công",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy tất cả phương thức vận chuyển đang hoạt động (cho dropdown)
  async getAllActiveShippingMethods(req, res) {
    try {
      const shippingMethods =
        await shippingService.getAllActiveShippingMethods();
      res.json({
        success: true,
        message: "Lấy danh sách phương thức vận chuyển thành công",
        data: shippingMethods,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy phương thức vận chuyển theo ID
  async getShippingMethodById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const shippingMethod = await shippingService.getShippingMethodById(id);

      res.json({
        success: true,
        message: "Lấy thông tin phương thức vận chuyển thành công",
        data: shippingMethod,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Tạo mới phương thức vận chuyển
  async createShippingMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const shippingMethod = await shippingService.createShippingMethod(
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Tạo phương thức vận chuyển thành công",
        data: shippingMethod,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật phương thức vận chuyển
  async updateShippingMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const shippingMethod = await shippingService.updateShippingMethod(
        id,
        req.body
      );

      res.json({
        success: true,
        message: "Cập nhật phương thức vận chuyển thành công",
        data: shippingMethod,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật trạng thái phương thức vận chuyển (0 hoặc 1)
  async updateShippingStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { TrangThai } = req.body;

      if (TrangThai === undefined || ![0, 1].includes(TrangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái phải là 0 hoặc 1",
        });
      }

      const shippingMethod = await shippingService.updateShippingMethod(id, {
        TrangThai,
      });

      const action = TrangThai === 0 ? "vô hiệu hóa" : "kích hoạt";
      res.json({
        success: true,
        message: `${
          action.charAt(0).toUpperCase() + action.slice(1)
        } phương thức vận chuyển thành công`,
        data: shippingMethod,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa cứng phương thức vận chuyển
  async hardDeleteShippingMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const result = await shippingService.hardDeleteShippingMethod(id);

      res.json({
        success: true,
        message: result.message,
        data: result.deletedMethod,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getShippingOptions(req, res) {
    try {
      const { orderValue, address } = req.query;

      if (!orderValue) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin giá trị đơn hàng",
        });
      }

      const options = await shippingService.getShippingOptionsWithFees(
        parseFloat(orderValue),
        address
      );

      res.json({
        success: true,
        message: "Lấy tùy chọn vận chuyển thành công",
        data: options,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async calculateShippingFee(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errors.array(),
        });
      }

      const { id_VanChuyen, tongGiaTriDonHang, diaChi } = req.body;

      const result = await shippingService.calculateShippingFee(
        id_VanChuyen,
        tongGiaTriDonHang,
        diaChi
      );

      res.json({
        success: true,
        message: "Tính phí vận chuyển thành công",
        data: {
          phiVanChuyen: result.fee,
          phiVanChuyenGoc: result.originalFee,
          mienphi: result.isFree,
          thongTin: {
            giaTriDonHang: tongGiaTriDonHang,
            diaChi: diaChi,
            phuongThucVanChuyen: result.method.name,
            moTa: result.method.description,
            thoiGianDuKien: result.method.estimatedTime,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ShippingController();
