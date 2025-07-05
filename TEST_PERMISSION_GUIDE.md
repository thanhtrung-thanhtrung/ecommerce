# HƯỚNG DẪN TEST HỆ THỐNG PHÂN QUYỀN

## 📋 Tài khoản test đã tạo

### 1. Admin Test

- **Email**: `admin.test@shoesshop.com`
- **Password**: `admin123`
- **Quyền**: Admin (id_Quyen = 1)

### 2. Nhân viên Test

- **Email**: `nhanvien.test@shoesshop.com`
- **Password**: `nhanvien123`
- **Quyền**: Nhân viên (id_Quyen = 2)

## 🚀 Cách chạy test

### Bước 1: Tạo tài khoản

```sql
-- Chạy file create_test_accounts.sql trong database
SOURCE create_test_accounts.sql;
```

### Bước 2: Kiểm tra backend

Test API endpoints sau với cả 2 tài khoản:

#### Auth endpoints:

- `POST /api/auth/login` - Đăng nhập

#### Admin endpoints (cả admin và nhân viên đều có quyền):

- `GET /api/products/admin/list` - Quản lý sản phẩm
- `GET /api/orders/admin` - Quản lý đơn hàng
- `GET /api/inventory/thong-ke/ton-kho` - Quản lý kho
- `GET /api/revenue/stats` - Báo cáo doanh thu
- `GET /api/categories` - Quản lý danh mục
- `GET /api/brands` - Quản lý thương hiệu
- `GET /api/suppliers` - Quản lý nhà cung cấp
- `GET /api/vouchers` - Quản lý voucher
- `GET /api/payments/admin` - Quản lý thanh toán
- `GET /api/shipping` - Quản lý vận chuyển

### Bước 3: Test frontend admin

1. Đăng nhập vào trang admin với 2 tài khoản
2. Kiểm tra xem cả 2 đều truy cập được tất cả tính năng
3. Không có sự phân biệt giữa admin và nhân viên

## ✅ Kết quả mong đợi

- **Admin**: Truy cập được tất cả tính năng ✅
- **Nhân viên**: Truy cập được tất cả tính năng ✅
- **Khách hàng**: Không thể truy cập trang admin ❌

## 🔧 Debug

Nếu có lỗi, kiểm tra:

1. **Middleware phân quyền**:

```javascript
const checkAdminRole = () => {
  return checkRole(["Admin", "Nhân viên"]);
};
```

2. **Query quyền user**:

```sql
SELECT q.TenQuyen as roleName
FROM nguoidung nd
JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
JOIN quyen q ON qnd.id_Quyen = q.id
WHERE nd.id = ? AND nd.TrangThai = 1
```

3. **Kiểm tra routes có middleware**:

- Tất cả routes admin phải có `verifyToken` + `checkAdminRole()`

## 📝 Ghi chú

- Hệ thống đã được cập nhật để nhân viên và admin có quyền bằng nhau
- Tất cả routes admin đã được bảo vệ bằng middleware phân quyền
- Frontend cần được cập nhật để không phân biệt 2 role này
