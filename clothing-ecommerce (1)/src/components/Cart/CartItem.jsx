"use client";

import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

const CartItem = ({ item, onUpdateQuantity, onRemove, loading }) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  // Use computed fields from CartContext mapping
  const productName = item.Ten || item.name || 'Sản phẩm';
  // Chuẩn hóa giá gốc và giá khuyến mãi
  const originalPrice = item.gia || item.Gia || 0;
  const salePrice = (item.GiaKhuyenMai !== undefined && item.GiaKhuyenMai !== null) ? item.GiaKhuyenMai : null;
  // Giá cuối cùng: nếu có giá khuyến mãi hợp lệ và nhỏ hơn giá gốc thì lấy giá khuyến mãi, ngược lại lấy giá gốc
  const finalPrice = (salePrice !== null && salePrice < originalPrice) ? salePrice : originalPrice;
  const quantity = item.soLuong || item.SoLuong || item.quantity || 0;
  const image = item.anhChinh || item.image || '/placeholder.jpg';
  const size = item.kichCo || item.size || '';
  const color = item.mauSac || item.color || '';
  const brand = item.tenThuongHieu || item.brand || '';
  const stock = item.SoLuongTon || item.stock || 0;

  // Tính phần trăm giảm giá thực tế
  const hasDiscount = salePrice !== null && salePrice < originalPrice;
  const discountPercent = hasDiscount && originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

  return (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={image}
          alt={productName}
          className="w-20 h-20 object-cover rounded-md"
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {productName}
        </h3>

        {brand && (
          <p className="text-sm text-gray-500">{brand}</p>
        )}

        {/* Size and Color */}
        <div className="flex items-center space-x-4 mt-1">
          {size && (
            <span className="text-sm text-gray-600">
              Size: <span className="font-medium">{size}</span>
            </span>
          )}
          {color && (
            <span className="text-sm text-gray-600">
              Màu: <span className="font-medium">{color}</span>
            </span>
          )}
        </div>

        {/* Stock warning */}
        {stock > 0 && stock <= 10 && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ Chỉ còn {stock} sản phẩm
          </p>
        )}
        {stock === 0 && (
          <p className="text-sm text-red-600 mt-1">
            ❌ Hết hàng
          </p>
        )}

        {/* Price - Theo nghiệp vụ web bán giày */}
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(finalPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(originalPrice)}
              </span>
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={loading || quantity <= 1}
          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="w-12 text-center text-sm font-medium">
          {quantity}
        </span>

        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={loading || quantity >= stock || stock === 0}
          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={loading}
        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Xóa sản phẩm"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Total Price */}
      <div className="text-right min-w-[100px]">
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(finalPrice * quantity)}
        </p>
        {hasDiscount && (
          <p className="text-sm text-green-600">
            Tiết kiệm {formatCurrency((originalPrice - salePrice) * quantity)}
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItem;
