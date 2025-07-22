const {
  User,
  Order,
  OrderDetail,
  ProductDetail,
  Product,
  PaymentMethod,
  ShippingMethod,
  Wishlist,
  UserRole,
  Role,
} = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

class UserService {
  async getProfile(userId) {
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
          attributes: ["id", "TenQuyen"],
        },
      ],
      attributes: ["id", "Email", "HoTen", "SDT", "DiaChi", "TrangThai"],
    });

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Format response to match original structure
    const userProfile = {
      id: user.id,
      Email: user.Email,
      HoTen: user.HoTen,
      SDT: user.SDT,
      DiaChi: user.DiaChi,
      TrangThai: user.TrangThai,
      id_Quyen: user.roles && user.roles.length > 0 ? user.roles[0].id : null,
    };

    return userProfile;
  }

  async updateProfile(userId, userData) {
    const allowedFields = {
      hoTen: "HoTen",
      soDienThoai: "SDT",
      diaChi: "DiaChi",
    };

    const updateData = {};
    for (const key in allowedFields) {
      if (userData[key] !== undefined) {
        updateData[allowedFields[key]] = userData[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Không có trường nào để cập nhật");
    }

    await User.update(updateData, {
      where: { id: userId },
    });

    return this.getProfile(userId);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "MatKhau"],
    });

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.MatKhau);
    if (!isValidPassword) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.update({ MatKhau: hashedPassword }, { where: { id: userId } });

    return true;
  }

  async deleteAccount(userId) {
    // Delete refresh tokens first
    await User.sequelize.query(
      "DELETE FROM token_lammoi WHERE id_NguoiDung = ?",
      {
        replacements: [userId],
        type: User.sequelize.QueryTypes.DELETE,
      }
    );

    // Soft delete by updating status
    await User.update({ TrangThai: 0 }, { where: { id: userId } });

    return true;
  }

  async getOrderHistory(userId) {
    const orders = await Order.findAll({
      where: { id_NguoiMua: userId },
      include: [
        {
          model: PaymentMethod,
          as: "paymentMethod",
          attributes: ["Ten"],
        },
        {
          model: ShippingMethod,
          as: "shippingMethod",
          attributes: ["Ten"],
        },
        {
          model: OrderDetail,
          as: "orderDetails",
          include: [
            {
              model: ProductDetail,
              as: "productDetail",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["id", "Ten", "HinhAnh"],
                },
              ],
            },
          ],
        },
      ],
      order: [["NgayDatHang", "DESC"]],
    });

    // Format response to match original structure
    const formattedOrders = orders.map((order) => {
      const orderData = order.toJSON();

      return {
        ...orderData,
        tenHinhThucThanhToan: orderData.paymentMethod?.Ten || null,
        tenHinhThucVanChuyen: orderData.shippingMethod?.Ten || null,
        chiTiet:
          orderData.orderDetails?.map((detail) => ({
            ...detail,
            id_SanPham: detail.productDetail?.product?.id,
            tenSanPham: detail.productDetail?.product?.Ten,
            HinhAnh: detail.productDetail?.product?.HinhAnh,
          })) || [],
      };
    });

    return formattedOrders;
  }

  async getWishlist(userId) {
    const wishlistItems = await Wishlist.findAll({
      where: { id_NguoiDung: userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "Ten", "HinhAnh", "Gia", "MoTa"],
        },
      ],
    });

    // Format response to match original structure
    const formattedWishlist = wishlistItems.map((item) => {
      const itemData = item.toJSON();
      return {
        ...itemData,
        tenSanPham: itemData.product?.Ten,
        HinhAnh: itemData.product?.HinhAnh,
        Gia: itemData.product?.Gia,
        MoTa: itemData.product?.MoTa,
      };
    });

    return formattedWishlist;
  }

  async addToWishlist(userId, productId) {
    if (userId == null || productId == null) {
      throw new Error("userId và productId không được để trống");
    }

    const existing = await Wishlist.findOne({
      where: {
        id_NguoiDung: userId,
        id_SanPham: productId,
      },
    });

    if (existing) {
      throw new Error("Sản phẩm đã có trong danh sách yêu thích");
    }

    await Wishlist.create({
      id_NguoiDung: userId,
      id_SanPham: productId,
    });

    return true;
  }

  async removeFromWishlist(userId, productId) {
    await Wishlist.destroy({
      where: {
        id_NguoiDung: userId,
        id_SanPham: productId,
      },
    });

    return true;
  }
}

module.exports = new UserService();
