import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import { FiCheckCircle, FiMail, FiPhone, FiMapPin, FiCreditCard, FiTruck } from "react-icons/fi";
import { formatCurrency } from "../utils/helpers";

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useShop();

  const [orderData, setOrderData] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
      setIsGuest(location.state.isGuest || false);
    }
  }, [location.state]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Tính toán lại các trường tổng tiền, giảm giá, phí ship cho chuẩn
  const subtotal = Number(orderData.TongTienHang || orderData.subtotal || 0);
  const shippingFee = Number(orderData.PhiVanChuyen || 0);
  const discount = Number(orderData.GiamGia || 0);
  const total = Number(orderData.TongThanhToan || orderData.total || (subtotal + shippingFee - discount));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FiCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mb-4">
            Cảm ơn bạn đã tin tưởng và mua sắm tại cửa hàng chúng tôi.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-blue-800 font-medium">
              Mã đơn hàng: <span className="font-bold">#{orderId}</span>
            </p>
            {orderData.NgayDatHang && (
              <p className="text-blue-700 text-sm mt-1">
                Thời gian đặt: {formatDate(orderData.NgayDatHang)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Thông tin đơn hàng
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FiMail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{orderData.EmailNguoiNhan}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FiPhone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium">{orderData.SDTNguoiNhan}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                  <p className="font-medium">{orderData.DiaChiNhan}</p>
                </div>
              </div>

              {orderData.GhiChu && (
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 mt-1 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ghi chú</p>
                    <p className="font-medium">{orderData.GhiChu}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Shipping Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Thanh toán & Vận chuyển
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FiCreditCard className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                  <p className="font-medium">
                    {orderData.paymentMethod || "Thanh toán khi nhận hàng"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FiTruck className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phương thức vận chuyển</p>
                  <p className="font-medium">
                    {orderData.shippingMethod || "Giao hàng tiêu chuẩn"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span>{formatCurrency(shippingFee)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Bước tiếp theo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800">Xác nhận đơn hàng</p>
                <p className="text-sm text-gray-600">
                  Chúng tôi sẽ gọi điện xác nhận đơn hàng trong vòng 2 giờ
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800">Chuẩn bị hàng</p>
                <p className="text-sm text-gray-600">
                  Đơn hàng sẽ được chuẩn bị và đóng gói cẩn thận
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800">Giao hàng</p>
                <p className="text-sm text-gray-600">
                  Hàng sẽ được giao trong vòng 2-3 ngày làm việc
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <p className="font-medium text-gray-800">Nhận hàng</p>
                <p className="text-sm text-gray-600">
                  Kiểm tra hàng và thanh toán (nếu COD)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Actions */}
        <div className="mt-8 text-center space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Lưu ý:</strong> {isGuest
                ? "Thông tin đơn hàng đã được gửi qua email. Bạn có thể tra cứu đơn hàng bằng số điện thoại."
                : "Bạn có thể theo dõi đơn hàng trong mục 'Đơn hàng của tôi'."
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>

            {isAuthenticated && !isGuest && (
              <Link
                to="/account/orders"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Xem đơn hàng của tôi
              </Link>
            )}

            <Link
              to="/contact"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>

          <div className="text-sm text-gray-600">
            <p>Cần hỗ trợ? Gọi hotline: <strong>1900 1234</strong></p>
            <p>Hoặc email: <strong>support@shoesstore.com</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
