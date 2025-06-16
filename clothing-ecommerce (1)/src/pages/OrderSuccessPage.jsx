import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/helpers";
import orderAPI from "../services/orderAPI";

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { orderSuccess, orderData } = location.state || {};

  useEffect(() => {
    if (!orderSuccess) {
      navigate("/");
      return;
    }

    // Nếu có orderData từ state, sử dụng luôn
    if (orderData) {
      setOrderDetails(orderData);
      setLoading(false);
      return;
    }

    // Nếu không có orderData, fetch từ API
    const fetchOrderDetails = async () => {
      try {
        const response = await orderAPI.getOrderById(orderId);
        setOrderDetails(response.data);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("Không thể tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId, orderSuccess, orderData, navigate]);

  if (!orderSuccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200 text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-lg text-gray-600">
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.
            </p>
          </div>

          {/* Order Info */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Thông tin đơn hàng
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Mã đơn hàng:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      #{orderDetails?.id || orderId}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Tổng tiền:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(orderDetails?.TongThanhToan || 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Trạng thái:</dt>
                    <dd className="text-sm font-medium text-green-600">
                      Đang xử lý
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Thông tin giao hàng
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">
                    {orderDetails?.TenNguoiNhan || "Khách hàng"}
                  </p>
                  <p>{orderDetails?.SDTNguoiNhan}</p>
                  <p>{orderDetails?.EmailNguoiNhan}</p>
                  <p>{orderDetails?.DiaChiNhan}</p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">
                Tiếp theo sẽ như thế nào?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 mr-3">
                    1
                  </span>
                  <span>
                    Chúng tôi sẽ xác nhận đơn hàng và bắt đầu chuẩn bị hàng cho
                    bạn
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 mr-3">
                    2
                  </span>
                  <span>
                    Bạn sẽ nhận được email xác nhận với thông tin chi tiết đơn
                    hàng
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 mr-3">
                    3
                  </span>
                  <span>
                    Khi hàng được giao, bạn sẽ nhận được thông báo theo dõi vận
                    chuyển
                  </span>
                </li>
              </ul>
            </div>

            {/* Guest Order Tracking */}
            {!orderDetails?.id_NguoiDung && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-yellow-900 mb-3">
                  Tra cứu đơn hàng
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Để tra cứu đơn hàng của bạn, vui lòng sử dụng:
                </p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    <strong>Mã đơn hàng:</strong> #{orderDetails?.id || orderId}
                  </li>
                  <li>
                    <strong>Email:</strong> {orderDetails?.EmailNguoiNhan}
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/")}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tiếp tục mua sắm
              </button>

              {orderDetails?.id_NguoiDung && (
                <button
                  onClick={() => navigate("/user/orders")}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Xem đơn hàng của tôi
                </button>
              )}

              {!orderDetails?.id_NguoiDung && (
                <button
                  onClick={() => navigate("/track-order")}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tra cứu đơn hàng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
