const { Wishlist, Product, Brand, Category, User } = require("../models");
const { Op } = require("sequelize");

const wishlistService = {
  // Thêm sản phẩm vào wishlist
  async addToWishlist(userId, productId) {
    try {
      // Kiểm tra xem sản phẩm đã có trong wishlist chưa
      const existingItem = await Wishlist.findOne({
        where: {
          id_NguoiDung: userId,
          id_SanPham: productId,
        },
      });

      if (existingItem) {
        return {
          success: false,
          message: "Sản phẩm đã có trong danh sách yêu thích",
        };
      }

      // Thêm sản phẩm vào wishlist
      const wishlistItem = await Wishlist.create({
        id_NguoiDung: userId,
        id_SanPham: productId,
      });

      return {
        success: true,
        message: "Đã thêm sản phẩm vào danh sách yêu thích",
        data: wishlistItem,
      };
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      throw error;
    }
  },

  // Xóa sản phẩm khỏi wishlist
  async removeFromWishlist(userId, productId) {
    try {
      const deleted = await Wishlist.destroy({
        where: {
          id_NguoiDung: userId,
          id_SanPham: productId,
        },
      });

      if (deleted === 0) {
        return {
          success: false,
          message: "Không tìm thấy sản phẩm trong danh sách yêu thích",
        };
      }

      return {
        success: true,
        message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
      };
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  },

  // Lấy danh sách wishlist của user
  async getUserWishlist(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "NgayThem",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const wishlistItems = await Wishlist.findAndCountAll({
        where: {
          id_NguoiDung: userId,
        },
        include: [
          {
            model: Product,
            as: "product",
            include: [
              {
                model: Brand,
                as: "brand",
                attributes: ["id", "Ten"],
              },
              {
                model: Category,
                as: "category",
                attributes: ["id", "Ten"],
              },
            ],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true,
      });

      return {
        success: true,
        data: {
          items: wishlistItems.rows,
          pagination: {
            total: wishlistItems.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(wishlistItems.count / limit),
          },
        },
      };
    } catch (error) {
      console.error("Error getting user wishlist:", error);
      throw error;
    }
  },

  // Kiểm tra sản phẩm có trong wishlist không
  async isInWishlist(userId, productId) {
    try {
      const item = await Wishlist.findOne({
        where: {
          id_NguoiDung: userId,
          id_SanPham: productId,
        },
      });

      return {
        success: true,
        data: {
          isInWishlist: !!item,
        },
      };
    } catch (error) {
      console.error("Error checking wishlist:", error);
      throw error;
    }
  },

  // Xóa nhiều sản phẩm khỏi wishlist
  async removeMultipleFromWishlist(userId, productIds) {
    try {
      const deleted = await Wishlist.destroy({
        where: {
          id_NguoiDung: userId,
          id_SanPham: {
            [Op.in]: productIds,
          },
        },
      });

      return {
        success: true,
        message: `Đã xóa ${deleted} sản phẩm khỏi danh sách yêu thích`,
        deletedCount: deleted,
      };
    } catch (error) {
      console.error("Error removing multiple from wishlist:", error);
      throw error;
    }
  },

  // Đếm số lượng sản phẩm trong wishlist
  async getWishlistCount(userId) {
    try {
      const count = await Wishlist.count({
        where: {
          id_NguoiDung: userId,
        },
      });

      return {
        success: true,
        data: {
          count,
        },
      };
    } catch (error) {
      console.error("Error getting wishlist count:", error);
      throw error;
    }
  },

  // Xóa toàn bộ wishlist của user
  async clearWishlist(userId) {
    try {
      const deleted = await Wishlist.destroy({
        where: {
          id_NguoiDung: userId,
        },
      });

      return {
        success: true,
        message: `Đã xóa ${deleted} sản phẩm khỏi danh sách yêu thích`,
        deletedCount: deleted,
      };
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      throw error;
    }
  },

  // Lấy danh sách sản phẩm được yêu thích nhiều nhất
  async getMostWishedProducts(options = {}) {
    try {
      const { limit = 10 } = options;

      const products = await Product.findAll({
        include: [
          {
            model: Wishlist,
            as: "wishlistItems",
            attributes: [],
          },
          {
            model: Brand,
            as: "brand",
            attributes: ["id", "Ten"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "Ten"],
          },
        ],
        attributes: [
          "id",
          "Ten",
          "Gia",
          "GiaKhuyenMai",
          "HinhAnh",
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("wishlistItems.id")
            ),
            "wishlistCount",
          ],
        ],
        group: ["Product.id", "brand.id", "category.id"],
        order: [[require("sequelize").literal("wishlistCount"), "DESC"]],
        limit: parseInt(limit),
        having: require("sequelize").literal("wishlistCount > 0"),
        subQuery: false,
      });

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      console.error("Error getting most wished products:", error);
      throw error;
    }
  },

  // Hiển thị tất cả wishlist (cho admin)
  async hienThiWishlist() {
    try {
      const wishlistItems = await Wishlist.findAll({
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "Ten", "Gia", "GiaKhuyenMai", "HinhAnh"],
            include: [
              {
                model: Brand,
                as: "brand",
                attributes: ["id", "Ten"],
              },
              {
                model: Category,
                as: "category",
                attributes: ["id", "Ten"],
              },
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "HoTen", "Email"],
          },
        ],
        order: [["NgayThem", "DESC"]],
      });

      return {
        success: true,
        data: wishlistItems,
      };
    } catch (error) {
      console.error("Error getting all wishlist items:", error);
      throw error;
    }
  },

  // Thống kê wishlist (cho admin)
  async thongKeWishlist() {
    try {
      const { sequelize } = require("../models");

      // Thống kê tổng quan
      const tongSoWishlist = await Wishlist.count();
      const soNguoiDungCoWishlist = await Wishlist.count({
        distinct: true,
        col: "id_NguoiDung",
      });

      // Top sản phẩm được yêu thích nhiều nhất
      const topSanPhamYeuThich = await Product.findAll({
        include: [
          {
            model: Wishlist,
            as: "wishlistItems",
            attributes: [],
          },
        ],
        attributes: [
          "id",
          "Ten",
          "HinhAnh",
          [
            sequelize.fn("COUNT", sequelize.col("wishlistItems.id")),
            "soLuotYeuThich",
          ],
        ],
        group: ["Product.id"],
        order: [[sequelize.literal("soLuotYeuThich"), "DESC"]],
        limit: 10,
        having: sequelize.literal("soLuotYeuThich > 0"),
        subQuery: false,
      });

      // Thống kê theo thời gian (30 ngày gần đây)
      const thongKeTheoNgay = await Wishlist.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("NgayThem")), "ngay"],
          [sequelize.fn("COUNT", "*"), "soLuong"],
        ],
        where: {
          NgayThem: {
            [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("NgayThem"))],
        order: [[sequelize.fn("DATE", sequelize.col("NgayThem")), "ASC"]],
        raw: true,
      });

      return {
        success: true,
        data: {
          tongSoWishlist,
          soNguoiDungCoWishlist,
          topSanPhamYeuThich,
          thongKeTheoNgay,
        },
      };
    } catch (error) {
      console.error("Error getting wishlist statistics:", error);
      throw error;
    }
  },
};

module.exports = wishlistService;
