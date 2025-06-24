#!/bin/bash

# Test CRUD API cho Shipping Methods
# Base URL của API
BASE_URL="http://localhost:3000/api/shipping"

echo "=== TESTING SHIPPING METHODS CRUD API ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 1. Test GET all shipping methods (with pagination)
print_test "1. GET All Shipping Methods (Pagination)"
curl -X GET "$BASE_URL?page=1&limit=5" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 2. Test GET active shipping methods
print_test "2. GET Active Shipping Methods"
curl -X GET "$BASE_URL/active" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 3. Test CREATE new shipping method
print_test "3. CREATE New Shipping Method"
NEW_SHIPPING_RESPONSE=$(curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "Ten": "Giao hàng siêu nhanh TEST",
    "MoTa": "Giao hàng trong 4-6 giờ",
    "PhiVanChuyen": 120000,
    "ThoiGianDuKien": "4-6 giờ",
    "TrangThai": 1
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s)

echo "$NEW_SHIPPING_RESPONSE" | jq '.'
# Extract ID from response for further tests
NEW_SHIPPING_ID=$(echo "$NEW_SHIPPING_RESPONSE" | jq -r '.data.id // empty')
echo ""

# 4. Test GET shipping method by ID
if [ ! -z "$NEW_SHIPPING_ID" ]; then
    print_test "4. GET Shipping Method by ID: $NEW_SHIPPING_ID"
    curl -X GET "$BASE_URL/$NEW_SHIPPING_ID" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n" \
      -s | jq '.'
    echo ""
else
    print_error "4. Cannot test GET by ID - Creation failed"
    NEW_SHIPPING_ID=1  # Use existing ID for other tests
fi

# 5. Test UPDATE shipping method
print_test "5. UPDATE Shipping Method (ID: $NEW_SHIPPING_ID)"
curl -X PUT "$BASE_URL/$NEW_SHIPPING_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "Ten": "Giao hàng siêu nhanh TEST UPDATED",
    "MoTa": "Giao hàng trong 3-5 giờ (đã cập nhật)",
    "PhiVanChuyen": 100000,
    "ThoiGianDuKien": "3-5 giờ"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 6. Test SEARCH shipping methods
print_test "6. SEARCH Shipping Methods"
curl -X GET "$BASE_URL?search=giao%20h%C3%A0ng&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 7. Test FILTER by status
print_test "7. FILTER by Status (Active = 1)"
curl -X GET "$BASE_URL?status=1&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 8. Test CALCULATE shipping fee
print_test "8. CALCULATE Shipping Fee"
curl -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "id_VanChuyen": 1,
    "tongGiaTriDonHang": 1500000,
    "diaChi": "123 Nguyễn Văn Linh, Quận 7, TP.HCM"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 9. Test CALCULATE shipping fee with free shipping
print_test "9. CALCULATE Shipping Fee (Free Shipping Case)"
curl -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "id_VanChuyen": 1,
    "tongGiaTriDonHang": 2500000,
    "diaChi": "123 Lê Văn Việt, Quận 9, TP.HCM"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 10. Test GET shipping options
print_test "10. GET Shipping Options"
curl -X GET "$BASE_URL/options?orderValue=1800000&address=Hà%20Nội" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 11. Test SOFT DELETE shipping method
print_test "11. SOFT DELETE Shipping Method (ID: $NEW_SHIPPING_ID)"
curl -X DELETE "$BASE_URL/$NEW_SHIPPING_ID" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 12. Test RESTORE shipping method
print_test "12. RESTORE Shipping Method (ID: $NEW_SHIPPING_ID)"
curl -X PATCH "$BASE_URL/$NEW_SHIPPING_ID/restore" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 13. Test HARD DELETE shipping method
print_test "13. HARD DELETE Shipping Method (Permanent - ID: $NEW_SHIPPING_ID)"
curl -X DELETE "$BASE_URL/$NEW_SHIPPING_ID/permanent" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 14. Test validation errors
print_test "14. TEST Validation Errors (Invalid Data)"
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "Ten": "ab",
    "PhiVanChuyen": -1000,
    "TrangThai": 5
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 15. Test not found error
print_test "15. TEST Not Found Error (Non-existent ID)"
curl -X GET "$BASE_URL/99999" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

# 16. Test hard delete on non-existent record
print_test "16. TEST Hard Delete Non-existent Record"
curl -X DELETE "$BASE_URL/99999/permanent" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""

print_success "All shipping methods API tests completed!"
echo ""
print_info "Summary of tested endpoints:"
echo "  - GET    $BASE_URL (with pagination, search, filter)"
echo "  - GET    $BASE_URL/active"
echo "  - GET    $BASE_URL/:id"
echo "  - POST   $BASE_URL"
echo "  - PUT    $BASE_URL/:id"
echo "  - DELETE $BASE_URL/:id (soft delete)"
echo "  - DELETE $BASE_URL/:id/permanent (hard delete)"
echo "  - PATCH  $BASE_URL/:id/restore"
echo "  - POST   $BASE_URL/calculate"
echo "  - GET    $BASE_URL/options"
echo ""
print_info "Difference between Soft Delete vs Hard Delete:"
echo "  - Soft Delete: Sets TrangThai = 0, record remains in database"
echo "  - Hard Delete: Completely removes record from database"
echo "  - Hard Delete only works if no orders are using the shipping method"
echo ""
print_info "Make sure your server is running on http://localhost:3000"
print_info "Install jq for better JSON formatting: sudo apt-get install jq"