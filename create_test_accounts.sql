-- Script tạo 2 tài khoản test cho hệ thống phân quyền
-- 1 Admin và 1 Nhân viên để test quyền truy cập trang admin

-- Tạo tài khoản Admin Test (Password: admin123)
INSERT INTO `nguoidung` (`HoTen`, `DiaChi`, `SDT`, `Email`, `MatKhau`, `TrangThai`, `NgayTao`) VALUES
('Admin Test - Phân Quyền', 'Địa chỉ Admin Test', '0900000001', 'admin.test@shoesshop.com', '$2a$10$g6Vlclo3qTEsxqxN9/DZaORFqnR/XCA/Kj8ILjXc1MEHJsZW5kj8q', 1, NOW());

-- Tạo tài khoản Nhân viên Test (Password: nhanvien123)
INSERT INTO `nguoidung` (`HoTen`, `DiaChi`, `SDT`, `Email`, `MatKhau`, `TrangThai`, `NgayTao`) VALUES
('Nhân Viên Test - Phân Quyền', 'Địa chỉ Nhân Viên Test', '0900000002', 'nhanvien.test@shoesshop.com', '$2a$10$rCVgjI/qMaC.FG83zBGHI.nR2w.NNev74YxjeV0G50RCFPSz2cZym', 1, NOW());

-- Gán quyền Admin cho tài khoản đầu tiên (lấy ID mới nhất)
INSERT INTO `quyenguoidung` (`id_Quyen`, `id_NguoiDung`) 
SELECT 1, id FROM `nguoidung` WHERE `Email` = 'admin.test@shoesshop.com';

-- Gán quyền Nhân viên cho tài khoản thứ hai
INSERT INTO `quyenguoidung` (`id_Quyen`, `id_NguoiDung`) 
SELECT 2, id FROM `nguoidung` WHERE `Email` = 'nhanvien.test@shoesshop.com';

-- Kiểm tra kết quả
SELECT 
    nd.id,
    nd.HoTen,
    nd.Email,
    q.TenQuyen,
    nd.TrangThai
FROM nguoidung nd
JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
JOIN quyen q ON qnd.id_Quyen = q.id
WHERE nd.Email IN ('admin.test@shoesshop.com', 'nhanvien.test@shoesshop.com')
ORDER BY q.id;

/*
THÔNG TIN ĐĂNG NHẬP:

ADMIN TEST:
- Email: admin.test@shoesshop.com
- Password: admin123
- Quyền: Admin (có thể truy cập tất cả tính năng)

NHÂN VIÊN TEST:
- Email: nhanvien.test@shoesshop.com  
- Password: nhanvien123
- Quyền: Nhân viên (có thể truy cập tất cả tính năng như admin)

Cả hai tài khoản đều có quyền truy cập đầy đủ vào trang admin.
*/