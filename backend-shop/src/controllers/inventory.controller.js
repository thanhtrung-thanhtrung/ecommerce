const InventoryService = require("../services/inventory.service");

class InventoryController {
  // Kiểm tra tồn kho
  async checkStock(req, res, next) {
    try {
      const { chiTietSanPhamId, soLuong } = req.body;
      const result = await InventoryService.checkStock(
        chiTietSanPhamId,
        soLuong
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Tạo phiếu nhập
  async createPhieuNhap(req, res, next) {
    try {
      const phieuNhapData = req.body;
      const userId = req.body.userId || req.query.userId || 1; // Default to user ID 1 if not provided
      const result = await InventoryService.createPhieuNhap(
        phieuNhapData,
        userId
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật phiếu nhập
  async updatePhieuNhap(req, res, next) {
    try {
      const { phieuNhapId } = req.params;
      const updateData = req.body;
      const result = await InventoryService.updatePhieuNhap(
        phieuNhapId,
        updateData
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách phiếu nhập
  async getPhieuNhapList(req, res, next) {
    try {
      const query = req.query;
      const result = await InventoryService.getPhieuNhapList(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết phiếu nhập
  async getPhieuNhapDetail(req, res, next) {
    try {
      const { phieuNhapId } = req.params;
      const result = await InventoryService.getPhieuNhapDetail(phieuNhapId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Thống kê tồn kho
  async thongKeTonKho(req, res, next) {
    try {
      const query = req.query;
      const result = await InventoryService.thongKeTonKho(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Thống kê nhập kho theo thời gian
  async thongKeNhapKhoTheoThoiGian(req, res, next) {
    try {
      const query = req.query;
      const result = await InventoryService.thongKeNhapKhoTheoThoiGian(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lấy lịch sử nhập kho của sản phẩm
  async getProductImportHistory(req, res, next) {
    try {
      const { chiTietSanPhamId } = req.params;
      const query = req.query;
      const result = await InventoryService.getProductImportHistory(
        chiTietSanPhamId,
        query
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Kiểm tra tồn kho trước khi nhập
  async checkStockBeforeImport(req, res, next) {
    try {
      const { chiTietSanPhamId, soLuong } = req.body;
      const result = await InventoryService.checkStock(
        chiTietSanPhamId,
        soLuong
      );
      res.status(200).json({
        success: true,
        message: "Kiểm tra tồn kho thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
