module.exports = (sequelize, DataTypes) => {
  const Size = sequelize.define(
    "Size",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Ten: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "kichco",
      timestamps: false,
    }
  );

  Size.associate = function (models) {
    Size.hasMany(models.ProductDetail, {
      foreignKey: "id_KichCo",
      as: "productDetails",
    });
  };

  return Size;
};
