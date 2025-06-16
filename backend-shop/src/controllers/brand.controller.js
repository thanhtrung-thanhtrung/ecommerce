const { validationResult } = require("express-validator");
const brandService = require("../services/brand.service");

class BrandController {
  // Tạo thương hiệu mới
  async taoThuongHieu(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const brandData = req.body;
      const newBrand = await brandService.taoThuongHieu(brandData);

      return res.status(201).json({
        success: true,
        message: "Tạo thương hiệu thành công",
        data: newBrand,
      });
    } catch (error) {
      return res
        .status(error.message === "Tên thương hiệu đã tồn tại" ? 400 : 500)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi tạo thương hiệu",
        });
    }
  }

  // Cập nhật thương hiệu
  async capNhatThuongHieu(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const brandData = req.body;

      const updatedBrand = await brandService.capNhatThuongHieu(id, brandData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật thương hiệu thành công",
        data: updatedBrand,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy thương hiệu" ? 404 : 400)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi cập nhật thương hiệu",
        });
    }
  }

  // Xóa thương hiệu
  async xoaThuongHieu(req, res) {
    try {
      const { id } = req.params;
      const result = await brandService.xoaThuongHieu(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      return res
        .status(
          error.message === "Không tìm thấy thương hiệu"
            ? 404
            : error.message === "Không thể xóa thương hiệu đang có sản phẩm"
            ? 400
            : 500
        )
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi xóa thương hiệu",
        });
    }
  }

  // Cập nhật trạng thái thương hiệu
  async capNhatTrangThai(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { TrangThai } = req.body;

      const result = await brandService.capNhatTrangThai(id, TrangThai);

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thương hiệu thành công",
        data: result,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy thương hiệu" ? 404 : 500)
        .json({
          success: false,
          message:
            error.message ||
            "Có lỗi xảy ra khi cập nhật trạng thái thương hiệu",
        });
    }
  }

  // Lấy chi tiết thương hiệu
  async layChiTietThuongHieu(req, res) {
    try {
      const { id } = req.params;
      const brand = await brandService.layChiTietThuongHieu(id);

      return res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy thương hiệu" ? 404 : 500)
        .json({
          success: false,
          message:
            error.message || "Có lỗi xảy ra khi lấy chi tiết thương hiệu",
        });
    }
  }

  // Lấy danh sách thương hiệu
  async layDanhSachThuongHieu(req, res) {
    try {
      const filters = {
        tuKhoa: req.query.tuKhoa,
        trangThai:
          req.query.trangThai !== undefined
            ? parseInt(req.query.trangThai)
            : undefined,
      };

      const brands = await brandService.layDanhSachThuongHieu(filters);

      return res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách thương hiệu",
      });
    }
  }

  // Thống kê thương hiệu
  async thongKeThuongHieu(req, res) {
    try {
      const stats = await brandService.thongKeThuongHieu();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi thống kê thương hiệu",
      });
    }
  }
}

module.exports = new BrandController();
