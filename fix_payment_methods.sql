-- Cập nhật tên phương thức thanh toán
UPDATE hinhthucthanhtoan SET Ten = 'COD' WHERE id = 1;

-- Cập nhật mô tả cho rõ ràng hơn
UPDATE hinhthucthanhtoan SET MoTa = 'Thanh toán khi nhận hàng (Cash on Delivery)' WHERE id = 1;
UPDATE hinhthucthanhtoan SET MoTa = 'Thanh toán trực tuyến qua VNPay' WHERE id = 7;