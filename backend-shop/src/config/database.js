const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối
pool
  .getConnection()
  .then((connection) => {
    console.log("Kết nối database thành công!");
    connection.release();
  })
  .catch((error) => {
    console.error("Lỗi kết nối database:", error);
  });

module.exports = pool;
