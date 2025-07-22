const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Role, UserRole, TokenRefresh } = require("../models");

class AuthService {
  async register(userData) {
    try {
      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({
        where: { Email: userData.email },
      });

      if (existingUser) {
        throw new Error("Email đã được sử dụng");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.matKhau, 10);

      // Tạo user mới
      const newUser = await User.create({
        HoTen: userData.hoTen,
        Email: userData.email,
        SDT: userData.sdt,
        DiaChi: userData.diaChi,
        MatKhau: hashedPassword,
        TrangThai: 1,
      });

      // Gán quyền mặc định (Khách hàng - id: 3)
      await UserRole.create({
        id_NguoiDung: newUser.id,
        id_Quyen: 3,
      });

      return {
        id: newUser.id,
        hoTen: newUser.HoTen,
        email: newUser.Email,
        sdt: newUser.SDT,
        diaChi: newUser.DiaChi,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, matKhau) {
    try {
      // Tìm user với roles
      const user = await User.findOne({
        where: {
          Email: email,
          TrangThai: 1,
        },
        include: [
          {
            model: Role,
            as: "roles",
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      // Kiểm tra password
      const isValidPassword = await bcrypt.compare(matKhau, user.MatKhau);
      if (!isValidPassword) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      // Lấy role đầu tiên (có thể cải thiện logic này)
      const userRole = user.roles && user.roles[0] ? user.roles[0].id : 3;
      const roleName =
        user.roles && user.roles[0] ? user.roles[0].TenQuyen : "Khách hàng";

      // Tạo access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.Email,
          role: userRole,
          roleName: roleName,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
      );

      // Tạo refresh token
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
      );

      // Lưu refresh token vào database
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      await TokenRefresh.create({
        id_NguoiDung: user.id,
        Token: refreshToken,
        ngay_tao: new Date(),
        ngay_het_han: expiryDate,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          hoTen: user.HoTen,
          email: user.Email,
          sdt: user.SDT,
          diaChi: user.DiaChi,
          avatar: user.Avatar,
          vaiTro: [roleName],
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await User.findOne({
        where: {
          id: userId,
          TrangThai: 1,
        },
        attributes: [
          "id",
          "HoTen",
          "Email",
          "SDT",
          "DiaChi",
          "Avatar",
          "NgayTao",
        ],
        include: [
          {
            model: Role,
            as: "roles",
            attributes: ["id", "TenQuyen"],
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      return {
        id: user.id,
        hoTen: user.HoTen,
        email: user.Email,
        sdt: user.SDT,
        diaChi: user.DiaChi,
        avatar: user.Avatar,
        ngayTao: user.NgayTao,
        vaiTro: user.roles.map((role) => role.TenQuyen),
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await User.findOne({
        where: {
          id: userId,
          TrangThai: 1,
        },
      });

      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      // Cập nhật thông tin
      await user.update({
        HoTen: updateData.hoTen || user.HoTen,
        SDT: updateData.sdt || user.SDT,
        DiaChi: updateData.diaChi || user.DiaChi,
        Avatar: updateData.avatar || user.Avatar,
      });

      return await this.getProfile(userId);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          id: userId,
          TrangThai: 1,
        },
      });

      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      // Kiểm tra mật khẩu cũ
      const isValidPassword = await bcrypt.compare(oldPassword, user.MatKhau);
      if (!isValidPassword) {
        throw new Error("Mật khẩu cũ không đúng");
      }

      // Hash mật khẩu mới
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu
      await user.update({
        MatKhau: hashedNewPassword,
      });

      return { message: "Đổi mật khẩu thành công" };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const tokenRecord = await TokenRefresh.findOne({
        where: {
          Token: refreshToken,
          id_NguoiDung: decoded.userId,
          ngay_het_han: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
      }

      const user = await User.findOne({
        where: {
          id: decoded.userId,
          TrangThai: 1,
        },
        include: [
          {
            model: Role,
            as: "roles",
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      const userRole = user.roles && user.roles[0] ? user.roles[0].id : 3;
      const roleName =
        user.roles && user.roles[0] ? user.roles[0].TenQuyen : "Khách hàng";

      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.Email,
          role: userRole,
          roleName: roleName,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
      );

      return {
        token: newToken,
        user: {
          id: user.id,
          email: user.Email,
          hoTen: user.HoTen,
          maQuyen: userRole,
          vaiTro: [roleName],
        },
      };
    } catch (error) {
      throw new Error("Refresh token không hợp lệ");
    }
  }

  async logout(refreshToken) {
    try {
      await TokenRefresh.destroy({
        where: { Token: refreshToken },
      });
      return { message: "Đăng xuất thành công" };
    } catch (error) {
      throw error;
    }
  }

  // Thêm method để xóa token hết hạn
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await TokenRefresh.destroy({
        where: {
          ngay_het_han: {
            [Op.lt]: new Date(),
          },
        },
      });
      return { deletedCount };
    } catch (error) {
      throw error;
    }
  }

  // Thêm method để lấy danh sách user với role
  async getUsersWithRoles(page = 1, limit = 10, search = "") {
    try {
      const offset = (page - 1) * limit;
      const whereClause = search
        ? {
            [Op.or]: [
              { HoTen: { [Op.like]: `%${search}%` } },
              { Email: { [Op.like]: `%${search}%` } },
            ],
          }
        : {};

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Role,
            as: "roles",
            attributes: ["id", "TenQuyen"],
            through: { attributes: [] },
          },
        ],
        attributes: [
          "id",
          "HoTen",
          "Email",
          "SDT",
          "DiaChi",
          "TrangThai",
          "NgayTao",
        ],
        limit,
        offset,
        order: [["NgayTao", "DESC"]],
      });

      return {
        users: rows.map((user) => ({
          id: user.id,
          hoTen: user.HoTen,
          email: user.Email,
          sdt: user.SDT,
          diaChi: user.DiaChi,
          trangThai: user.TrangThai,
          ngayTao: user.NgayTao,
          vaiTro: user.roles.map((role) => role.TenQuyen),
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Thêm method để cập nhật quyền user
  async updateUserRole(userId, roleId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Quyền không tồn tại");
      }

      // Xóa quyền cũ
      await UserRole.destroy({
        where: { id_NguoiDung: userId },
      });

      // Thêm quyền mới
      await UserRole.create({
        id_NguoiDung: userId,
        id_Quyen: roleId,
      });

      return { message: "Cập nhật quyền thành công" };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
