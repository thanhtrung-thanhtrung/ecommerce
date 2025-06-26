const { validationResult } = require("express-validator");
const cartService = require("../services/cart.service");
const { v4: uuidv4 } = require("uuid"); // Add this import for UUID generation

class CartController {
  async getCart(req, res, next) {
    try {
      // Get user ID if logged in
      const userId = req.user?.id || null;

      // Get or create session ID for guests
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;

      // Kiểm tra header X-Session-ID nếu không có cookie
      if (!userId && !sessionId) {
        sessionId = req.headers["x-session-id"] || uuidv4();
        // Set the sessionId as a cookie
        res.cookie("sessionId", sessionId, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }

      const cart = await cartService.getCart(userId, sessionId);

      // Return standardized response format
      res.json({
        success: true,
        data: cart,
        message: "Lấy giỏ hàng thành công",
      });
    } catch (error) {
      // Xử lý lỗi nghiệp vụ từ service
      if (error.message) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error); // Chuyển lỗi không xác định xuống middleware xử lý lỗi chung
    }
  }

  async syncSession(req, res, next) {
    try {
      // Lấy sessionId từ header hoặc cookie
      let sessionId = req.cookies?.sessionId || req.sessionIdFromHeader;
      const headerSessionId = req.headers["x-session-id"];

      if (!sessionId && !headerSessionId) {
        return res.status(400).json({ message: "Không tìm thấy session ID" });
      }

      // Nếu có session ID trong header nhưng không trùng với cookie,
      // thì sử dụng session ID từ header
      if (headerSessionId && headerSessionId !== sessionId) {
        sessionId = headerSessionId;
      }

      // Thiết lập cookie với session ID
      res.cookie("sessionId", sessionId, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      // Lấy thông tin giỏ hàng theo session ID
      const cart = await cartService.getCart(null, sessionId);
      res.json(cart);
    } catch (error) {
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async createSession(req, res, next) {
    try {
      // Tạo mới session ID
      const sessionId = uuidv4();

      // Thiết lập cookie với session ID mới
      res.cookie("sessionId", sessionId, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      // Trả về session ID mới
      res.json({ sessionId });
    } catch (error) {
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async syncAfterLogin(req, res, next) {
    try {
      // Đảm bảo người dùng đã đăng nhập
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      // Lấy session ID từ cookie, session, hoặc header
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;
      if (!sessionId) {
        sessionId = req.headers["x-session-id"];
      }

      // Nếu không có session ID, không cần đồng bộ
      if (!sessionId) {
        return res
          .status(400)
          .json({ message: "Không tìm thấy session ID để đồng bộ" });
      }

      // Gọi service để gộp giỏ hàng
      const cart = await cartService.mergeCart(userId, sessionId);

      // Xóa cookie sessionId vì đã đăng nhập và đã gộp giỏ hàng
      res.clearCookie("sessionId");

      res.json(cart);
    } catch (error) {
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async addToCart(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = req.user?.id || null;
      // Lấy sessionId từ cookie, session, header (không lấy từ body)
      let sessionId =
        req.cookies?.sessionId ||
        req.session?.id ||
        req.sessionIdFromHeader ||
        req.headers["x-session-id"];

      // Ensure sessionId is created for guests
      if (!userId && !sessionId) {
        sessionId = uuidv4();
        res.cookie("sessionId", sessionId, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }

      // Lấy đúng tên trường từ body
      const { id_ChiTietSanPham, SoLuong } = req.body;

      // Debugging logs
      console.log("🔍 Debug - sessionId:", sessionId);
      console.log("🔍 Debug - Adding to cart:", { id_ChiTietSanPham, SoLuong });

      if (!id_ChiTietSanPham || !SoLuong) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin sản phẩm hoặc số lượng.",
        });
      }

      const cart = await cartService.addToCart(
        { id_ChiTietSanPham, SoLuong },
        userId,
        sessionId
      );

      res.status(200).json({
        success: true,
        data: cart,
        message: "Thêm vào giỏ hàng thành công",
      });
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi thêm vào giỏ hàng",
      });
    }
  }

  async updateCart(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { maGioHang } = req.params;
      const { SoLuong } = req.body;
      const userId = req.user?.id || null;

      // Kiểm tra tất cả vị trí có thể chứa sessionId
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;
      if (!userId && !sessionId) {
        sessionId = req.headers["x-session-id"];
      }

      if (!maGioHang || !SoLuong) {
        return res.status(400).json({
          success: false,
          message: "Thiếu mã giỏ hàng hoặc số lượng.",
        });
      }

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Không tìm thấy thông tin người dùng hoặc session để cập nhật giỏ hàng.",
        });
      }

      const cart = await cartService.updateCart(
        maGioHang,
        SoLuong,
        userId,
        sessionId
      );

      res.json({
        success: true,
        data: cart,
        message: "Cập nhật giỏ hàng thành công",
      });
    } catch (error) {
      // Xử lý lỗi nghiệp vụ từ service
      if (error.message) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async removeFromCart(req, res, next) {
    try {
      const { maGioHang } = req.params;
      const userId = req.user?.id || null;

      // Kiểm tra tất cả vị trí có thể chứa sessionId
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;
      if (!userId && !sessionId) {
        sessionId = req.headers["x-session-id"];
      }

      if (!maGioHang) {
        return res.status(400).json({
          success: false,
          message: "Thiếu mã giỏ hàng.",
        });
      }

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Không tìm thấy thông tin người dùng hoặc session để xóa sản phẩm khỏi giỏ hàng.",
        });
      }

      const cart = await cartService.removeFromCart(
        maGioHang,
        userId,
        sessionId
      );

      res.json({
        success: true,
        data: cart,
        message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      });
    } catch (error) {
      // Xử lý lỗi nghiệp vụ từ service
      if (error.message) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const userId = req.user?.id || null;

      // Kiểm tra tất cả vị trí có thể chứa sessionId
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;
      if (!userId && !sessionId) {
        sessionId = req.headers["x-session-id"];
      }

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Không tìm thấy thông tin người dùng hoặc session để xóa giỏ hàng.",
        });
      }

      await cartService.clearCart(userId, sessionId);

      res.json({
        success: true,
        message: "Đã xóa giỏ hàng",
      });
    } catch (error) {
      // Xử lý lỗi nghiệp vụ từ service
      if (error.message) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async mergeCart(req, res, next) {
    try {
      const userId = req.user?.id; // Merge cart chỉ dành cho user đã đăng nhập

      // Kiểm tra tất cả vị trí có thể chứa sessionId
      let sessionId =
        req.cookies?.sessionId || req.session?.id || req.sessionIdFromHeader;
      if (!sessionId) {
        sessionId = req.headers["x-session-id"];
      }

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Chức năng này yêu cầu đăng nhập." });
      }

      if (!sessionId) {
        return res
          .status(400)
          .json({ message: "Không tìm thấy session để gộp giỏ hàng." });
      }

      const cart = await cartService.mergeCart(userId, sessionId);

      // Xóa cookie sessionId sau khi gộp giỏ hàng thành công
      res.clearCookie("sessionId");

      res.json(cart);
    } catch (error) {
      // Xử lý lỗi nghiệp vụ từ service
      if (error.message) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new CartController();
