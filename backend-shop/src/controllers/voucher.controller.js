const VoucherService = require("../services/voucher.service");
const {
  voucherValidator,
  updateVoucherStatusValidator,
  searchVoucherValidator,
} = require("../validators/voucher.validator");

class VoucherController {
  async taoVoucher(req, res, next) {
    try {
      const voucherData = req.body;
      const newVoucher = await VoucherService.taoVoucher(voucherData);
      res.status(201).json(newVoucher);
    } catch (error) {
      next(error);
    }
  }

  async capNhatVoucher(req, res, next) {
    try {
      const { maVoucher } = req.params;
      const voucherData = req.body;
      const updatedVoucher = await VoucherService.capNhatVoucher(
        maVoucher,
        voucherData
      );
      res.status(200).json(updatedVoucher);
    } catch (error) {
      next(error);
    }
  }

  async capNhatTrangThai(req, res, next) {
    try {
      const { maVoucher } = req.params;
      const { TrangThai } = req.body;
      const result = await VoucherService.capNhatTrangThai(
        maVoucher,
        TrangThai
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái voucher thành công",
        data: result,
      }); 
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Có lỗi xảy ra khi cập nhật trạng thái voucher",
      });
    }
  } 

  async timKiemVoucher(req, res, next) {
    try {
      const filters = req.query;
      const vouchers = await VoucherService.timKiemVoucher(filters);
      res.status(200).json(vouchers);
    } catch (error) {
      next(error);
    }
  }

  async applyVoucher(req, res, next) {
    try {
      const { maVoucher } = req.params;
      const { tongTien, id_nguoidung } = req.body;

      // Lấy id_nguoidung từ token hoặc body (cho guest)
      const userId = req.user?.id || id_nguoidung || null;

      const result = await VoucherService.applyVoucher(
        maVoucher,
        tongTien,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Áp dụng mã giảm giá thành công",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new VoucherController();
