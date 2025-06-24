# 📧 Hệ thống Email Tự động cho Đơn hàng

Hệ thống gửi email thông báo tự động khi cập nhật trạng thái đơn hàng với template HTML đẹp mắt và responsive.

## ✨ Tính năng

- ✅ **Gửi email tự động** khi admin cập nhật trạng thái đơn hàng
- ✅ **Template HTML đẹp** với màu sắc theo từng trạng thái
- ✅ **Responsive design** tương thích mobile
- ✅ **Chi tiết đơn hàng** đầy đủ trong email
- ✅ **Link theo dõi** đơn hàng
- ✅ **Text fallback** cho email client cũ
- ✅ **Error handling** và logging

## 🎯 Các trạng thái hỗ trợ

| Status       | Mô tả       | Màu sắc   | Email Subject                          |
| ------------ | ----------- | --------- | -------------------------------------- |
| `confirmed`  | Đã xác nhận | 🔵 Blue   | ✅ Đơn hàng #X đã được xác nhận        |
| `processing` | Đang xử lý  | 🟣 Purple | 📦 Đơn hàng #X đang được xử lý         |
| `shipping`   | Đang giao   | 🟢 Green  | 🚚 Đơn hàng #X đang được giao          |
| `delivered`  | Đã giao     | 🟢 Green  | ✅ Đơn hàng #X đã được giao thành công |
| `cancelled`  | Đã hủy      | 🔴 Red    | ❌ Đơn hàng #X đã bị hủy               |

## 🔧 Cấu hình

### 1. Cấu hình Gmail (Khuyến nghị)

1. **Bật 2-Step Verification** cho Gmail:

   - Vào [Google Account Security](https://myaccount.google.com/security)
   - Bật "2-Step Verification"

2. **Tạo App Password**:

   - Vào [App Passwords](https://myaccount.google.com/apppasswords)
   - Chọn "Mail" và "Other (custom name)"
   - Nhập tên: "Shoes Shop"
   - Copy mật khẩu 16 ký tự

3. **Cập nhật file .env**:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:5714
```

### 2. Cấu hình Provider khác

#### Outlook/Hotmail:

```env
EMAIL_USER=yourname@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo:

```env
EMAIL_USER=yourname@yahoo.com
EMAIL_PASS=your-password
```

## 🚀 Sử dụng

### Tự động (Khuyến nghị)

Email sẽ tự động được gửi khi admin cập nhật trạng thái đơn hàng:

```javascript
// Khi admin cập nhật trạng thái từ admin dashboard
// Email sẽ tự động gửi đến khách hàng
```

### Manual API Testing

#### 1. Test cấu hình email:

```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### 2. Test email trạng thái đơn hàng:

```bash
curl -X POST http://localhost:5000/api/email/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 9,
    "status": "shipping",
    "note": "Đơn hàng đang được giao bởi Giao Hàng Nhanh"
  }'
```

#### 3. Test qua admin API (với auto email):

```bash
curl -X PATCH http://localhost:5000/api/orders/admin/9/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "note": "Đã giao thành công"
  }'
```

## 🧪 Testing Scripts

### Linux/Mac:

```bash
chmod +x test-email-system.sh
./test-email-system.sh
```

### Windows PowerShell:

```powershell
.\test-email-system.ps1
```

## 📧 Email Template Preview

Email sẽ bao gồm:

```
┌─────────────────────────────────────────┐
│  👟 SHOES SHOP                          │
│  Đơn hàng đang được giao                │
└─────────────────────────────────────────┘
│                                         │
│  Xin chào [Tên khách hàng],             │
│                                         │
│  [Trạng thái] Đơn hàng của bạn đã được  │
│  giao cho đơn vị vận chuyển...          │
│                                         │
│  📋 Thông tin đơn hàng                  │
│  ├─ Mã đơn hàng: #9                     │
│  ├─ Ngày đặt: 24 tháng 6, 2025          │
│  ├─ Địa chỉ: [Địa chỉ giao hàng]       │
│  └─ Tổng tiền: 2.500.000₫               │
│                                         │
│  📦 Sản phẩm đã đặt                     │
│  ┌───────────────────────────────────┐   │
│  │ Nike Air Max | Size 42 | Đen     │   │
│  │ x1 | 2.500.000₫                  │   │
│  └───────────────────────────────────┘   │
│                                         │
│  🔄 Bước tiếp theo                      │
│  Vui lòng chuẩn bị nhận hàng...         │
│                                         │
│  [🔍 Theo dõi đơn hàng]                 │
│                                         │
│  Lưu ý tra cứu:                        │
│  • Mã đơn hàng: #9                     │
│  • Email: customer@example.com         │
└─────────────────────────────────────────┘
```

## 🔍 Debug & Troubleshooting

### Kiểm tra log server

```bash
# Terminal chạy server sẽ hiển thị:
📧 Đang gửi email thông báo trạng thái đơn hàng #9 từ 2 -> 4 đến customer@email.com
✅ Đã gửi email thành công cho đơn hàng #9
```

### Lỗi thường gặp

#### 1. "Invalid login" - Gmail

**Nguyên nhân**: Chưa bật 2FA hoặc sai App Password
**Giải pháp**: Làm theo hướng dẫn cấu hình Gmail ở trên

#### 2. "ECONNREFUSED"

**Nguyên nhân**: Không kết nối được SMTP server
**Giải pháp**: Kiểm tra internet và firewall

#### 3. Email không được gửi nhưng không có lỗi

**Nguyên nhân**: Email có thể vào spam
**Giải pháp**: Kiểm tra thư mục spam/junk

### Kiểm tra email logs (nếu có bảng email_logs)

```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

## 📝 API Documentation

### POST /api/email/test

Test cấu hình email cơ bản.

**Request:**

```json
{
  "email": "test@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email test đã được gửi thành công",
  "data": {
    "messageId": "...",
    "message": "Test email sent successfully"
  }
}
```

### POST /api/email/order-status

Gửi email thông báo trạng thái đơn hàng thủ công.

**Request:**

```json
{
  "orderId": 9,
  "status": "shipping",
  "note": "Ghi chú từ admin (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email thông báo trạng thái đã được gửi",
  "data": {
    "messageId": "...",
    "recipient": "customer@example.com"
  }
}
```

## 🎨 Customization

### Thay đổi template email

Chỉnh sửa file `src/services/email.service.js`:

```javascript
// Thay đổi màu sắc
getOrderStatusTemplate(orderData, status) {
  const statusTemplates = {
    confirmed: {
      color: "#YOUR_COLOR", // Thay đổi màu
      title: "Your Custom Title", // Thay đổi tiêu đề
      // ...
    }
  }
}

// Thay đổi HTML template
createEmailHTML(orderData, status, template) {
  return `
    <!DOCTYPE html>
    <html>
    <!-- Your custom HTML -->
    </html>
  `;
}
```

### Thêm trạng thái mới

```javascript
// Trong getOrderStatusTemplate()
const statusTemplates = {
  // ...existing statuses...
  custom_status: {
    subject: `🆕 Custom Status for Order #${orderData.id}`,
    title: "Custom Status Title",
    message: "Custom message...",
    color: "#FF6B6B",
    nextStep: "Custom next step...",
  },
};
```

## 🚨 Security Notes

- ✅ App Password được khuyến nghị thay vì mật khẩu Gmail thường
- ✅ Email logs có thể chứa thông tin nhạy cảm
- ✅ Giới hạn rate limit cho email API
- ✅ Validate input để tránh email spam

## 📊 Production Recommendations

1. **Rate Limiting**: Giới hạn số email gửi/phút
2. **Queue System**: Sử dụng Redis/RabbitMQ cho email queue
3. **Email Service**: Cân nhắc SendGrid, AWS SES cho production
4. **Monitoring**: Monitor email delivery rates
5. **Backup SMTP**: Cấu hình multiple SMTP providers

---

**🎉 Chúc bạn sử dụng thành công!**

Hệ thống email này sẽ giúp cải thiện trải nghiệm khách hàng và tự động hóa quy trình thông báo đơn hàng.
