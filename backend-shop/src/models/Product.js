module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
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
      MoTaChiTiet: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ThongSoKyThuat: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      Gia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      GiaKhuyenMai: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      SoLuongDaBan: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      id_DanhMuc: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_ThuongHieu: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_NhaCungCap: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      HinhAnh: {
        type: DataTypes.TEXT,
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
      NgayCapNhat: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "sanpham",
      timestamps: false,
    }
  );

  Product.associate = function (models) {
    // Product belongsTo Category
    Product.belongsTo(models.Category, {
      foreignKey: "id_DanhMuc",
      as: "category",
    });

    // Product belongsTo Brand
    Product.belongsTo(models.Brand, {
      foreignKey: "id_ThuongHieu",
      as: "brand",
    });

    // Product belongsTo Supplier
    Product.belongsTo(models.Supplier, {
      foreignKey: "id_NhaCungCap",
      as: "supplier",
    });

    // Product hasMany ProductDetails
    Product.hasMany(models.ProductDetail, {
      foreignKey: "id_SanPham",
      as: "productDetails",
    });

    // Product hasMany Reviews
    Product.hasMany(models.Review, {
      foreignKey: "id_SanPham",
      as: "reviews",
    });

    // Product hasMany Wishlist items
    Product.hasMany(models.Wishlist, {
      foreignKey: "id_SanPham",
      as: "wishlistItems",
    });
  };

  return Product;
};
