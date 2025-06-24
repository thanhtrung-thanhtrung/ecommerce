# Test CRUD API cho Shipping Methods - PowerShell Version
# Base URL của API
$BASE_URL = "http://localhost:3000/api/shipping"

Write-Host "=== TESTING SHIPPING METHODS CRUD API ===" -ForegroundColor Cyan
Write-Host ""

# Function to make HTTP requests
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Description
    )
    
    Write-Host "==== $Description ====" -ForegroundColor Blue
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        
        Write-Host "✓ Success" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# 1. Test GET all shipping methods
Invoke-ApiTest -Method "GET" -Url "$BASE_URL?page=1&limit=5" -Description "1. GET All Shipping Methods (Pagination)"

# 2. Test GET active shipping methods
Invoke-ApiTest -Method "GET" -Url "$BASE_URL/active" -Description "2. GET Active Shipping Methods"

# 3. Test CREATE new shipping method
$createBody = @{
    Ten = "Giao hàng siêu nhanh TEST"
    MoTa = "Giao hàng trong 4-6 giờ"
    PhiVanChuyen = 120000
    ThoiGianDuKien = "4-6 giờ"
    TrangThai = 1
} | ConvertTo-Json

$createResponse = Invoke-ApiTest -Method "POST" -Url $BASE_URL -Body $createBody -Description "3. CREATE New Shipping Method"

# Try to extract ID for further tests
$newShippingId = 1
try {
    $createObj = $createResponse | ConvertFrom-Json
    if ($createObj.data.id) {
        $newShippingId = $createObj.data.id
    }
} catch {
    Write-Host "Using default ID for tests" -ForegroundColor Yellow
}

# 4. Test GET shipping method by ID
Invoke-ApiTest -Method "GET" -Url "$BASE_URL/$newShippingId" -Description "4. GET Shipping Method by ID: $newShippingId"

# 5. Test UPDATE shipping method
$updateBody = @{
    Ten = "Giao hàng siêu nhanh TEST UPDATED"
    MoTa = "Giao hàng trong 3-5 giờ (đã cập nhật)"
    PhiVanChuyen = 100000
    ThoiGianDuKien = "3-5 giờ"
} | ConvertTo-Json

Invoke-ApiTest -Method "PUT" -Url "$BASE_URL/$newShippingId" -Body $updateBody -Description "5. UPDATE Shipping Method"

# 6. Test UPDATE STATUS to disabled (0)
$statusBody = @{
    TrangThai = 0
} | ConvertTo-Json

Invoke-ApiTest -Method "PATCH" -Url "$BASE_URL/$newShippingId/status" -Body $statusBody -Description "6. UPDATE Status to Disabled (0)"

# 7. Test UPDATE STATUS to enabled (1)
$statusBody = @{
    TrangThai = 1
} | ConvertTo-Json

Invoke-ApiTest -Method "PATCH" -Url "$BASE_URL/$newShippingId/status" -Body $statusBody -Description "7. UPDATE Status to Enabled (1)"

# 8. Test SEARCH shipping methods
Invoke-ApiTest -Method "GET" -Url "$BASE_URL?search=giao&page=1&limit=10" -Description "8. SEARCH Shipping Methods"

# 9. Test CALCULATE shipping fee
$calculateBody = @{
    id_VanChuyen = 1
    tongGiaTriDonHang = 1500000
    diaChi = "123 Nguyễn Văn Linh, Quận 7, TP.HCM"
} | ConvertTo-Json

Invoke-ApiTest -Method "POST" -Url "$BASE_URL/calculate" -Body $calculateBody -Description "9. CALCULATE Shipping Fee"

# 10. Test GET shipping options
Invoke-ApiTest -Method "GET" -Url "$BASE_URL/options?orderValue=1800000&address=Hà Nội" -Description "10. GET Shipping Options"

# 11. Test HARD DELETE (xóa cứng)
Invoke-ApiTest -Method "DELETE" -Url "$BASE_URL/$newShippingId/permanent" -Description "11. HARD DELETE Shipping Method (Permanent)"

# 12. Test validation errors for status update
$invalidStatusBody = @{
    TrangThai = 5
} | ConvertTo-Json

Invoke-ApiTest -Method "PATCH" -Url "$BASE_URL/1/status" -Body $invalidStatusBody -Description "12. TEST Invalid Status Value"

# 13. Test validation errors
$invalidBody = @{
    Ten = "ab"
    PhiVanChuyen = -1000
    TrangThai = 5
} | ConvertTo-Json

Invoke-ApiTest -Method "POST" -Url $BASE_URL -Body $invalidBody -Description "13. TEST Validation Errors"

# 14. Test hard delete on non-existent record
Invoke-ApiTest -Method "DELETE" -Url "$BASE_URL/99999/permanent" -Description "14. TEST Hard Delete Non-existent Record"

Write-Host "=== TESTING COMPLETED ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary of tested endpoints:" -ForegroundColor Yellow
Write-Host "  - GET    $BASE_URL (with pagination, search, filter)"
Write-Host "  - GET    $BASE_URL/active"
Write-Host "  - GET    $BASE_URL/:id"
Write-Host "  - POST   $BASE_URL"
Write-Host "  - PUT    $BASE_URL/:id"
Write-Host "  - PATCH  $BASE_URL/:id/status (Update status 0/1 via JSON)"
Write-Host "  - DELETE $BASE_URL/:id/permanent (hard delete only)"
Write-Host "  - POST   $BASE_URL/calculate"
Write-Host "  - GET    $BASE_URL/options"
Write-Host ""
Write-Host "Status Management:" -ForegroundColor Green
Write-Host '  Disable: curl -X PATCH http://localhost:3000/api/shipping/5/status -H "Content-Type: application/json" -d "{\"TrangThai\": 0}"' -ForegroundColor White
Write-Host '  Enable:  curl -X PATCH http://localhost:3000/api/shipping/5/status -H "Content-Type: application/json" -d "{\"TrangThai\": 1}"' -ForegroundColor White
Write-Host ""
Write-Host "Operations available:" -ForegroundColor Green
Write-Host "  - Status Update: Updates TrangThai field via JSON (0=disabled, 1=enabled)" -ForegroundColor White
Write-Host "  - Hard Delete: Completely removes record from database" -ForegroundColor White
Write-Host "  - Hard Delete only works if no orders are using the shipping method" -ForegroundColor White
Write-Host ""
Write-Host "Removed endpoints:" -ForegroundColor Red
Write-Host "  - DELETE $BASE_URL/:id (soft delete) - REMOVED" -ForegroundColor White
Write-Host "  - PATCH  $BASE_URL/:id/restore - REMOVED" -ForegroundColor White
Write-Host ""
Write-Host "Make sure your server is running on http://localhost:3000" -ForegroundColor Green