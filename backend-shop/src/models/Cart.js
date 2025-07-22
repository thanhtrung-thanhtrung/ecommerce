module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_NguoiDung: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      id_ChiTietSanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SoLuong: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      NgayThem: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "giohang",
      timestamps: false,
    }
  );

  Cart.associate = function (models) {
    Cart.belongsTo(models.User, {
      foreignKey: "id_NguoiDung",
      as: "user",
    });

    Cart.belongsTo(models.ProductDetail, {
      foreignKey: "id_ChiTietSanPham",
      as: "productDetail",
    });
  };

  return Cart;
};
