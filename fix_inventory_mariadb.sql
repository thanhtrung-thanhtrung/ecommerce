-- =====================================
-- SCRIPT FIX HỆ THỐNG TỒN KHO CHO MARIADB  
-- Tương thích với MariaDB 10.4.32
-- =====================================

-- 1. XÓA CÁC THÀNH PHẦN CŨ (AN TOÀN)
-- =====================================

-- Xóa triggers cũ
DROP TRIGGER IF EXISTS `tr_QuanLyTonKhoTheoTrangThaiDonHang`;
DROP TRIGGER IF EXISTS `tr_XoaGioHangSauKhiDatHang`;

-- Xóa functions cũ 
DROP FUNCTION IF EXISTS `fn_TinhTonKhoRealTime`;
DROP FUNCTION IF EXISTS `fn_CoTheBan`;
DROP FUNCTION IF EXISTS `fn_SoLuongDangCho`;

-- Xóa procedures cũ
DROP PROCEDURE IF EXISTS `sp_LayDanhSachSanPhamCoHang`;
DROP PROCEDURE IF EXISTS `sp_TimKiemSanPhamNangCao`;
DROP PROCEDURE IF EXISTS `sp_QuanLyNguoiDung`;

-- Xóa views cũ (nếu có)
DROP VIEW IF EXISTS `v_tonkho_sanpham`;

-- Xóa cột TonKho nếu tồn tại (bảo đảm an toàn)
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

-- 2. TẠO LẠI FUNCTIONS (MARIADB SYNTAX)
-- =====================================

DELIMITER $$

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

CREATE FUNCTION `fn_CoTheBan`(`p_id_ChiTietSanPham` INT, `p_SoLuongCanBan` INT) 
RETURNS TINYINT(1) 
DETERMINISTIC 
READS SQL DATA
BEGIN
    DECLARE v_TonKho INT DEFAULT 0;
    
    SELECT fn_TinhTonKhoRealTime(p_id_ChiTietSanPham) INTO v_TonKho;
    
    RETURN (v_TonKho >= p_SoLuongCanBan);
END$$

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

-- 3. TẠO LẠI TRIGGERS (CHỈ QUẢN LÝ SOLUONGDABAN)
-- ===============================================

DELIMITER $$

CREATE TRIGGER `tr_QuanLyDonHang` 
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

CREATE TRIGGER `tr_XoaGioHangSauKhiDatHang` 
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

-- 4. TẠO VIEW TỒN KHO REAL-TIME
-- =============================

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

-- 5. TẠO LẠI PROCEDURES SỬ DỤNG FUNCTIONS
-- =======================================

DELIMITER $$

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

CREATE PROCEDURE `sp_TimKiemSanPhamNangCao`(
    IN `p_Keyword` VARCHAR(100), 
    IN `p_DanhMuc` INT, 
    IN `p_ThuongHieu` INT, 
    IN `p_MinPrice` DECIMAL(15,2), 
    IN `p_MaxPrice` DECIMAL(15,2), 
    IN `p_MauSac` VARCHAR(50), 
    IN `p_KichCo` VARCHAR(10), 
    IN `p_SortBy` VARCHAR(20)
)
BEGIN
    SELECT 
        sp.id,
        sp.Ten,
        sp.Gia,
        sp.GiaKhuyenMai,
        sp.MoTa,
        th.Ten as ThuongHieu,
        dm.Ten as DanhMuc,
        GROUP_CONCAT(DISTINCT CONCAT(ms.Ten, ':', kc.Ten)) as BienThe,
        MIN(fn_TinhTonKhoRealTime(cts.id)) as TonKho,
        COUNT(DISTINCT dg.id) as SoLuotDanhGia,
        ROUND(AVG(dg.SoSao), 1) as DiemDanhGia,
        sp.HinhAnh
    FROM sanpham sp
    INNER JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
    INNER JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
    INNER JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
    INNER JOIN mausac ms ON cts.id_MauSac = ms.id
    INNER JOIN kichco kc ON cts.id_KichCo = kc.id
    LEFT JOIN danhgia dg ON sp.id = dg.id_SanPham AND dg.TrangThai = 1
    WHERE sp.TrangThai = 1
    AND (p_Keyword IS NULL OR sp.Ten LIKE CONCAT('%', p_Keyword, '%'))
    AND (p_DanhMuc IS NULL OR sp.id_DanhMuc = p_DanhMuc)
    AND (p_ThuongHieu IS NULL OR sp.id_ThuongHieu = p_ThuongHieu)
    AND (p_MinPrice IS NULL OR sp.Gia >= p_MinPrice)
    AND (p_MaxPrice IS NULL OR sp.Gia <= p_MaxPrice)
    AND (p_MauSac IS NULL OR ms.Ten = p_MauSac)
    AND (p_KichCo IS NULL OR kc.Ten = p_KichCo)
    GROUP BY sp.id, sp.Ten, sp.Gia, sp.GiaKhuyenMai, sp.MoTa, th.Ten, dm.Ten, sp.HinhAnh
    HAVING TonKho > 0
    ORDER BY 
        CASE p_SortBy
            WHEN 'price_asc' THEN sp.Gia
            WHEN 'price_desc' THEN -sp.Gia
            WHEN 'newest' THEN sp.NgayTao
            WHEN 'popular' THEN sp.SoLuongDaBan
            ELSE sp.NgayTao
        END DESC;
END$$

CREATE PROCEDURE `sp_QuanLyNguoiDung`(
    IN `p_Action` VARCHAR(20), 
    IN `p_UserId` INT, 
    IN `p_NewRole` INT, 
    IN `p_NewStatus` INT
)
BEGIN
    DECLARE v_CurrentRole INT DEFAULT NULL;
    DECLARE v_CurrentStatus INT DEFAULT NULL;
    
    -- Lấy thông tin hiện tại
    SELECT qnd.id_Quyen, nd.TrangThai 
    INTO v_CurrentRole, v_CurrentStatus
    FROM nguoidung nd
    LEFT JOIN quyenguoidung qnd ON nd.id = qnd.id_NguoiDung
    WHERE nd.id = p_UserId;
    
    CASE p_Action
        WHEN 'UPDATE_ROLE' THEN
            IF p_NewRole IS NOT NULL AND (v_CurrentRole IS NULL OR p_NewRole != v_CurrentRole) THEN
                IF v_CurrentRole IS NULL THEN
                    INSERT INTO quyenguoidung (id_Quyen, id_NguoiDung) VALUES (p_NewRole, p_UserId);
                ELSE
                    UPDATE quyenguoidung 
                    SET id_Quyen = p_NewRole
                    WHERE id_NguoiDung = p_UserId;
                END IF;
            END IF;
            
        WHEN 'UPDATE_STATUS' THEN
            IF p_NewStatus IS NOT NULL AND p_NewStatus != v_CurrentStatus THEN
                UPDATE nguoidung 
                SET TrangThai = p_NewStatus
                WHERE id = p_UserId;
                
                IF p_NewStatus = 0 THEN
                    DELETE FROM giohang WHERE id_NguoiDung = p_UserId;
                    DELETE FROM wishlist WHERE id_NguoiDung = p_UserId;
                END IF;
            END IF;
            
        WHEN 'GET_STATS' THEN
            SELECT 
                COUNT(*) as TongSoNguoiDung,
                SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as SoNguoiDungHoatDong,
                SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as SoNguoiDungBiKhoa,
                AVG(TongChiTieu) as ChiTieuTrungBinh
            FROM v_ThongTinNguoiDung;
    END CASE;
END$$

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

DELIMITER ;

-- 6. KIỂM TRA VÀ TEST
-- ===================

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

-- Thông báo hoàn thành
SELECT 
    '✅ HỆ THỐNG TỒN KHO ĐÃ ĐƯỢC SỬA THÀNH CÔNG!' as KetQua,
    'Real-time calculation - Tương thích MariaDB' as GhiChu,
    NOW() as ThoiGian;

-- Hướng dẫn sử dụng
SELECT '=== HƯỚNG DẪN SỬ DỤNG ===' as info;
SELECT 'fn_TinhTonKhoRealTime(id_ChiTietSanPham) - Tính tồn kho real-time' as Function1;
SELECT 'fn_CoTheBan(id_ChiTietSanPham, soLuong) - Kiểm tra có thể bán' as Function2;
SELECT 'v_tonkho_sanpham - View tổng hợp tồn kho' as View1;
SELECT 'sp_ThongBaoTonKhoThap() - Cảnh báo tồn kho thấp' as Procedure1;