module.exports = (sequelize, DataTypes) => {
  const ShippingMethod = sequelize.define(
    "ShippingMethod",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Ten: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PhiVanChuyen: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      ThoiGianDuKien: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "hinhthucvanchuyen",
      timestamps: false,
    }
  );

  ShippingMethod.associate = function (models) {
    ShippingMethod.hasMany(models.Order, {
      foreignKey: "id_VanChuyen",
      as: "orders",
    });
  };

  return ShippingMethod;
};
