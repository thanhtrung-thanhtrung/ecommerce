require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "shoes_shop",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      dateStrings: true,
      typeCast: true,
    },
    timezone: "+07:00",
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    timezone: "+07:00",
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
  },
};
