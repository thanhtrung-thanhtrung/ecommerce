-- Migration to support guest checkout
-- Add new columns to donhang table for guest customer information

ALTER TABLE donhang 
ADD COLUMN HoTenNguoiNhan VARCHAR(255) NULL COMMENT 'Họ tên người nhận cho đơn hàng guest',
ADD COLUMN EmailNguoiNhan VARCHAR(255) NULL COMMENT 'Email người nhận cho đơn hàng guest',
ADD COLUMN session_id VARCHAR(255) NULL COMMENT 'Session ID cho đơn hàng guest';

-- Create index for better performance on guest order lookups
CREATE INDEX idx_donhang_guest_lookup ON donhang(EmailNguoiNhan, session_id);
CREATE INDEX idx_donhang_email ON donhang(EmailNguoiNhan);

-- Update giohang table to ensure session_id column exists (if not already present)
-- ALTER TABLE giohang ADD COLUMN session_id VARCHAR(255) NULL COMMENT 'Session ID cho giỏ hàng guest';
-- CREATE INDEX idx_giohang_session ON giohang(session_id);