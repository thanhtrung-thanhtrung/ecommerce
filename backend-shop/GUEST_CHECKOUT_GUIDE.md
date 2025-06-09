# Guest Checkout Implementation

## Overview

This implementation adds guest checkout functionality to the shoes shop backend, allowing customers to purchase products without creating an account.

## Key Features

- **Guest Shopping Cart**: Users can add items to cart using session-based storage
- **Guest Checkout**: Complete purchase process without authentication
- **Order Tracking**: Guests can track orders using order ID + email
- **Order Cancellation**: Guests can cancel orders using email verification
- **Session Management**: Seamless cart experience with session persistence

## Database Changes

The following columns were added to support guest checkout:

### `donhang` table

- `HoTenNguoiNhan` VARCHAR(255) NULL - Customer name for guest orders
- `EmailNguoiNhan` VARCHAR(255) NULL - Customer email for guest orders
- `session_id` VARCHAR(255) NULL - Session ID for guest orders

### Indexes

- `idx_donhang_guest_lookup` - For efficient guest order lookups
- `idx_donhang_email` - For email-based order tracking

## API Endpoints

### Cart Management (Guest + Authenticated)

- `GET /api/cart` - Get cart items (optional auth)
- `POST /api/cart` - Add item to cart (optional auth)
- `PUT /api/cart/:id` - Update cart item (optional auth)
- `DELETE /api/cart/:id` - Remove cart item (optional auth)
- `DELETE /api/cart` - Clear cart (optional auth)
- `POST /api/cart/merge` - Merge guest cart to user account (auth required)

### Order Management

#### Authenticated Users

- `POST /api/orders` - Create order (optional auth)
- `GET /api/orders/:id` - Get order details (auth required)
- `POST /api/orders/:id/cancel` - Cancel order (auth required)
- `GET /api/orders` - Order history (auth required)

#### Guest Users

- `POST /api/orders` - Create guest order (no auth, requires hoTen + email)
- `GET /api/orders/guest/:id?email=xxx` - Track guest order
- `POST /api/orders/guest/:id/cancel` - Cancel guest order

### Payment

- `POST /api/payments/create` - Create payment (optional auth)
- Payment callbacks work for both guest and authenticated orders

## Usage Examples

### 1. Guest Cart Flow

```javascript
// Add item to cart (guest)
POST /api/cart
{
  "id_ChiTietSanPham": 1,
  "soLuong": 2
}
// Session cookie will be automatically created

// View cart
GET /api/cart
// Returns cart items for the session
```

### 2. Guest Checkout Flow

```javascript
// Create guest order
POST /api/orders
{
  "hoTen": "Nguyen Van A",
  "email": "customer@example.com",
  "diaChiGiao": "123 Main St, City",
  "soDienThoai": "0123456789",
  "id_ThanhToan": 1,
  "id_VanChuyen": 1,
  "magiamgia": "DISCOUNT10",
  "ghiChu": "Giao hàng buổi sáng"
}
// Returns order details with order ID
```

### 3. Guest Order Tracking

```javascript
// Track order by ID and email
GET /api/orders/guest/123?email=customer@example.com
// Returns order details if email matches
```

### 4. Guest Order Cancellation

```javascript
// Cancel guest order
POST /api/orders/guest/123/cancel
{
  "email": "customer@example.com",
  "lyDoHuy": "Changed mind"
}
```

### 5. Guest Payment

```javascript
// Create payment for guest order
POST /api/payments/create
{
  "maDonHang": 123,
  "maHinhThucThanhToan": 1
}
// Works without authentication for guest orders
```

## Security Considerations

### Guest Order Access Control

- Guest orders can only be accessed with email verification
- Order details require matching email address
- No sensitive user information is exposed

### Session Management

- Sessions are used for cart persistence
- Session data is cleared after order completion
- No permanent user data stored in sessions

### Data Privacy

- Guest customer information is stored only for order fulfillment
- Email addresses are required for order communication
- No account creation unless explicitly requested

## Migration Instructions

1. **Run Database Migration**:

```sql
-- Execute the migration file
source backend-shop/src/database/migrations/add_guest_checkout_support.sql
```

2. **Environment Setup**:
   Ensure session management is configured in your Express app:

```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);
```

3. **Frontend Integration**:

- Update cart components to work without authentication
- Add guest checkout form with required fields
- Implement order tracking page for guests
- Handle session persistence across page reloads

## Error Handling

### Common Guest Checkout Errors

- `"Vui lòng cung cấp họ tên và email để đặt hàng"` - Missing customer info
- `"Không tìm thấy session để tạo đơn hàng"` - Session not found
- `"Đơn hàng không tồn tại hoặc email không khớp"` - Invalid order/email combo
- `"Giỏ hàng trống"` - No items in cart

### Validation

- Guest orders require: `hoTen`, `email`, `diaChiGiao`, `soDienThoai`
- Email format validation is handled by existing validators
- Phone number format validation is applied

## Testing

### Test Scenarios

1. **Guest Cart Operations**

   - Add/remove items without login
   - Update quantities
   - Clear cart

2. **Guest Checkout**

   - Complete order with all required fields
   - Handle missing customer information
   - Process payment methods (COD, VNPay, etc.)

3. **Order Management**

   - Track orders with correct email
   - Prevent access with wrong email
   - Cancel orders within allowed timeframe

4. **Session Handling**
   - Cart persistence across browser sessions
   - Session cleanup after order completion
   - Cart merging when user logs in

## Benefits

### For Customers

- **Faster Checkout**: No account creation required
- **Privacy**: Minimal data collection
- **Flexibility**: Can create account later if desired

### For Business

- **Higher Conversion**: Reduced checkout friction
- **Better UX**: Streamlined purchase process
- **Customer Acquisition**: Convert guests to registered users over time

## Future Enhancements

- Guest order history via email lookup
- Option to create account during/after checkout
- Guest wishlist functionality
- Email notifications for order updates
