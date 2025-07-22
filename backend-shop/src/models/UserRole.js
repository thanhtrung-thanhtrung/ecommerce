module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define(
    "UserRole",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_Quyen: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_NguoiDung: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "quyenguoidung",
      timestamps: false,
    }
  );

  return UserRole;
};
