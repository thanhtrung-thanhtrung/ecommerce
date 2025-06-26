import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartContext } from "../contexts/CartContext";
import CartItem from "../components/Cart/CartItem";
import CartSummary from "../components/Cart/CartSummary";
import VoucherInput from "../components/Cart/VoucherInput";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    cartSubtotal,
    finalTotal,
    totalItems,
    appliedVoucher,
    voucherDiscount,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    validateVoucher,
    removeVoucher,
  } = useCartContext();

  useEffect(() => {
    // Fetch cart when component mounts
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    try {
      await updateCartItem(cartId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      await removeFromCart(cartId);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?")) {
      try {
        await clearCart();
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading && cartItems.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
              <p className="text-sm text-gray-600">
                {totalItems > 0 ? `${totalItems} sản phẩm` : "Giỏ hàng trống"}
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-gray-600 mb-8">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sản phẩm trong giỏ hàng ({totalItems})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.id_ChiTietSanPham}`} className="p-6">
                      <CartItem
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        loading={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Voucher Input */}
              <div className="mt-6">
                <VoucherInput
                  onApplyVoucher={validateVoucher}
                  onRemoveVoucher={removeVoucher}
                  appliedVoucher={appliedVoucher}
                  loading={loading}
                />
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <CartSummary
                items={cartItems}
                subtotal={cartSubtotal}
                discount={voucherDiscount}
                finalTotal={finalTotal}
                appliedVoucher={appliedVoucher}
                onCheckout={handleCheckout}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
