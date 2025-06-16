-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 16, 2025 at 04:24 PM
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
(8, 8, 331, 1, 2900000.00, 2900000.00);

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
  `TonKho` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`, `TonKho`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39', 10),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40', 10),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39', 9),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40', 10),
(327, 146, 7, 4, 'JORDAN1-BLUE-42', 10),
(328, 146, 8, 1, 'JORDAN1-BLACK-43', 10),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39', 10),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40', 10),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41', 9);

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
(1, 'Giày Thể Thao Cao Cấp vip', NULL, 'Các loại giày cao cấp dành cho hoạt động thể thao', 0),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đa năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(5, 'Giày Bóng Đá', 3, 'Giày chuyên dụng cho bóng đá', 1),
(6, 'Giày Bóng Rổ', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(8, 'Giày Trẻ Em', NULL, 'Giày thể thao dành cho trẻ em', 1),
(9, 'Giày Tennis', 3, 'Giày chuyên dụng cho tennis', 1),
(38, 'Giày Thể Thao đẹp', NULL, 'Các loại giày dành cho hoạt động thể thao', 1);

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
(7, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Xã Hiệp Phước, Huyện Nhà Bè, Hồ Chí Minh', 800000.00, 30000.00, 0.00, 80000030000.00, NULL, 'nguyen van tao', 1, 1, 1, 0, NULL, '2025-06-16 20:55:56', '2025-06-16 20:55:56', 'thanhtrung3010xsw@gmail.com', NULL),
(8, NULL, NULL, 'b4e63f0c-35aa-42a9-ae23-2dae8b3891d9', 'trung', '0798355785', 'nha be á nha, Phường Thới Bình, Quận Ninh Kiều, Cần Thơ', 2900000.00, 30000.00, 0.00, 290000030000.00, NULL, 'hahaa', 3, 1, 1, 0, NULL, '2025-06-16 21:06:17', '2025-06-16 21:06:17', 'thanhtrung3010xsw@gmail.com', NULL);

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
CREATE TRIGGER `tr_UpdateTonKhoKhiXacNhanDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    IF NEW.TrangThai = 2 AND OLD.TrangThai = 1 THEN
        UPDATE chitietsanpham cts
        INNER JOIN chitietdonhang ctdh ON cts.id = ctdh.id_ChiTietSanPham
        SET cts.SoLuongTon = cts.SoLuongTon - ctdh.SoLuong
        WHERE ctdh.id_DonHang = NEW.id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_XoaGioHangSauKhiDatHang` AFTER INSERT ON `donhang` FOR EACH ROW BEGIN
    -- Xóa giỏ hàng của user
    IF NEW.id_NguoiMua IS NOT NULL THEN
        DELETE FROM giohang WHERE id_NguoiDung = NEW.id_NguoiMua;
    END IF;
    
    -- Xóa giỏ hàng của khách vãng lai
    IF NEW.session_id IS NOT NULL THEN
        DELETE FROM giohang WHERE session_id = NEW.session_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `giohang`
--

CREATE TABLE `giohang` (
  `id` int(11) NOT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `id_ChiTietSanPham` int(11) DEFAULT NULL,
  `SoLuong` int(11) DEFAULT NULL,
  `NgayThem` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hinhthucthanhtoan`
--

CREATE TABLE `hinhthucthanhtoan` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hinhthucthanhtoan`
--

INSERT INTO `hinhthucthanhtoan` (`id`, `Ten`, `MoTa`, `TrangThai`) VALUES
(1, 'Tiền mặt', 'Thanh toán khi nhận hàng', 1),
(2, 'Chuyển khoản', 'Chuyển khoản ngân hàng', 1),
(3, 'Thẻ tín dụng', 'Thanh toán qua thẻ tín dụng', 1);

-- --------------------------------------------------------

--
-- Table structure for table `hinhthucvanchuyen`
--

CREATE TABLE `hinhthucvanchuyen` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `PhiVanChuyen` decimal(15,2) DEFAULT 0.00,
  `ThoiGianDuKien` varchar(50) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hinhthucvanchuyen`
--

INSERT INTO `hinhthucvanchuyen` (`id`, `Ten`, `MoTa`, `PhiVanChuyen`, `ThoiGianDuKien`, `TrangThai`) VALUES
(1, 'Giao hàng tiêu chuẩn', 'Giao hàng trong 2-3 ngày', 30000.00, '2-3 ngày', 1),
(2, 'Giao hàng nhanh', 'Giao hàng trong 1-2 ngày', 50000.00, '1-2 ngày', 1),
(3, 'Giao hàng siêu tốc', 'Giao hàng trong ngày', 80000.00, 'Trong ngày', 1),
(4, 'Giao hàng miễn phí', 'Miễn phí giao hàng cho đơn hàng trên 1.000.000đ', 0.00, '3-7 ngày', 1);

-- --------------------------------------------------------

--
-- Table structure for table `kichco`
--

CREATE TABLE `kichco` (
  `id` int(11) NOT NULL,
  `Ten` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kichco`
--

INSERT INTO `kichco` (`id`, `Ten`) VALUES
(1, '36'),
(2, '37'),
(3, '38'),
(4, '39'),
(5, '40'),
(6, '41'),
(7, '42'),
(8, '43'),
(9, '44'),
(10, '45'),
(11, '35'),
(12, '46'),
(13, '47'),
(14, '48'),
(15, '35'),
(16, '46'),
(17, '47'),
(18, '48'),
(19, '35'),
(20, '46'),
(21, '47'),
(22, '48'),
(23, '35'),
(24, '46'),
(25, '47'),
(26, '48'),
(27, '35'),
(28, '46'),
(29, '47'),
(30, '48'),
(31, '35'),
(32, '46'),
(33, '47'),
(34, '48'),
(35, '35'),
(36, '46'),
(37, '47'),
(38, '48'),
(39, '35'),
(40, '46'),
(41, '47'),
(42, '48');

-- --------------------------------------------------------

--
-- Table structure for table `magiamgia`
--

CREATE TABLE `magiamgia` (
  `Ma` varchar(20) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `PhanTramGiam` int(11) DEFAULT NULL,
  `GiaTriGiamToiDa` decimal(15,2) DEFAULT NULL,
  `NgayBatDau` datetime DEFAULT NULL,
  `NgayKetThuc` datetime DEFAULT NULL,
  `SoLuotSuDung` int(11) DEFAULT NULL,
  `SoLuotDaSuDung` int(11) DEFAULT 0,
  `DieuKienApDung` decimal(15,2) DEFAULT 0.00,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `magiamgia`
--

INSERT INTO `magiamgia` (`Ma`, `Ten`, `MoTa`, `PhanTramGiam`, `GiaTriGiamToiDa`, `NgayBatDau`, `NgayKetThuc`, `SoLuotSuDung`, `SoLuotDaSuDung`, `DieuKienApDung`, `TrangThai`) VALUES
('SUMMER20', 'Hè rực rỡ', 'Giảm 20% cho đơn hàng mùa hè', 20, 200000.00, '2024-06-01 00:00:00', '2024-08-31 00:00:00', 500, 0, 1000000.00, 1),
('WELCOME10', 'Chào mừng', 'Giảm 10% cho đơn hàng đầu tiên', 10, 100000.00, '2024-01-01 00:00:00', '2024-12-31 00:00:00', 1000, 0, 500000.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `mausac`
--

CREATE TABLE `mausac` (
  `id` int(11) NOT NULL,
  `Ten` varchar(50) DEFAULT NULL,
  `MaMau` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mausac`
--

INSERT INTO `mausac` (`id`, `Ten`, `MaMau`) VALUES
(1, 'Đen', '#000000'),
(2, 'Trắng', '#FFFFFF'),
(3, 'Đỏ', '#FF0000'),
(4, 'Xanh Dương', '#0000FF'),
(5, 'Xanh Lá', '#00FF00'),
(6, 'Xám', '#808080'),
(7, 'Vàng', '#FFFF00'),
(8, 'Cam', '#FFA500'),
(9, 'Hồng', '#FFC0CB'),
(10, 'Nâu', '#A52A2A'),
(11, 'Tím', '#800080'),
(12, 'Xanh Navy', '#000080'),
(13, 'Xanh Lá Cây', '#228B22'),
(14, 'Xám', '#808080'),
(15, 'Vàng', '#FFFF00'),
(16, 'Cam', '#FFA500'),
(17, 'Hồng', '#FFC0CB'),
(18, 'Nâu', '#A52A2A'),
(19, 'Tím', '#800080'),
(20, 'Xanh Navy', '#000080'),
(21, 'Xanh Lá Cây', '#228B22'),
(22, 'Xám', '#808080'),
(23, 'Vàng', '#FFFF00'),
(24, 'Cam', '#FFA500'),
(25, 'Hồng', '#FFC0CB'),
(26, 'Nâu', '#A52A2A'),
(27, 'Tím', '#800080'),
(28, 'Xanh Navy', '#000080'),
(29, 'Xanh Lá Cây', '#228B22'),
(30, 'Xám', '#808080'),
(31, 'Vàng', '#FFFF00'),
(32, 'Cam', '#FFA500'),
(33, 'Hồng', '#FFC0CB'),
(34, 'Nâu', '#A52A2A'),
(35, 'Tím', '#800080'),
(36, 'Xanh Navy', '#000080'),
(37, 'Xanh Lá Cây', '#228B22'),
(38, 'Xám', '#808080'),
(39, 'Vàng', '#FFFF00'),
(40, 'Cam', '#FFA500'),
(41, 'Hồng', '#FFC0CB'),
(42, 'Nâu', '#A52A2A'),
(43, 'Tím', '#800080'),
(44, 'Xanh Navy', '#000080'),
(45, 'Xanh Lá Cây', '#228B22'),
(46, 'Xám', '#808080'),
(47, 'Vàng', '#FFFF00'),
(48, 'Cam', '#FFA500'),
(49, 'Hồng', '#FFC0CB'),
(50, 'Nâu', '#A52A2A'),
(51, 'Tím', '#800080'),
(52, 'Xanh Navy', '#000080'),
(53, 'Xanh Lá Cây', '#228B22'),
(54, 'Xám', '#808080'),
(55, 'Vàng', '#FFFF00'),
(56, 'Cam', '#FFA500'),
(57, 'Hồng', '#FFC0CB'),
(58, 'Nâu', '#A52A2A'),
(59, 'Tím', '#800080'),
(60, 'Xanh Navy', '#000080'),
(61, 'Xanh Lá Cây', '#228B22'),
(62, 'Xám', '#808080'),
(63, 'Vàng', '#FFFF00'),
(64, 'Cam', '#FFA500'),
(65, 'Hồng', '#FFC0CB'),
(66, 'Nâu', '#A52A2A'),
(67, 'Tím', '#800080'),
(68, 'Xanh Navy', '#000080'),
(69, 'Xanh Lá Cây', '#228B22');

-- --------------------------------------------------------

--
-- Table structure for table `nguoidung`
--

CREATE TABLE `nguoidung` (
  `id` int(11) NOT NULL,
  `HoTen` varchar(100) DEFAULT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Avatar` varchar(255) DEFAULT NULL,
  `MatKhau` varchar(100) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1,
  `NgayTao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nguoidung`
--

INSERT INTO `nguoidung` (`id`, `HoTen`, `DiaChi`, `SDT`, `Email`, `Avatar`, `MatKhau`, `TrangThai`, `NgayTao`) VALUES
(1, 'Admin', 'Quận 1, TP.HCM', '0123456789', 'admin@example.com', NULL, 'hashed_password', 1, '2025-05-19 03:13:12'),
(2, 'Nguyễn Văn A', 'Quận 2, TP.HCM', '0987654321', 'nguyenvana@example.com', NULL, 'hashed_password', 1, '2025-05-19 03:13:12'),
(3, 'Trần Thị B', 'Quận 3, TP.HCM', '0912345678', 'tranthib@example.com', NULL, 'hashed_password', 1, '2025-05-19 03:13:12'),
(8, 'chunchun', '123 Test Street', '0123456789', 'chunchunnnn@example.com', NULL, '$2a$10$4ZQqRNd4AbLf0rCnDH5l/uNDpCTpl20AG9UbAhQswyCD.eQWsXNkO', 1, '2025-05-21 21:53:51'),
(9, 'Admin Test', 'Địa chỉ Admin', '0900000001', 'chu.test@example.com', NULL, '$2a$10$CY4kQKg18HaSEJuWO99LKeVMfEW5tVDVNdrqclL2BpW0AH47iB9H2', 1, '2025-05-23 21:20:29'),
(10, 'Nhân viên Test', 'Địa chỉ Nhân viên', '0900000002', 'nhanvien.test@example.com', NULL, '$2a$10$jP425lCJynvp88hy0EqLOezvJWpv3hbfXSAPHkcl2HGZeUrKrVKmu', 1, '2025-05-23 21:20:29'),
(11, 'Khách hàng Test', 'Địa chỉ Khách hàng', '0900000003', 'khachhang.test@example.com', NULL, '$2a$10$LwZhH5F5.DQ/vDo2ybDskuQpsapVoctm9sNi9jYeQchlWx35vETMG', 1, '2025-05-23 21:20:29'),
(12, 'Nguyễn Văn Test', 'Hà Nội', '0123456789', 'testuser@example.com', NULL, '$2a$10$3pn2IeL6UAMp7DpJm0D6ZOzp0jx94.dUaAvI.K0y8lG5aJmlWn8UC', 1, '2025-05-24 00:01:54'),
(13, 'Nhân Viên Test', 'Hà Nội', '0123456788', 'nhanvien1@example.com', NULL, '$2a$10$hLboZTTVcSPfidQoBzZ6GuOCwtlJmr1CYpg3SMKDDBViKacYb75vK', 1, '2025-05-24 00:03:23'),
(14, 'Nhân Viên Test', 'Hà Nội', '0123456788', 'nhanviesn1@example.com', NULL, '$2a$10$I0Gf.TcnSUVE.I0vVB4fuOonXztSSHjnUhSKcvDHVxFacHJQ.m7Ua', 1, '2025-05-24 00:10:58'),
(15, 'ttt', 'sdfa', '56', 'asf@gmail.com', NULL, '$2a$10$ILgSzK1hmS6aOIahXg5vi.9V9bjAmQYvyBlb6unmFT4/zReiFS1pG', 1, '2025-06-01 12:42:10'),
(16, 'Khách vãng lai', NULL, '0000000000', 'guest@system.local', NULL, NULL, 1, '2025-06-01 13:31:01'),
(21, 'Khách vãng lai', NULL, '0000000000', 'guesjjjjt@system.local', NULL, NULL, 1, '2025-06-01 13:37:51'),
(23, 'Khách vãng lai', NULL, '0000000000', 'guestv@system.local', NULL, NULL, 1, '2025-06-01 13:49:58'),
(24, 'Khách vãng lai', NULL, '0000000000', 'gguest@system.local', NULL, NULL, 1, '2025-06-01 13:51:01'),
(30, 'Khách vãng lai', NULL, '0000000000', 'geuest@system.local', NULL, NULL, 1, '2025-06-01 13:54:12'),
(31, 'Nguyễn Văn An', '123 Đường ABC, Quận 1, TP.HCM', '0901234567', 'nguyenvanan@email.com', NULL, '$2a$10$example_hashed_password', 1, '2025-06-02 22:20:11'),
(32, 'Trần Thị Bình', '456 Đường XYZ, Quận 3, TP.HCM', '0912345678', 'tranthibinh@email.com', NULL, '$2a$10$example_hashed_password', 1, '2025-06-02 22:20:11'),
(33, 'Lê Văn Cường', '789 Đường DEF, Quận 5, TP.HCM', '0923456789', 'levancuong@email.com', NULL, '$2a$10$example_hashed_password', 1, '2025-06-02 22:20:11'),
(34, 'Phạm Thị Dung', '321 Đường GHI, Quận 7, TP.HCM', '0934567890', 'phamthidung@email.com', NULL, '$2a$10$example_hashed_password', 1, '2025-06-02 22:20:11'),
(35, 'Nguyen Van A', '123 Đường ABC, Quận XYZ, TP.HCM', '0987654321', 'nguyenvana@gmail.com', NULL, '$2a$10$VDe.tu.NF3XQdfTvKI2t6OXo2dXLXEhxguK77/R.KavC5sVITaFs2', 1, '2025-06-05 11:38:27'),
(36, 'Nguyen Van A', '123 Đường ABC, Quận XYZ, TP.HCM', '0987654321', 'nguyenvanaa@gmail.com', NULL, '$2a$10$kpuXdAsFwpwa8gHdy3xNdOYBYOgYU3YCf4tD5OZb4ZXCj0V9suisu', 1, '2025-06-05 12:04:22'),
(37, 'Nguyen Van A', '123 ABC Street, HCM', '0798355785', 'a@example.com', NULL, '$2a$10$2naKjOxgnkg7KzOj13a.4OlYVnxgvW5BEBFTCubbSTPD/XqHctTLO', 1, '2025-06-06 12:16:59'),
(40, 'chun chun', '123 Đường ABC, Quận 1, TP.HCM', '0798355785', 'nguyenvanaa@example.com', NULL, '$2a$10$6y6ifLsxRsDTkCtOVl9MhOWVb6r3scyFpdWGw3TTMbREIL6TEUh66', 1, '2025-06-06 14:16:42'),
(41, 'thanh trung', 'nguyen van tao', '0798355785', 'trungpro2811@gmail.com', NULL, '$2a$10$52GF8UaIsJWTQ4lVYEayhuEV.mLkB7ASjdDprNc.PWqW6z7bFWKSi', 1, '2025-06-06 14:28:54'),
(42, 'thanh trung', 'nha be á nha', '0906964977', 'trungpro2811s@gmail.com', NULL, '$2a$10$VRFTv0Zjc7NksprVC8sGb.NAQd3L1Eeq7FbEn95fU4YHjr.8WEIb6', 1, '2025-06-06 14:39:29'),
(43, 'thanh trung', 'nha be á nha', '0906964977', 'dh52108820@student.stu.edu.vn', NULL, '$2a$10$1X7Y3hHjJ2GzbbXxnMF3SOFSsucXxlD.jRHz1LhsPwtewaC/r/tu.', 1, '2025-06-06 14:41:58'),
(44, 'Nguyen Van A', '123 Đường ABC, Quận 1, TP.HCM', '0913345678', 'nguyenvanadd@gmail.com', NULL, '$2a$10$0COzdCTAS5svLSINJLcYkOtYNCREmOsTBkwglrIY1mlVnOAyZ0CQW', 1, '2025-06-07 10:17:21'),
(45, 'NguyenVan A', '123 Đường ABC, Quận 1, TP.HCM', '0901234567', 'nguyeenvana@gmail.com', NULL, '$2a$10$LTE9uKuOkRGo4.U71MTTk..QOyYq4A.PNgECiIZwTqY54NbswYCni', 1, '2025-06-07 10:41:44'),
(46, 'NguyenVan A', '123 Đường ABC, Quận 1, TP.HCM', '0901234567', 'nguyeenvbbana@gmail.com', NULL, '$2a$10$wMOgzG1gxZNBjOB1A9D7seq4XsGxaSKoLYoGV99X/REclr9H2AXQO', 1, '2025-06-07 10:43:16'),
(47, 'NguyenVan A', '123 Đường ABC, Quận 1, TP.HCM', '0901234567', 'nguyeenvbbddana@gmail.com', NULL, '$2a$10$GChTRl5bUBf1RmmMmo9A2uu7aAmto3.IRZMq23f/rsgZc.j5J8Dd6', 1, '2025-06-07 10:48:42'),
(48, 'Nguyễn Văn A', '123 Đường ABC, Quận XYZ, TP.HCM', '0987654321', 'user@example.com', NULL, '$2a$10$tQyO4DiE.eJzis7x0U1I6ucWBL6siYEWg8izzg/wGJtY3ljMuYv0a', 1, '2025-06-07 13:31:54'),
(49, 'tran thanh chunddd', '123 Đường ABC, Quận XYZ, TP.HCM', '0987654321', 'tesddtuser@example.com', NULL, '$2a$10$3Jvk2iuNeORSJQD6zaDMWujmQNhPgNoaFr4G8Cc9zQ1CbEGDD2UEW', 1, '2025-06-07 13:44:31'),
(50, 'chun chuna', 'nhà bè than yêuu', '0798355780', 'thanhtrung3010xsw@gmail.com', NULL, '$2a$10$yx4Ft3CIhxU0mdY7.b1z8ex7XM/xgCsUNblrOs7sELJE7g3MQDpWa', 1, '2025-06-11 01:14:34');

-- --------------------------------------------------------

--
-- Table structure for table `nhacungcap`
--

CREATE TABLE `nhacungcap` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nhacungcap`
--

INSERT INTO `nhacungcap` (`id`, `Ten`, `Email`, `SDT`, `DiaChi`, `TrangThai`) VALUES
(1, 'Nike Việt Nam', 'contact@nike.vn', '02812345678', 'Quận 1, TP.HCM', 1),
(2, 'Adidas Việt Nam', 'contact@adidas.vn', '02887654321', 'Quận 2, TP.HCM', 1),
(3, 'Puma Việt Nam', 'contact@puma.vn', '02898765432', 'Quận 3, TP.HCM', 1),
(4, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(5, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(6, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(7, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(8, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(9, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(10, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(11, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(12, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(13, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(14, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(15, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(16, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(17, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(18, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(19, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(20, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(21, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(22, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(23, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(24, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(25, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(26, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(27, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(28, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(29, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(30, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(31, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1),
(32, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(33, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(34, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(35, 'Reebok Việt Nam', 'contact@reebok.vn', '02867890123', 'Quận 7, TP.HCM', 1);

-- --------------------------------------------------------

--
-- Table structure for table `phieunhap`
--

CREATE TABLE `phieunhap` (
  `id` int(11) NOT NULL,
  `MaPhieuNhap` varchar(20) DEFAULT NULL,
  `id_NhaCungCap` int(11) DEFAULT NULL,
  `id_NguoiTao` int(11) DEFAULT NULL,
  `TongTien` decimal(15,2) DEFAULT 0.00,
  `GhiChu` text DEFAULT NULL,
  `NgayNhap` datetime DEFAULT current_timestamp(),
  `TrangThai` int(11) DEFAULT 1 COMMENT '1: Chờ xác nhận, 2: Đã nhập kho, 3: Đã hủy'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `phieunhap`
--

INSERT INTO `phieunhap` (`id`, `MaPhieuNhap`, `id_NhaCungCap`, `id_NguoiTao`, `TongTien`, `GhiChu`, `NgayNhap`, `TrangThai`) VALUES
(1, 'PN001', 1, 1, 50000000.00, 'Nhập hàng Nike tháng 6', '2024-06-01 09:00:00', 2),
(2, 'PN002', 2, 1, 40000000.00, 'Nhập hàng Adidas tháng 6', '2024-06-01 10:00:00', 2),
(3, 'PN003', 3, 1, 30000000.00, 'Nhập hàng Puma tháng 6', '2024-06-01 11:00:00', 2),
(4, 'PN004', 4, 1, 25000000.00, 'Nhập hàng New Balance tháng 6', '2024-06-01 14:00:00', 2),
(5, 'PN005', 5, 1, 20000000.00, 'Nhập hàng Converse tháng 6', '2024-06-01 15:00:00', 2),
(6, 'PN006', 6, 1, 18000000.00, 'Nhập hàng Vans tháng 6', '2024-06-01 16:00:00', 2);

-- --------------------------------------------------------

--
-- Table structure for table `quyen`
--

CREATE TABLE `quyen` (
  `id` int(11) NOT NULL,
  `TenQuyen` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quyen`
--

INSERT INTO `quyen` (`id`, `TenQuyen`) VALUES
(1, 'Admin'),
(2, 'Nhân viên'),
(3, 'Khách hàng');

-- --------------------------------------------------------

--
-- Table structure for table `quyenguoidung`
--

CREATE TABLE `quyenguoidung` (
  `id` int(11) NOT NULL,
  `id_Quyen` int(11) DEFAULT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quyenguoidung`
--

INSERT INTO `quyenguoidung` (`id`, `id_Quyen`, `id_NguoiDung`) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 3, 8),
(5, 1, 9),
(6, 2, 10),
(7, 3, 11),
(8, 3, 12),
(9, 3, 13),
(10, 3, 14),
(11, 3, 15),
(20, 3, 30),
(25, 3, 35),
(26, 3, 36),
(27, 3, 47),
(28, 3, 48),
(29, 3, 49),
(30, 3, 50);

-- --------------------------------------------------------

--
-- Table structure for table `sanpham`
--

CREATE TABLE `sanpham` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `MoTaChiTiet` text DEFAULT NULL,
  `ThongSoKyThuat` text DEFAULT NULL,
  `Gia` decimal(15,2) DEFAULT NULL,
  `GiaKhuyenMai` decimal(15,2) DEFAULT NULL,
  `SoLuongDaBan` int(11) DEFAULT 0,
  `id_DanhMuc` int(11) DEFAULT NULL,
  `id_ThuongHieu` int(11) DEFAULT NULL,
  `id_NhaCungCap` int(11) DEFAULT NULL,
  `HinhAnh` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Format: {"anhChinh": "url", "anhPhu": ["url1", "url2", ...]}' CHECK (json_valid(`HinhAnh`)),
  `TrangThai` int(11) DEFAULT 1,
  `NgayTao` datetime DEFAULT current_timestamp(),
  `NgayCapNhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sanpham`
--

INSERT INTO `sanpham` (`id`, `Ten`, `MoTa`, `MoTaChiTiet`, `ThongSoKyThuat`, `Gia`, `GiaKhuyenMai`, `SoLuongDaBan`, `id_DanhMuc`, `id_ThuongHieu`, `id_NhaCungCap`, `HinhAnh`, `TrangThai`, `NgayTao`, `NgayCapNhat`) VALUES
(144, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 0, 1, 2, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078220/shoes_shop/products/sxggiyyyzozm7akoozi5.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/sxggiyyyzozm7akoozi5\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078225/shoes_shop/products/lzge6vpas622oeiuxa9h.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078228/shoes_shop/products/cnewmljkxcqttaqmivod.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/lzge6vpas622oeiuxa9h\",\"shoes_shop/products/cnewmljkxcqttaqmivod\"]}', 1, '2025-06-16 19:50:31', '2025-06-16 19:50:31'),
(145, 'Giày Bitis Hunter X', 'Giày thể thao quốc dân Việt Nam', '\"Bitis Hunter X với giá hợp lý, thiết kế trẻ trung, phù hợp học sinh, sinh viên...\"', '{\"ChatLieu\":\"Vải lưới, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Việt Nam\"}', 800000.00, 750000.00, 0, 3, 7, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750080727/shoes_shop/products/gdepwxbpyqa2mqv5pqrp.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/gdepwxbpyqa2mqv5pqrp\"}', 1, '2025-06-16 20:32:09', '2025-06-16 20:32:09'),
(146, 'Giày Nike Jordan 1 Retro', 'Nike Jordan 1 Retro kết hợp thiết kế cổ điển và chất liệu cao cấp, tạo nên dấu ấn riêng...', '{\r\n      \"ChatLieu\": \"Da thật, cao su\",\r\n      \"KieuGiay\": \"Bóng rổ\",\r\n      \"XuatXu\": \"Chính hãng\"\r\n    }', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 3900000.00, 1.00, 0, 6, 2, 2, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750081480/shoes_shop/products/tdekprjc7pxor85xvt6r.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/tdekprjc7pxor85xvt6r\"}', 1, '2025-06-16 20:44:41', '2025-06-16 20:44:41'),
(147, 'Giày New Balance 574', 'Thương hiệu chạy bộ biểu tượng', 'New Balance 574 nổi bật với thiết kế retro và phần đệm EVA êm ái...', '{\"ChatLieu\":\"Vải mesh, da lộn\",\"KieuGiay\":\"Chạy bộ\",\"XuatXu\":\"Chính hãng\"}', 2300000.00, 2100000.00, 0, 4, 6, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750081624/shoes_shop/products/r5octfh1ltmhn71p9xya.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/r5octfh1ltmhn71p9xya\"}', 1, '2025-06-16 20:47:05', '2025-06-16 20:47:05'),
(148, 'Giày Thể Thao Puma RS-X', 'Phong cách chunky thời thượng', 'Puma RS-X có thiết kế hầm hố và đầy cá tính, phù hợp với người yêu phong cách hiện đại', '{\"ChatLieu\":\"Vải, da PU\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2900000.00, 2600000.00, 0, 3, 5, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750081966/shoes_shop/products/mk3wowzajsrbdomcumgk.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/mk3wowzajsrbdomcumgk\"}', 1, '2025-06-16 20:52:48', '2025-06-16 20:52:48');

-- --------------------------------------------------------

--
-- Table structure for table `thuonghieu`
--

CREATE TABLE `thuonghieu` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `thuonghieu`
--

INSERT INTO `thuonghieu` (`id`, `Ten`, `MoTa`, `TrangThai`) VALUES
(1, 'Nike Updated', 'Thương hiệu giày thể thao hàng đầu thế giới', 1),
(2, 'Adidas', 'Thương hiệu thể thao nổi tiếng', 1),
(3, 'Puma', 'Thương hiệu thể thao đẳng cấp', 1),
(4, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(5, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(6, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(7, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(8, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(9, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(10, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(11, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(12, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(13, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(14, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(15, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(16, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(17, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(18, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(19, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(20, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(21, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(22, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(23, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(24, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(25, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(26, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(27, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(28, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(29, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(30, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(31, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(32, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(33, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(34, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(35, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(36, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(37, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(38, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(39, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(40, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(41, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(42, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(43, 'Reebok', 'Thương hiệu thể thao và fitness', 1),
(44, 'Under Armour', 'Thương hiệu thể thao hiện đại', 1),
(45, 'ASICS', 'Thương hiệu giày chạy bộ Nhật Bản', 1),
(46, 'New Balance', 'Thương hiệu giày chạy bộ chuyên nghiệp từ Mỹ', 1),
(47, 'Converse', 'Thương hiệu giày canvas cổ điển', 1),
(48, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1),
(49, 'Reebok', 'Thương hiệu thể thao và fitness', 1);

-- --------------------------------------------------------

--
-- Table structure for table `token_lammoi`
--

CREATE TABLE `token_lammoi` (
  `id` int(11) NOT NULL,
  `id_NguoiDung` int(11) NOT NULL,
  `ma_hash` varchar(255) NOT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `ngay_het_han` datetime NOT NULL,
  `Token` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `token_lammoi`
--

INSERT INTO `token_lammoi` (`id`, `id_NguoiDung`, `ma_hash`, `ngay_tao`, `ngay_het_han`, `Token`) VALUES
(1, 35, '', '2025-06-05 12:04:36', '2025-06-12 12:04:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzUsImlhdCI6MTc0OTA5OTg3NiwiZXhwIjoxNzQ5NzA0Njc2fQ.AR_32Te2NTf8pdS2nRP74oYrllH0jPrKrMWs7uWlgWs'),
(2, 10, '', '2025-06-05 12:05:39', '2025-06-12 12:05:39', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc0OTA5OTkzOSwiZXhwIjoxNzQ5NzA0NzM5fQ.n4jyXRkYj4_BLvBFaQZZAQWQ9Vd20NL780LlcqL7Yzw'),
(3, 9, '', '2025-06-05 12:06:24', '2025-06-12 12:06:24', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzQ5MDk5OTg0LCJleHAiOjE3NDk3MDQ3ODR9.XisVSCoS7rZRK0AH2rXdg5002FtkjZRW9NefOMJKhjo'),
(4, 48, '', '2025-06-07 13:39:40', '2025-06-14 13:39:40', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ4LCJpYXQiOjE3NDkyNzgzODAsImV4cCI6MTc0OTg4MzE4MH0.j3Xx-zG4q-985VrX3lbXyM4SBeJt5GgPL-SRxdnGnuE'),
(5, 49, '', '2025-06-07 13:45:14', '2025-06-14 13:45:14', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkyNzg3MTQsImV4cCI6MTc0OTg4MzUxNH0.BmE_NBn0IJQXMokaCHQHXRd9L5bEHY0JlieNMqcsSuQ'),
(6, 49, '', '2025-06-07 15:06:57', '2025-06-14 15:06:57', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkyODM2MTcsImV4cCI6MTc0OTg4ODQxN30.9-nR-fHl3QyYfZMlNxjURUUQfBzwt9QhdZJEJVhTk8I'),
(7, 49, '', '2025-06-07 15:33:52', '2025-06-14 15:33:52', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkyODUyMzIsImV4cCI6MTc0OTg5MDAzMn0.4mq4ok78htrxM24Pon7TBDfed1YX4UQe34wZbhJInR0'),
(8, 49, '', '2025-06-07 20:04:46', '2025-06-14 20:04:46', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzMDE0ODYsImV4cCI6MTc0OTkwNjI4Nn0.0xx1BExDobCVFSmrvluFP3uIByf_QC4N3EXoWj3XzXY'),
(9, 49, '', '2025-06-07 22:09:36', '2025-06-14 22:09:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzMDg5NzYsImV4cCI6MTc0OTkxMzc3Nn0.xVgcxTKNA1fLoHw-JJJLguAatDY-EzYK-xzPreB0QFA'),
(10, 49, '', '2025-06-07 22:09:47', '2025-06-14 22:09:47', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzMDg5ODcsImV4cCI6MTc0OTkxMzc4N30.sCVdBcxBxmy9uOSSIiE73k48ZFQfqT3eUgGIWYMaDqI'),
(11, 49, '', '2025-06-07 22:09:52', '2025-06-14 22:09:52', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzMDg5OTIsImV4cCI6MTc0OTkxMzc5Mn0.NxMbvcRhEAWiuIz6rSEVLf20Ei_eHxz2v3YYImBEvZ0'),
(13, 49, '', '2025-06-07 22:43:33', '2025-06-14 22:43:33', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzMTEwMTMsImV4cCI6MTc0OTkxNTgxM30.hsn5qe0qxwTSFG14Lch27UPue9IdNdqTG10a9TAbQrg'),
(14, 49, '', '2025-06-08 12:32:29', '2025-06-15 12:32:29', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzNjA3NDksImV4cCI6MTc0OTk2NTU0OX0.taVshP2Jlzm2j_k_9a8xD7-6LHD6c3JUASkNbxiJ23Q'),
(15, 49, '', '2025-06-08 22:20:57', '2025-06-15 22:20:57', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzOTYwNTcsImV4cCI6MTc1MDAwMDg1N30.uV-WbBecsE2QByZBgRZYsiw5-oFXHh21vB1oWH8x0P0'),
(17, 49, '', '2025-06-08 23:06:55', '2025-06-15 23:06:55', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDkzOTg4MTUsImV4cCI6MTc1MDAwMzYxNX0.XBte2_DJz2-ZqP01OAch90sCCe4S2U7hIxit0uN-U4A'),
(30, 9, '', '2025-06-10 22:16:54', '2025-06-17 22:16:54', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTU2ODYxNCwiZXhwIjoxNzUwMTczNDE0fQ.4GVZZaM9-gUbf-YPr0lA1Y06-P2zbl7FoaYtOiX1hgM'),
(31, 9, '', '2025-06-10 22:22:42', '2025-06-17 22:22:42', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTU2ODk2MiwiZXhwIjoxNzUwMTczNzYyfQ.5mwCtDrU9PVpj0LRqJjDghldrLtzfOMSUax9CEZgoFQ'),
(32, 9, '', '2025-06-10 22:25:24', '2025-06-17 22:25:24', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTU2OTEyNCwiZXhwIjoxNzUwMTczOTI0fQ.jkMM065tHaRtB-XsPiVYadiBDeWx41SHN3azFTn2Rpk'),
(34, 9, '', '2025-06-11 01:07:04', '2025-06-18 01:07:04', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTU3ODgyNCwiZXhwIjoxNzUwMTgzNjI0fQ.4_wI_jaJIATu1IRB5otMNUoptyO6CNjYDhCHAHaKgMY'),
(35, 49, '', '2025-06-11 01:07:46', '2025-06-18 01:07:46', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDk1Nzg4NjYsImV4cCI6MTc1MDE4MzY2Nn0.s2KzOAoHD-OmNR0CVRHcFLg0cOZ6rOyRSS1tbUNAJVs'),
(39, 49, '', '2025-06-12 18:24:32', '2025-06-19 18:24:32', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ5LCJpYXQiOjE3NDk3Mjc0NzIsImV4cCI6MTc1MDMzMjI3Mn0.hfD49Buofbbh9P_QQoCtYNprCU7VnHuHDTbmYrFMJZg'),
(40, 9, '', '2025-06-12 18:25:50', '2025-06-19 18:25:50', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTcyNzU1MCwiZXhwIjoxNzUwMzMyMzUwfQ.S68ifojQHsHbpGWxIONqFLnUCHWKvdc_j4D_aHypSTQ'),
(41, 9, '', '2025-06-12 18:50:09', '2025-06-19 18:50:09', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTcyOTAwOSwiZXhwIjoxNzUwMzMzODA5fQ.HnUIGncfNtligKEOI4CW1EkjrxohkSypqDtPxJv07PY'),
(42, 9, '', '2025-06-12 18:53:55', '2025-06-19 18:53:55', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTcyOTIzNSwiZXhwIjoxNzUwMzM0MDM1fQ.kgNke8VG9xcjOGNuI7XpOflzjJYF9nE2-D5XWBmggjw'),
(43, 9, '', '2025-06-12 18:58:41', '2025-06-19 18:58:41', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTcyOTUyMSwiZXhwIjoxNzUwMzM0MzIxfQ.EmlzcN3vH996ETa4mtcfghXQNVRt6y90FAUwA3fW1P4'),
(44, 9, '', '2025-06-12 19:04:06', '2025-06-19 19:04:06', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTcyOTg0NiwiZXhwIjoxNzUwMzM0NjQ2fQ.4_DCX_lGNKJ6WdwYceJLNMerqDfOTDr8E6lvU0i7QO4'),
(45, 9, '', '2025-06-12 19:08:20', '2025-06-19 19:08:20', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMDEwMCwiZXhwIjoxNzUwMzM0OTAwfQ.26907aYTyraUT8TleQmwkE3OopzhThIQwaYQsOsimgM'),
(47, 9, '', '2025-06-12 19:26:33', '2025-06-19 19:26:33', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMTE5MywiZXhwIjoxNzUwMzM1OTkzfQ.O5ZmfA64njWW8txosJf5YPUJQYCFfRoCpuatNxAU4_4'),
(48, 9, '', '2025-06-12 19:29:09', '2025-06-19 19:29:09', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMTM0OSwiZXhwIjoxNzUwMzM2MTQ5fQ.yTxL4qNjioiqvokK8UGlxhiRfCXj4jHJCz7Xhs5VAb8'),
(49, 9, '', '2025-06-12 19:29:12', '2025-06-19 19:29:12', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMTM1MiwiZXhwIjoxNzUwMzM2MTUyfQ.1JEJi0vTPwhcrLSHy3eSlY6CPCft_tRKSAjWA-vxXqc'),
(50, 9, '', '2025-06-12 19:31:51', '2025-06-19 19:31:51', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMTUxMSwiZXhwIjoxNzUwMzM2MzExfQ.q5J67jTmmEZGfHSrudcQRUt6DDyFr76QllIqRWWVWmk'),
(51, 9, '', '2025-06-12 19:32:36', '2025-06-19 19:32:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMTU1NiwiZXhwIjoxNzUwMzM2MzU2fQ.vtnoGlXritcP8sGA9nY-K9DyEieiFCxJXsd8MhXd7b4'),
(52, 9, '', '2025-06-12 19:34:11', '2025-06-19 19:34:11', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzQ5NzMxNjUxLCJleHAiOjE3NTAzMzY0NTF9.wV3AQkpSQ6GPvJggcylaw0jLvJJMhkXEItZD4xrhL2I'),
(54, 50, '', '2025-06-12 19:39:23', '2025-06-19 19:39:23', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NDk3MzE5NjMsImV4cCI6MTc1MDMzNjc2M30.xF6M9J_aEV7kgGNls8bk_Onj4U9K0zEjpBjy0C40lt4'),
(55, 9, '', '2025-06-12 19:45:30', '2025-06-19 19:45:30', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMjMzMCwiZXhwIjoxNzUwMzM3MTMwfQ.PVnl0uZOW3DRdEtQop9Iec7yfmv1cutxpK3PdLZNPhY'),
(56, 9, '', '2025-06-12 19:51:34', '2025-06-19 19:51:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMjY5NCwiZXhwIjoxNzUwMzM3NDk0fQ._eToJ5lz0rDpv8adYmDc97GdAm12M_HQQ42jeZsneXg'),
(57, 9, '', '2025-06-12 19:55:57', '2025-06-19 19:55:57', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMjk1NywiZXhwIjoxNzUwMzM3NzU3fQ.Ct0zZxqzTLAmDjb8P3L95a0W7TEfAXe1eGokqH2E9wI'),
(58, 9, '', '2025-06-12 19:56:20', '2025-06-19 19:56:20', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMjk4MCwiZXhwIjoxNzUwMzM3NzgwfQ.vxpz0w_smmV-SpbtE3oRyB3cEZJCfND9fsjpQLYjKQE'),
(59, 9, '', '2025-06-12 19:59:47', '2025-06-19 19:59:47', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzE4NywiZXhwIjoxNzUwMzM3OTg3fQ.4lwMQMf7WWY7LANIOqbLbdU3E3nAWZU378lEVg8PeXQ'),
(60, 9, '', '2025-06-12 20:01:43', '2025-06-19 20:01:43', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzMwMywiZXhwIjoxNzUwMzM4MTAzfQ.-BVl3Nu-zdsapjWAJ05xzx178_uuZZRIZxLweQre17M'),
(61, 9, '', '2025-06-12 20:05:13', '2025-06-19 20:05:13', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzUxMywiZXhwIjoxNzUwMzM4MzEzfQ.ezDZirghtYlJ7I9aM2bDIH1gssTtzoqekgrV9633lmo'),
(62, 9, '', '2025-06-12 20:08:49', '2025-06-19 20:08:49', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzcyOSwiZXhwIjoxNzUwMzM4NTI5fQ.HNQHR4NOKu3yqa4YzK7yIKv9kcsE_PabrbjpsldR4Rk'),
(63, 9, '', '2025-06-12 20:12:31', '2025-06-19 20:12:31', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzk1MSwiZXhwIjoxNzUwMzM4NzUxfQ.VOElFefOdAQY6SuoqJp3GMGPSSWuYsRG-gPlrabstpI'),
(64, 9, '', '2025-06-12 20:13:19', '2025-06-19 20:13:19', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczMzk5OSwiZXhwIjoxNzUwMzM4Nzk5fQ.XY4x2__H7XKmt-Rt2yS2YWb6wGReieH4usVVGFKO-3s'),
(65, 9, '', '2025-06-12 20:14:27', '2025-06-19 20:14:27', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczNDA2NywiZXhwIjoxNzUwMzM4ODY3fQ.zRF02KAFL0GlGW-ST1LdXt5jkMbfue3x1FSNwNl3GMI');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_thongtinnguoidung`
-- (See below for the actual view)
--
CREATE TABLE `v_thongtinnguoidung` (
`id` int(11)
,`HoTen` varchar(100)
,`Email` varchar(100)
,`SDT` varchar(15)
,`DiaChi` varchar(255)
,`TrangThai` int(11)
,`NgayTao` datetime
,`VaiTro` mediumtext
,`SoDonHang` bigint(21)
,`TongChiTieu` decimal(37,2)
,`SoDanhGia` bigint(21)
,`SoWishlist` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_tonkho_sanpham`
-- (See below for the actual view)
--
CREATE TABLE `v_tonkho_sanpham` (
`id_ChiTietSanPham` int(11)
,`TenSanPham` varchar(100)
,`KichCo` varchar(10)
,`MauSac` varchar(50)
,`MaSanPham` varchar(50)
,`SoLuongNhap` decimal(32,0)
,`SoLuongBan` decimal(32,0)
,`TonKho` decimal(33,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL,
  `id_NguoiDung` int(11) DEFAULT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `NgayThem` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `v_thongtinnguoidung`
--
DROP TABLE IF EXISTS `v_thongtinnguoidung`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_thongtinnguoidung`  AS SELECT `nd`.`id` AS `id`, `nd`.`HoTen` AS `HoTen`, `nd`.`Email` AS `Email`, `nd`.`SDT` AS `SDT`, `nd`.`DiaChi` AS `DiaChi`, `nd`.`TrangThai` AS `TrangThai`, `nd`.`NgayTao` AS `NgayTao`, group_concat(`q`.`TenQuyen` separator ',') AS `VaiTro`, count(distinct `dh`.`id`) AS `SoDonHang`, sum(case when `dh`.`TrangThai` = 4 then `dh`.`TongThanhToan` else 0 end) AS `TongChiTieu`, count(distinct `dg`.`id`) AS `SoDanhGia`, count(distinct `w`.`id`) AS `SoWishlist` FROM (((((`nguoidung` `nd` left join `quyenguoidung` `qnd` on(`nd`.`id` = `qnd`.`id_NguoiDung`)) left join `quyen` `q` on(`qnd`.`id_Quyen` = `q`.`id`)) left join `donhang` `dh` on(`nd`.`id` = `dh`.`id_NguoiMua`)) left join `danhgia` `dg` on(`nd`.`id` = `dg`.`id_NguoiDung`)) left join `wishlist` `w` on(`nd`.`id` = `w`.`id_NguoiDung`)) GROUP BY `nd`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `v_tonkho_sanpham`
--
DROP TABLE IF EXISTS `v_tonkho_sanpham`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_tonkho_sanpham`  AS SELECT `cts`.`id` AS `id_ChiTietSanPham`, `sp`.`Ten` AS `TenSanPham`, `kc`.`Ten` AS `KichCo`, `ms`.`Ten` AS `MauSac`, `cts`.`MaSanPham` AS `MaSanPham`, coalesce(`nhap`.`SoLuongNhap`,0) AS `SoLuongNhap`, coalesce(`ban`.`SoLuongBan`,0) AS `SoLuongBan`, coalesce(`nhap`.`SoLuongNhap`,0) - coalesce(`ban`.`SoLuongBan`,0) AS `TonKho` FROM (((((`chitietsanpham` `cts` join `sanpham` `sp` on(`cts`.`id_SanPham` = `sp`.`id`)) join `kichco` `kc` on(`cts`.`id_KichCo` = `kc`.`id`)) join `mausac` `ms` on(`cts`.`id_MauSac` = `ms`.`id`)) left join (select `ctpn`.`id_ChiTietSanPham` AS `id_ChiTietSanPham`,sum(`ctpn`.`SoLuong`) AS `SoLuongNhap` from (`chitietphieunhap` `ctpn` join `phieunhap` `pn` on(`ctpn`.`id_PhieuNhap` = `pn`.`id`)) where `pn`.`TrangThai` = 2 group by `ctpn`.`id_ChiTietSanPham`) `nhap` on(`cts`.`id` = `nhap`.`id_ChiTietSanPham`)) left join (select `ctdh`.`id_ChiTietSanPham` AS `id_ChiTietSanPham`,sum(`ctdh`.`SoLuong`) AS `SoLuongBan` from (`chitietdonhang` `ctdh` join `donhang` `dh` on(`ctdh`.`id_DonHang` = `dh`.`id`)) where `dh`.`TrangThai` in (2,3,4) group by `ctdh`.`id_ChiTietSanPham`) `ban` on(`cts`.`id` = `ban`.`id_ChiTietSanPham`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_DonHang` (`id_DonHang`),
  ADD KEY `id_SanPham_BienThe` (`id_ChiTietSanPham`),
  ADD KEY `idx_chitietdonhang_sanpham` (`id_ChiTietSanPham`);

--
-- Indexes for table `chitietphieunhap`
--
ALTER TABLE `chitietphieunhap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_PhieuNhap` (`id_PhieuNhap`),
  ADD KEY `id_SanPham_BienThe` (`id_ChiTietSanPham`),
  ADD KEY `idx_chitietphieunhap_sanpham` (`id_ChiTietSanPham`);

--
-- Indexes for table `chitietsanpham`
--
ALTER TABLE `chitietsanpham`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_SanPham` (`id_SanPham`),
  ADD KEY `id_KichCo` (`id_KichCo`),
  ADD KEY `id_MauSac` (`id_MauSac`),
  ADD KEY `idx_chitietsanpham_sanpham` (`id_SanPham`);

--
-- Indexes for table `danhgia`
--
ALTER TABLE `danhgia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_SanPham` (`id_SanPham`),
  ADD KEY `id_NguoiDung` (`id_NguoiDung`),
  ADD KEY `id_DonHang` (`id_DonHang`);

--
-- Indexes for table `danhmuc`
--
ALTER TABLE `danhmuc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `donhang`
--
ALTER TABLE `donhang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `MaDonHang` (`MaDonHang`),
  ADD KEY `id_NguoiMua` (`id_NguoiMua`),
  ADD KEY `MaGiamGia` (`MaGiamGia`),
  ADD KEY `id_ThanhToan` (`id_ThanhToan`),
  ADD KEY `id_VanChuyen` (`id_VanChuyen`),
  ADD KEY `idx_donhang_nguoimua` (`id_NguoiMua`),
  ADD KEY `idx_donhang_trangthai` (`TrangThai`),
  ADD KEY `idx_donhang_ngaydat` (`NgayDatHang`),
  ADD KEY `idx_donhang_trangthai_multiple` (`TrangThai`,`NgayDatHang`),
  ADD KEY `idx_session` (`session_id`);

--
-- Indexes for table `giohang`
--
ALTER TABLE `giohang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_NguoiDung` (`id_NguoiDung`),
  ADD KEY `id_SanPham_BienThe` (`id_ChiTietSanPham`),
  ADD KEY `idx_session` (`session_id`);

--
-- Indexes for table `hinhthucthanhtoan`
--
ALTER TABLE `hinhthucthanhtoan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hinhthucvanchuyen`
--
ALTER TABLE `hinhthucvanchuyen`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kichco`
--
ALTER TABLE `kichco`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `magiamgia`
--
ALTER TABLE `magiamgia`
  ADD PRIMARY KEY (`Ma`);

--
-- Indexes for table `mausac`
--
ALTER TABLE `mausac`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nguoidung`
--
ALTER TABLE `nguoidung`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `nhacungcap`
--
ALTER TABLE `nhacungcap`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `phieunhap`
--
ALTER TABLE `phieunhap`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `MaPhieuNhap` (`MaPhieuNhap`),
  ADD KEY `id_NhaCungCap` (`id_NhaCungCap`),
  ADD KEY `id_NguoiTao` (`id_NguoiTao`),
  ADD KEY `idx_phieunhap_trangthai` (`TrangThai`);

--
-- Indexes for table `quyen`
--
ALTER TABLE `quyen`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quyenguoidung`
--
ALTER TABLE `quyenguoidung`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_Quyen` (`id_Quyen`),
  ADD KEY `id_NguoiDung` (`id_NguoiDung`);

--
-- Indexes for table `sanpham`
--
ALTER TABLE `sanpham`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_DanhMuc` (`id_DanhMuc`),
  ADD KEY `id_ThuongHieu` (`id_ThuongHieu`),
  ADD KEY `id_NhaCungCap` (`id_NhaCungCap`),
  ADD KEY `idx_sanpham_danhmuc` (`id_DanhMuc`),
  ADD KEY `idx_sanpham_thuonghieu` (`id_ThuongHieu`);

--
-- Indexes for table `thuonghieu`
--
ALTER TABLE `thuonghieu`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `token_lammoi`
--
ALTER TABLE `token_lammoi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_NguoiDung` (`id_NguoiDung`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_wishlist` (`id_NguoiDung`,`id_SanPham`),
  ADD KEY `id_NguoiDung` (`id_NguoiDung`),
  ADD KEY `id_SanPham` (`id_SanPham`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `chitietphieunhap`
--
ALTER TABLE `chitietphieunhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `chitietsanpham`
--
ALTER TABLE `chitietsanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=332;

--
-- AUTO_INCREMENT for table `danhgia`
--
ALTER TABLE `danhgia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `danhmuc`
--
ALTER TABLE `danhmuc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `donhang`
--
ALTER TABLE `donhang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `giohang`
--
ALTER TABLE `giohang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `hinhthucthanhtoan`
--
ALTER TABLE `hinhthucthanhtoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `hinhthucvanchuyen`
--
ALTER TABLE `hinhthucvanchuyen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `kichco`
--
ALTER TABLE `kichco`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `mausac`
--
ALTER TABLE `mausac`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `nguoidung`
--
ALTER TABLE `nguoidung`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `nhacungcap`
--
ALTER TABLE `nhacungcap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `phieunhap`
--
ALTER TABLE `phieunhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `quyen`
--
ALTER TABLE `quyen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quyenguoidung`
--
ALTER TABLE `quyenguoidung`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `sanpham`
--
ALTER TABLE `sanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT for table `thuonghieu`
--
ALTER TABLE `thuonghieu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `token_lammoi`
--
ALTER TABLE `token_lammoi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  ADD CONSTRAINT `chitietdonhang_ibfk_1` FOREIGN KEY (`id_DonHang`) REFERENCES `donhang` (`id`),
  ADD CONSTRAINT `fk_chitietdonhang_chitietsanpham` FOREIGN KEY (`id_ChiTietSanPham`) REFERENCES `chitietsanpham` (`id`);

--
-- Constraints for table `chitietphieunhap`
--
ALTER TABLE `chitietphieunhap`
  ADD CONSTRAINT `chitietphieunhap_ibfk_1` FOREIGN KEY (`id_PhieuNhap`) REFERENCES `phieunhap` (`id`),
  ADD CONSTRAINT `fk_chitietphieunhap_chitietsanpham` FOREIGN KEY (`id_ChiTietSanPham`) REFERENCES `chitietsanpham` (`id`);

--
-- Constraints for table `chitietsanpham`
--
ALTER TABLE `chitietsanpham`
  ADD CONSTRAINT `chitietsanpham_ibfk_1` FOREIGN KEY (`id_SanPham`) REFERENCES `sanpham` (`id`),
  ADD CONSTRAINT `chitietsanpham_ibfk_2` FOREIGN KEY (`id_KichCo`) REFERENCES `kichco` (`id`),
  ADD CONSTRAINT `chitietsanpham_ibfk_3` FOREIGN KEY (`id_MauSac`) REFERENCES `mausac` (`id`);

--
-- Constraints for table `danhgia`
--
ALTER TABLE `danhgia`
  ADD CONSTRAINT `danhgia_ibfk_1` FOREIGN KEY (`id_SanPham`) REFERENCES `sanpham` (`id`),
  ADD CONSTRAINT `danhgia_ibfk_2` FOREIGN KEY (`id_NguoiDung`) REFERENCES `nguoidung` (`id`),
  ADD CONSTRAINT `danhgia_ibfk_3` FOREIGN KEY (`id_DonHang`) REFERENCES `donhang` (`id`);

--
-- Constraints for table `donhang`
--
ALTER TABLE `donhang`
  ADD CONSTRAINT `donhang_ibfk_1` FOREIGN KEY (`id_NguoiMua`) REFERENCES `nguoidung` (`id`),
  ADD CONSTRAINT `donhang_ibfk_2` FOREIGN KEY (`MaGiamGia`) REFERENCES `magiamgia` (`Ma`),
  ADD CONSTRAINT `donhang_ibfk_3` FOREIGN KEY (`id_ThanhToan`) REFERENCES `hinhthucthanhtoan` (`id`),
  ADD CONSTRAINT `donhang_ibfk_4` FOREIGN KEY (`id_VanChuyen`) REFERENCES `hinhthucvanchuyen` (`id`);

--
-- Constraints for table `giohang`
--
ALTER TABLE `giohang`
  ADD CONSTRAINT `fk_giohang_chitietsanpham` FOREIGN KEY (`id_ChiTietSanPham`) REFERENCES `chitietsanpham` (`id`),
  ADD CONSTRAINT `giohang_ibfk_1` FOREIGN KEY (`id_NguoiDung`) REFERENCES `nguoidung` (`id`);

--
-- Constraints for table `phieunhap`
--
ALTER TABLE `phieunhap`
  ADD CONSTRAINT `phieunhap_ibfk_1` FOREIGN KEY (`id_NhaCungCap`) REFERENCES `nhacungcap` (`id`),
  ADD CONSTRAINT `phieunhap_ibfk_2` FOREIGN KEY (`id_NguoiTao`) REFERENCES `nguoidung` (`id`);

--
-- Constraints for table `quyenguoidung`
--
ALTER TABLE `quyenguoidung`
  ADD CONSTRAINT `quyenguoidung_ibfk_1` FOREIGN KEY (`id_Quyen`) REFERENCES `quyen` (`id`),
  ADD CONSTRAINT `quyenguoidung_ibfk_2` FOREIGN KEY (`id_NguoiDung`) REFERENCES `nguoidung` (`id`);

--
-- Constraints for table `sanpham`
--
ALTER TABLE `sanpham`
  ADD CONSTRAINT `sanpham_ibfk_1` FOREIGN KEY (`id_DanhMuc`) REFERENCES `danhmuc` (`id`),
  ADD CONSTRAINT `sanpham_ibfk_2` FOREIGN KEY (`id_ThuongHieu`) REFERENCES `thuonghieu` (`id`),
  ADD CONSTRAINT `sanpham_ibfk_3` FOREIGN KEY (`id_NhaCungCap`) REFERENCES `nhacungcap` (`id`);

--
-- Constraints for table `token_lammoi`
--
ALTER TABLE `token_lammoi`
  ADD CONSTRAINT `token_lammoi_ibfk_1` FOREIGN KEY (`id_NguoiDung`) REFERENCES `nguoidung` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`id_NguoiDung`) REFERENCES `nguoidung` (`id`),
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`id_SanPham`) REFERENCES `sanpham` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
