module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_SanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_NguoiDung: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_DonHang: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      SoSao: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      NoiDung: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "danhgia",
      timestamps: false,
    }
  );

  Review.associate = function (models) {
    Review.belongsTo(models.Product, {
      foreignKey: "id_SanPham",
      as: "product",
    });

    Review.belongsTo(models.User, {
      foreignKey: "id_NguoiDung",
      as: "user",
    });

    Review.belongsTo(models.Order, {
      foreignKey: "id_DonHang",
      as: "order",
    });
  };

  return Review;
};
