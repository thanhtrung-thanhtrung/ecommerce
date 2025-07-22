module.exports = (sequelize, DataTypes) => {
  const TokenRefresh = sequelize.define(
    "TokenRefresh",
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
      ma_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ngay_tao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ngay_het_han: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      Token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "token_lammoi",
      timestamps: false,
    }
  );

  TokenRefresh.associate = function (models) {
    TokenRefresh.belongsTo(models.User, {
      foreignKey: "id_NguoiDung",
      as: "user",
    });
  };

  return TokenRefresh;
};
