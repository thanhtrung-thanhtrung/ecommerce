module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define(
    "Wishlist",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_NguoiDung: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_SanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      NgayThem: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "wishlist",
      timestamps: false,
    }
  );

  Wishlist.associate = function (models) {
    Wishlist.belongsTo(models.User, {
      foreignKey: "id_NguoiDung",
      as: "user",
    });

    Wishlist.belongsTo(models.Product, {
      foreignKey: "id_SanPham",
      as: "product",
    });
  };

  return Wishlist;
};
