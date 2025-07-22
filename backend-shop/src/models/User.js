module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      HoTen: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      DiaChi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      SDT: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      Email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      Avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      MatKhau: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      NgayTao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "nguoidung",
      timestamps: false,
    }
  );

  User.associate = function (models) {
    // User hasMany Orders
    User.hasMany(models.Order, {
      foreignKey: "id_NguoiMua",
      as: "orders",
    });

    // User hasMany Cart items
    User.hasMany(models.Cart, {
      foreignKey: "id_NguoiDung",
      as: "cartItems",
    });

    // User hasMany Reviews
    User.hasMany(models.Review, {
      foreignKey: "id_NguoiDung",
      as: "reviews",
    });

    // User hasMany Wishlist items
    User.hasMany(models.Wishlist, {
      foreignKey: "id_NguoiDung",
      as: "wishlistItems",
    });

    // User belongsToMany Roles
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: "id_NguoiDung",
      otherKey: "id_Quyen",
      as: "roles",
    });

    // User hasMany TokenRefresh
    User.hasMany(models.TokenRefresh, {
      foreignKey: "id_NguoiDung",
      as: "refreshTokens",
    });
  };

  return User;
};
