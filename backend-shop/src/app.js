const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Add this import
const routes = require("./routes");
require("dotenv").config();
require("./config/database"); // Import database configuration

const app = express();

// Enhanced CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_ORIGIN || "http://localhost:3001",
      "http://localhost:5714", // clothing-ecommerce frontend
      "http://localhost:5173", // admin-dashboard frontend (Vite dev server)
      "http://localhost:5174", // backup Vite port
    ],
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cookie",
    ], // Allowed headers
    exposedHeaders: ["Set-Cookie"], // Headers that client can access
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Handle preflight requests explicitly
app.options("*", cors()); // Enable pre-flight for all routes

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser before session middleware

// Cấu hình express-session (Đặt SAU express.json() và express.urlencoded())
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your_super_secret_key_change_me_later", // RẤT QUAN TRỌNG: Thay đổi chuỗi này
    resave: false, // Không lưu lại session nếu không có thay đổi
    saveUninitialized: true, // Lưu session mới chưa khởi tạo (cho khách vãng lai)
    cookie: {
      secure: process.env.NODE_ENV === "production", // true nếu dùng HTTPS, false nếu HTTP (dev)
      httpOnly: true, // Không cho phép truy cập cookie từ client-side script
      maxAge: 24 * 60 * 60 * 1000, // Thời gian sống của session cookie (ví dụ: 1 ngày)
    },
  })
);

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Có lỗi xảy ra! Vui lòng thử lại sau.",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    message: "Không tìm thấy tài nguyên yêu cầu!",
  });
});

// Start server
const PORT = process.env.PORT || 5000; // Changed from 3000 to 5000 to match API calls
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`API có thể truy cập tại http://localhost:${PORT}/api`);
  console.log(`Môi trường: ${process.env.NODE_ENV}`);
});

module.exports = app;
