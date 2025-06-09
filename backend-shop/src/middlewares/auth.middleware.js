const jwt = require("jsonwebtoken");

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

// Optional authentication - allows both authenticated and guest users
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue as guest
      req.user = null;
    }
  } else {
    req.user = null;

    // Kiểm tra X-Session-ID header nếu không có token auth
    const sessionIdHeader = req.headers["x-session-id"];
    if (sessionIdHeader) {
      // Lưu session ID vào req để các route có thể sử dụng
      req.sessionIdFromHeader = sessionIdHeader;
    }
  }

  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
};
