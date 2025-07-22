module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      TenQuyen: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "quyen",
      timestamps: false,
    }
  );

  Role.associate = function (models) {
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: "id_Quyen",
      otherKey: "id_NguoiDung",
      as: "users",
    });
  };

  return Role;
};
