module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
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
      id_DanhMucCha: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: "danhmuc",
      timestamps: false,
    }
  );

  Category.associate = function (models) {
    // Self-referencing association for parent-child categories
    Category.hasMany(Category, {
      foreignKey: "id_DanhMucCha",
      as: "children",
    });

    Category.belongsTo(Category, {
      foreignKey: "id_DanhMucCha",
      as: "parent",
    });

    // Category hasMany Products
    Category.hasMany(models.Product, {
      foreignKey: "id_DanhMuc",
      as: "products",
    });
  };

  return Category;
};
