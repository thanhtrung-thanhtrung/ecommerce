"use client"

import React from "react";
import { formatCurrency } from "../../utils/helpers";

const CartSummary = ({
  items = [],
  subtotal = 0,
  discount = 0,
  finalTotal = 0,
  appliedVoucher = null,
  onCheckout,
  loading = false
}) => {
  // Tính toán tiết kiệm từ giá khuyến mãi
  const totalSavingsFromDiscounts = items.reduce((sum, item) => {
    const originalPrice = item.gia || item.Gia || 0;
    const salePrice = item.GiaKhuyenMai || null;
    const quantity = item.soLuong || item.SoLuong || item.quantity || 0;

    if (salePrice && salePrice < originalPrice) {
      return sum + ((originalPrice - salePrice) * quantity);
    }
    return sum;
  }, 0);

  // Tính lại tổng phụ (subtotal) từ items (nếu cần)
  const computedSubtotal = items.reduce((sum, item) => {
    const price = (item.GiaKhuyenMai && item.GiaKhuyenMai < (item.gia || item.Gia || 0))
      ? item.GiaKhuyenMai
      : (item.gia || item.Gia || 0);
    const quantity = item.soLuong || item.SoLuong || item.quantity || 0;
    return sum + price * quantity;
  }, 0);

  // Tính tổng cuối cùng sau giảm giá (voucher)
  const computedFinalTotal = Math.max(0, computedSubtotal - (discount || 0));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Tóm tắt đơn hàng
      </h2>

      {/* Tạm tính */}
      <div className="space-y-3 border-b border-gray-200 pb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tạm tính ({items.length} sản phẩm)</span>
          <span className="font-medium">{formatCurrency(computedSubtotal)}</span>
        </div>

        {/* Hiển thị tiết kiệm từ khuyến mãi */}
        {totalSavingsFromDiscounts > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Tiết kiệm từ khuyến mãi</span>
            <span>-{formatCurrency(totalSavingsFromDiscounts)}</span>
          </div>
        )}

        {/* Hiển thị voucher discount */}
        {appliedVoucher && discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Voucher: {appliedVoucher.Ten}</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Phí vận chuyển</span>
          <span className="text-green-600">Miễn phí</span>
        </div>
      </div>

      {/* Tổng cộng */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-lg font-semibold">
          <span>Tổng cộng</span>
          <span className="text-primary-600">{formatCurrency(computedFinalTotal)}</span>
        </div>

        {/* Hiển thị tổng tiết kiệm */}
        {(totalSavingsFromDiscounts + (discount || 0)) > 0 && (
          <div className="text-sm text-green-600 text-right">
            Bạn đã tiết kiệm: {formatCurrency(totalSavingsFromDiscounts + (discount || 0))}
          </div>
        )}
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={loading || items.length === 0}
        className="w-full mt-6 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang xử lý..." : "Tiến hành thanh toán"}
      </button>

      {/* Security info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>🔒 Thanh toán an toàn và bảo mật</p>
        <p>✓ Hỗ trợ nhiều hình thức thanh toán</p>
      </div>
    </div>
  );
};

export default CartSummary;
