module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define(
    "Voucher",
    {
      Ma: {
        type: DataTypes.STRING(20),
        primaryKey: true,
      },
      Ten: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PhanTramGiam: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      GiaTriGiamToiDa: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      NgayBatDau: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      NgayKetThuc: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      SoLuotSuDung: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SoLuotDaSuDung: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      DieuKienApDung: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "magiamgia",
      timestamps: false,
    }
  );

  Voucher.associate = function (models) {
    Voucher.hasMany(models.Order, {
      foreignKey: "MaGiamGia",
      sourceKey: "Ma",
      as: "orders",
    });
  };

  return Voucher;
};
