const jwt = require("jsonwebtoken");
const db = require("../config/database");

// Middleware xác thực token bắt buộc
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token xác thực" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// Middleware xác thực tùy chọn - cho phép cả user đã đăng nhập và khách
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token không hợp lệ, tiếp tục như khách
      req.user = null;
    }
  } else {
    req.user = null;
  }

  // Kiểm tra session ID từ cookie hoặc header
  const sessionId = req.cookies.sessionId || req.headers["x-session-id"];
  if (sessionId) {
    req.sessionId = sessionId;
  }

  next();
};

// Middleware kiểm tra quyền truy cập
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        console.error("User not authenticated or missing user ID");
        return res.status(401).json({
          message: "Vui lòng đăng nhập để tiếp tục",
          error: "User not authenticated or missing user ID",
        });
      }

      // Chuyển đổi allowedRoles thành mảng nếu là string
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Lấy thông tin quyền của user từ database
      const [userRoles] = await db.execute(
        `SELECT r.Ten as roleName 
         FROM nguoidung nd
         JOIN quyen r ON nd.id_Quyen = r.id
         WHERE nd.id = ? AND nd.TrangThai = 1`,
        [req.user.id]
      );

      if (userRoles.length === 0) {
        console.error(`No roles found for user ID: ${req.user.id}`);
        return res.status(403).json({
          message: "Tài khoản không có quyền truy cập",
          error: "No roles found for user",
        });
      }

      const userRole = userRoles[0].roleName.toLowerCase(); // Chuyển về chữ thường

      // Kiểm tra quyền
      if (!roles.map((r) => r.toLowerCase()).includes(userRole)) {
        console.error(
          `Permission denied for user ID: ${
            req.user.id
          }, Role: ${userRole}, Required: ${roles.join(", ")}`
        );
        return res.status(403).json({
          message: "Bạn không có quyền thực hiện thao tác này",
          requiredRoles: roles,
          currentRole: userRole,
          error: "Permission denied",
        });
      }

      // Thêm thông tin quyền vào request
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Error in checkRole middleware:", error);
      return res.status(500).json({
        message: "Lỗi kiểm tra quyền truy cập",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  };
};

// Middleware kiểm tra trạng thái tài khoản
const checkAccountStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // Cho phép tiếp tục nếu là khách
    }

    const [user] = await db.execute(
      "SELECT TrangThai FROM nguoidung WHERE id = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (user[0].TrangThai !== 1) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa hoặc chưa được kích hoạt",
        status: user[0].TrangThai,
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkAccountStatus middleware:", error);
    return res
      .status(500)
      .json({ message: "Lỗi kiểm tra trạng thái tài khoản" });
  }
};

// Middleware kiểm tra session
const checkSession = (req, res, next) => {
  const sessionId = req.cookies.sessionId || req.headers["x-session-id"];

  if (!sessionId) {
    // Tạo session mới nếu chưa có
    const newSessionId = require("crypto").randomBytes(32).toString("hex");
    res.cookie("sessionId", newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    });
    req.sessionId = newSessionId;
  } else {
    req.sessionId = sessionId;
  }

  next();
};

// Middleware kiểm tra IP và thiết bị
const checkDeviceAndIP = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // Cho phép tiếp tục nếu là khách
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Kiểm tra IP và thiết bị trong database
    const [device] = await db.execute(
      `SELECT * FROM thietbi 
       WHERE id_NguoiDung = ? AND IP = ? AND UserAgent = ? AND TrangThai = 1`,
      [req.user.id, clientIP, userAgent]
    );

    if (device.length === 0) {
      // Ghi log thiết bị mới
      await db.execute(
        `INSERT INTO thietbi (id_NguoiDung, IP, UserAgent, TrangThai, NgayTao)
         VALUES (?, ?, ?, 1, NOW())`,
        [req.user.id, clientIP, userAgent]
      );
    } else {
      // Cập nhật thời gian hoạt động
      await db.execute(
        "UPDATE thietbi SET ThoiGianHoatDongCuoi = NOW() WHERE id = ?",
        [device[0].id]
      );
    }

    next();
  } catch (error) {
    console.error("Error in checkDeviceAndIP middleware:", error);
    next(); // Cho phép tiếp tục ngay cả khi có lỗi
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  checkRole,
  checkAccountStatus,
  checkSession,
  checkDeviceAndIP,
};
