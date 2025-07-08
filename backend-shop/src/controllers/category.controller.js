const { validationResult } = require("express-validator");
const categoryService = require("../services/category.service");

class CategoryController {
  // Tạo danh mục mới
  async taoDanhMuc(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const categoryData = req.body;
      const newCategory = await categoryService.taoDanhMuc(categoryData);
      return res.status(201).json({
        success: true,
        message: "tao danh muc thanh cong ",
        data: newCategory,
      });
    } catch (error) {
      return res
        .status(error.message === "Tên danh mục đã tồn tại" ? 400 : 500)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi tạo danh mục",
        });
    }
    // try {
    //   const errors = validationResult(req);
    //   if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    //   }

    //   const categoryData = req.body;
    //   const newCategory = await categoryService.taoDanhMuc(categoryData);

    //   return res.status(201).json({
    //     success: true,
    //     message: "Tạo danh mục thành công",
    //     data: newCategory,
    //   });
    // } catch (error) {
    //   return res
    //     .status(error.message === "Tên danh mục đã tồn tại" ? 400 : 500)
    //     .json({
    //       success: false,
    //       message: error.message || "Có lỗi xảy ra khi tạo danh mục",
    //     });
    // }
  }

  // Cập nhật danh mục
  async capNhatDanhMuc(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { id } = req.params;
      const categoryData = req.body;
      const updatedCategoruy = await categoryService.capNhatDanhMuc(
        id,
        categoryData
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật danh mục thành công",

        data: updatedCategoruy,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy danh mục" ? 404 : 400)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi cập nhật danh mục",
        });
    }
    // try {
    //   const errors = validationResult(req);
    //   if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    //   }

    //   const { id } = req.params;
    //   const categoryData = req.body;

    //   const updatedCategory = await categoryService.capNhatDanhMuc(
    //     id,
    //     categoryData
    //   );

    //   return res.status(200).json({
    //     success: true,
    //     message: "Cập nhật danh mục thành công",
    //     data: updatedCategory,
    //   });
    // } catch (error) {
    //   return res
    //     .status(error.message === "Không tìm thấy danh mục" ? 404 : 400)
    //     .json({
    //       success: false,
    //       message: error.message || "Có lỗi xảy ra khi cập nhật danh mục",
    //     });
    // }
  }

  // Xóa danh mục
  async xoaDanhMuc(req, res) {
    try {
      const { id } = req.params;
      const result = await categoryService.xoaDanhMuc(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      return res
        .status(
          error.message === "Không tìm thấy danh mục"
            ? 404
            : error.message === "Không thể xóa danh mục đang có sản phẩm"
            ? 400
            : 500
        )
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi xóa danh mục",
        });
    }
  }

  // Cập nhật trạng thái danh mục
  async capNhatTrangThai(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { TrangThai } = req.body;

      const result = await categoryService.capNhatTrangThai(id, TrangThai);

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái danh mục thành công",
        data: result,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy danh mục" ? 404 : 500)
        .json({
          success: false,
          message:
            error.message || "Có lỗi xảy ra khi cập nhật trạng thái danh mục",
        });
    }
  }

  // Lấy chi tiết danh mục
  async layChiTietDanhMuc(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryService.layChiTietDanhMuc(id);

      return res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      return res
        .status(error.message === "Không tìm thấy danh mục" ? 404 : 500)
        .json({
          success: false,
          message: error.message || "Có lỗi xảy ra khi lấy chi tiết danh mục",
        });
    }
  }

  // Lấy danh sách danh mục
  async layDanhSachDanhMuc(req, res) {
    try {
      const filters = {
        tuKhoa: req.query.tuKhoa,
        trangThai:
          req.query.trangThai !== undefined
            ? parseInt(req.query.trangThai)
            : undefined,
      };

      const categories = await categoryService.layDanhSachDanhMuc(filters);

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách danh mục",
      });
    }
  }

  // Thống kê danh mục
  async thongKeDanhMuc(req, res) {
    try {
      const stats = await categoryService.thongKeDanhMuc();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi thống kê danh mục",
      });
    }
  }
}

module.exports = new CategoryController();
