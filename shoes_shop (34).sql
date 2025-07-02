-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 26, 2025 at 11:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shoes_shop`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKho` (IN `p_id_ChiTietSanPham` INT, IN `p_SoLuongThayDoi` INT, IN `p_LoaiThayDoi` VARCHAR(10))   BEGIN
    DECLARE v_TonKhoHienTai INT DEFAULT 0;
    
    -- Lấy tồn kho hiện tại
    SELECT TonKho INTO v_TonKhoHienTai
    FROM chitietsanpham
    WHERE id = p_id_ChiTietSanPham;
    
    -- Cập nhật tồn kho
    IF p_LoaiThayDoi = 'TANG' THEN
        UPDATE chitietsanpham 
        SET TonKho = TonKho + p_SoLuongThayDoi
        WHERE id = p_id_ChiTietSanPham;
    ELSEIF p_LoaiThayDoi = 'GIAM' THEN
        IF v_TonKhoHienTai >= p_SoLuongThayDoi THEN
            UPDATE chitietsanpham 
            SET TonKho = TonKho - p_SoLuongThayDoi
            WHERE id = p_id_ChiTietSanPham;
        ELSE
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Không đủ hàng trong kho để thực hiện giao dịch';
        END IF;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_KiemTraTonKho` (IN `p_id_ChiTietSanPham` INT, IN `p_SoLuongCanBan` INT, OUT `p_TonKho` INT, OUT `p_CoTheBan` BOOLEAN)   BEGIN
    SELECT TonKho INTO p_TonKho
    FROM v_tonkho_sanpham 
    WHERE id_ChiTietSanPham = p_id_ChiTietSanPham;
    
    SET p_TonKho = COALESCE(p_TonKho, 0);
    SET p_CoTheBan = (p_TonKho >= p_SoLuongCanBan);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LayDanhSachSanPhamCoHang` ()   BEGIN
    SELECT 
        sp.id,
        sp.Ten,
        sp.Gia,
        sp.GiaKhuyenMai,
        th.Ten as ThuongHieu,
        dm.Ten as DanhMuc,
        COUNT(DISTINCT cts.id) as SoBienThe,
        SUM(GREATEST(tk.TonKho, 0)) as TongTonKho,
        -- Thêm thông tin hữu ích
        sp.SoLuongDaBan,
        ROUND(AVG(dg.SoSao), 1) as DiemDanhGia,
        COUNT(DISTINCT dg.id) as SoLuotDanhGia
    FROM sanpham sp
    INNER JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
    INNER JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
    INNER JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
    INNER JOIN v_tonkho_sanpham tk ON cts.id = tk.id_ChiTietSanPham
    LEFT JOIN danhgia dg ON sp.id = dg.id_SanPham AND dg.TrangThai = 1
    WHERE tk.TonKho > 0
      AND sp.TrangThai = 1
    GROUP BY sp.id, sp.Ten, sp.Gia, sp.GiaKhuyenMai, th.Ten, dm.Ten, sp.SoLuongDaBan
    HAVING TongTonKho > 0
    ORDER BY sp.NgayTao DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_QuanLyNguoiDung` (IN `p_Action` VARCHAR(20), IN `p_UserId` INT, IN `p_NewRole` INT, IN `p_NewStatus` INT)   BEGIN
    DECLARE v_CurrentRole INT;
    DECLARE v_CurrentStatus INT;
    
    -- Lấy thông tin hiện tại
    SELECT id_Quyen, TrangThai 
    INTO v_CurrentRole, v_CurrentStatus
    FROM quyenguoidung qnd
    INNER JOIN nguoidung nd ON qnd.id_NguoiDung = nd.id
    WHERE nd.id = p_UserId;
    
    CASE p_Action
        WHEN 'UPDATE_ROLE' THEN
            -- Cập nhật vai trò
            IF p_NewRole IS NOT NULL AND p_NewRole != v_CurrentRole THEN
                UPDATE quyenguoidung 
                SET id_Quyen = p_NewRole
                WHERE id_NguoiDung = p_UserId;
            END IF;
            
        WHEN 'UPDATE_STATUS' THEN
            -- Cập nhật trạng thái
            IF p_NewStatus IS NOT NULL AND p_NewStatus != v_CurrentStatus THEN
                UPDATE nguoidung 
                SET TrangThai = p_NewStatus
                WHERE id = p_UserId;
                
                -- Nếu khóa tài khoản, xóa giỏ hàng và wishlist
                IF p_NewStatus = 0 THEN
                    DELETE FROM giohang WHERE id_NguoiDung = p_UserId;
                    DELETE FROM wishlist WHERE id_NguoiDung = p_UserId;
                END IF;
            END IF;
            
        WHEN 'GET_STATS' THEN
            -- Lấy thống kê người dùng
            SELECT 
                COUNT(*) as TongSoNguoiDung,
                SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) as SoNguoiDungHoatDong,
                SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) as SoNguoiDungBiKhoa,
                AVG(TongChiTieu) as ChiTieuTrungBinh
            FROM v_ThongTinNguoiDung;
    END CASE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_TimKiemSanPhamNangCao` (IN `p_Keyword` VARCHAR(100), IN `p_DanhMuc` INT, IN `p_ThuongHieu` INT, IN `p_MinPrice` DECIMAL(15,2), IN `p_MaxPrice` DECIMAL(15,2), IN `p_MauSac` VARCHAR(50), IN `p_KichCo` VARCHAR(10), IN `p_SortBy` VARCHAR(20))   BEGIN
    SELECT 
        sp.id,
        sp.Ten,
        sp.Gia,
        sp.GiaKhuyenMai,
        sp.MoTa,
        th.Ten as ThuongHieu,
        dm.Ten as DanhMuc,
        GROUP_CONCAT(DISTINCT CONCAT(ms.Ten, ':', kc.Ten)) as BienThe,
        MIN(tk.TonKho) as TonKho,
        COUNT(DISTINCT dg.id) as SoLuotDanhGia,
        ROUND(AVG(dg.SoSao), 1) as DiemDanhGia,
        sp.HinhAnh
    FROM sanpham sp
    INNER JOIN thuonghieu th ON sp.id_ThuongHieu = th.id
    INNER JOIN danhmuc dm ON sp.id_DanhMuc = dm.id
    INNER JOIN chitietsanpham cts ON sp.id = cts.id_SanPham
    INNER JOIN mausac ms ON cts.id_MauSac = ms.id
    INNER JOIN kichco kc ON cts.id_KichCo = kc.id
    LEFT JOIN v_tonkho_sanpham tk ON cts.id = tk.id_ChiTietSanPham
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),
(17, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Thị trấn An Châu, Huyện Sơn Động, Bắc Giang', 1500000.00, 2000.00, 200000.00, 13000002000.00, 'SUMMER20', NULL, 3, 4, 1, 0, NULL, '2025-06-26 09:56:54', '2025-06-26 09:56:54', 'thanhtrung3010xsw@gmail.com', NULL),
(18, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'fffffffffffffffffffffffffff, Xã Thanh Thịnh, Huyện Chợ Mới, Bắc Kạn', 1500000.00, 2000.00, 75000.00, 14250002000.00, 'VOUCHER1750230321633', 'dđ', 1, 4, 1, 0, NULL, '2025-06-26 10:04:12', '2025-06-26 10:04:12', 'thanhtrung3010xsw@gmail.com', NULL);

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Chỉ cập nhật khi đơn hàng chuyển sang trạng thái "Đã giao" (4)
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_CapNhatTonKhoKhiThayDoiDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW 
BEGIN
    -- Khi đơn hàng chuyển từ chờ xác nhận (1) sang đã xác nhận (2): trừ kho
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng bị hủy (5) từ trạng thái đã xác nhận: cộng lại kho
    IF NEW.TrangThai = 5 AND OLD.TrangThai IN (2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
    
    -- Khi đơn hàng chuyển từ trạng thái hủy (5) về các trạng thái khác
    IF OLD.TrangThai = 5 AND NEW.TrangThai IN (1, 2, 3, 4) THEN
        -- Cập nhật tồn kho dựa trên stored procedure
        CALL sp_CapNhatTonKhoTuDong();
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTuDong` ()   
BEGIN
    -- Cập nhật tồn kho dựa trên view v_tonkho_sanpham
    UPDATE chitietsanpham cts
    INNER JOIN v_tonkho_sanpham vt ON cts.id = vt.id_ChiTietSanPham
    SET cts.TonKho = GREATEST(0, vt.SoLuongNhap - vt.SoLuongBan);
    
    -- Log số lượng bản ghi được cập nhật
    SELECT ROW_COUNT() as SoBanGhiCapNhat;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CapNhatTonKhoTheoSanPham` (IN `p_id_ChiTietSanPham` INT)   
BEGIN
    DECLARE v_SoLuongNhap INT DEFAULT 0;
    DECLARE v_SoLuongBan INT DEFAULT 0;
    DECLARE v_TonKhoMoi INT DEFAULT 0;
    
    -- Lấy số lượng nhập từ phiếu nhập đã duyệt
    SELECT COALESCE(SUM(ctpn.SoLuong), 0) INTO v_SoLuongNhap
    FROM chitietphieunhap ctpn
    INNER JOIN phieunhap pn ON ctpn.id_PhieuNhap = pn.id
    WHERE ctpn.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND pn.TrangThai = 2; -- Chỉ tính phiếu nhập đã duyệt
    
    -- Lấy số lượng bán từ đơn hàng đã xác nhận
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) INTO v_SoLuongBan
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham
      AND dh.TrangThai IN (2, 3, 4); -- Đã xác nhận, đang giao, đã giao
    
    -- Tính tồn kho mới
    SET v_TonKhoMoi = GREATEST(0, v_SoLuongNhap - v_SoLuongBan);
    
    -- Cập nhật tồn kho
    UPDATE chitietsanpham 
    SET TonKho = v_TonKhoMoi 
    WHERE id = p_id_ChiTietSanPham;
    
    -- Trả về thông tin
    SELECT 
        p_id_ChiTietSanPham as id_ChiTietSanPham,
        v_SoLuongNhap as SoLuongNhap,
        v_SoLuongBan as SoLuongBan,
        v_TonKhoMoi as TonKhoMoi;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaBan` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_DonHang`, `id_ChiTietSanPham`, `SoLuong`, `GiaBan`, `ThanhTien`) VALUES
(7, 7, 325, 1, 800000.00, 800000.00),
(8, 8, 331, 1, 2900000.00, 2900000.00),
(9, 9, 323, 1, 2500000.00, 2500000.00),
(10, 9, 327, 1, 3900000.00, 3900000.00),
(11, 10, 331, 2, 2900000.00, 5800000.00),
(12, 11, 323, 1, 2500000.00, 2500000.00),
(13, 12, 325, 1, 750000.00, 750000.00),
(14, 13, 325, 2, 750000.00, 1500000.00),
(15, 14, 327, 1, 3800000.00, 3800000.00),
(16, 15, 325, 2, 750000.00, 1500000.00),
(17, 16, 329, 1, 2100000.00, 2100000.00),
(18, 17, 325, 2, 750000.00, 1500000.00),
(19, 18, 325, 2, 750000.00, 1500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietphieunhap`
--

CREATE TABLE `chitietphieunhap` (
  `id` int(11) NOT NULL,
  `id_PhieuNhap` int(11) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `GiaNhap` decimal(15,2) DEFAULT NULL,
  `ThanhTien` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietphieunhap`
--

INSERT INTO `chitietphieunhap` (`id`, `id_PhieuNhap`, `id_ChiTietSanPham`, `SoLuong`, `GiaNhap`, `ThanhTien`) VALUES
(20, 7, 323, 10, 1000000.00, 10000000.00),
(21, 8, 323, 10, 1000000.00, 10000000.00),
(22, 9, 323, 10, 1000000.00, 10000000.00),
(23, 10, 331, 1, 100000.00, 100000.00),
(24, 11, 323, 10, 1000000.00, 10000000.00),
(25, 12, 323, 10, 1000000.00, 10000000.00),
(26, 13, 332, 11, 1222222.00, 13444442.00),
(27, 14, 358, 12, 1000000.00, 12000000.00),
(28, 15, 347, 12, 120000.00, 1440000.00),
(29, 15, 333, 12, 900000.00, 10800000.00),
(30, 16, 327, 12, 122222.00, 1466664.00),
(31, 17, 333, 10, 10000.00, 9999999999999.99);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL,
  `TonKho` int(11) DEFAULT 0,
  `SoLuong` int(11) DEFAULT 0 COMMENT 'Số lượng trong kho (alias cho TonKho)'
) ;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`, `SoLuong`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 32, 32),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 2, 2),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 9, 9),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10, 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 9, 9),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10, 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 8, 8),
(332, 149, 5, 3, 'CONVERSE-RED-39', 0, 0),
(333, 149, 6, 3, 'CONVERSE-RED-40', 0, 0),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39', 0, 0),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40', 0, 0),
(345, 154, 1, 1, 'NIKE-AM2023-DEN-39', 10, 10),
(346, 154, 2, 1, 'NIKE-AM2023-DEN-40', 15, 15),
(347, 153, 2, 1, 'MD-A', 0, 0),
(350, 151, 2, 2, 'MD-3', 0, 0),
(354, 155, 12, 11, 'D', 10, 10),
(358, 156, 2, 3, 'ND1', 12, 12),
(359, 157, 12, 12, 'NIKE-NAVY-46', 0, 0),
(360, 157, 14, 12, 'NIKE-NAVY-48', 0, 0);

--
-- Triggers `chitietsanpham`
--
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_insert` BEFORE INSERT ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_sync_soluong_tonkho_update` BEFORE UPDATE ON `chitietsanpham` FOR EACH ROW BEGIN
    -- Đồng bộ SoLuong = TonKho
    SET NEW.SoLuong = NEW.TonKho;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `danhgia`
--

CREATE TABLE `danhgia` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_DonHang` int(11) DEFAULT NULL,
  `SoSao` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `NgayDanhGia` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danhmuc`
--

CREATE TABLE `danhmuc` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `id_DanhMucCha` int(11) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `danhmuc`
--

INSERT INTO `danhmuc` (`id`, `Ten`, `id_DanhMucCha`, `MoTa`, `TrangThai`) VALUES
(1, 'Giày Thể Thao Cao Cấp vivvvvp PRO', NULL, NULL, 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(42, 'Giày học sinh ', NULL, NULL, 1),
(43, 'Giày trẻ em m', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `MaDonHang` varchar(20) DEFAULT NULL,
  `id_NguoiMua` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `SDTNguoiNhan` varchar(15) DEFAULT NULL,
  `DiaChiNhan` varchar(255) DEFAULT NULL,
  `TongTienHang` decimal(15,2) DEFAULT 0.00,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `GiamGia` decimal(15,2) DEFAULT 0.00,
  `TongThanhToan` decimal(15,2) DEFAULT 0.00,
  `MaGiamGia` varchar(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `id_ThanhToan` int(11) DEFAULT NULL,
  `id_VanChuyen` int(11) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang giao, 4: Đã giao, 5: Đã hủy',
  `TrangThaiThanhToan` int(11) DEFAULT 0 COMMENT '0: Chưa thanh toán, 1: Đã thanh toán',
  `ThoiGianThanhToan` datetime DEFAULT NULL,
  `NgayDatHang` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `EmailNguoiNhan` varchar(100) DEFAULT NULL,
  `LyDoHuy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donhang`
--

INSERT INTO `donhang` (`id`, `MaDonHang`, `id_NguoiMua`, `session_id`, `TenNguoiNhan`, `SDTNguoiNhan`, `DiaChiNhan`, `TongTienHang`, `PhiVanChuyen`, `GiamGia`, `TongThanhToan`, `MaGiamGia`, `GhiChu`, `id_ThanhToan`, `id_VanChuyen`, `TrangThai`, `TrangThaiThanhToan`, `ThoiGianThanhToan`, `NgayDatHang`, `NgayCapNhat`, `EmailNguoiNhan`, `LyDoHuy`) VALUES
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 5, 0, NULL, '2025-06-16 20:55:56', '2025-06-25 01:20:45', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 5, 0, NULL, '2025-06-16 21:06:17', '2025-06-24 21:18:52', 'thanhtrung3010xsw@gmail.com', NULL),
(9, NULL, NULL, '6403275e-94fc-46bc-9c46-87e7c887178b', 'trung', '0798355785', 'nha be á nha, Phường Thới An Đông, Quận Bình Thuỷ, Cần Thơ', 6400000.00, 30000.00, 0.00, 640000030000.00, NULL, 'nguyen van tao', 3, 1, 3, 0, NULL, '2025-06-17 09:00:13', '2025-06-24 22:50:12', 'thanhtrung3010xsw@gmail.com', NULL),
(10, NULL, NULL, '9cb52e6c-9e4b-4691-9ca6-600fc363a82e', 'trung', '0798355785', 'nha be á nha, Xã Quảng Thành, Huyện Châu Đức, Bà Rịa - Vũng Tàu', 5800000.00, 30000.00, 0.00, 580000030000.00, NULL, 'j', 3, 1, 4, 0, NULL, '2025-06-17 09:15:57', '2025-06-24 21:18:46', 'thanhtrung3010xsw@gmail.com', NULL),
(11, NULL, NULL, 'd1118aba-4810-4e37-860d-3f4abf907e40', 'trung', '0798355785', 'nha be á nha, Xã Vĩnh Lợi, Huyện Châu Thành, An Giang', 2500000.00, 30000.00, 0.00, 250000030000.00, NULL, 'ss', 1, 1, 4, 0, NULL, '2025-06-17 11:11:19', '2025-06-25 01:10:50', 'trantuyetsuong14@gmail.com', NULL),
(12, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 750000.00, 30000.00, 0.00, 75000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:12:36', '2025-06-26 09:12:36', 'testguest@example.com', NULL),
(13, NULL, NULL, 'Zh3NsSDLiTS18nTaj5RTzJgtfUXnm3tU', 'Test Guest', '0901234567', '123 Test Street', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, NULL, 1, 1, 1, 0, NULL, '2025-06-26 09:14:42', '2025-06-26 09:14:42', 'thanhtrung3010xsw@gmail.com', NULL),
(14, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Phước Thắng, Huyện Tuy Phước, Bình Định', 3800000.00, 2000.00, 0.00, 38000002000.00, NULL, 'm', 1, 4, 1, 0, NULL, '2025-06-26 09:26:55', '2025-06-26 09:26:55', 'thanhtrung3010xsw@gmail.com', NULL),
(15, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'nnnnnnnnnnnnnnnnnnnnnnnnn, Xã Ninh Quới A, Huyện Hồng Dân, Bạc Liêu', 1500000.00, 30000.00, 0.00, 150000030000.00, NULL, 'm', 1, 1, 1, 0, NULL, '2025-06-26 09:43:30', '2025-06-26 09:43:30', 'thanhtrung3010xsw@gmail.com', NULL),
(16, NULL, NULL, 'QGGN0v1IB1VggOLdw95-3-_cibYIgTfM', 'chun chun', '0798355785', 'chun chun , Phường Trà An, Quận Bình Thuỷ, Cần Thơ', 2100000.00, 2000.00, 0.00, 21000002000.00, NULL, 'mdđ', 1, 4, 1, 0, NULL, '2025-06-26 09:48:25', '2025-06-26 09:48:25', 'thanhtrung3010xsw@gmail.com', NULL),