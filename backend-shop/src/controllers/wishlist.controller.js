const WishlistService = require("../services/wishlist.service");
const {
  wishlistValidator,
  getWishlistValidator,
  checkMultipleProductsValidator,
  getWishlistDetailValidator,
} = require("../validators/wishlist.validator");

class WishlistController {
  // Thêm sản phẩm vào wishlist
  async themVaoWishlist(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId; // Lấy userId từ body hoặc query
      const { productId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const result = await WishlistService.themVaoWishlist(
        parseInt(userId),
        parseInt(productId)
      );

      res.status(201).json({
        success: true,
        message: "Đã thêm sản phẩm vào danh sách yêu thích",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa sản phẩm khỏi wishlist
  async xoaKhoiWishlist(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId;
      const { productId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      await WishlistService.xoaKhoiWishlist(
        parseInt(userId),
        parseInt(productId)
      );

      res.status(200).json({
        success: true,
        message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách wishlist của người dùng
  async layDanhSachWishlist(req, res, next) {
    try {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const options = {
        danhMuc: req.query.danhMuc ? parseInt(req.query.danhMuc) : null,
        thuongHieu: req.query.thuongHieu
          ? parseInt(req.query.thuongHieu)
          : null,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null,
      };

      const wishlist = await WishlistService.layDanhSachWishlist(
        parseInt(userId),
        options
      );
      const soLuong = await WishlistService.demSoLuongWishlist(
        parseInt(userId)
      );

      res.status(200).json({
        success: true,
        data: {
          wishlist,
          tongSo: soLuong,
          trang: options.limit
            ? Math.floor((options.offset || 0) / options.limit) + 1
            : 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Kiểm tra sản phẩm có trong wishlist không
  async kiemTraTrongWishlist(req, res, next) {
    try {
      const userId = req.query.userId;
      const { productId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const isInWishlist = await WishlistService.kiemTraTrongWishlist(
        parseInt(userId),
        parseInt(productId)
      );

      res.status(200).json({
        success: true,
        data: {
          coTrongWishlist: isInWishlist,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Kiểm tra nhiều sản phẩm có trong wishlist không
  async kiemTraNhieuSanPham(req, res, next) {
    try {
      const userId = req.query.userId;
      const productIds = JSON.parse(req.query.productIds);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const wishlistStatus = await WishlistService.kiemTraNhieuSanPham(
        parseInt(userId),
        productIds
      );

      res.status(200).json({
        success: true,
        data: wishlistStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa toàn bộ wishlist
  async xoaToanBoWishlist(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const deletedCount = await WishlistService.xoaToanBoWishlist(
        parseInt(userId)
      );

      res.status(200).json({
        success: true,
        message: `Đã xóa ${deletedCount} sản phẩm khỏi danh sách yêu thích`,
        data: { soLuongDaXoa: deletedCount },
      });
    } catch (error) {
      next(error);
    }
  }

  // Đếm số lượng sản phẩm trong wishlist
  async demSoLuongWishlist(req, res, next) {
    try {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người dùng",
        });
      }

      const soLuong = await WishlistService.demSoLuongWishlist(
        parseInt(userId)
      );

      res.status(200).json({
        success: true,
        data: { soLuong },
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy wishlist chi tiết (cho admin)
  async layWishlistChiTiet(req, res, next) {
    try {
      const options = {
        userId: req.query.userId ? parseInt(req.query.userId) : null,
        productId: req.query.productId ? parseInt(req.query.productId) : null,
        tuNgay: req.query.tuNgay || null,
        denNgay: req.query.denNgay || null,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null,
      };

      const wishlist = await WishlistService.layWishlistChiTiet(options);

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }
   async hienThiWishlist(req,res){
    const hienThi = await WishlistService.hienThiWishlist();
    res.status(200).json({
      success: true,
      data: hienThi,
    });
   }
  // Thống kê wishlist (cho admin)
  async thongKeWishlist(req, res, next) {
    try {
      const stats = await WishlistService.thongKeWishlist();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();
