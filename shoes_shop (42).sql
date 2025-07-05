-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 04, 2025 at 07:50 PM
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_KiemTraTonKho` ()   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LayDanhSachSanPhamCoHang` ()   BEGIN
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

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_CoTheBan` (`p_id_ChiTietSanPham` INT, `p_SoLuongCanBan` INT) RETURNS TINYINT(1) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE v_TonKho INT DEFAULT 0;
    
    SELECT fn_TinhTonKhoRealTime(p_id_ChiTietSanPham) INTO v_TonKho;
    
    RETURN (v_TonKho >= p_SoLuongCanBan);
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_SoLuongDangCho` (`p_id_ChiTietSanPham` INT) RETURNS INT(11) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE v_SoLuongCho INT DEFAULT 0;
    
    SELECT COALESCE(SUM(ctdh.SoLuong), 0) 
    INTO v_SoLuongCho 
    FROM chitietdonhang ctdh
    INNER JOIN donhang dh ON ctdh.id_DonHang = dh.id
    WHERE ctdh.id_ChiTietSanPham = p_id_ChiTietSanPham 
    AND dh.TrangThai = 1;
    
    RETURN v_SoLuongCho;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_TinhTonKhoRealTime` (`p_id_ChiTietSanPham` INT) RETURNS INT(11) DETERMINISTIC READS SQL DATA BEGIN
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
(51, 44, 377, 1, 750000.00, 750000.00),
(52, 45, 377, 1, 750000.00, 750000.00);

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
(87, 51, 347, 12, 10.00, 120.00),
(88, 51, 383, 8, 10.00, 80.00),
(89, 52, 347, 12, 100.00, 1200.00),
(90, 52, 383, 8, 100.00, 800.00),
(91, 53, 347, 5, 100.00, 500.00),
(92, 53, 383, 3, 100.00, 300.00),
(93, 54, 327, 12, 1000.00, 12000.00),
(94, 54, 328, 20, 1000.00, 20000.00),
(95, 55, 327, 10, 100.00, 1000.00),
(96, 55, 328, 10, 100.00, 1000.00),
(97, 55, 377, 12, 100.00, 1200.00),
(98, 56, 377, 10, 10.00, 100.00),
(99, 56, 375, 10, 10.00, 100.00),
(100, 56, 327, 10, 20.00, 200.00);

-- --------------------------------------------------------

--
-- Table structure for table `chitietsanpham`
--

CREATE TABLE `chitietsanpham` (
  `id` int(11) NOT NULL,
  `id_SanPham` int(11) DEFAULT NULL,
  `id_KichCo` int(11) DEFAULT NULL,
  `id_MauSac` int(11) DEFAULT NULL,
  `MaSanPham` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chitietsanpham`
--

INSERT INTO `chitietsanpham` (`id`, `id_SanPham`, `id_KichCo`, `id_MauSac`, `MaSanPham`) VALUES
(323, 144, 1, 1, 'NIKE-AM2023-DEN-39'),
(324, 144, 2, 1, 'NIKE-AM2023-DEN-40'),
(325, 145, 1, 1, 'NIKE-AM2023-DEN-39'),
(326, 145, 2, 1, 'NIKE-AM2023-DEN-40'),
(327, 146, 7, 4, 'JORDAN1-BLUE-42'),
(328, 146, 8, 1, 'JORDAN1-BLACK-43'),
(329, 147, 1, 1, 'NIKE-AM2023-DEN-39'),
(330, 147, 2, 1, 'NIKE-AM2023-DEN-40'),
(331, 148, 4, 5, 'PUMA-RSX-GREEN-41'),
(332, 149, 5, 3, 'CONVERSE-RED-39'),
(333, 149, 6, 3, 'CONVERSE-RED-40'),
(336, 150, 1, 1, 'NIKE-AM2023-DEN-39'),
(337, 150, 2, 1, 'NIKE-AM2023-DEN-40'),
(340, 152, 1, 1, 'NIKE-AM2023-DEN-39'),
(341, 152, 2, 1, 'NIKE-AM2023-DEN-40'),
(347, 153, 2, 1, 'MD-A'),
(358, 156, 2, 3, 'ND1'),
(366, 151, 10, 11, 'DM'),
(368, 157, 5, 10, '123'),
(371, 154, 2, 1, 'NIKE-AM2023-DEN-40'),
(373, 144, 1, 1, 'SP001-01-01'),
(374, 144, 2, 2, 'NIKE-TRANG-37-AUTO'),
(375, 145, 3, 3, 'BITIS-DO-38-AUTO'),
(376, 145, 4, 5, 'BITIS-DO-38-UTO'),
(377, 145, 11, 8, 'REEBOK-CAM-35-1231'),
(378, 145, 8, 5, 'REEBOK-XANHLÁ-43-2119'),
(379, 145, 8, 3, 'REEBOK-ĐỎ-43-0466'),
(381, 150, 10, 12, 'ADIDAS-XANHNAVY-45-1959'),
(383, 153, 9, 13, 'ADIDAS-XANHLÁCÂY-44-6807'),
(384, 148, 7, 4, 'CONVERSE-XANHDƯƠNG-42-8546'),
(385, 155, 7, 11, 'D'),
(386, 155, 7, 7, 'NIKE-VÀNG-42-7820'),
(387, 155, 8, 11, 'NIKE-ĐEN-43-5890'),
(393, 158, 5, 13, 'ND1'),
(396, 159, 9, 13, 'NAAAAA');

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
(1, 'Giày Thể Thao Cao Cấp', NULL, NULL, 1),
(2, 'Giày Nữ', NULL, 'Các loại giày dành cho nữ', 1),
(3, 'Giày Thể Thao', NULL, 'Giày thể thao đsdasda năng', 1),
(4, 'Giày Chạy Bộ', 3, 'Giày chuyên dụng cho chạy bộ', 1),
(6, 'Giày Bóng Rổa', 3, 'Giày chuyên dụng cho bóng rổ', 1),
(7, 'Giày Lifestyle', NULL, 'Giày thời trang hàng ngày', 1),
(41, 'Giày cổ cao', NULL, NULL, 1),
(43, 'Giày trẻ em ', NULL, NULL, 1);

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
(44, 'DH250704-44', NULL, 'Kce-RdwECqCA2kmDLtp7iHSmYfWO6K2z', 'chun chunadđghjkg', '0798355784', 'nhà bè than yêuuuuuu, Xã Trần Hưng Đạo, Huyện Lý Nhân, Hà Nam', 750000.00, 50000.00, 0.00, 75000050000.00, NULL, '15', 3, 4, 4, 0, NULL, '2025-07-04 23:14:13', '2025-07-05 00:11:40', 'thanhtrung3010xsw@gmail.com', NULL),
(45, 'DH250704-45', 50, NULL, 'chun chunadđghjkg', '0798355784', 'nhà bè than yêuuuuuu, Xã Uy Nỗ, Huyện Đông Anh, Hà Nội', 750000.00, 50000.00, 0.00, 75000050000.00, NULL, 'd', 3, 4, 3, 0, NULL, '2025-07-04 23:17:35', '2025-07-05 00:12:05', 'thanhtrung3010xsw@gmail.com', 'Khách hàng yêu cầu hủy đơn hàng');

--
-- Triggers `donhang`
--
DELIMITER $$
CREATE TRIGGER `tr_CapNhatSoLuongDaBan_v2` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_QuanLyDonHang` AFTER UPDATE ON `donhang` FOR EACH ROW BEGIN
    -- Cập nhật số lượng đã bán khi đơn hàng hoàn thành
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
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_XoaGioHang_v2` AFTER INSERT ON `donhang` FOR EACH ROW BEGIN
    IF NEW.id_NguoiMua IS NOT NULL THEN
        DELETE FROM giohang WHERE id_NguoiDung = NEW.id_NguoiMua;
    END IF;
    
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

--
-- Dumping data for table `giohang`
--

INSERT INTO `giohang` (`id`, `id_NguoiDung`, `session_id`, `id_ChiTietSanPham`, `SoLuong`, `NgayThem`) VALUES
(48, NULL, 'b986eb34-54bf-4190-b8e9-e612effa6772', 325, 1, '2025-06-18 12:00:51'),
(49, NULL, 'b986eb34-54bf-4190-b8e9-e612effa6772', 331, 1, '2025-06-18 12:11:16'),
(50, NULL, '9xT6daejh9eBqw5_Lnor6YnGHlkHIWQP', 323, 1, '2025-06-25 20:12:23'),
(51, NULL, 'MOjcIXZ4ECFTmZuJQVgD-_pkZrwfrW7s', 323, 1, '2025-06-25 20:13:51'),
(52, NULL, 'mrINObZm5GE9FiNou3NZjvEUSYdJb2-y', 325, 1, '2025-06-25 20:31:39'),
(53, NULL, 'mrINObZm5GE9FiNou3NZjvEUSYdJb2-y', 329, 1, '2025-06-25 20:33:51'),
(54, NULL, 'InG4CtniEueijAYtmktGVqH5gYjbefTK', 325, 1, '2025-06-25 20:50:51'),
(55, NULL, 'InG4CtniEueijAYtmktGVqH5gYjbefTK', 327, 1, '2025-06-25 20:50:55'),
(56, NULL, 'i2enmUfyoNeOFfmJlFd0iG4iCoWrY6EY', 325, 1, '2025-06-25 21:00:04'),
(57, NULL, 'i2enmUfyoNeOFfmJlFd0iG4iCoWrY6EY', 327, 1, '2025-06-25 21:00:06'),
(58, NULL, 'i2enmUfyoNeOFfmJlFd0iG4iCoWrY6EY', 323, 1, '2025-06-25 21:00:09'),
(59, NULL, 'hYCpqj2mAs6jSbdfnxzsdJJjhEPQb_Ul', 323, 1, '2025-06-25 21:03:25'),
(60, NULL, 'hYCpqj2mAs6jSbdfnxzsdJJjhEPQb_Ul', 325, 1, '2025-06-25 21:03:26'),
(61, NULL, 'srug4hXjhKGakEDRBPeAjMwYkl8vXRvq', 331, 3, '2025-06-25 21:08:08'),
(63, NULL, '_I9_no-ESxLh1SPXmjpBJO1frV2QXxoU', 329, 3, '2025-06-25 21:28:43'),
(64, NULL, 'RBBEuRGs3KA2LfKqvbmS-fsjD8XG0rS7', 325, 1, '2025-06-26 06:11:16'),
(65, NULL, '5C_Az8dXk_0BYV6QwtfO3TvqtHzjanvA', 327, 1, '2025-06-26 06:50:33'),
(66, NULL, 'k7T6UjhF_fM9gO42YQkER7A06cF-nCZC', 331, 1, '2025-06-26 07:02:30'),
(67, NULL, 'k7T6UjhF_fM9gO42YQkER7A06cF-nCZC', 325, 1, '2025-06-26 07:03:49'),
(69, NULL, 'iix0BNYIsE0W3_f60TNOzjX473oU4lTF', 325, 1, '2025-06-26 07:13:37'),
(70, NULL, 'eKA_SEfx7B0ViueU-pNZ_NuUuNTPvCIi', 325, 1, '2025-06-26 07:17:54'),
(72, NULL, 'K2sKb-eSQqqyUKtL19Wtc--MSA0QPTRK', 325, 1, '2025-06-26 07:24:49'),
(73, NULL, 'H5M0h0OK9VlvidMIBT0BYbzfydj2Uv23', 325, 1, '2025-06-26 07:29:33'),
(74, NULL, 'PDstvu8R_hTj5ZdrmfzdHoeyGAvfDpAI', 327, 1, '2025-06-26 07:47:58'),
(75, NULL, 'xUtwWasR8gKr7GVGiRqnYzWN8MvZIgqb', 329, 1, '2025-06-26 07:54:12'),
(76, NULL, 'xUtwWasR8gKr7GVGiRqnYzWN8MvZIgqb', 330, 1, '2025-06-26 07:54:15'),
(77, NULL, 'cJbUakt2EhAlhoMUUAl26bqOlccx8PZT', 325, 1, '2025-06-26 08:07:19'),
(78, NULL, 'DFNCeEJxyswYvwDVsDGvzo5dOilESvDL', 325, 1, '2025-06-26 08:19:12'),
(79, NULL, 'ILXs2xTYY_rHiuPE_bTF0sCMhG072Jw9', 325, 1, '2025-06-26 08:21:39'),
(80, NULL, 'At83Ew6O1e9UqNxso0VDMc9pE2bVieBw', 325, 1, '2025-06-26 08:28:48'),
(81, NULL, 'X4V-kW3W16x6LZGtqiJOYkTFZL-YK32Q', 325, 1, '2025-06-26 08:34:01'),
(82, NULL, '4ts49KbntWX1Alx7aaDq87pQOViSmJjI', 325, 1, '2025-06-26 08:41:45'),
(92, NULL, 'JfUB59jHZNzgZaq8ykGj5vifKKZ7oK0z', 323, 1, '2025-06-26 17:07:44'),
(96, NULL, 'V0wYLvUdQiOFPNkuKMzI38niyUU8b7C3', 331, 1, '2025-06-26 22:02:34'),
(100, NULL, 'Y6MGLtAp5g3cCXyHhTFrx8FOgumEZD3q', 323, 1, '2025-06-26 23:48:16'),
(112, NULL, 'TxlZTK1bnaH7JHE_Sy02LvA-BreDRWv9', 323, 1, '2025-06-27 21:46:29'),
(114, NULL, 'AUpbPjS2V7znGL7elagqlITd1Zseytu4', 327, 1, '2025-06-27 22:14:54'),
(115, NULL, 'AXqjh_Ac62P7DcRdmPakTT9dxQqySsxS', 327, 1, '2025-06-27 22:20:37'),
(117, NULL, '9yDZKp7gBzoIYBSFqsBTyD525mVkew4F', 323, 1, '2025-06-27 22:24:29'),
(119, 56, 'cGWq0BAkdPsfV04b3cRh6eFXeJ5WjII_', 329, 1, '2025-06-27 22:29:55'),
(122, 57, '1seFeBnPnlMCwAP0qkmGYKn-FW2lpgqY', 323, 10, '2025-06-29 00:03:41'),
(123, 57, '1seFeBnPnlMCwAP0qkmGYKn-FW2lpgqY', 331, 1, '2025-06-29 00:03:48'),
(128, NULL, '97MxjddnVJSOwWiZTuGDgd2MvfVAQgGl', 325, 1, '2025-06-30 15:21:58'),
(133, NULL, 'OTynP7YTcJZzUTZp1ziL5ox_2o2V8awS', 328, 1, '2025-07-02 21:54:12'),
(135, NULL, 'cChz53Wa3tfGxEOS14K_HfHpByBu5lqi', 381, 8, '2025-07-02 22:05:29');

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
(1, 'Tiền mặt mặt ', 'Thanh toán khi nhận hàng', 1),
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
(1, 'Giao hàng tiêu chuẩn f', 'Giao hàng trong 2-3 ngàym', 30000.00, '2-3 ngày', 1),
(4, 'Giao hàng miễn phí df', 'Miễn phí giao hàng cho đơn hàng trên 1.000.000đm', 50000.00, '1', 1);

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
(11, '35'),
(1, '36'),
(2, '37'),
(3, '38'),
(4, '39'),
(5, '40'),
(6, '41'),
(7, '42'),
(8, '43'),
(9, '44'),
(10, '45');

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
('SUMMER20', 'Hè rực rỡ', 'Giảm 20% cho đơn hàng mùa hè', 20, 200000.00, '2025-06-20 00:00:00', '2025-07-30 00:00:00', 500, 5, 1000000.00, 1),
('VOUCHER1750230287385', 'Giảm giá mùa hè', 'Voucher giảm giá 20% cho mùa hè', 10, 200000.00, '2025-06-21 00:00:00', '2025-06-28 00:00:00', 99, 0, 500000.00, 1),
('VOUCHER1750230321633', 'Giảm giá mùa hè', 'Voucher giảm giá 5% cho mùa hè', 5, 200000.00, '2025-06-17 00:00:00', '2025-08-30 00:00:00', 100, 1, 500000.00, 1),
('VOUCHER1750230411262', 'Giảm giá mùa hè', 'Voucher giảm giá 20% cho mùa hè', 20, 200000.00, '2025-06-18 00:00:00', '2025-08-31 00:00:00', 100, 0, 500000.00, 1),
('VOUCHER1750454532500', 'Giảm giá mùa hè', 'Voucher giảm giá 20% cho mùa hè', 20, 200000.00, '2025-06-18 00:00:00', '2025-08-31 00:00:00', 100, 0, 500000.00, 1),
('VOUCHER1750454772357', 'Giảm giá mùa hè', 'Voucher giảm giá 20% cho mùa hè', 20, 200000.00, '2025-06-18 00:00:00', '2025-08-31 00:00:00', 100, 0, 500000.00, 1),
('VOUCHER1750471932175', 'haa', 'chun', 22, 10000.00, '2022-12-12 00:00:00', '2023-01-12 00:00:00', 12, 0, 50000.00, 1),
('VOUCHER1750472008435', 'hade', 'ga', 12, 20000.00, '2025-06-12 00:00:00', '2025-06-24 00:00:00', 12, 0, 300000.00, 1),
('WELCOME10', 'Giảm giá mùa hè cập nhật', 'Voucher giảm giá 25% cho mùa hè', 25, 250000.00, '2025-06-18 00:00:00', '2025-09-30 00:00:00', 150, 1, 600000.00, 1);

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
(13, 'Xanh Lá Cây', '#228B22');

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
(50, 'chun chunadđghjkg', 'nhà bè than yêuuuuuu', '0798355784', 'thanhtrung3010xsw@gmail.com', NULL, '$2a$10$xYW/6q6qcqeoSWJ3xKV6Hu1o3.nfKF.wNoB3ZsnQ8xtiYGirWHJoO', 1, '2025-06-11 01:14:34'),
(51, 'Lâm', 'hai con thang lan con', '0798355785', 'thanhtrung301zaq@gmail.com', NULL, '$2a$10$5nWDhixdN4W1SPBYw7kZHOiglp6.wde0iQ1L8mDNwz.CbTSyPGbrC', 1, '2025-06-26 16:52:19'),
(52, 'Lâm', 'hai con thang lan con', '0798355785', 'thanhtrung301zddddaq@gmail.com', NULL, '$2a$10$C5t533pXy0olcjyFOa.MTulH7s5z07MAW4VnQwL5j0ZQ1Mt5XcH3O', 1, '2025-06-26 16:55:06'),
(53, 'Lâm', 'hai con thang lan con', '0798355785', 'trungpro2811ddd@gmail.com', NULL, '$2a$10$S6AVT47ukIbDwQgy1DBENePCrm5n1gtSLPtUmYFZlsnqIW6x3qKKC', 1, '2025-06-26 16:55:50'),
(54, 'Lâm', 'hai con thang lan con', '0798355785', 'trungpro2811dddddd@gmail.com', NULL, '$2a$10$fafsIrDE6QOZchoGmY34futriclGbaevSZOwJH6ytVcD.OwCUQHxq', 1, '2025-06-26 16:56:41'),
(55, 'Lâm', 'hai con thang lan con', '0798355785', 'trungdddpro2811dddddd@gmail.com', NULL, '$2a$10$gGFSQK9o1lL/wcKZapHDCeDUx2M6HGAOIumqbNv4EYzGniTYFx6hW', 1, '2025-06-26 16:59:10'),
(56, 'Lâm trrung', 'hai con thang lan con hai', '0798355784', 'trungdddpro2811dddddd@gmail.comd', NULL, '$2a$10$0C/BayVveegi74c1cBYgke.yYxOMjOtDwVX0wABzTY2kkZAHFlJhi', 1, '2025-06-26 17:01:01'),
(57, 'THÁI TUẤN', 'nhà bè than yêu', '0798355785', 'tuanxinhzai2906@gmail.com', NULL, '$2a$10$Q/SckBArF1Aqg9jdT4Vz4.2im/yzc2GA2ODuMM4qr4gVff/wjDdh.', 1, '2025-06-28 23:44:22');

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
(1, 'Nike Việt Nam ', 'contact.updated@nike.vn', '0798355785', 'Quận 1, TP.HCM - Updatedd', 1),
(2, 'Adidas Việt Nam', 'contact@adidas.vn', '02887654321', 'Quận 2, TP.HCM', 1),
(3, 'Puma Việt Nam', 'contact@puma.vn', '02898765432', 'Quận 3, TP.HCM', 1),
(4, 'New Balance Việt Nam', 'contact@newbalance.vn', '02834567890', 'Quận 4, TP.HCM', 1),
(5, 'Converse Việt Nam', 'contact@converse.vn', '02845678901', 'Quận 5, TP.HCM', 1),
(6, 'Vans Việt Nam', 'contact@vans.vn', '02856789012', 'Quận 6, TP.HCM', 1),
(36, 'Nhà cung cấp Test', 'test@supplier.com', '0901234567', '123 Test Street, TP.HCM', 1),
(44, 'Giày Thể Thao Cao Cấp', 'thanhtrung3010xsw@gmail.com', '0798355781', 'nguyen van tao', 1);

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
(51, 'PN-250704-001', 4, 1, 200.00, 'ádfg', '2025-07-04 10:02:22', 2),
(52, 'PN-250704-002', 4, 1, 2000.00, 's', '2025-07-04 10:05:06', 2),
(53, 'PN-250704-003', 5, 1, 800.00, 'sss', '2025-07-04 10:12:05', 2),
(54, 'PN-250704-004', 3, 1, 32000.00, '12', '2025-07-04 10:56:21', 2),
(55, 'PN-250704-005', 4, 1, 3200.00, '12', '2025-07-04 11:07:43', 2),
(56, 'PN-250704-006', 5, 1, 400.00, '1234', '2025-07-04 17:51:09', 2);

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
(30, 3, 50),
(31, 3, 51),
(32, 3, 52),
(33, 3, 53),
(34, 3, 54),
(35, 3, 55),
(36, 3, 56),
(37, 3, 57);

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
(144, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 5, 1, 2, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078220/shoes_shop/products/sxggiyyyzozm7akoozi5.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/sxggiyyyzozm7akoozi5\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078225/shoes_shop/products/lzge6vpas622oeiuxa9h.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750078228/shoes_shop/products/cnewmljkxcqttaqmivod.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/lzge6vpas622oeiuxa9h\",\"shoes_shop/products/cnewmljkxcqttaqmivod\"]}', 0, '2025-06-16 19:50:31', '2025-06-30 10:19:08'),
(145, 'Giày Bitis Hunter X', 'Giày thể thao quốc dân Việt Nam', '\"Bitis Hunter X với giá hợp lý, thiết kế trẻ trung, phù hợp học sinh, sinh viên...\"', '{\"ChatLieu\":\"Vải lưới, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Việt Nam\"}', 800000.00, 750000.00, 11, 3, 7, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750080727/shoes_shop/products/gdepwxbpyqa2mqv5pqrp.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/gdepwxbpyqa2mqv5pqrp\"}', 1, '2025-06-16 20:32:09', '2025-07-05 00:11:40'),
(146, 'Giày Nike Jordan 1 Retro', 'Nike Jordan 1 Retro kết hợp thiết kế cổ điển và chất liệu cao cấp, tạo nên dấu ấn riêng...', '\n      \"ChatLieu\": \"Da thật, cao su\",\n      \"KieuGiay\": \"Bóng rổ\",\n      \"XuatXu\": \"Chính hãng\"\n    ', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 3900000.00, 3800000.00, 1, 6, 2, 2, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750080727/shoes_shop/products/gdepwxbpyqa2mqv5pqrp.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/gdepwxbpyqa2mqv5pqrp\"}', 1, '2025-06-16 20:44:41', '2025-07-03 18:57:10'),
(147, 'Giày New Balance 574', 'Thương hiệu chạy bộ biểu tượng', 'New Balance 574 nổi bật với thiết kế retro và phần đệm EVA êm ái...', '{\"ChatLieu\":\"Vải mesh, da lộn\",\"KieuGiay\":\"Chạy bộ\",\"XuatXu\":\"Chính hãng\"}', 2300000.00, 2100000.00, 0, 4, 6, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750081624/shoes_shop/products/r5octfh1ltmhn71p9xya.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/r5octfh1ltmhn71p9xya\"}', 1, '2025-06-16 20:47:05', '2025-06-21 11:19:02'),
(148, 'Giày Thể Thao Puma RS-X', 'Phong cách chunky thời thượng', 'Puma RS-X có thiết kế hầm hố và đầy cá tính, phù hợp với người yêu phong cách hiện đại', '{\"ChatLieu\":\"Vải, da PU\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2900000.00, 2600000.00, 4, 3, 5, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750081966/shoes_shop/products/mk3wowzajsrbdomcumgk.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/mk3wowzajsrbdomcumgk\"}', 1, '2025-06-16 20:52:48', '2025-06-27 17:29:56'),
(149, 'Giày Converse Chuck Taylor All Star', 'Giày thời trang cổ điển', 'Converse Chuck Taylor là mẫu giày được ưa chuộng bởi phong cách tối giản và đa năng...', '{\"ChatLieu\":\"Canvas, cao su\",\"KieuGiay\":\"Lifestyle\",\"XuatXu\":\"Chính hãng\"}', 1700000.00, 1500000.00, 0, 2, 3, 3, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750381315/shoes_shop/products/upoj3ohzdhchtpu95twm.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/upoj3ohzdhchtpu95twm\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750381317/shoes_shop/products/rjlczmz5qwsuokuaglx7.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750381322/shoes_shop/products/czkbmnjxukja3gkjqwtd.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/rjlczmz5qwsuokuaglx7\",\"shoes_shop/products/czkbmnjxukja3gkjqwtd\"]}', 1, '2025-06-19 12:18:18', '2025-06-21 12:41:44'),
(150, 'Giày Thể Thao Nike Air Max 202ddđ', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 0, 41, 2, 6, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750480208/shoes_shop/products/xtkyfeulgaryni75eghl.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/xtkyfeulgaryni75eghl\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750310433/shoes_shop/products/cmycupeutt1uniavgsnh.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750310437/shoes_shop/products/uhc1tujth380zc307drx.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/cmycupeutt1uniavgsnh\",\"shoes_shop/products/uhc1tujth380zc307drx\"]}', 1, '2025-06-19 12:19:35', '2025-06-21 11:30:11'),
(151, 'Giày Converse Chuck Taylor All Star', 'Giày thời trang cổ điển', 'Converse Chuck Taylor là mẫu giày được ưa chuộng bởi phong cách tối giản và đa năng...', '{\"ChatLieu\":\"Canvas, cao su\",\"KieuGiay\":\"Lifestyle\",\"XuatXu\":\"Chính hãng\"}', 1700000.00, 1500000.00, 0, 7, 3, 3, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750487109/shoes_shop/products/yk9i6hzqfqodnfan44dk.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/yk9i6hzqfqodnfan44dk\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750487112/shoes_shop/products/gmhk935nt6lsykm0a8kh.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750487115/shoes_shop/products/v1wj7e3sfxkpgcb0el5a.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750487115/shoes_shop/products/vgnz770gp587yzbxsiwu.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/gmhk935nt6lsykm0a8kh\",\"shoes_shop/products/v1wj7e3sfxkpgcb0el5a\",\"shoes_shop/products/vgnz770gp587yzbxsiwu\"]}', 1, '2025-06-21 11:37:39', '2025-06-28 18:14:29'),
(152, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 0, 1, 2, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750480772/shoes_shop/products/af2vwp8zvpylim39jgjs.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/af2vwp8zvpylim39jgjs\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750480777/shoes_shop/products/jd6k2514pm3vcco2japy.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750480780/shoes_shop/products/csva7vvugpbcllr6jgsl.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/jd6k2514pm3vcco2japy\",\"shoes_shop/products/csva7vvugpbcllr6jgsl\"]}', 0, '2025-06-21 11:39:44', '2025-06-30 10:20:01'),
(153, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 0, 1, 2, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750483115/shoes_shop/products/chqziedh5e7ykqrhgyhe.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/chqziedh5e7ykqrhgyhe\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750483119/shoes_shop/products/t3pjnhuylcctyk8ludfy.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750483122/shoes_shop/products/alqcn0dwaqajqntamh9m.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/t3pjnhuylcctyk8ludfy\",\"shoes_shop/products/alqcn0dwaqajqntamh9m\"]}', 1, '2025-06-21 12:18:46', '2025-06-21 13:23:18'),
(154, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 0, 7, 53, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751251198/shoes_shop/products/sznaiepr6bzgpxeyx8tw.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/sznaiepr6bzgpxeyx8tw\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751251201/shoes_shop/products/alhqa74rqtxr0bprkbkq.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751251204/shoes_shop/products/rqcx94eikn03zdj3oznp.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/alhqa74rqtxr0bprkbkq\",\"shoes_shop/products/rqcx94eikn03zdj3oznp\"]}', 1, '2025-06-21 13:10:08', '2025-06-30 09:40:30'),
(155, 'Giày Thể Thao Nike Air Max 2023', 'Giày thể thao cao cấp với công nghệ đệm khí', 'Giày thể thao Nike Air Max 2023 được thiết kế với công nghệ đệm khí tiên tiến, mang lại cảm giác thoải mái và hỗ trợ tốt cho chân khi vận động. Phần upper làm từ vải mesh thoáng khí giúp giảm thiểu mồ hôi và mùi hôi.', '{\"ChatLieu\":\"Vải mesh, cao su\",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"Chính hãng\"}', 2500000.00, 2200000.00, 115, 1, 53, 1, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488275/shoes_shop/products/avprg3oqnvehmow0t5k9.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/avprg3oqnvehmow0t5k9\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751622873/shoes_shop/products/z89bxkhiuqkjwgh4ov8d.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/z89bxkhiuqkjwgh4ov8d\"]}', 1, '2025-06-21 13:28:43', '2025-07-04 16:54:35'),
(156, 'd', 'thanh trung', 'dddddddddddddddddddddddddd', '{\"ChatLieu\":\"da \",\"KieuGiay\":\"Thể thao\",\"XuatXu\":\"d\"}', 200000.00, 190000.00, 0, 43, 53, 2, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488464/shoes_shop/products/t4fiba9mlh90ta25l3jh.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/t4fiba9mlh90ta25l3jh\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488467/shoes_shop/products/uygxsa0zdj1wzs1tubuy.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488469/shoes_shop/products/lk1vbgd3omrvlub1utiu.jpg\",\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488470/shoes_shop/products/lf1uelxwatpmzq36bdk4.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/uygxsa0zdj1wzs1tubuy\",\"shoes_shop/products/lk1vbgd3omrvlub1utiu\",\"shoes_shop/products/lf1uelxwatpmzq36bdk4\"]}', 1, '2025-06-21 13:47:53', '2025-06-22 14:41:52'),
(157, 'VOW', 'WOEHHHHHHHHHHHHHHHHHHHHHHHH', 'SDFSFMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMcvvvDDSDFSFMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMcvvvDD', '{\"ChatLieu\":\"DA\",\"KieuGiay\":\"THEO THAO \",\"XuatXu\":\"NHAT \"}', 120000.00, 129999.00, 0, 3, 15, 36, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751102849/shoes_shop/products/ck6o06lfctstbi7aloi9.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/ck6o06lfctstbi7aloi9\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751102855/shoes_shop/products/gbspyhx2xt229fqbb8en.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/gbspyhx2xt229fqbb8en\"]}', 0, '2025-06-21 16:52:12', '2025-06-30 13:10:21'),
(158, 'trung', 'trung ssssssssssssssssssssssssss sss', 'trung  sss  ss s s s s s s s s s', '{\"ChatLieu\":\"da\",\"KieuGiay\":\"da\",\"XuatXu\":\"da\"}', 1200.00, 999.00, 0, 7, 53, 2, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751627384/shoes_shop/products/toleso7we75c9i3k1eqd.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/toleso7we75c9i3k1eqd\",\"anhPhu\":[\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751627388/shoes_shop/products/rfvhlflf3m4nph31lsb1.jpg\"],\"anhPhu_public_ids\":[\"shoes_shop/products/rfvhlflf3m4nph31lsb1\"]}', 1, '2025-07-04 18:09:51', '2025-07-04 18:20:41'),
(159, 'chun', 'chungnngng', 'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn', '{\"ChatLieu\":\"da\",\"KieuGiay\":\"da\",\"XuatXu\":\"da\"}', 10000.00, 9005.00, 0, 41, 15, 2, '{\"anhChinh\":\"https://res.cloudinary.com/db7jn3ooa/image/upload/v1751628149/shoes_shop/products/ztqhehoexvmaczbcwczk.jpg\",\"anhChinh_public_id\":\"shoes_shop/products/ztqhehoexvmaczbcwczk\"}', 1, '2025-07-04 18:22:32', '2025-07-04 18:23:43');

-- --------------------------------------------------------

--
-- Table structure for table `thuonghieu`
--

CREATE TABLE `thuonghieu` (
  `id` int(11) NOT NULL,
  `Ten` varchar(100) DEFAULT NULL,
  `MoTa` text DEFAULT NULL,
  `TrangThai` int(11) DEFAULT 1,
  `Website` varchar(255) DEFAULT NULL,
  `Logo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `thuonghieu`
--

INSERT INTO `thuonghieu` (`id`, `Ten`, `MoTa`, `TrangThai`, `Website`, `Logo`) VALUES
(2, 'Adidas', 'Adidas là một thương hiệu thể thao toàn cầu đến từ Đức, nổi tiếng với sự đổi mới và phong cách.', 1, 'https://example-updated.com', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751253201/brands/qymbamh42iq0ub9eoavq.jpg'),
(3, 'Puma', 'Thương hiệu thể thao đẳng cấp', 1, 'https://vn.puma.com/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751249136/brands/gx4pokrzqig8j5tgz6yz.png'),
(5, 'Converse', 'Thương hiệu giày canvas cổ điển', 1, 'https://www.converse.vn/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751250007/brands/vomv8s9vzcqtyz2ksfwz.jpg'),
(6, 'Vans', 'Thương hiệu giày skateboard và lifestyle', 1, 'https://vansvietnam.com.vn/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751249948/brands/niopmqsqw5bymagaow7d.jpg'),
(7, 'Reebok', 'Thương hiệu thể thao và fitness', 1, 'https://www.reebok.com/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751249903/brands/hxmgi8ubujzun97jf9iq.jpg'),
(15, 'ASICS', 'Thương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật BảnThương hiệu giày chạy bộ Nhật Bản', 1, 'https://www.asics.com/vn/en-vn/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751249531/brands/irofzkxtdsfr7hcdi6fo.jpg'),
(53, 'Nike', 'Thương hiệu giày thể thao hàng đầu', 1, 'https://about.nike.com/en/', 'https://res.cloudinary.com/db7jn3ooa/image/upload/v1751249361/brands/s6ievtlkq2rlbxc45kx7.jpg');

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
(17, 49, '', '2025-06-08 23:06:55', '2025-06-15 23:06:55', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2YerSWQiOjQ5LCJpYXQiOjE3NDkzOTg4MTUsImV4cCI6MTc1MDAwMzYxNX0.XBte2_DJz2-ZqP01OAch90sCCe4S2U7hIxit0uN-U4A'),
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
(65, 9, '', '2025-06-12 20:14:27', '2025-06-19 20:14:27', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0OTczNDA2NywiZXhwIjoxNzUwMzM4ODY3fQ.zRF02KAFL0GlGW-ST1LdXt5jkMbfue3x1FSNwNl3GMI'),
(72, 50, '', '2025-06-18 12:24:34', '2025-06-25 12:24:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTAyMjQyNzQsImV4cCI6MTc1MDgyOTA3NH0.-2AkkYL0X_hHyQN5IrCmsEvO2T7W2koxj_RiVGpyMPk'),
(73, 50, '', '2025-06-26 16:45:16', '2025-07-03 16:45:16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5MzExMTYsImV4cCI6MTc1MTUzNTkxNn0.VFgvNpeACz5Rb28YBcf1YoiITZq_IAgGbmnV2Z_jUmc'),
(74, 50, '', '2025-06-26 16:45:56', '2025-07-03 16:45:56', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5MzExNTYsImV4cCI6MTc1MTUzNTk1Nn0.0ie70wx6Lg_mbgyoDj0We5HGcwyk1Ik3B2jG6UXF1yM'),
(75, 50, '', '2025-06-26 16:47:39', '2025-07-03 16:47:39', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5MzEyNTksImV4cCI6MTc1MTUzNjA1OX0.-936QjZMHZlGvu9zorZgjxfZIJRewf6uC0zWQicnj3M'),
(76, 50, '', '2025-06-26 16:49:56', '2025-07-03 16:49:56', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5MzEzOTYsImV4cCI6MTc1MTUzNjE5Nn0.bvcmfHEBQ0qh1V_GqdxvGsM6PNyIH3j32H365mtepzQ'),
(77, 55, '', '2025-06-26 17:00:01', '2025-07-03 17:00:01', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU1LCJpYXQiOjE3NTA5MzIwMDEsImV4cCI6MTc1MTUzNjgwMX0.MRzwdJft5O8KISCps4rxqeojTGW-lRtfLZU6U4dZZnc'),
(78, 56, '', '2025-06-26 17:04:31', '2025-07-03 17:04:31', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTA5MzIyNzEsImV4cCI6MTc1MTUzNzA3MX0.uWUZlpprtYJGltURsn_LVMJWPWQxdsKuxkWjBYOUp80'),
(79, 50, '', '2025-06-26 17:05:24', '2025-07-03 17:05:24', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5MzIzMjQsImV4cCI6MTc1MTUzNzEyNH0.iLn8_3Wy8WTpzs6flHAOjc-imGcp-hPoe8tdU2o9XaE'),
(80, 54, '', '2025-06-26 17:29:36', '2025-07-03 17:29:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU0LCJpYXQiOjE3NTA5MzM3NzYsImV4cCI6MTc1MTUzODU3Nn0.CrWedbRWSCA5Wn6iBadY6v_0k3tm7cZ52JcOrSor-u8'),
(81, 54, '', '2025-06-26 17:37:08', '2025-07-03 17:37:08', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU0LCJpYXQiOjE3NTA5MzQyMjgsImV4cCI6MTc1MTUzOTAyOH0.mFKbETd6bjFsvIMJI7KlnQgImoL2PfVU2oTfjDQZoUk'),
(82, 50, '', '2025-06-26 20:41:24', '2025-07-03 20:41:24', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NDUyODQsImV4cCI6MTc1MTU1MDA4NH0.3Dhk5CajexazNZLkpCOB49NlFUnh2vdnpp_0141Xzdg'),
(83, 50, '', '2025-06-26 21:45:18', '2025-07-03 21:45:18', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NDkxMTgsImV4cCI6MTc1MTU1MzkxOH0.oNqR-qaJdPqNjg40id91figoQA-AyXVWkM1gpUtZc8k'),
(84, 50, '', '2025-06-26 22:01:23', '2025-07-03 22:01:23', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NTAwODMsImV4cCI6MTc1MTU1NDg4M30.258W6gXKRemjImIEiH59VumCca7BYgo41jmGmX6wgKE'),
(85, 50, '', '2025-06-26 22:28:03', '2025-07-03 22:28:03', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NTE2ODMsImV4cCI6MTc1MTU1NjQ4M30.vj9ts4RcK7dJ3NgPXPYcVUf71cN8oJt48eNf0wdoTtE'),
(86, 56, '', '2025-06-26 22:45:48', '2025-07-03 22:45:48', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTA5NTI3NDgsImV4cCI6MTc1MTU1NzU0OH0.9C7b7w7b3lW19W4IycAIhnpLhaADin-NF561wmLJOtE'),
(87, 50, '', '2025-06-26 22:46:12', '2025-07-03 22:46:12', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NTI3NzIsImV4cCI6MTc1MTU1NzU3Mn0.zmlVexoOLu3NVMcl1X62Emh6DeBT6KWFwyfNusUJMcY'),
(88, 56, '', '2025-06-26 23:28:09', '2025-07-03 23:28:09', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTA5NTUyODksImV4cCI6MTc1MTU2MDA4OX0.4Nc_JO6Qq-SZTV16vf8kWJAQrYuhRqIZARiNhzSqTAk'),
(89, 50, '', '2025-06-27 00:11:35', '2025-07-04 00:11:35', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTA5NTc4OTUsImV4cCI6MTc1MTU2MjY5NX0.4aIG0VtfjBo064ffaz7EJ301LxbwmnF4SjtQB-sziAs'),
(90, 50, '', '2025-06-27 16:20:36', '2025-07-04 16:20:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMTYwMzYsImV4cCI6MTc1MTYyMDgzNn0.AhpCAAnSRH8od4LjWh4SqHmU3efme_N-ziITTpPqK_0'),
(91, 50, '', '2025-06-27 17:24:23', '2025-07-04 17:24:23', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMTk4NjMsImV4cCI6MTc1MTYyNDY2M30.52utW-QsDOEz3p2YspzMHMtPCy-cuHKb8uzmhd0Eax8'),
(92, 50, '', '2025-06-27 17:44:18', '2025-07-04 17:44:18', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMjEwNTgsImV4cCI6MTc1MTYyNTg1OH0.sPra2XoLl-DRXoNyuRgAOCmIEvC0ZVEaVQKTj5BdkyU'),
(93, 50, '', '2025-06-27 21:46:51', '2025-07-04 21:46:51', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMzU2MTEsImV4cCI6MTc1MTY0MDQxMX0.T3GhnAGpak7UuFnSjRv0oqEhC7XyhMtUDgHvMSRNcAA'),
(94, 50, '', '2025-06-27 21:51:10', '2025-07-04 21:51:10', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMzU4NzAsImV4cCI6MTc1MTY0MDY3MH0.j09WhBLHagI-KP-kKxLofoDMK3IRbDaLpRJ6Eo7ahtY'),
(95, 50, '', '2025-06-27 22:21:34', '2025-07-04 22:21:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMzc2OTQsImV4cCI6MTc1MTY0MjQ5NH0.aVQ8-PhdqCQB7COpJ04cjHZ08ivNxKOsNmEE-t15aos'),
(96, 50, '', '2025-06-27 22:23:20', '2025-07-04 22:23:20', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMzc4MDAsImV4cCI6MTc1MTY0MjYwMH0.8JacEkElM5e5XCRVff5wyg0kKO8uFTE_UbzxVKRrRAE'),
(97, 50, '', '2025-06-27 22:25:07', '2025-07-04 22:25:07', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMzc5MDcsImV4cCI6MTc1MTY0MjcwN30.Xj1kx3Zwquh1cZLbV1OTJUjSxOVH-I2tRgNJNgFQuug'),
(98, 56, '', '2025-06-27 22:26:36', '2025-07-04 22:26:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTEwMzc5OTYsImV4cCI6MTc1MTY0Mjc5Nn0.ZKmgNpRjmXtdpVeNGgedkGsNtkWJMv1FL13De8QEgMw'),
(99, 50, '', '2025-06-27 22:52:36', '2025-07-04 22:52:36', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwNzk1NTYsImV4cCI6MTc1MTY0NDM1Nn0.Wejza4CQKZhm92P_Y92pgaLoVejT_p1wPoeKRLgWdTM'),
(100, 56, '', '2025-06-27 23:04:34', '2025-07-04 23:04:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTEwNDAyNzQsImV4cCI6MTc1MTY0NTA3NH0.O19YMZsAgs8__PBvqj7UFrpNDvKHCfV72b04xCbdUHo'),
(101, 50, '', '2025-06-27 23:27:20', '2025-07-04 23:27:20', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwNDE2NDAsImV4cCI6MTc1MTY0NjQ0MH0.pD-yn2ZFga2pMgGYJMVtCg1J5mHJ_GzfWynWPD_noQk'),
(102, 50, '', '2025-06-27 23:29:37', '2025-07-04 23:29:37', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwNDE3NzcsImV4cCI6MTc1MTY0NjU3N30.r6Fyhv3QMHBQxWd8vQA0JCYckr09mGUvQsGDqUlak6w'),
(103, 50, '', '2025-06-27 23:29:51', '2025-07-04 23:29:51', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwNDE3OTEsImV4cCI6MTc1MTY0NjU5MX0.GqYYpFEBy0_exrRTqMOooQZP0xqPUNn8ybtDa3B0X-k'),
(104, 57, '', '2025-06-28 23:44:33', '2025-07-05 23:44:33', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU3LCJpYXQiOjE3NTExMjkwNzMsImV4cCI6MTc1MTczMzg3M30.RxR6Xrra8s4CvTWChhZaqDhjd9LKo_7FgncE9a9ewDc'),
(105, 57, '', '2025-06-29 00:15:47', '2025-07-06 00:15:47', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU3LCJpYXQiOjE3NTExMzA5NDcsImV4cCI6MTc1MTczNTc0N30.jhX-FEat7SzP_6EhdStN5gEl9je8-KXMfX3bgOdNRLM'),
(106, 50, '', '2025-06-29 00:58:40', '2025-07-06 00:58:40', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTExMzM1MjAsImV4cCI6MTc1MTczODMyMH0.4OT_bD51cBre88p8ugpLYXFP6ZRr9PZubFcN6qPeT8k'),
(107, 50, '', '2025-06-29 01:03:07', '2025-07-06 01:03:07', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTExMzM3ODcsImV4cCI6MTc1MTczODU4N30.qy4G07FB1oM1cZLbV1OTJUjSxOVH-I2tRgNJNgFQuug'),
(108, 50, '', '2025-06-29 01:03:20', '2025-07-06 01:03:20', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTExMzM4MDAsImV4cCI6MTc1MTczODYwMH0.2JJeGDcg03_Wrqj5jG550uWCCTiAMujstaAklv26AHQ'),
(109, 50, '', '2025-06-29 01:08:25', '2025-07-06 01:08:25', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMTQxMDUsImV4cCI6MTc1MTczODkwNX0.onEru_X4LdZcE2mnPM7pjj4uxRaVii8_2VEEcCdIhZI'),
(110, 50, '', '2025-06-29 11:18:52', '2025-07-06 11:18:52', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMTYwMzYsImV4cCI6MTc1MTYyMDgzNn0.AhpCAAnSRH8od4LjWh4SqHmU3efme_N-ziITTpPqK_0'),
(111, 50, '', '2025-06-29 11:29:38', '2025-07-06 11:29:38', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwMTk4NjMsImV4cCI6MTc1MTc3NjE3OH0.iAPavctPVCq5ye3wm27WIGzPAY_KcLxbBnoZF_t1j5U'),
(112, 50, '', '2025-06-29 11:41:34', '2025-07-06 11:41:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEwNzA3MzIsImV4cCI6MTc1MTc3Njg5NH0.IqIncc4v-hLcPjpfr0jv7XZ-8g3xvFKaPft7MKwcBmQ'),
(113, 56, '', '2025-06-29 11:48:50', '2025-07-06 11:48:50', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTEwNzI1MzAsImV4cCI6MTc1MTc3NzMzMH0.Vj11Wa2NGcO5W9L0uFdMgrqIc7DPF3uboBVON-BIR9s'),
(114, 56, '', '2025-06-29 12:42:32', '2025-07-06 12:42:32', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjU2LCJpYXQiOjE3NTEwNzU3NTIsImV4cCI6MTc1MTc4MDU1Mn0.SuuXW1NiApRGb17X50Y1XGHGlS9k7fh576CcfS1UzdQ'),
(115, 50, '', '2025-06-30 13:57:45', '2025-07-07 13:57:45', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTEyNjY2NjUsImV4cCI6MTc1MTg3MTQ2NX0.dBg8-WPkBu97eSMavTXuAYj9m-Hv1lygIqMbC9ZqSvg'),
(116, 50, '', '2025-07-02 22:05:59', '2025-07-09 22:05:59', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTE0Njg3NTksImV4cCI6MTc1MjA3MzU1OX0.qJ1wEeoVozN-FyasoKlCwKIw2P5mejwquu3RA41LCb8'),
(117, 50, '', '2025-07-03 20:12:59', '2025-07-10 20:12:59', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTE1NDgzNzksImV4cCI6MTc1MjE1MzE3OX0.GGJYg6ZWMdFwo9UZ6FvVp4KYKkVHYwOsr8z9MIWs3Cs'),
(118, 50, '', '2025-07-04 23:16:39', '2025-07-11 23:16:39', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTE2NDU3OTksImV4cCI6MTc1MjI1MDU5OX0.h6Y1DVS5w-v8BBOKokPF2YAty401p0fL7ZzL_YsAGNM'),
(119, 50, '', '2025-07-04 23:47:34', '2025-07-11 23:47:34', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUwLCJpYXQiOjE3NTE2NDc2NTQsImV4cCI6MTc1MjI1MjQ1NH0.n8_1iSG26JxQKIpVb4JnCIiECmrN0PA2RoGOlArWMUs');

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
,`id_SanPham` int(11)
,`MaSanPham` varchar(50)
,`TenSanPham` varchar(100)
,`ThuongHieu` varchar(100)
,`DanhMuc` varchar(100)
,`KichCo` varchar(10)
,`MauSac` varchar(50)
,`TonKho` int(11)
,`SoLuongDangCho` int(11)
,`Gia` decimal(15,2)
,`GiaKhuyenMai` decimal(15,2)
,`TrangThaiSanPham` int(11)
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

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `id_NguoiDung`, `id_SanPham`, `NgayThem`) VALUES
(1, 8, 146, '2025-06-24 19:50:41'),
(2, NULL, 149, '2025-06-24 20:01:35'),
(3, NULL, 149, '2025-06-24 20:03:41'),
(7, NULL, 146, '2025-06-24 23:04:44'),
(8, NULL, 146, '2025-06-24 23:05:04'),
(9, NULL, 146, '2025-06-24 23:05:14'),
(33, 56, 156, '2025-06-29 13:01:16'),
(37, 56, 145, '2025-06-29 13:25:48'),
(38, 50, 145, '2025-07-05 00:01:18'),
(39, 50, 146, '2025-07-05 00:01:20'),
(40, 50, 148, '2025-07-05 00:01:24');

-- --------------------------------------------------------

--
-- Structure for view `v_thongtinnguoidung`
--
DROP TABLE IF EXISTS `v_thongtinnguoidung`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_thongtinnguoidung`  AS SELECT `nd`.`id` AS `id`, `nd`.`HoTen` AS `HoTen`, `nd`.`Email` AS `Email`, `nd`.`SDT` AS `SDT`, `nd`.`DiaChi` AS `DiaChi`, `nd`.`TrangThai` AS `TrangThai`, `nd`.`NgayTao` AS `NgayTao`, group_concat(distinct `q`.`TenQuyen` separator ',') AS `VaiTro`, count(distinct `dh`.`id`) AS `SoDonHang`, sum(case when `dh`.`TrangThai` = 4 then `dh`.`TongThanhToan` else 0 end) AS `TongChiTieu`, count(distinct `dg`.`id`) AS `SoDanhGia`, count(distinct `w`.`id`) AS `SoWishlist` FROM (((((`nguoidung` `nd` left join `quyenguoidung` `qnd` on(`nd`.`id` = `qnd`.`id_NguoiDung`)) left join `quyen` `q` on(`qnd`.`id_Quyen` = `q`.`id`)) left join `donhang` `dh` on(`nd`.`id` = `dh`.`id_NguoiMua`)) left join `danhgia` `dg` on(`nd`.`id` = `dg`.`id_NguoiDung`)) left join `wishlist` `w` on(`nd`.`id` = `w`.`id_NguoiDung`)) GROUP BY `nd`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `v_tonkho_sanpham`
--
DROP TABLE IF EXISTS `v_tonkho_sanpham`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_tonkho_sanpham`  AS SELECT `cts`.`id` AS `id_ChiTietSanPham`, `cts`.`id_SanPham` AS `id_SanPham`, `cts`.`MaSanPham` AS `MaSanPham`, `sp`.`Ten` AS `TenSanPham`, `th`.`Ten` AS `ThuongHieu`, `dm`.`Ten` AS `DanhMuc`, `kc`.`Ten` AS `KichCo`, `ms`.`Ten` AS `MauSac`, `fn_TinhTonKhoRealTime`(`cts`.`id`) AS `TonKho`, `fn_SoLuongDangCho`(`cts`.`id`) AS `SoLuongDangCho`, `sp`.`Gia` AS `Gia`, `sp`.`GiaKhuyenMai` AS `GiaKhuyenMai`, `sp`.`TrangThai` AS `TrangThaiSanPham` FROM (((((`chitietsanpham` `cts` join `sanpham` `sp` on(`cts`.`id_SanPham` = `sp`.`id`)) join `thuonghieu` `th` on(`sp`.`id_ThuongHieu` = `th`.`id`)) join `danhmuc` `dm` on(`sp`.`id_DanhMuc` = `dm`.`id`)) join `kichco` `kc` on(`cts`.`id_KichCo` = `kc`.`id`)) join `mausac` `ms` on(`cts`.`id_MauSac` = `ms`.`id`)) ;

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
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kichco_ten` (`Ten`);

--
-- Indexes for table `magiamgia`
--
ALTER TABLE `magiamgia`
  ADD PRIMARY KEY (`Ma`);

--
-- Indexes for table `mausac`
--
ALTER TABLE `mausac`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_mausac_ten` (`Ten`);

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
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nhacungcap_ten` (`Ten`);

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
  ADD KEY `idx_sanpham_thuonghieu` (`id_ThuongHieu`),
  ADD KEY `idx_sanpham_ten` (`Ten`),
  ADD KEY `idx_sanpham_gia` (`Gia`);

--
-- Indexes for table `thuonghieu`
--
ALTER TABLE `thuonghieu`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_thuonghieu_ten` (`Ten`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `chitietphieunhap`
--
ALTER TABLE `chitietphieunhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `chitietsanpham`
--
ALTER TABLE `chitietsanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=397;

--
-- AUTO_INCREMENT for table `danhgia`
--
ALTER TABLE `danhgia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `danhmuc`
--
ALTER TABLE `danhmuc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `donhang`
--
ALTER TABLE `donhang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `giohang`
--
ALTER TABLE `giohang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT for table `hinhthucthanhtoan`
--
ALTER TABLE `hinhthucthanhtoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `hinhthucvanchuyen`
--
ALTER TABLE `hinhthucvanchuyen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `nhacungcap`
--
ALTER TABLE `nhacungcap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `phieunhap`
--
ALTER TABLE `phieunhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `quyen`
--
ALTER TABLE `quyen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quyenguoidung`
--
ALTER TABLE `quyenguoidung`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `sanpham`
--
ALTER TABLE `sanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT for table `thuonghieu`
--
ALTER TABLE `thuonghieu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `token_lammoi`
--
ALTER TABLE `token_lammoi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

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
