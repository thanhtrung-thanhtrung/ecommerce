module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      MaDonHang: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      id_NguoiMua: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      TenNguoiNhan: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      SDTNguoiNhan: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      DiaChiNhan: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      TongTienHang: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      PhiVanChuyen: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      GiamGia: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      TongThanhToan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      MaGiamGia: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      GhiChu: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      id_ThanhToan: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_VanChuyen: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      TrangThaiThanhToan: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ThoiGianThanhToan: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      NgayDatHang: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      NgayCapNhat: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      EmailNguoiNhan: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      LyDoHuy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "donhang",
      timestamps: false,
    }
  );

  Order.associate = function (models) {
    Order.belongsTo(models.User, {
      foreignKey: "id_NguoiMua",
      as: "buyer",
    });

    Order.belongsTo(models.PaymentMethod, {
      foreignKey: "id_ThanhToan",
      as: "paymentMethod",
    });

    Order.belongsTo(models.ShippingMethod, {
      foreignKey: "id_VanChuyen",
      as: "shippingMethod",
    });

    Order.belongsTo(models.Voucher, {
      foreignKey: "MaGiamGia",
      targetKey: "Ma",
      as: "voucher",
    });

    Order.hasMany(models.OrderDetail, {
      foreignKey: "id_DonHang",
      as: "orderDetails",
    });

    Order.hasMany(models.Review, {
      foreignKey: "id_DonHang",
      as: "reviews",
    });
  };

  return Order;
};
