"use client";

import { Link } from "react-router-dom";
import { Trash, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Product Image */}
      <Link
        to={`/products/${item.id}`}
        className="block aspect-square overflow-hidden"
      >
        <img
          src={item.hinhAnh || "/placeholder.svg?height=300&width=300"}
          alt={item.ten}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.giaKhuyenMai && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
            -{Math.round(((item.gia - item.giaKhuyenMai) / item.gia) * 100)}%
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/products/${item.id}`} className="block">
          <h3 className="text-sm font-medium text-gray-800 mb-1 hover:text-primary-600 transition-colors">
            {item.ten}
          </h3>
          <p className="text-xs text-gray-500 mb-2">{item.thuongHieu}</p>
          <div className="flex items-center space-x-2 mb-4">
            {item.giaKhuyenMai ? (
              <>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(item.giaKhuyenMai)}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  {formatCurrency(item.gia)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-800">
                {formatCurrency(item.gia)}
              </span>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onAddToCart(item)}
            className="flex-1 bg-primary-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center mr-2"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Thêm vào giỏ
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Xóa khỏi yêu thích"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;
