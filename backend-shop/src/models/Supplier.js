module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    "Supplier",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Ten: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      SDT: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      DiaChi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "nhacungcap",
      timestamps: false,
    }
  );

  Supplier.associate = function (models) {
    Supplier.hasMany(models.Product, {
      foreignKey: "id_NhaCungCap",
      as: "products",
    });

    Supplier.hasMany(models.ImportReceipt, {
      foreignKey: "id_NhaCungCap",
      as: "importReceipts",
    });
  };

  return Supplier;
};
