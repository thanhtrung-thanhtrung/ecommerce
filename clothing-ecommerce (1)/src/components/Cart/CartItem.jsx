"use client";

import { Link } from "react-router-dom";
import { Trash, Plus, Minus } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateQuantity(item.id, newQuantity);
  };

  // Helper function để parse hình ảnh từ JSON
  const getProductImage = (hinhAnh) => {
    try {
      if (typeof hinhAnh === "string" && hinhAnh.startsWith("{")) {
        const imageData = JSON.parse(hinhAnh);
        return imageData.anhChinh || "/placeholder.svg?height=200&width=200";
      }
      return hinhAnh || "/placeholder.svg?height=200&width=200";
    } catch (error) {
      return "/placeholder.svg?height=200&width=200";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row border rounded-lg overflow-hidden bg-white">
      {/* Product Image */}
      <Link
        to={`/products/${item.id_SanPham}`}
        className="relative w-full sm:w-32 h-32"
      >
        <img
          src={getProductImage(item.HinhAnh)}
          alt={item.tenSanPham}
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 p-4 flex flex-col sm:flex-row">
        <div className="flex-1">
          <Link
            to={`/products/${item.id_SanPham}`}
            className="hover:text-primary-600"
          >
            <h3 className="font-medium text-gray-800">{item.tenSanPham}</h3>
          </Link>

          <div className="text-sm text-gray-600 mt-1 space-y-1">
            {item.tenKichCo && <p>Size: {item.tenKichCo}</p>}
            {item.tenMau && <p>Màu: {item.tenMau}</p>}
            {item.SoLuongTon !== undefined && (
              <p
                className={`${
                  item.SoLuongTon < 5 ? "text-red-500" : "text-green-600"
                }`}
              >
                Còn lại: {item.SoLuongTon}
              </p>
            )}
          </div>

          <div className="mt-2">
            <span className="font-bold text-gray-800">
              {formatCurrency(item.Gia)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 sm:mt-0 sm:ml-6">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => handleQuantityChange(item.SoLuong - 1)}
              className="p-2 text-gray-600 hover:text-gray-800"
              disabled={item.SoLuong <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center">{item.SoLuong}</span>
            <button
              onClick={() => handleQuantityChange(item.SoLuong + 1)}
              className="p-2 text-gray-600 hover:text-gray-800"
              disabled={item.SoLuong >= item.SoLuongTon}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Total Price */}
          <div className="ml-4 text-right">
            <div className="font-bold text-gray-800">
              {formatCurrency(item.Gia * item.SoLuong)}
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="ml-4 p-2 text-gray-500 hover:text-red-600"
            aria-label="Remove item"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
