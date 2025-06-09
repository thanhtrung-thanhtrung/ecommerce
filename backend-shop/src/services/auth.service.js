const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

class AuthService {
  async register(userData) {
    const { email, matKhau, hoTen, soDienThoai, diaChi } = userData;

    const [existingUser] = await db.execute(
      "SELECT * FROM nguoidung WHERE Email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error("Email đã được sử dụng");
    }

    const hashedPassword = await bcrypt.hash(matKhau, 10);

    const [result] = await db.execute(
      "INSERT INTO nguoidung (Email, MatKhau, HoTen, SDT, DiaChi, TrangThai) VALUES (?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, hoTen, soDienThoai, diaChi, 1]
    );

    const userId = result.insertId;
    await db.execute(
      "INSERT INTO quyenguoidung (id_Quyen, id_NguoiDung) VALUES (?, ?)",
      [3, userId]
    );

    return userId;
  }

  async login(email, matKhau) {
    const [users] = await db.execute(
      `SELECT nd.*, qnd.id_Quyen FROM nguoidung nd
       LEFT JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
       WHERE nd.Email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(matKhau, user.MatKhau);
    if (!isValidPassword) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.Email, role: user.id_Quyen },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    await db.execute(
      "INSERT INTO token_lammoi (Token, id_NguoiDung, ngay_het_han) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [refreshToken, user.id]
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.Email,
        hoTen: user.HoTen,
        maQuyen: user.id_Quyen,
      },
    };
  }

  async forgotPassword(email) {
    const [users] = await db.execute(
      "SELECT * FROM nguoidung WHERE Email = ?",
      [email]
    );

    if (users.length === 0) {
      throw new Error("Email không tồn tại trong hệ thống");
    }

    const user = users[0];

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Đặt lại mật khẩu",
      html: `
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Click vào link sau để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>Link sẽ hết hạn sau 1 giờ.</p>
      `,
    });

    return true;
  }

  async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute("UPDATE nguoidung SET MatKhau = ? WHERE id = ?", [
        hashedPassword,
        decoded.userId,
      ]);

      return true;
    } catch (error) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const [tokens] = await db.execute(
        "SELECT * FROM token_lammoi WHERE Token = ? AND id_NguoiDung = ? AND ngay_het_han > NOW()",
        [refreshToken, decoded.userId]
      );

      if (tokens.length === 0) {
        throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
      }

      const [users] = await db.execute(
        `SELECT nd.*, qnd.id_Quyen FROM nguoidung nd
         LEFT JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
         WHERE nd.id = ?`,
        [decoded.userId]
      );

      const user = users[0];

      const newToken = jwt.sign(
        { userId: user.id, email: user.Email, role: user.id_Quyen },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return {
        token: newToken,
        user: {
          id: user.id,
          email: user.Email,
          hoTen: user.HoTen,
          maQuyen: user.id_Quyen,
        },
      };
    } catch (error) {
      throw new Error("Refresh token không hợp lệ");
    }
  }

  async logout(refreshToken) {
    await db.execute("DELETE FROM token_lammoi WHERE Token = ?", [
      refreshToken,
    ]);
    return true;
  }
}

module.exports = new AuthService();
