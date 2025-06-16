#!/bin/bash

# =============================================================================
# SCRIPT TEST API CRUD SẢN PHẨM - SHOES SHOP
# Server: http://localhost:5000
# =============================================================================

echo "🚀 TESTING SHOES SHOP API - CRUD OPERATIONS"
echo "============================================="

# Biến cấu hình
BASE_URL="http://localhost:5000/api"
CONTENT_TYPE="Content-Type: application/json"

# =============================================================================
# 1. ✅ TEST CREATE - THÊM SẢN PHẨM MỚI
# =============================================================================
echo ""
echo "1️⃣ TESTING CREATE PRODUCT - Thêm sản phẩm mới"
echo "================================================"

# Tạo sản phẩm Nike Air Max mới
curl -X POST "${BASE_URL}/products/admin/create" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "Ten": "Nike Air Max 2024 Premium Edition",
    "MoTa": "Giày thể thao Nike Air Max với công nghệ đệm khí tiên tiến 2024",
    "MoTaChiTiet": "Nike Air Max 2024 Premium Edition được thiết kế với công nghệ Air Max mới nhất, mang lại sự thoải mái tối đa cho người dùng. Chất liệu cao cấp, thiết kế hiện đại phù hợp cho mọi hoạt động thể thao và thời trang.",
    "ThongSoKyThuat": {
      "ChatLieu": "Mesh cao cấp + Da tổng hợp",
      "De": "Air Max + Cao su chống trượt", 
      "CongNghe": "Air Max 2024 Technology",
      "TrongLuong": "320g",
      "ChieuCao": "Cổ thấp",
      "PhongCach": "Sport/Lifestyle"
    },
    "Gia": 3200000,
    "GiaKhuyenMai": 2800000,
    "id_DanhMuc": 3,
    "id_ThuongHieu": 1,
    "id_NhaCungCap": 1,
    "bienThe": [
      {
        "id_KichCo": 5,
        "id_MauSac": 1,
        "MaSanPham": "AIR-MAX-2024-BLACK-40",
        "SoLuong": 25
      },
      {
        "id_KichCo": 6,
        "id_MauSac": 1,
        "MaSanPham": "AIR-MAX-2024-BLACK-41",
        "SoLuong": 30
      },
      {
        "id_KichCo": 7,
        "id_MauSac": 2,
        "MaSanPham": "AIR-MAX-2024-WHITE-42",
        "SoLuong": 20
      }
    ]
  }'

echo ""
echo "✅ Create Product Test Completed"

# =============================================================================
# 2. ✅ TEST READ - XEM DANH SÁCH/CHI TIẾT SẢN PHẨM
# =============================================================================
echo ""
echo "2️⃣ TESTING READ OPERATIONS - Xem danh sách và chi tiết"
echo "========================================================"

# Lấy danh sách tất cả sản phẩm (có phân trang)
echo ""
echo "📋 Lấy danh sách sản phẩm (trang 1, 10 items):"
curl -X GET "${BASE_URL}/products?page=1&limit=10"

echo ""
echo "🔍 Lấy chi tiết sản phẩm ID=3 (Nike Air Force 1):"
curl -X GET "${BASE_URL}/products/3"

echo ""
echo "🔎 Tìm kiếm sản phẩm với từ khóa 'Nike':"
curl -X GET "${BASE_URL}/products/search?tuKhoa=Nike&page=1&limit=5"

echo ""
echo "🏷️ Lấy sản phẩm theo danh mục (ID=3 - Giày thể thao):"
curl -X GET "${BASE_URL}/products/search?id_DanhMuc=3&page=1&limit=5"

echo ""
echo "💰 Tìm sản phẩm theo khoảng giá (2.000.000 - 3.000.000):"
curl -X GET "${BASE_URL}/products/search?giaMin=2000000&giaMax=3000000"

echo ""
echo "✅ Read Operations Test Completed"

# =============================================================================
# 3. ✅ TEST UPDATE - SỬA THÔNG TIN SẢN PHẨM
# =============================================================================
echo ""
echo "3️⃣ TESTING UPDATE PRODUCT - Cập nhật thông tin sản phẩm"
echo "========================================================"

# Cập nhật sản phẩm ID=3 (Nike Air Force 1)
echo ""
echo "📝 Cập nhật sản phẩm ID=3:"
curl -X PUT "${BASE_URL}/products/admin/update/3" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "Ten": "Nike Air Force 1 - Updated Edition 2025",
    "MoTa": "Giày Nike Air Force 1 cổ điển - Phiên bản cập nhật 2025",
    "MoTaChiTiet": "Nike Air Force 1 với thiết kế cổ điển được cập nhật với chất liệu cao cấp hơn, phù hợp cho mọi hoạt động thể thao và thời trang đường phố. Sản phẩm được cải tiến về độ bền và thoải mái.",
    "ThongSoKyThuat": {
      "ChatLieu": "Da thật + Da tổng hợp cao cấp",
      "De": "Cao su chống trượt và chống mài mòn",
      "CongNghe": "Air-Sole cushioning technology",
      "TrongLuong": "380g",
      "ChieuCao": "Cổ thấp",
      "PhongCach": "Lifestyle/Street"
    },
    "Gia": 2900000,
    "GiaKhuyenMai": 2600000,
    "id_DanhMuc": 7,
    "id_ThuongHieu": 1,
    "id_NhaCungCap": 1,
    "TrangThai": 1,
    "bienThe": [
      {
        "id_KichCo": 5,
        "id_MauSac": 2,
        "MaSanPham": "AF1-2025-WHITE-40",
        "SoLuong": 25
      },
      {
        "id_KichCo": 6,
        "id_MauSac": 2,
        "MaSanPham": "AF1-2025-WHITE-41",
        "SoLuong": 30
      },
      {
        "id_KichCo": 7,
        "id_MauSac": 1,
        "MaSanPham": "AF1-2025-BLACK-42",
        "SoLuong": 20
      },
      {
        "id_KichCo": 8,
        "id_MauSac": 1,
        "MaSanPham": "AF1-2025-BLACK-43",
        "SoLuong": 15
      }
    ]
  }'

echo ""
echo "✅ Update Product Test Completed"

# =============================================================================
# 4. ✅ TEST DELETE - XÓA SẢN PHẨM
# =============================================================================
echo ""
echo "4️⃣ TESTING DELETE PRODUCT - Xóa sản phẩm"
echo "=========================================="

# Xóa sản phẩm (thường là soft delete - đổi trạng thái)
echo ""
echo "🗑️ Xóa sản phẩm ID=127:"
curl -X DELETE "${BASE_URL}/products/admin/delete/127"

echo ""
echo "✅ Delete Product Test Completed"

# =============================================================================
# 5. ✅ TEST ADDITIONAL OPERATIONS - CÁC THAO TÁC BỔ SUNG
# =============================================================================
echo ""
echo "5️⃣ TESTING ADDITIONAL OPERATIONS - Thao tác bổ sung"
echo "====================================================="

# Lấy danh sách sản phẩm cho admin (bao gồm sản phẩm đã xóa)
echo ""
echo "👨‍💼 Lấy danh sách sản phẩm cho Admin:"
curl -X GET "${BASE_URL}/products/admin?page=1&limit=10"

# Cập nhật trạng thái sản phẩm
echo ""
echo "🔄 Cập nhật trạng thái sản phẩm ID=128 (ẩn sản phẩm):"
curl -X PATCH "${BASE_URL}/products/admin/status/128" \
  -H "${CONTENT_TYPE}" \
  -d '{"TrangThai": 0}'

# Lấy biến thể của sản phẩm
echo ""
echo "🎯 Lấy biến thể sản phẩm ID=3:"
curl -X GET "${BASE_URL}/products/admin/variants/3"

echo ""
echo "✅ Additional Operations Test Completed"

# =============================================================================
# 6. ✅ TEST ERROR CASES - KIỂM TRA CÁC TRƯỜNG HỢP LỖI
# =============================================================================
echo ""
echo "6️⃣ TESTING ERROR CASES - Kiểm tra trường hợp lỗi"
echo "================================================="

# Test lấy sản phẩm không tồn tại
echo ""
echo "❌ Test lấy sản phẩm không tồn tại (ID=99999):"
curl -X GET "${BASE_URL}/products/99999"

# Test tạo sản phẩm với dữ liệu không hợp lệ
echo ""
echo "❌ Test tạo sản phẩm thiếu thông tin bắt buộc:"
curl -X POST "${BASE_URL}/products/admin/create" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "Ten": "",
    "Gia": "invalid_price"
  }'

# Test cập nhật sản phẩm không tồn tại
echo ""
echo "❌ Test cập nhật sản phẩm không tồn tại (ID=99999):"
curl -X PUT "${BASE_URL}/products/admin/update/99999" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "Ten": "Test Product",
    "Gia": 1000000
  }'

echo ""
echo "✅ Error Cases Test Completed"

# =============================================================================
# 7. ✅ TEST PERFORMANCE - KIỂM TRA HIỆU SUẤT
# =============================================================================
echo ""
echo "7️⃣ TESTING PERFORMANCE - Kiểm tra hiệu suất"
echo "============================================="

# Test tải danh sách sản phẩm với số lượng lớn
echo ""
echo "⚡ Test tải 50 sản phẩm cùng lúc:"
curl -X GET "${BASE_URL}/products?page=1&limit=50"

# Test tìm kiếm phức tạp
echo ""
echo "🔍 Test tìm kiếm phức tạp (nhiều điều kiện):"
curl -X GET "${BASE_URL}/products/search?tuKhoa=Nike&id_DanhMuc=3&id_ThuongHieu=1&giaMin=1000000&giaMax=5000000&page=1&limit=20"

echo ""
echo "✅ Performance Test Completed"

# =============================================================================
# KẾT THÚC TEST
# =============================================================================
echo ""
echo "🎉 TẤT CẢ TEST CASE ĐÃ HOÀN THÀNH!"
echo "=================================="
echo ""
echo "📊 TỔNG KẾT:"
echo "✅ CREATE - Thêm sản phẩm mới"
echo "✅ READ - Xem danh sách/chi tiết sản phẩm" 
echo "✅ UPDATE - Sửa thông tin sản phẩm"
echo "✅ DELETE - Xóa sản phẩm"
echo "✅ Additional Operations - Thao tác bổ sung"
echo "✅ Error Handling - Xử lý lỗi"
echo "✅ Performance Testing - Kiểm tra hiệu suất"
echo ""
echo "🔗 API Documentation: http://localhost:5000/api-docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Happy Testing! 🚀"