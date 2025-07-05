const bcrypt = require("bcryptjs");

// Mật khẩu test cho các tài khoản
const passwords = {
  admin: "admin123",
  nhanvien: "nhanvien123",
};

// Hash mật khẩu
async function hashPasswords() {
  console.log("=== THÔNG TIN TÀI KHOẢN TEST ===\n");

  for (const [role, password] of Object.entries(passwords)) {
    const hashed = await bcrypt.hash(password, 10);
    console.log(`${role.toUpperCase()}:`);
    console.log(`  Email: ${role}.test@shoesshop.com`);
    console.log(`  Password: ${password}`);
    console.log(`  Hashed: ${hashed}\n`);
  }
}

hashPasswords().catch(console.error);

/*
HƯỚNG DẪN TEST HỆ THỐNG PHÂN QUYỀN:

1. Chạy script SQL create_test_accounts.sql để tạo tài khoản
2. Đăng nhập với các tài khoản sau:

ADMIN TEST:
- Email: admin.test@shoesshop.com  
- Password: admin123
- Quyền: Có thể truy cập tất cả tính năng admin

NHÂN VIÊN TEST:
- Email: nhanvien.test@shoesshop.com
- Password: nhanvien123  
- Quyền: Có thể truy cập tất cả tính năng admin (giống admin)

3. Test các tính năng sau:
- Quản lý sản phẩm (/api/products/admin/*)
- Quản lý đơn hàng (/api/orders/admin/*)
- Quản lý kho hàng (/api/inventory/*)
- Báo cáo doanh thu (/api/revenue/*)
- Quản lý danh mục, thương hiệu, nhà cung cấp
- Quản lý voucher, phương thức thanh toán/vận chuyển

4. Cả admin và nhân viên đều có thể thực hiện tất cả các tính năng trên
*/
