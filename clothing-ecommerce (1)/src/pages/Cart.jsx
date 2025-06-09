import React from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartContext } from "../contexts/CartContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
// import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    updateCartItem,
    removeFromCart,
    clearCart,
  } = useCartContext();

  // const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleQuantityChange = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      await updateCartItem(id, newQuantity);
    }
  };

  const handleRemoveItem = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await removeFromCart(id);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      await clearCart();
    }
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Giỏ hàng trống
          </h3>
          <p className="text-gray-500 mb-4">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Button onClick={() => window.history.back()}>
            Tiếp tục mua sắm
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Giỏ hàng ({cartCount} sản phẩm)
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Xóa tất cả
          </Button>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.maGioHang}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <img
                  src={item.hinhAnh || "/placeholder.jpg"}
                  alt={item.tenSanPham}
                  className="w-20 h-20 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-lg">{item.tenSanPham}</h3>
                  <p className="text-gray-600">
                    Size: {item.kichThuoc} | Màu: {item.mauSac}
                  </p>
                  <p className="font-semibold text-lg">
                    {formatPrice(item.giaBan)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleQuantityChange(item.maGioHang, item.soLuong, -1)
                    }
                    disabled={loading || item.soLuong <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="mx-2 font-medium min-w-[3rem] text-center">
                    {item.soLuong}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleQuantityChange(item.maGioHang, item.soLuong, 1)
                    }
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {formatPrice(item.giaBan * item.soLuong)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.maGioHang)}
                    className="text-red-600 hover:text-red-700 mt-1"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Tổng cộng */}
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Tổng cộng:</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Tiếp tục mua sắm
              </Button>
              <Button
                className="flex-1"
                disabled={loading || cartItems.length === 0}
                onClick={() => navigate("/checkout")}
              >
                Tiến hành thanh toán
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;
