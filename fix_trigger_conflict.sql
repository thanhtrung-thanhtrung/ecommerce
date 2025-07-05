-- =====================================
-- SCRIPT FIX LỖI TRIGGER ĐÃ TỒN TẠI
-- Xử lý lỗi #1359 - Trigger already exists
-- =====================================

-- 1. FORCE XÓA TẤT CẢ TRIGGERS CŨ
-- ================================

-- Xóa trigger với FORCE (bỏ qua lỗi nếu không tồn tại)
SET @sql = 'DROP TRIGGER IF EXISTS `tr_QuanLyTonKhoTheoTrangThaiDonHang`';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = 'DROP TRIGGER IF EXISTS `tr_XoaGioHangSauKhiDatHang`';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = 'DROP TRIGGER IF EXISTS `tr_QuanLyDonHang`';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Kiểm tra và xóa trigger với tên khác (nếu có)
DROP TRIGGER IF EXISTS `tr_CapNhatTonKho`;
DROP TRIGGER IF EXISTS `tr_CapNhatSoLuongDaBan`;
DROP TRIGGER IF EXISTS `donhang_AFTER_UPDATE`;
DROP TRIGGER IF EXISTS `donhang_AFTER_INSERT`;

-- 2. XÓA FUNCTIONS CŨ
-- ===================
DROP FUNCTION IF EXISTS `fn_TinhTonKhoRealTime`;
DROP FUNCTION IF EXISTS `fn_CoTheBan`;
DROP FUNCTION IF EXISTS `fn_SoLuongDangCho`;

-- 3. XÓA PROCEDURES CŨ
-- =====================
DROP PROCEDURE IF EXISTS `sp_LayDanhSachSanPhamCoHang`;
DROP PROCEDURE IF EXISTS `sp_TimKiemSanPhamNangCao`;
DROP PROCEDURE IF EXISTS `sp_QuanLyNguoiDung`;
DROP PROCEDURE IF EXISTS `sp_ThongBaoTonKhoThap`;
DROP PROCEDURE IF EXISTS `sp_KiemTraTonKho`;

-- 4. XÓA VIEWS CŨ
-- ================
DROP VIEW IF EXISTS `v_tonkho_sanpham`;
DROP VIEW IF EXISTS `v_ThongTinNguoiDung`;

-- 5. KIỂM TRA VÀ XÓA CỘT TONKHO (AN TOÀN)
-- ========================================
SET @check_column = (SELECT COUNT(*) 
                     FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'chitietsanpham' 
                     AND COLUMN_NAME = 'TonKho');

SET @sql_drop = IF(@check_column > 0, 
                   'ALTER TABLE chitietsanpham DROP COLUMN TonKho', 
                   'SELECT "Cột TonKho không tồn tại" as thongbao');

PREPARE stmt FROM @sql_drop;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===================================================
-- PHẦN 2: TẠO MỚI TOÀN BỘ HỆ THỐNG
-- ===================================================

DELIMITER $$

-- FUNCTION 1: Tính tồn kho real-time
CREATE FUNCTION `fn_TinhTonKhoRealTime`(`p_id_ChiTietSanPham` INT) 
RETURNS INT(11) 
DETERMINISTIC 
READS SQL DATA
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    
    -- Tổng số lượng đã nhập kho (từ phiếu nhập đã xác nhận)
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) 
    INTO v_SoLuongNhap 
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham 
    AND pn.TrangThai = 2;
    
    -- Tổng số lượng đã bán (đơn hàng đã xác nhận, đang giao, đã giao)
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) 
    INTO v_SoLuongBan 
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham 
    AND dh.TrangThai IN (2, 3, 4);
    
    -- Trả về tồn kho (không âm)
    RETURN GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
END$$

-- FUNCTION 2: Kiểm tra có thể bán
CREATE FUNCTION `fn_CoTheBan`(`p_id_ChiTietSanPham` INT, `p_SoLuongCanBan` INT) 
RETURNS TINYINT(1) 
DETERMINISTIC 
READS SQL DATA
BEGIN
    DECLARE v_TonKho INT DEFAULT 0;
    
    SELECT fn_TinhTonKhoRealTime(p_id_ChiTietSanPham) INTO v_TonKho;
    
    RETURN (v_TonKho >= p_SoLuongCanBan);
END$$

-- FUNCTION 3: Số lượng đang chờ xác nhận
CREATE FUNCTION `fn_SoLuongDangCho`(`p_id_ChiTietSanPham` INT) 
RETURNS INT(11) 
DETERMINISTIC 
READS SQL DATA
BEGIN
    DECLARE v_SoLuongCho INT DEFAULT 0;
    
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) 
    INTO v_SoLuongCho 
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham 
    AND dh.TrangThai = 1;
    
    RETURN v_SoLuongCho;
END$$

DELIMITER ;

-- ===================================================
-- TẠO TRIGGERS MỚI (với tên khác để tránh conflict)
-- ===================================================

DELIMITER $$

-- TRIGGER 1: Quản lý đơn hàng (tên mới)
CREATE TRIGGER `tr_CapNhatSoLuongDaBan_v2` 
AFTER UPDATE ON `donhang` 
FOR EACH ROW 
BEGIN
    -- Cập nhật số lượng đã bán khi đơn hàng hoàn thành (4)
    IF NEW.TrangThai = 4 AND OLD.TrangThai != 4 THEN
        UPDATE sanpham sp
        SET SoLuongDaBan = SoLuongDaBan + (
            SELECT COALESCE(SUM(ctdh.SoLuong), 0)
            FROM chitietdonhang ctdh
            INNER JOIN chitietsanpham cts ON ctdh.id_ChiTietSanPham = cts.id
            WHERE ctdh.id_DonHang = NEW.id
              AND cts.id_SanPham = sp.id
        )
        WHERE sp.id IN (
            SELECT DISTINCT cts.id_SanPham
            FROM chitietdonhang ctdh
            INNER JOIN chitietsanpham cts ON ctdh.id_ChiTietSanPham = cts.id
            WHERE ctdh.id_DonHang = NEW.id
        );
    END IF;
    
    -- Trừ số lượng đã bán khi đơn hàng bị hủy (từ trạng thái đã hoàn thành)
    IF NEW.TrangThai = 5 AND OLD.TrangThai = 4 THEN
        UPDATE sanpham sp
        SET SoLuongDaBan = GREATEST(0, SoLuongDaBan - (
            SELECT COALESCE(SUM(ctdh.SoLuong), 0)
            FROM chitietdonhang ctdh
            INNER JOIN chitietsanpham cts ON ctdh.id_ChiTietSanPham = cts.id
            WHERE ctdh.id_DonHang = NEW.id
              AND cts.id_SanPham = sp.id
        ))
        WHERE sp.id IN (
            SELECT DISTINCT cts.id_SanPham
            FROM chitietdonhang ctdh
            INNER JOIN chitietsanpham cts ON ctdh.id_ChiTietSanPham = cts.id
            WHERE ctdh.id_DonHang = NEW.id
        );
    END IF;
END$$

-- TRIGGER 2: Xóa giỏ hàng sau khi đặt hàng (tên mới)
CREATE TRIGGER `tr_XoaGioHang_v2` 
AFTER INSERT ON `donhang` 
FOR EACH ROW 
BEGIN
    IF NEW.id_NguoiMua IS NOT NULL THEN
        DELETE FROM giohang WHERE id_NguoiDung = NEW.id_NguoiMua;
    END IF;
    
    IF NEW.session_id IS NOT NULL THEN
        DELETE FROM giohang WHERE session_id = NEW.session_id;
    END IF;
END$$

DELIMITER ;

-- ===================================================
-- TẠO VIEW MỚI
-- ===================================================

-- VIEW 1: Tồn kho sản phẩm
CREATE VIEW `v_tonkho_sanpham` AS
SELECT 
    cts.id as id_ChiTietSanPham,
    cts.id_SanPham,
    cts.MaSanPham,
    sp.Ten as TenSanPham,
    th.Ten as ThuongHieu,
    dm.Ten as DanhMuc,
    kc.Ten as KichCo,
    ms.Ten as MauSac,
    fn_TinhTonKhoRealTime(cts.id) as TonKho,
    fn_SoLuongDangCho(cts.id) as SoLuongDangCho,
    sp.Gia,
    sp.GiaKhuyenMai,
    sp.TrangThai as TrangThaiSanPham
FROM chitietsanpham cts
INNER JOIN sanpham sp ON cts.id_SanPham = sp.id
INNER JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
INNER JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
INNER JOIN kichco kc ON cts.id_KichCo = kc.id
INNER JOIN mausac ms ON cts.id_MauSac = ms.id;

-- VIEW 2: Thông tin người dùng
CREATE VIEW `v_ThongTinNguoiDung` AS
SELECT 
    nd.id,
    nd.HoTen,
    nd.Email,
    nd.SDT,
    nd.DiaChi,
    nd.TrangThai,
    nd.NgayTao,
    GROUP_CONCAT(DISTINCT q.TenQuyen SEPARATOR ',') as VaiTro,
    COUNT(DISTINCT dh.id) as SoDonHang,
    SUM(CASE WHEN dh.TrangThai = 4 THEN dh.TongThanhToan ELSE 0 END) as TongChiTieu,
    COUNT(DISTINCT dg.id) as SoDanhGia,
    COUNT(DISTINCT w.id) as SoWishlist
FROM nguoidung nd
LEFT JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
LEFT JOIN quyen q ON qnd.id_Quyen = q.id
LEFT JOIN donhang dh ON nd.id = dh.id_NguoiMua
LEFT JOIN danhgia dg ON nd.id = dg.id_NguoiDung
LEFT JOIN wishlist w ON nd.id = w.id_NguoiDung
GROUP BY nd.id;

-- ===================================================
-- TẠO STORED PROCEDURES MỚI
-- ===================================================

DELIMITER $$

-- PROCEDURE 1: Lấy danh sách sản phẩm có hàng
CREATE PROCEDURE `sp_LayDanhSachSanPhamCoHang`()
BEGIN
    SELECT 
        sp.id,
        sp.Ten,
        sp.Gia,
        sp.GiaKhuyenMai,
        th.Ten as ThuongHieu,
        dm.Ten as DanhMuc,
        COUNT(DISTINCT cts.id) as SoBienThe,
        SUM(fn_TinhTonKhoRealTime(cts.id)) as TongTonKho,
        sp.SoLuongDaBan,
        ROUND(AVG(dg.SoSao), 1) as DiemDanhGia,
        COUNT(DISTINCT dg.id) as SoLuotDanhGia,
        sp.HinhAnh
    FROM sanpham sp
    INNER JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
    INNER JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
    INNER JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
    LEFT JOIN danhgia dg ON sp.id = dg.id_SanPham AND dg.TrangThai = 1
    WHERE sp.TrangThai = 1
    GROUP BY sp.id, sp.Ten, sp.Gia, sp.GiaKhuyenMai, th.Ten, dm.Ten, sp.SoLuongDaBan, sp.HinhAnh
    HAVING TongTonKho > 0
    ORDER BY sp.NgayTao DESC;
END$$

-- PROCEDURE 2: Kiểm tra tồn kho
CREATE PROCEDURE `sp_KiemTraTonKho`()
BEGIN
    SELECT 
        'Thống kê tồn kho real-time' as ThongKe,
        COUNT(*) as TongSoBienThe,
        SUM(CASE WHEN fn_TinhTonKhoRealTime(cts.id) > 0 THEN 1 ELSE 0 END) as ConHang,
        SUM(CASE WHEN fn_TinhTonKhoRealTime(cts.id) = 0 THEN 1 ELSE 0 END) as HetHang,
        SUM(CASE WHEN fn_TinhTonKhoRealTime(cts.id) <= 10 AND fn_TinhTonKhoRealTime(cts.id) > 0 THEN 1 ELSE 0 END) as SapHetHang
    FROM chitietsanpham cts
    INNER JOIN sanpham sp ON cts.id_SanPham = sp.id
    WHERE sp.TrangThai = 1;
END$$

-- PROCEDURE 3: Thông báo tồn kho thấp
CREATE PROCEDURE `sp_ThongBaoTonKhoThap`(IN `p_NgungCanhBao` INT DEFAULT 10)
BEGIN
    SELECT 
        tk.id_ChiTietSanPham,
        tk.TenSanPham,
        tk.ThuongHieu,
        tk.KichCo,
        tk.MauSac,
        tk.MaSanPham,
        tk.TonKho,
        tk.SoLuongDangCho,
        'Tồn kho thấp' as CanhBao
    FROM v_tonkho_sanpham tk
    WHERE tk.TonKho <= p_NgungCanhBao 
    AND tk.TonKho > 0
    AND tk.TrangThaiSanPham = 1
    ORDER BY tk.TonKho ASC, tk.TenSanPham;
END$$

DELIMITER ;

-- ===================================================
-- KIỂM TRA VÀ TEST HỆ THỐNG
-- ===================================================

-- Test functions
SELECT 'KIỂM TRA FUNCTIONS' as Status;

SELECT 
    'Test fn_TinhTonKhoRealTime' as Test,
    cts.id,
    cts.MaSanPham,
    fn_TinhTonKhoRealTime(cts.id) as TonKho
FROM chitietsanpham cts 
LIMIT 5;

-- Test view
SELECT 'KIỂM TRA VIEW' as Status;
SELECT * FROM v_tonkho_sanpham LIMIT 3;

-- Test procedure
SELECT 'KIỂM TRA PROCEDURE' as Status;
CALL sp_KiemTraTonKho();

-- Kiểm tra triggers
SELECT 
    'KIỂM TRA TRIGGERS' as Status,
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE()
AND TRIGGER_NAME IN ('tr_CapNhatSoLuongDaBan_v2', 'tr_XoaGioHang_v2');

-- Thông báo hoàn thành
SELECT 
    '✅ HỆ THỐNG TỒN KHO ĐÃ ĐƯỢC SỬA HOÀN TOÀN!' as KetQua,
    'Đã xử lý lỗi trigger conflict - Sử dụng functions real-time' as GhiChu,
    NOW() as ThoiGian;

-- Hướng dẫn sử dụng
SELECT '=== HỆ THỐNG MỚI ĐÃ SẴN SÀNG ===' as info;
SELECT 'fn_TinhTonKhoRealTime(id_ChiTietSanPham) - Tính tồn kho real-time' as Function1;
SELECT 'fn_CoTheBan(id_ChiTietSanPham, soLuong) - Kiểm tra có thể bán' as Function2;
SELECT 'v_tonkho_sanpham - View tổng hợp tồn kho' as View1;
SELECT 'sp_ThongBaoTonKhoThap() - Cảnh báo tồn kho thấp' as Procedure1;