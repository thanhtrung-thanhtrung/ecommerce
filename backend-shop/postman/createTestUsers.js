require('dotenv').config({ path: '../.env' });
const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

const testUsers = [
  {
    HoTen: 'Admin Test',
    Email: '  chu.test@example.com',
    MatKhau: 'password123', // Mật khẩu gốc (sẽ được băm)
    SDT: '0900000001',
    DiaChi: 'Địa chỉ Admin',
    TrangThai: 1,
    id_Quyen: 1 // ID quyền Admin
  },
  {
    HoTen: 'Nhân viên Test',
    Email: 'nhanvien.test@example.com',
    MatKhau: 'password456', // Mật khẩu gốc (sẽ được băm)
    SDT: '0900000002',
    DiaChi: 'Địa chỉ Nhân viên',
    TrangThai: 1,
    id_Quyen: 2 // ID quyền Nhân viên
  },
  {
    HoTen: 'Khách hàng Test',
    Email: 'khachhang.test@example.com',
    MatKhau: 'password789', // Mật khẩu gốc (sẽ được băm)
    SDT: '0900000003',
    DiaChi: 'Địa chỉ Khách hàng',
    TrangThai: 1,
    id_Quyen: 3 // ID quyền Khách hàng
  }
];

async function createTestUsers() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    for (const userData of testUsers) {
      await connection.beginTransaction();

      // Kiểm tra email đã tồn tại chưa
      const [existingUser] = await connection.query(
        'SELECT id FROM nguoidung WHERE Email = ?',
        [userData.Email]
      );

      if (existingUser.length > 0) {
        console.warn(`Người dùng với email ${userData.Email} đã tồn tại, bỏ qua.`);
        await connection.rollback();
        continue; // Bỏ qua người dùng này và sang người dùng tiếp theo
      }

      // Băm mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.MatKhau, salt);

      // Chèn người dùng vào bảng nguoidung
      const [userResult] = await connection.query(
        ' INSERT INTO nguoidung (HoTen, Email, MatKhau, salt, SDT, DiaChi, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.HoTen, userData.Email, hashedPassword, salt, userData.SDT, userData.DiaChi, userData.TrangThai]
      );

      const userId = userResult.insertId;

      // Gán quyền vào bảng quyenguoidung
      await connection.query(
        ' INSERT INTO quyenguoidung (id_NguoiDung, id_Quyen) VALUES (?, ?)',
        [userId, userData.id_Quyen]
      );

      await connection.commit();
      console.log(`Đã tạo người dùng ${userData.HoTen} (${userData.Email}) với quyền ID ${userData.id_Quyen}`);
    }

    console.log('Hoàn tất tạo người dùng test.');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Lỗi khi tạo người dùng test:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    // Đóng pool kết nối sau khi hoàn thành
    pool.end(); 
  }
}

createTestUsers(); 