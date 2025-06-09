"use client";

import { formatCurrency } from "../../utils/helpers";

const CheckoutSummary = ({
  items,
  subtotal,
  shippingFee,
  total,
  onSubmit,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Đơn hàng của bạn
      </h2>

      {/* Order Items */}
      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
        {items?.map((item, index) => (
          <div key={index} className="flex items-center">
            <img
              src={item.hinhAnh || "/placeholder.svg?height=50&width=50"}
              alt={item.ten}
              className="w-12 h-12 object-cover rounded-md"
            />
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-800">{item.ten}</h4>
              <p className="text-xs text-gray-600">
                {item.kichCo && `Size: ${item.kichCo}`}{" "}
                {item.mauSac && `• ${item.mauSac}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                {formatCurrency(item.gia)}
              </div>
              <div className="text-xs text-gray-600">x{item.soLuong}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="space-y-3 mb-6 border-t pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Phí vận chuyển</span>
          <span className="font-medium">
            {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
          </span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Tổng cộng</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="text-center">
        <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
          <span className="mr-1">🔒</span>
          Thanh toán an toàn và bảo mật
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
