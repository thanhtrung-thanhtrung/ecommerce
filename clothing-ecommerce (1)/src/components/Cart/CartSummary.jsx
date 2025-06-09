"use client"

import { useState } from "react"
import { formatCurrency } from "../../utils/helpers"

const CartSummary = ({ totalAmount, onCheckout }) => {
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [couponSuccess, setCouponSuccess] = useState("")

  const handleApplyCoupon = (e) => {
    e.preventDefault()

    // Reset states
    setCouponError("")
    setCouponSuccess("")

    if (!couponCode.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá")
      return
    }

    // Simulate coupon validation
    const validCoupons = {
      WELCOME10: { discount: 0.1, description: "Giảm 10%" },
      SAVE20: { discount: 0.2, description: "Giảm 20%" },
      FREESHIP: { discount: 50000, description: "Miễn phí vận chuyển" },
    }

    const coupon = validCoupons[couponCode.toUpperCase()]

    if (coupon) {
      const discountAmount = coupon.discount < 1 ? totalAmount * coupon.discount : coupon.discount

      setDiscount(discountAmount)
      setCouponSuccess(`Áp dụng thành công: ${coupon.description}`)
    } else {
      setCouponError("Mã giảm giá không hợp lệ")
    }
  }

  const finalTotal = Math.max(0, totalAmount - discount)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Tóm tắt đơn hàng</h2>

      {/* Coupon Code */}
      <form onSubmit={handleApplyCoupon} className="mb-6">
        <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
          Mã giảm giá
        </label>
        <div className="flex">
          <input
            type="text"
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Nhập mã giảm giá"
            className="flex-1 form-input rounded-r-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 transition-colors"
          >
            Áp dụng
          </button>
        </div>
        {couponError && <p className="text-red-600 text-sm mt-1">{couponError}</p>}
        {couponSuccess && <p className="text-green-600 text-sm mt-1">{couponSuccess}</p>}
      </form>

      {/* Order Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Phí vận chuyển</span>
          <span className="text-gray-600">Tính khi thanh toán</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Tổng cộng</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button onClick={onCheckout} className="w-full btn-primary py-3 text-lg">
        Tiến hành thanh toán
      </button>

      {/* Security Info */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <span className="mr-1">🔒</span>
          Thanh toán an toàn và bảo mật
        </div>
      </div>
    </div>
  )
}

export default CartSummary
