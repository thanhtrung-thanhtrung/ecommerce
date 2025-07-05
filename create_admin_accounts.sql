-- Tạo tài khoản test cho admin dashboard
-- File: create_admin_accounts.sql

-- Tạo tài khoản Admin test
INSERT INTO `nguoidung` (`id`, `HoTen`, `DiaChi`, `SDT`, `Email`, `Avatar`, `MatKhau`, `TrangThai`, `NgayTao`) VALUES
(100, 'Admin Test', 'Địa chỉ Admin Test', '0900000100', 'admin.test@shoesshop.com', NULL, '$2a$10$CY4kQKg18HaSEJuWO99LKeVMfEW5tVDVNdrqclL2BpW0AH47iB9H2', 1, NOW()),
(101, 'Nhân viên Test', 'Địa chỉ Nhân viên Test', '0900000101', 'nhanvien.test@shoesshop.com', NULL, '$2a$10$jP425lCJynvp88hy0EqLOezvJWpv3hbfXSAPHkcl2HGZeUrKrVKmu', 1, NOW());

-- Gán quyền Admin (id=1) cho tài khoản admin test
INSERT INTO `quyenguoidung` (`id_Quyen`, `id_NguoiDung`) VALUES
(1, 100), -- Admin
(2, 101); -- Nhân viên

-- Thông tin đăng nhập:
-- Admin: admin.test@shoesshop.com / admin123
-- Nhân viên: nhanvien.test@shoesshop.com / nhanvien123