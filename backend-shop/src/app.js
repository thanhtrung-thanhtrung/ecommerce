const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Add this import
const routes = require("./routes");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./config/database"); // Import database configuration

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  // Development URLs
  process.env.CLIENT_ORIGIN || "http://localhost:3001",
  "http://localhost:5714", // clothing-ecommerce frontend
  "http://localhost:5173", // admin-dashboard frontend (Vite dev server)
  "http://localhost:5174", // backup Vite port

  // Production Vercel URLs
  "https://admin-dashboard-seven-snowy-72.vercel.app",
  "https://shop-frontend-ecru.vercel.app",
  "https://*.vercel.app", // Allow all Vercel subdomains

  // Environment-based URLs
  process.env.FRONTEND_URL, // From environment variables
  process.env.ADMIN_URL,
];

// Filter out undefined values
const validOrigins = allowedOrigins.filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (
        validOrigins.indexOf(origin) !== -1 ||
        origin.includes(".vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cookie",
      "X-Session-ID", // Add this for guest cart functionality
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
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

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

// Ensure session middleware is correctly configured
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID); // Debugging session ID
  console.log("Session Data:", req.session); // Debugging session data
  next();
});

// Debugging middleware for session
app.use((req, res, next) => {
  console.log("Session Middleware - req.sessionID:", req.sessionID);
  console.log("Session Middleware - req.session:", req.session);
  next();
});

// Routes
app.use("/api", routes);

// Health check endpoint for Railway
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Shoe Shop Backend API",
    status: "running",
    endpoints: [
      "/api/health",
      "/api/auth",
      "/api/products",
      "/api/orders",
      "/api/users",
    ],
  });
});

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
const PORT = process.env.PORT || 8080; // Railway thường dùng PORT 8080
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`🔌 API endpoints: http://localhost:${PORT}/api`);
});

module.exports = app;
