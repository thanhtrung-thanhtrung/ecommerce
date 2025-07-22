module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define(
    "Brand",
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
      MoTa: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      Website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      Logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "thuonghieu",
      timestamps: false,
    }
  );

  Brand.associate = function (models) {
    Brand.hasMany(models.Product, {
      foreignKey: "id_ThuongHieu",
      as: "products",
    });
  };

  return Brand;
};
