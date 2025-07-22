module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define(
    "PaymentMethod",
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
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "hinhthucthanhtoan",
      timestamps: false,
    }
  );

  PaymentMethod.associate = function (models) {
    PaymentMethod.hasMany(models.Order, {
      foreignKey: "id_ThanhToan",
      as: "orders",
    });
  };

  return PaymentMethod;
};
