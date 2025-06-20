const supplierService = require("../services/supplier.service");

class SupplierController {
  // Tạo nhà cung cấp mới
  async taoNhaCungCap(req, res) {
    try {
      const result = await supplierService.taoNhaCungCap(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật nhà cung cấp
  async capNhatNhaCungCap(req, res) {
    try {
      const { id } = req.params;
      const result = await supplierService.capNhatNhaCungCap(id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Xóa nhà cung cấp
  async xoaNhaCungCap(req, res) {
    try {
      const { id } = req.params;
      const result = await supplierService.xoaNhaCungCap(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cập nhật trạng thái nhà cung cấp
  async capNhatTrangThai(req, res) {
    try {
      const { id } = req.params;
      const { TrangThai } = req.body;
      const result = await supplierService.capNhatTrangThai(id, TrangThai);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy chi tiết nhà cung cấp
  async layChiTietNhaCungCap(req, res) {
    try {
      const { id } = req.params;
      const result = await supplierService.layChiTietNhaCungCap(id);
      res.json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy danh sách nhà cung cấp
  async layDanhSachNhaCungCap(req, res) {
    try {
      const filters = {
        tuKhoa: req.query.tuKhoa,
        trangThai: req.query.trangThai,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        offset:
          req.query.page && req.query.limit
            ? (parseInt(req.query.page) - 1) * parseInt(req.query.limit)
            : 0,
      };

      const result = await supplierService.layDanhSachNhaCungCap(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Thống kê nhà cung cấp
  async thongKeNhaCungCap(req, res) {
    try {
      const result = await supplierService.thongKeNhaCungCap();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Lấy danh sách nhà cung cấp hoạt động (cho dropdown)
  async layDanhSachNhaCungCapHoatDong(req, res) {
    try {
      const result = await supplierService.layDanhSachNhaCungCapHoatDong();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SupplierController();
