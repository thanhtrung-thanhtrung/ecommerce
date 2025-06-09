"use client";

import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";

const OrderCard = ({ order, onCancel }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 1:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Package className="h-5 w-5 text-blue-500" />;
      case 3:
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 4:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 5:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      1: "Chờ xác nhận",
      2: "Đã xác nhận",
      3: "Đang giao",
      4: "Đã giao",
      5: "Đã hủy",
    };
    return statusMap[status] || "Không xác định";
  };

  const getStatusColor = (status) => {
    const colorMap = {
      1: "text-yellow-600 bg-yellow-50",
      2: "text-blue-600 bg-blue-50",
      3: "text-purple-600 bg-purple-50",
      4: "text-green-600 bg-green-50",
      5: "text-red-600 bg-red-50",
    };
    return colorMap[status] || "text-gray-600 bg-gray-50";
  };

  const canCancel = order.trangThai === 1 || order.trangThai === 2;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Đơn hàng #{order.id}
          </h3>
          <p className="text-sm text-gray-600">
            Đặt ngày: {formatDate(order.ngayTao)}
          </p>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          {getStatusIcon(order.trangThai)}
          <span
            className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              order.trangThai
            )}`}
          >
            {getStatusText(order.trangThai)}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {order.sanPham?.slice(0, 2).map((item, index) => (
          <div key={index} className="flex items-center">
            <img
              src={item.hinhAnh || "/placeholder.svg?height=60&width=60"}
              alt={item.ten}
              className="w-12 h-12 object-cover rounded-md"
            />
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-800">{item.ten}</h4>
              <p className="text-xs text-gray-600">
                {item.kichCo && `Size: ${item.kichCo}`}{" "}
                {item.mauSac && `• Màu: ${item.mauSac}`} • SL: {item.soLuong}
              </p>
            </div>
            <div className="text-sm font-medium text-gray-800">
              {formatCurrency(item.gia)}
            </div>
          </div>
        ))}
        {order.sanPham?.length > 2 && (
          <p className="text-sm text-gray-600">
            và {order.sanPham.length - 2} sản phẩm khác...
          </p>
        )}
      </div>

      {/* Order Total */}
      <div className="flex justify-between items-center py-3 border-t">
        <span className="text-sm text-gray-600">Tổng tiền:</span>
        <span className="text-lg font-bold text-gray-800">
          {formatCurrency(order.tongTien)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link
          to={`/orders/${order.id}`}
          className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Xem chi tiết
        </Link>
        {order.trangThai === 3 && (
          <Link
            to={`/orders/${order.id}/track`}
            className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Theo dõi đơn hàng
          </Link>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(order.id, "Khách hàng yêu cầu hủy")}
            className="flex-1 py-2 px-4 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Hủy đơn hàng
          </button>
        )}
        {order.trangThai === 4 && (
          <Link
            to={`/products/${order.sanPham?.[0]?.id}?review=true`}
            className="flex-1 text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Đánh giá
          </Link>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
