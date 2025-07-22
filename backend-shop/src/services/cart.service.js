const {
  Cart,
  ProductDetail,
  Product,
  Size,
  Color,
  Brand,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

class CartService {
  async getCart(userId = null, sessionId = null) {
    const whereClause = {};

    if (userId) {
      whereClause.id_NguoiDung = userId;
    } else if (sessionId) {
      whereClause.id_NguoiDung = null;
      whereClause.session_id = sessionId;
    } else {
      // If no userId or sessionId, return empty cart
      return [];
    }

    const cartItems = await Cart.findAll({
      where: whereClause,
      include: [
        {
          model: ProductDetail,
          as: "productDetail",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "Ten", "HinhAnh", "Gia", "GiaKhuyenMai"],
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["Ten"],
                },
              ],
            },
            {
              model: Size,
              as: "size",
              attributes: ["Ten"],
            },
            {
              model: Color,
              as: "color",
              attributes: ["Ten"],
            },
          ],
        },
      ],
      order: [["id", "DESC"]],
    });

    // Process and format the cart items
    const processedItems = cartItems.map((item) => {
      const cartItem = item.get({ plain: true });
      const product = cartItem.productDetail.product;

      let anhChinh = "/placeholder.jpg";
      try {
        if (product.HinhAnh && product.HinhAnh !== "{}") {
          const imageData =
            typeof product.HinhAnh === "string"
              ? JSON.parse(product.HinhAnh)
              : product.HinhAnh;
          anhChinh = imageData.anhChinh || "/placeholder.jpg";
        }
      } catch (error) {
        console.error("Error parsing HinhAnh:", error);
      }

      // Get real-time stock using raw query (since we need to use the database function)
      return {
        id: cartItem.id,
        id_ChiTietSanPham: cartItem.id_ChiTietSanPham,
        soLuong: Number(cartItem.SoLuong) || 0,
        id_SanPham: product.id,
        Ten: product.Ten,
        anhChinh,
        gia: Number(product.Gia) || 0,
        GiaKhuyenMai: product.GiaKhuyenMai
          ? Number(product.GiaKhuyenMai)
          : null,
        kichCo: cartItem.productDetail.size.Ten,
        mauSac: cartItem.productDetail.color.Ten,
        tenThuongHieu: product.brand?.Ten || null,
        // Will be populated by getRealTimeStock function
        SoLuongTon: 0,
      };
    });

    // Get real-time stock for each item using raw query
    for (let item of processedItems) {
      const [stockResult] = await sequelize.query(
        "SELECT fn_TinhTonKhoRealTime(?) as SoLuongTon",
        {
          replacements: [item.id_ChiTietSanPham],
          type: sequelize.QueryTypes.SELECT,
        }
      );
      item.SoLuongTon = stockResult?.SoLuongTon || 0;
    }

    return processedItems;
  }

  async addToCart(cartData, userId = null, sessionId = null) {
    const { id_ChiTietSanPham, SoLuong } = cartData;

    // Check stock availability using database functions
    const [stockCheck] = await sequelize.query(
      `SELECT 
        fn_TinhTonKhoRealTime(?) as TonKhoThucTe,
        fn_CoTheBan(?, ?) as CoTheBan
      `,
      {
        replacements: [id_ChiTietSanPham, id_ChiTietSanPham, SoLuong],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!stockCheck || stockCheck.CoTheBan !== 1) {
      throw new Error(
        `Số lượng sản phẩm trong kho không đủ. Tồn kho thực tế: ${
          stockCheck?.TonKhoThucTe || 0
        }, yêu cầu: ${SoLuong}`
      );
    }

    // Check if product already exists in cart
    const whereClause = {
      id_ChiTietSanPham,
    };

    if (userId) {
      whereClause.id_NguoiDung = userId;
    } else {
      whereClause.session_id = sessionId;
      whereClause.id_NguoiDung = null;
    }

    const existingItem = await Cart.findOne({
      where: whereClause,
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.SoLuong + SoLuong;

      // Check stock again with new quantity
      const [newStockCheck] = await sequelize.query(
        `SELECT 
          fn_TinhTonKhoRealTime(?) as TonKhoThucTe,
          fn_CoTheBan(?, ?) as CoTheBan
        `,
        {
          replacements: [id_ChiTietSanPham, id_ChiTietSanPham, newQuantity],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!newStockCheck || newStockCheck.CoTheBan !== 1) {
        throw new Error(
          `Số lượng sản phẩm trong kho không đủ. Tồn kho thực tế: ${
            newStockCheck?.TonKhoThucTe || 0
          }, yêu cầu: ${newQuantity}`
        );
      }

      await existingItem.update({ SoLuong: newQuantity });
    } else {
      // Add new item to cart
      await Cart.create({
        id_ChiTietSanPham,
        SoLuong,
        id_NguoiDung: userId,
        session_id: sessionId,
        NgayThem: new Date(),
      });
    }

    return this.getCart(userId, sessionId);
  }

  async updateCart(cartId, SoLuong, userId = null, sessionId = null) {
    // Check if cart item exists
    const whereClause = { id: cartId };

    if (userId) {
      whereClause.id_NguoiDung = userId;
    } else {
      whereClause.session_id = sessionId;
      whereClause.id_NguoiDung = null;
    }

    const cartItem = await Cart.findOne({
      where: whereClause,
    });

    if (!cartItem) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    // Check stock availability with new quantity
    const [stockCheck] = await sequelize.query(
      `SELECT 
        fn_TinhTonKhoRealTime(?) as TonKhoThucTe,
        fn_CoTheBan(?, ?) as CoTheBan
      `,
      {
        replacements: [
          cartItem.id_ChiTietSanPham,
          cartItem.id_ChiTietSanPham,
          SoLuong,
        ],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!stockCheck || stockCheck.CoTheBan !== 1) {
      throw new Error(
        `Số lượng sản phẩm trong kho không đủ. Tồn kho thực tế: ${
          stockCheck?.TonKhoThucTe || 0
        }, yêu cầu: ${SoLuong}`
      );
    }

    // Update quantity
    await cartItem.update({ SoLuong });

    return this.getCart(userId, sessionId);
  }

  async removeFromCart(cartId, userId = null, sessionId = null) {
    const whereClause = { id: cartId };

    if (userId) {
      whereClause.id_NguoiDung = userId;
    } else {
      whereClause.session_id = sessionId;
      whereClause.id_NguoiDung = null;
    }

    await Cart.destroy({
      where: whereClause,
    });

    return this.getCart(userId, sessionId);
  }

  async clearCart(userId = null, sessionId = null) {
    const whereClause = {};

    if (userId) {
      whereClause.id_NguoiDung = userId;
    } else if (sessionId) {
      whereClause.session_id = sessionId;
      whereClause.id_NguoiDung = null;
    }

    await Cart.destroy({
      where: whereClause,
    });

    return true;
  }

  async mergeCart(userId, sessionId) {
    // Get session cart items
    const sessionCartItems = await Cart.findAll({
      where: {
        session_id: sessionId,
        id_NguoiDung: null,
      },
    });

    // Get user cart items
    const userCartItems = await Cart.findAll({
      where: {
        id_NguoiDung: userId,
      },
    });

    // Merge cart items
    for (const sessionItem of sessionCartItems) {
      const existingUserItem = userCartItems.find(
        (item) => item.id_ChiTietSanPham === sessionItem.id_ChiTietSanPham
      );

      if (existingUserItem) {
        // Update quantity if product already exists in user cart
        await this.updateCart(
          existingUserItem.id,
          existingUserItem.SoLuong + sessionItem.SoLuong,
          userId
        );
        // Remove session item
        await sessionItem.destroy();
      } else {
        // Transfer session item to user cart
        await sessionItem.update({
          id_NguoiDung: userId,
          session_id: null,
        });
      }
    }

    return this.getCart(userId);
  }
}

module.exports = new CartService();
