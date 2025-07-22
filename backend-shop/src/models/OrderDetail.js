module.exports = (sequelize, DataTypes) => {
  const OrderDetail = sequelize.define(
    "OrderDetail",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_DonHang: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_ChiTietSanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SoLuong: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      GiaBan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      ThanhTien: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      tableName: "chitietdonhang",
      timestamps: false,
    }
  );

  OrderDetail.associate = function (models) {
    OrderDetail.belongsTo(models.Order, {
      foreignKey: "id_DonHang",
      as: "order",
    });

    OrderDetail.belongsTo(models.ProductDetail, {
      foreignKey: "id_ChiTietSanPham",
      as: "productDetail",
    });
  };

  return OrderDetail;
};
