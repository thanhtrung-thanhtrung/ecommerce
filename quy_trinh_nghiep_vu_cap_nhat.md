# QUY TRÌNH NGHIỆP VỤ HỆ THỐNG SHOES SHOP - CẬP NHẬT ĐẦY ĐỦ

## 1.1.1.1. Quy trình tìm kiếm sản phẩm

Người dùng nhập từ khóa vào ô tìm kiếm. Hệ thống tìm các sản phẩm có tên, mô tả hoặc thông số kỹ thuật trong bảng `sanpham` khớp với từ khóa. Kết quả được lọc theo `TrangThai = 1` (sản phẩm đang bán) và có tồn kho thông qua view `v_tonkho_sanpham` hoặc function `fn_TinhTonKhoRealTime()`.

## 1.1.1.2. Quy trình đánh giá sản phẩm

Sau khi đơn hàng hoàn thành (`TrangThai = 4`), người dùng có thể đánh giá sản phẩm bằng cách để lại số sao (1-5) và bình luận. Hệ thống lưu vào bảng `danhgia` có liên kết với `nguoidung`, `sanpham` và `donhang` để đảm bảo chỉ đánh giá sản phẩm đã mua.

## 1.1.1.3. Quy trình quản lý giỏ hàng

Khi người dùng nhấn 'Thêm vào giỏ hàng', hệ thống:

- **Người dùng đã đăng nhập**: Lưu vào bảng `giohang` với `id_NguoiDung`
- **Khách vãng lai**: Lưu vào bảng `giohang` với `session_id` (UUID)
- Kiểm tra tồn kho qua function `fn_TinhTonKhoRealTime(id_ChiTietSanPham)`
- Liên kết với `chitietsanpham` (không phải `sanpham_chitiet`) để quản lý size/màu cụ thể

## 1.1.1.4. Quy trình cập nhật giỏ hàng

Người dùng thay đổi số lượng sản phẩm trong giỏ hàng. Hệ thống:

- Kiểm tra tồn kho thực tế qua function `fn_CoTheBan(id_ChiTietSanPham, SoLuongCanBan)`
- Cập nhật `SoLuong` trong bảng `giohang`
- Hiển thị lỗi nếu vượt quá tồn kho

## 1.1.1.5. Quy trình xóa sản phẩm khỏi giỏ hàng

Người dùng xóa sản phẩm khỏi giỏ hàng. Hệ thống xóa record trong bảng `giohang` dựa trên:

- `id_NguoiDung` và `id_ChiTietSanPham` (đối với user đã đăng nhập)
- `session_id` và `id_ChiTietSanPham` (đối với khách vãng lai)

## 1.1.1.6. Quy trình quản lý thanh toán

Trong trang checkout, người dùng chọn phương thức thanh toán từ bảng `hinhthucthanhtoan`. Hệ thống:

- Lưu thông tin thanh toán vào trường `id_ThanhToan` trong bảng `donhang`
- Cập nhật `TrangThaiThanhToan` (0: Chưa thanh toán, 1: Đã thanh toán)
- Lưu `ThoiGianThanhToan` khi thanh toán thành công

## 1.1.1.7. Quy trình áp dụng mã giảm giá

Người dùng nhập mã giảm giá. Hệ thống kiểm tra trong bảng `magiamgia`:

- Mã còn hiệu lực (`NgayBatDau <= NOW() <= NgayKetThuc`)
- `TrangThai = 1`
- `SoLuotDaSuDung < SoLuotSuDung`
- Đơn hàng đủ điều kiện (`TongTienHang >= DieuKienApDung`)
- Tính giảm giá: `MIN(TongTienHang * PhanTramGiam / 100, GiaTriGiamToiDa)`

## 1.1.1.8. Quy trình theo dõi đơn hàng

Người dùng xem đơn hàng trong "Đơn hàng của tôi". Hệ thống truy vấn bảng `donhang` với:

- Trạng thái: 1=Chờ xác nhận, 2=Đã xác nhận, 3=Đang giao, 4=Đã giao, 5=Đã hủy
- Thông tin vận chuyển từ bảng `hinhthucvanchuyen`
- Chi tiết sản phẩm từ `chitietdonhang` -> `chitietsanpham` -> `sanpham`

## 1.1.1.9. Quy trình đặt hàng

Sau khi xác nhận checkout, hệ thống:

1. Tạo `MaDonHang` theo format: `DH{YYMMDD}-{ID}`
2. Lưu vào bảng `donhang` với thông tin người nhận, shipping, payment
3. Lưu chi tiết vào `chitietdonhang` liên kết với `chitietsanpham`
4. **Trigger `tr_XoaGioHang_v2`** tự động xóa giỏ hàng sau khi tạo đơn
5. Không trừ tồn kho ngay (chỉ trừ khi đơn hoàn thành)

## 1.1.1.10. Quy trình hủy đơn hàng

Người dùng/admin có thể hủy đơn hàng khi `TrangThai IN (1,2,3)`. Hệ thống:

- Cập nhật `TrangThai = 5` và `LyDoHuy`
- **Trigger `tr_CapNhatSoLuongDaBan_v2`** tự động hoàn lại `SoLuongDaBan` nếu đơn đã hoàn thành trước đó

## 1.1.1.11. Quy trình quản lý mã giảm giá (CRUD)

### **Tạo mã giảm giá:**

Admin tạo voucher mới trong trang admin với:

- `Ma` (unique), `Ten`, `MoTa`
- `PhanTramGiam` (1-100%), `GiaTriGiamToiDa`
- `NgayBatDau`, `NgayKetThuc` (validation: không được trong quá khứ)
- `SoLuotSuDung`, `DieuKienApDung` (số tiền tối thiểu)
- `TrangThai` mặc định = 1 (kích hoạt)
- Dữ liệu lưu vào bảng `magiamgia`

### **Xem danh sách mã giảm giá:**

Admin xem tất cả voucher với:

- Hiển thị thông tin: Mã, Tên, Giảm giá, Ngày hết hạn, Trạng thái
- Phân trang và tìm kiếm theo mã/tên
- Lọc theo trạng thái (Hoạt động/Tạm dừng/Hết hạn)

### **Sửa mã giảm giá:**

Admin có thể cập nhật voucher:

- Chỉnh sửa: `Ten`, `MoTa`, `PhanTramGiam`, `GiaTriGiamToiDa`
- Gia hạn: `NgayKetThuc`, `SoLuotSuDung`
- **Không cho sửa**: `Ma` (do unique constraint)
- **Validation**: Ngày kết thúc phải sau ngày hiện tại

### **Cập nhật trạng thái:**

Admin kích hoạt/tạm dừng voucher:

- Toggle `TrangThai` (1=Hoạt động, 0=Tạm dừng)
- Voucher tạm dừng không áp dụng được khi checkout
- Hiển thị badge trạng thái trong danh sách

### **Xóa mã giảm giá:**

Admin xóa voucher với kiểm tra:

- **Xóa mềm**: Cập nhật `TrangThai = 0` thay vì xóa cứng
- **Kiểm tra ràng buộc**: Không xóa nếu đã có đơn hàng sử dụng
- Hiển thị xác nhận trước khi xóa

## 1.1.1.12. Quy trình thống kê Dashboard

Admin xem thống kê qua:

- **Doanh thu**: Tổng hợp từ `donhang` có `TrangThai = 4`
- **Đơn hàng**: Phân tích theo trạng thái và thời gian
- **Tồn kho**: Sử dụng stored procedure `sp_KiemTraTonKho()` và function `fn_TinhTonKhoRealTime()`
- **View tổng hợp**: `v_tonkho_sanpham`, `v_thongtinnguoidung`

## 1.1.1.13. Quy trình quản lý danh mục (CRUD)

### **Tạo danh mục:**

Admin thêm danh mục mới:

- Nhập `TenDanhMuc`, `MoTa`
- Chọn `id_DanhMucCha` (nếu là danh mục con)
- `TrangThai` mặc định = 1 (hiển thị)
- Lưu vào bảng `danhmuc`

### **Xem danh sách danh mục:**

Admin xem tất cả danh mục:

- Hiển thị cấu trúc cây danh mục cha-con
- Phân trang và tìm kiếm theo tên
- Hiển thị số lượng sản phẩm trong mỗi danh mục

### **Sửa danh mục:**

Admin cập nhật thông tin danh mục:

- Chỉnh sửa: `TenDanhMuc`, `MoTa`
- Thay đổi danh mục cha (`id_DanhMucCha`)
- **Validation**: Không cho danh mục làm con của chính nó

### **Cập nhật trạng thái:**

Admin ẩn/hiện danh mục:

- Toggle `TrangThai` (1=Hiển thị, 0=Ẩn)
- Danh mục ẩn không hiển thị trên website

### **Xóa danh mục:**

Admin xóa danh mục với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu còn sản phẩm
- **Kiểm tra danh mục con**: Không xóa nếu còn danh mục con
- Hiển thị xác nhận trước khi xóa

## 1.1.1.14. Quy trình quản lý sản phẩm (CRUD)

### **Tạo sản phẩm:**

Admin thêm sản phẩm mới:

- **Thông tin cơ bản**: `Ten`, `MoTa`, `MoTaChiTiet`
- **Giá cả**: `Gia`, `GiaKhuyenMai`
- **Phân loại**: `id_DanhMuc`, `id_ThuongHieu`, `id_NhaCungCap`
- **Hình ảnh**: Upload lên Cloudinary, lưu JSON URLs
- **Thông số kỹ thuật**: Lưu dạng JSON (`ChatLieu`, `KieuGiay`, `XuatXu`)
- **Biến thể**: Tạo `chitietsanpham` với size/màu và số lượng

### **Xem danh sách sản phẩm:**

Admin xem tất cả sản phẩm:

- Hiển thị: Hình ảnh, Tên, Giá, Danh mục, Thương hiệu, Trạng thái
- Phân trang và tìm kiếm đa tiêu chí
- Lọc theo danh mục, thương hiệu, trạng thái
- Hiển thị tồn kho tổng theo sản phẩm

### **Sửa sản phẩm:**

Admin cập nhật thông tin sản phẩm:

- Chỉnh sửa tất cả thông tin cơ bản
- Cập nhật/thêm/xóa hình ảnh
- Quản lý biến thể (thêm size/màu mới, cập nhật số lượng)
- **Validation**: Giá khuyến mãi < Giá gốc

### **Cập nhật trạng thái:**

Admin quản lý hiển thị sản phẩm:

- Toggle `TrangThai` (1=Đang bán, 0=Ngừng bán)
- Sản phẩm ngừng bán không hiển thị trên website

### **Xóa sản phẩm:**

Admin xóa sản phẩm với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu đã có người mua
- **Xóa cứng**: Xóa luôn khỏi database nếu chưa bán
- **Gợi ý**: Khuyến nghị ẩn sản phẩm thay vì xóa

## 1.1.1.15. Quy trình quản lý nhà cung cấp (CRUD)

### **Tạo nhà cung cấp:**

Admin thêm nhà cung cấp mới:

- Nhập: `TenNhaCungCap`, `Email`, `SDT`, `DiaChi`
- `TrangThai` mặc định = 1 (hoạt động)
- Lưu vào bảng `nhacungcap`

### **Xem danh sách nhà cung cấp:**

Admin xem tất cả nhà cung cấp:

- Hiển thị thông tin liên hệ và trạng thái
- Phân trang và tìm kiếm theo tên/email
- Hiển thị số lượng sản phẩm mỗi nhà cung cấp

### **Sửa nhà cung cấp:**

    Admin cập nhật thông tin:

    - Chỉnh sửa: Tên, Email, SDT, Địa chỉ
    - **Validation**: Email hợp lệ, SDT đúng format

### **Cập nhật trạng thái:**

Admin kích hoạt/tạm dừng:

- Toggle `TrangThai` (1=Hoạt động, 0=Tạm dừng)

### **Xóa nhà cung cấp:**

Admin xóa với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu còn sản phẩm
- Hiển thị xác nhận trước khi xóa

## 1.1.1.16. Quy trình quản lý thương hiệu (CRUD)

### **Tạo thương hiệu:**

Admin thêm thương hiệu mới:

- Nhập: `TenThuongHieu`, `MoTa`
- Upload logo lên Cloudinary
- `TrangThai` mặc định = 1 (hiển thị)
- Lưu vào bảng `thuonghieu`

### **Xem danh sách thương hiệu:**

Admin xem tất cả thương hiệu:

- Hiển thị logo, tên, mô tả, trạng thái
- Phân trang và tìm kiếm theo tên
- Hiển thị số lượng sản phẩm mỗi thương hiệu

### **Sửa thương hiệu:**

Admin cập nhật thông tin:

- Chỉnh sửa: Tên, Mô tả
- Thay đổi logo (upload mới lên Cloudinary)

### **Cập nhật trạng thái:**

Admin ẩn/hiện thương hiệu:

- Toggle `TrangThai` (1=Hiển thị, 0=Ẩn)

### **Xóa thương hiệu:**

Admin xóa với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu còn sản phẩm
- Hiển thị xác nhận trước khi xóa

## 1.1.1.17. Quy trình quản lý thuộc tính sản phẩm (CRUD)

### **Quản lý kích cỡ:**

#### **Tạo kích cỡ:**

- Nhập `TenKichCo` (unique constraint)
- Lưu vào bảng `kichco`

#### **Xem danh sách kích cỡ:**

- Hiển thị tất cả size có sẵn
- Phân trang và tìm kiếm

#### **Sửa kích cỡ:**

- Chỉnh sửa `TenKichCo`
- **Validation**: Không trùng với size khác

#### **Xóa kích cỡ:**

- **Kiểm tra ràng buộc**: Không xóa nếu đang được sử dụng
- Xóa khỏi bảng `kichco`

### **Quản lý màu sắc:**

#### **Tạo màu sắc:**

- Nhập `TenMau`, `MaMau` (hex code)
- Lưu vào bảng `mausac`

#### **Xem danh sách màu sắc:**

- Hiển thị tên màu và preview màu
- Phân trang và tìm kiếm

#### **Sửa màu sắc:**

- Chỉnh sửa tên màu và mã màu
- **Validation**: Mã màu hex hợp lệ

#### **Xóa màu sắc:**

- **Kiểm tra ràng buộc**: Không xóa nếu đang được sử dụng
- Xóa khỏi bảng `mausac`

## 1.1.1.18. Quy trình quản lý phương thức thanh toán (CRUD)

### **Tạo phương thức thanh toán:**

Admin thêm phương thức mới:

- Nhập: `Ten`, `MoTa`
- `TrangThai` mặc định = 1 (hoạt động)
- Lưu vào bảng `hinhthucthanhtoan`

### **Xem danh sách phương thức:**

Admin xem tất cả phương thức:

- Hiển thị tên, mô tả, trạng thái
- Phân trang và tìm kiếm

### **Sửa phương thức thanh toán:**

Admin cập nhật thông tin:

- Chỉnh sửa: `Ten`, `MoTa`

### **Cập nhật trạng thái:**

Admin kích hoạt/tạm dừng:

- Toggle `TrangThai` (1=Hoạt động, 0=Tạm dừng)
- Phương thức tạm dừng không hiển thị khi checkout

### **Xóa phương thức thanh toán:**

Admin xóa với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu đã có đơn hàng sử dụng
- Hiển thị xác nhận trước khi xóa

## 1.1.1.19. Quy trình quản lý vận chuyển (CRUD)

### **Tạo phương thức vận chuyển:**

Admin thêm phương thức mới:

- Nhập: `Ten`, `MoTa`, `Gia` (phí vận chuyển)
- `ThoiGianDuKien` (số ngày giao hàng)
- `TrangThai` mặc định = 1 (hoạt động)
- Lưu vào bảng `hinhthucvanchuyen`

### **Xem danh sách phương thức vận chuyển:**

Admin xem tất cả phương thức:

- Hiển thị tên, phí, thời gian, trạng thái
- Phân trang và tìm kiếm

### **Sửa phương thức vận chuyển:**

Admin cập nhật thông tin:

- Chỉnh sửa: `Ten`, `MoTa`, `Gia`, `ThoiGianDuKien`

### **Cập nhật trạng thái:**

Admin kích hoạt/tạm dừng:

- Toggle `TrangThai` (1=Hoạt động, 0=Tạm dừng)

### **Xóa phương thức vận chuyển:**

Admin xóa với kiểm tra:

- **Kiểm tra ràng buộc**: Không xóa nếu đã có đơn hàng sử dụng
- Hiển thị xác nhận trước khi xóa

## 1.1.1.20. Quy trình quản lý đơn hàng (Admin CRUD)

### **Xem danh sách đơn hàng:**

Admin xem tất cả đơn hàng:

- Hiển thị: Mã đơn, Khách hàng, Tổng tiền, Trạng thái, Ngày tạo
- Phân trang và tìm kiếm theo mã đơn/tên khách
- Lọc theo trạng thái, phương thức thanh toán, thời gian

### **Xem chi tiết đơn hàng:**

Admin xem thông tin đầy đủ:

- Thông tin khách hàng và địa chỉ giao hàng
- Danh sách sản phẩm, số lượng, giá
- Lịch sử cập nhật trạng thái
- Thông tin thanh toán và vận chuyển

### **Cập nhật trạng thái đơn hàng:**

Admin xử lý đơn hàng:

- Chuyển trạng thái: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao
- **Trigger tự động**: Cập nhật `SoLuongDaBan` khi hoàn thành
- Ghi log thời gian và người cập nhật

### **Hủy đơn hàng:**

Admin hủy đơn hàng:

- Chỉ hủy được khi `TrangThai IN (1,2,3)`
- Nhập `LyDoHuy`
- **Trigger tự động**: Hoàn lại tồn kho nếu cần

### **In hóa đơn/Xuất báo cáo:**

Admin xuất thông tin đơn hàng:

- In hóa đơn PDF
- Xuất danh sách đơn hàng Excel
- Báo cáo doanh thu theo thời gian

## 1.1.1.21. Quy trình quản lý tài khoản (CRUD)

### **Xem danh sách người dùng:**

Admin xem tất cả tài khoản:

- Hiển thị từ view `v_thongtinnguoidung`
- Thông tin: Họ tên, Email, SDT, Quyền, Trạng thái
- Phân trang và tìm kiếm theo tên/email
- Lọc theo quyền và trạng thái

### **Xem chi tiết tài khoản:**

Admin xem thông tin đầy đủ:

- Thông tin cá nhân và liên hệ
- Lịch sử đăng nhập (từ bảng `token_lammoi`)
- Lịch sử đơn hàng
- Thiết bị đăng nhập (từ bảng `thietbi`)

### **Cập nhật quyền người dùng:**

Admin phân quyền:

- Cập nhật `id_Quyen` trong bảng `quyenguoidung`
- Quyền: 1=Admin, 2=Nhân viên, 3=Khách hàng
- **Validation**: Không tự giảm quyền của chính mình

### **Khóa/Mở khóa tài khoản:**

Admin quản lý trạng thái:

- Toggle `TrangThai` trong bảng `nguoidung`
- Tài khoản khóa không thể đăng nhập
- Xóa tất cả refresh token khi khóa

### **Xóa tài khoản:**

Admin xóa tài khoản:

- **Xóa mềm**: Cập nhật `TrangThai = 0`
- **Kiểm tra ràng buộc**: Không xóa nếu có đơn hàng
- Xóa tất cả token và session

## 1.1.1.22. Quy trình quản lý kho hàng (CRUD)

### **Tạo phiếu nhập kho:**

Admin nhập hàng mới:

- Tạo `phieunhap` với thông tin: Nhà cung cấp, Ngày nhập, Ghi chú
- Thêm chi tiết vào `chitietphieunhap`: Sản phẩm, Size, Màu, Số lượng, Giá nhập
- **Tự động**: Cập nhật tồn kho qua function `fn_TinhTonKhoRealTime()`

### **Xem danh sách phiếu nhập:**

Admin xem lịch sử nhập kho:

- Hiển thị: Mã phiếu, Nhà cung cấp, Ngày nhập, Tổng tiền
- Phân trang và tìm kiếm theo mã phiếu
- Lọc theo nhà cung cấp và thời gian

### **Xem chi tiết phiếu nhập:**

Admin xem thông tin đầy đủ:

- Thông tin phiếu nhập và nhà cung cấp
- Danh sách sản phẩm nhập với số lượng và giá
- Tính tổng giá trị phiếu nhập

### **Sửa phiếu nhập:**

Admin cập nhật phiếu nhập:

- **Chỉ sửa được**: Ghi chú và thông tin không ảnh hưởng tồn kho
- **Không cho sửa**: Số lượng và sản phẩm đã nhập

### **Hủy phiếu nhập:**

Admin hủy phiếu nhập:

- **Kiểm tra**: Có thể hủy nếu hàng chưa bán
- **Tự động**: Trừ lại tồn kho đã nhập
- Cập nhật trạng thái phiếu nhập

### **Báo cáo tồn kho:**

Admin xem báo cáo:

- Sử dụng stored procedure `sp_KiemTraTonKho()`
- Báo cáo sản phẩm sắp hết hàng
- Báo cáo giá trị tồn kho theo danh mục
- Xuất Excel báo cáo tồn kho

## 1.1.1.23. Quy trình đồng bộ giỏ hàng sau đăng nhập

Khi khách vãng lai đăng nhập:

- API `/cart/sync-after-login` gộp giỏ hàng từ `session_id` vào `id_NguoiDung`
- Xóa session cart và giữ user cart
- Đảm bảo không mất sản phẩm đã thêm

## 1.1.1.24. Quy trình quản lý Analytics và Báo cáo

### **Dashboard tổng quan:**

Admin xem thống kê realtime:

- **Doanh thu**: Hôm nay, tuần này, tháng này
- **Đơn hàng**: Số lượng theo trạng thái
- **Sản phẩm**: Top bán chạy, sắp hết hàng
- **Khách hàng**: Mới đăng ký, hoạt động

### **Báo cáo doanh thu:**

Admin phân tích doanh thu:

- Báo cáo theo ngày/tuần/tháng/năm
- Biểu đồ xu hướng doanh thu
- So sánh với kỳ trước
- Xuất báo cáo PDF/Excel

### **Báo cáo sản phẩm:**

Admin phân tích sản phẩm:

- Top sản phẩm bán chạy
- Sản phẩm ít bán/không bán
- Phân tích theo danh mục/thương hiệu
- Tỷ lệ chuyển đổi từ xem → mua

### **Báo cáo khách hàng:**

Admin phân tích khách hàng:

- Khách hàng VIP (mua nhiều)
- Phân tích hành vi mua hàng
- Tỷ lệ khách hàng quay lại
- Phân bố địa lý khách hàng

## CẢI TIẾN SO VỚI MÔ TẢ TRƯỚC:

### ✅ Hoàn thiện CRUD cho tất cả module:

- Mỗi nghiệp vụ đều có đầy đủ: Create, Read, Update, Delete
- Validation và ràng buộc dữ liệu chi tiết
- Xử lý trạng thái và quyền hạn rõ ràng

### 🔧 Bổ sung tính năng:

- Quản lý kho hàng với phiếu nhập chi tiết
- Analytics và báo cáo đa dạng
- Đồng bộ giỏ hàng guest→user
- Phân quyền chi tiết cho admin/nhân viên

### 📊 Database automation:

- Trigger tự động xử lý nghiệp vụ
- Function/Procedure tính toán realtime
- View tổng hợp dữ liệu
- Constraint và validation chặt chẽ

### 🔐 Bảo mật và kiểm soát:

- JWT authentication với refresh token
- Phân quyền đa cấp
- Audit log cho các thao tác quan trọng
- Xóa mềm thay vì xóa cứng
