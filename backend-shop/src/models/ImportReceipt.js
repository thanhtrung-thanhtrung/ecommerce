module.exports = (sequelize, DataTypes) => {
  const ImportReceipt = sequelize.define(
    "ImportReceipt",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      MaPhieuNhap: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      id_NhaCungCap: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_NguoiTao: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      TongTien: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      GhiChu: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      NgayNhap: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      TrangThai: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: "1: Chờ xác nhận, 2: Đã nhập kho, 3: Đã hủy",
      },
    },
    {
      tableName: "phieunhap",
      timestamps: false,
    }
  );

  ImportReceipt.associate = function (models) {
    ImportReceipt.belongsTo(models.Supplier, {
      foreignKey: "id_NhaCungCap",
      as: "supplier",
    });

    ImportReceipt.belongsTo(models.User, {
      foreignKey: "id_NguoiTao",
      as: "creator",
    });

    ImportReceipt.hasMany(models.ImportReceiptDetail, {
      foreignKey: "id_PhieuNhap",
      as: "importReceiptDetails",
    });
  };

  return ImportReceipt;
};
