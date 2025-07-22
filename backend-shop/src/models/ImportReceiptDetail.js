module.exports = (sequelize, DataTypes) => {
  const ImportReceiptDetail = sequelize.define(
    "ImportReceiptDetail",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_PhieuNhap: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_ChiTietSanPham: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SoLuong: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      GiaNhap: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      ThanhTien: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      tableName: "chitietphieunhap",
      timestamps: false,
    }
  );

  ImportReceiptDetail.associate = function (models) {
    ImportReceiptDetail.belongsTo(models.ImportReceipt, {
      foreignKey: "id_PhieuNhap",
      as: "importReceipt",
    });

    ImportReceiptDetail.belongsTo(models.ProductDetail, {
      foreignKey: "id_ChiTietSanPham",
      as: "productDetail",
    });
  };

  return ImportReceiptDetail;
};
