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
      res.status(200).json(result);
    } catch (error) {
      next(error);
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

  async kiemTraVoucher(req, res, next) {
    try {
      const { maVoucher } = req.params;
      const { tongTien } = req.body;
      const result = await VoucherService.kiemTraVoucher(maVoucher, tongTien);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoucherController();
