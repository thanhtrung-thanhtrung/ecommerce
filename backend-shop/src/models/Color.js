module.exports = (sequelize, DataTypes) => {
  const Color = sequelize.define(
    "Color",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Ten: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      MaMau: {
        type: DataTypes.STRING(7),
        allowNull: true,
      },
    },
    {
      tableName: "mausac",
      timestamps: false,
    }
  );

  Color.associate = function (models) {
    Color.hasMany(models.ProductDetail, {
      foreignKey: "id_MauSac",
      as: "productDetails",
    });
  };

  return Color;
};
