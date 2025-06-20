#!/bin/bash

# Revenue API Test Script
# Base URL
BASE_URL="http://localhost:3000/api/revenue"

echo "=== TESTING REVENUE API ENDPOINTS ==="
echo ""

# Test 1: GET /stats - Thống kê doanh thu theo thời gian
echo "1. Testing Revenue Stats (GET /stats)"
echo "----------------------------------------"

# Test với các tham số khác nhau
echo "• Test with date range:"
curl -X GET "${BASE_URL}/stats?startDate=2024-01-01&endDate=2024-12-31&groupBy=month" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test with year filter:"
curl -X GET "${BASE_URL}/stats?year=2024&groupBy=day" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: GET /report - Báo cáo doanh thu chi tiết
echo "2. Testing Revenue Report (GET /report)"
echo "----------------------------------------"

echo "• Test detailed report:"
curl -X GET "${BASE_URL}/report?startDate=2024-01-01&endDate=2024-12-31&includeProducts=true" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test report with category filter:"
curl -X GET "${BASE_URL}/report?startDate=2024-01-01&endDate=2024-12-31&categoryId=1" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: GET /customers - Thống kê khách hàng VIP
echo "3. Testing VIP Customers Stats (GET /customers)"
echo "------------------------------------------------"

echo "• Test VIP customers list:"
curl -X GET "${BASE_URL}/customers?limit=10&minSpent=1000000" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test customers with date range:"
curl -X GET "${BASE_URL}/customers?startDate=2024-01-01&endDate=2024-12-31&sortBy=totalSpent" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: GET /vouchers - Thống kê mã giảm giá
echo "4. Testing Voucher Stats (GET /vouchers)"
echo "-----------------------------------------"

echo "• Test voucher statistics:"
curl -X GET "${BASE_URL}/vouchers?status=active" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test voucher usage stats:"
curl -X GET "${BASE_URL}/vouchers?includeUsage=true&sortBy=usage" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: GET /dashboard - Dashboard thống kê tổng quan
echo "5. Testing Dashboard Overview (GET /dashboard)"
echo "----------------------------------------------"

echo "• Test dashboard data:"
curl -X GET "${BASE_URL}/dashboard" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test dashboard with period:"
curl -X GET "${BASE_URL}/dashboard?period=thisMonth" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 6: GET /export - Xuất báo cáo
echo "6. Testing Export Report (GET /export)"
echo "---------------------------------------"

echo "• Test export to Excel:"
curl -X GET "${BASE_URL}/export?format=excel&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test export to PDF:"
curl -X GET "${BASE_URL}/export?format=pdf&reportType=summary&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 7: GET /compare - So sánh doanh thu giữa 2 kỳ
echo "7. Testing Revenue Comparison (GET /compare)"
echo "--------------------------------------------"

echo "• Test period comparison:"
curl -X GET "${BASE_URL}/compare?period1Start=2024-01-01&period1End=2024-06-30&period2Start=2024-07-01&period2End=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test year over year comparison:"
curl -X GET "${BASE_URL}/compare?compareType=yearOverYear&year1=2023&year2=2024" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 8: GET /overview - Tổng quan doanh thu (cho admin dashboard)
echo "8. Testing Revenue Overview (GET /overview)"
echo "--------------------------------------------"

echo "• Test admin overview:"
curl -X GET "${BASE_URL}/overview" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test overview with filters:"
curl -X GET "${BASE_URL}/overview?includeProjections=true&period=quarterly" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "=== ERROR TESTING ==="
echo ""

# Test với dữ liệu không hợp lệ
echo "9. Testing Invalid Data"
echo "-----------------------"

echo "• Test với ngày không hợp lệ:"
curl -X GET "${BASE_URL}/stats?startDate=invalid-date&endDate=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test với tham số thiếu:"
curl -X GET "${BASE_URL}/compare?period1Start=2024-01-01" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "• Test với format không hỗ trợ:"
curl -X GET "${BASE_URL}/export?format=invalid&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "=== TEST COMPLETED ==="