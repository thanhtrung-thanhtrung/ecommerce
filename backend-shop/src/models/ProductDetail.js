module.exports = (sequelize, DataTypes) => {
  const ProductDetail = sequelize.define(
    "ProductDetail",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_SanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_KichCo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_MauSac: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      MaSanPham: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "chitietsanpham",
      timestamps: false,
    }
  );

  ProductDetail.associate = function (models) {
    ProductDetail.belongsTo(models.Product, {
      foreignKey: "id_SanPham",
      as: "product",
    });

    ProductDetail.belongsTo(models.Size, {
      foreignKey: "id_KichCo",
      as: "size",
    });

    ProductDetail.belongsTo(models.Color, {
      foreignKey: "id_MauSac",
      as: "color",
    });

    ProductDetail.hasMany(models.Cart, {
      foreignKey: "id_ChiTietSanPham",
      as: "cartItems",
    });

    ProductDetail.hasMany(models.OrderDetail, {
      foreignKey: "id_ChiTietSanPham",
      as: "orderDetails",
    });
  };

  return ProductDetail;
};
