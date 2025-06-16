<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thêm Sản Phẩm Mới</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
    }

    .container {
        max-width: 800px;
        margin: 0 auto;
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h1 {
        text-align: center;
        color: #333;
    }

    .form-group {
        margin-bottom: 15px;
    }

    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    input[type="text"],
    input[type="number"],
    textarea,
    select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }

    textarea {
        height: 100px;
    }

    button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
    }

    button:hover {
        background-color: #45a049;
    }

    .bienThe-container {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
    }

    .bienThe-item {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
    }

    .add-bienThe {
        margin-bottom: 15px;
    }

    .result {
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
    }

    .success {
        background-color: #d4edda;
        color: #155724;
    }

    .error {
        background-color: #f8d7da;
        color: #721c24;
    }
    </style>
</head>

<body>
    <div class="container">
        <h1>Thêm Sản Phẩm Mới</h1>

        <?php
        $result = "";
        $resultClass = "";
        
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $apiUrl = "http://localhost:5000/api/products/admin/create";
            
            // Chuẩn bị dữ liệu sản phẩm
            $postData = [
                'Ten' => $_POST['Ten'],
                'MoTa' => $_POST['MoTa'],
                'MoTaChiTiet' => $_POST['MoTaChiTiet'],
                'ThongSoKyThuat' => $_POST['ThongSoKyThuat'],
                'Gia' => $_POST['Gia'],
                'GiaKhuyenMai' => $_POST['GiaKhuyenMai'],
                'id_DanhMuc' => $_POST['id_DanhMuc'],
                'id_ThuongHieu' => $_POST['id_ThuongHieu'],
                'id_NhaCungCap' => $_POST['id_NhaCungCap'],
                'bienThe' => $_POST['bienThe']
            ];
            
            // Khởi tạo cURL
            $curl = curl_init($apiUrl);
            
            // Chuẩn bị dữ liệu form
            $formData = [];
            foreach ($postData as $key => $value) {
                $formData[$key] = $value;
            }
            
            // Xử lý hình ảnh
            $hinhAnh = [];
            
            // Thêm file ảnh chính
            if (isset($_FILES['anhChinh']) && $_FILES['anhChinh']['error'] == 0) {
                $formData['anhChinh'] = new CURLFile(
                    $_FILES['anhChinh']['tmp_name'],
                    $_FILES['anhChinh']['type'],
                    $_FILES['anhChinh']['name']
                );
            }
            
            // Thêm các file ảnh phụ
            if (isset($_FILES['anhPhu']) && is_array($_FILES['anhPhu']['name'])) {
                for ($i = 0; $i < count($_FILES['anhPhu']['name']); $i++) {
                    if ($_FILES['anhPhu']['error'][$i] == 0) {
                        $formData['anhPhu' . $i] = new CURLFile(
                            $_FILES['anhPhu']['tmp_name'][$i],
                            $_FILES['anhPhu']['type'][$i],
                            $_FILES['anhPhu']['name'][$i]
                        );
                    }
                }
            }
            
            // Thiết lập các options cho cURL
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $formData);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            
            // Thực hiện request
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            
            if ($response === false) {
                $result = "Lỗi khi gửi yêu cầu: " . curl_error($curl);
                $resultClass = "error";
            } else {
                if ($httpCode >= 200 && $httpCode < 300) {
                    $result = "Thêm sản phẩm thành công! Phản hồi: " . $response;
                    $resultClass = "success";
                } else {
                    $result = "Lỗi khi thêm sản phẩm. Mã lỗi: " . $httpCode . ". Phản hồi: " . $response;
                    $resultClass = "error";
                }
            }
            
            curl_close($curl);
        }
        ?>

        <?php if (!empty($result)): ?>
        <div class="result <?php echo $resultClass; ?>">
            <?php echo $result; ?>
        </div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label for="Ten">Tên sản phẩm</label>
                <input type="text" name="Ten" required>
            </div>

            <div class="form-group">
                <label for="MoTa">Mô tả</label>
                <textarea name="MoTa" required></textarea>
            </div>

            <div class="form-group">
                <label for="MoTaChiTiet">Mô tả chi tiết</label>
                <textarea name="MoTaChiTiet" required></textarea>
            </div>

            <div class="form-group">
                <label for="ThongSoKyThuat">Thông số kỹ thuật (JSON)</label>
                <textarea name="ThongSoKyThuat" required>
{
  "ChatLieu": "Vải mesh, cao su",
  "KieuGiay": "Thể thao",
  "XuatXu": "Chính hãng"
}
        </textarea>
            </div>

            <div class="form-group">
                <label for="Gia">Giá</label>
                <input type="number" name="Gia" required>
            </div>

            <div class="form-group">
                <label for="GiaKhuyenMai">Giá khuyến mãi</label>
                <input type="number" name="GiaKhuyenMai">
            </div>

            <div class="form-group">
                <label for="id_DanhMuc">Danh mục</label>
                <input type="number" name="id_DanhMuc" required>
            </div>

            <div class="form-group">
                <label for="id_ThuongHieu">Thương hiệu</label>
                <input type="number" name="id_ThuongHieu" required>
            </div>

            <div class="form-group">
                <label for="id_NhaCungCap">Nhà cung cấp</label>
                <input type="number" name="id_NhaCungCap" required>
            </div>

            <div class="form-group">
                <label for="bienThe">Biến thể (JSON)</label>
                <textarea name="bienThe" required>
[
  { "id_KichCo": 1, "id_MauSac": 1, "MaSanPham": "NIKE-AM2023-DEN-39", "SoLuong": 10 },
  { "id_KichCo": 2, "id_MauSac": 1, "MaSanPham": "NIKE-AM2023-DEN-40", "SoLuong": 15 }
]
        </textarea>
            </div>

            <div class="form-group">
                <label for="anhChinh">Ảnh chính</label>
                <input type="file" name="anhChinh" accept="image/*" required>
            </div>

            <div class="form-group">
                <label for="anhPhu[]">Ảnh phụ (chọn nhiều)</label>
                <input type="file" name="anhPhu[]" multiple accept="image/*">
            </div>

            <button type="submit">Thêm sản phẩm</button>
        </form>

    </div>
</body>

</html>