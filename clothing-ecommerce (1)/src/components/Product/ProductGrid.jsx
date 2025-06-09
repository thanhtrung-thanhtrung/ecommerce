"use client";

import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../store/slices/cartSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../store/slices/wishlistSlice";
import { formatCurrency } from "../../utils/helpers";

const ProductGrid = ({ products }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Helper function to parse and get main image from HinhAnh JSON
  const getProductImage = (hinhAnh) => {
    try {
      if (typeof hinhAnh === "string") {
        const imageData = JSON.parse(hinhAnh);
        return imageData.anhChinh || "/placeholder.svg?height=300&width=300";
      }
      return hinhAnh || "/placeholder.svg?height=300&width=300";
    } catch (error) {
      return "/placeholder.svg?height=300&width=300";
    }
  };

  const handleAddToCart = async (product) => {
    // Cần lấy id_ChiTietSanPham từ API hoặc từ product detail
    // Tạm thời thông báo cho user cần chọn variant
    if (!product.chiTietSanPham || product.chiTietSanPham.length === 0) {
      // Redirect to product detail page để chọn size/màu
      window.location.href = `/products/${product.id}`;
      return;
    }

    // Lấy variant đầu tiên nếu có
    const firstVariant = product.chiTietSanPham[0];

    const cartItem = {
      id_ChiTietSanPham: firstVariant.id,
      soLuong: 1,
    };

    dispatch(addToCart(cartItem));
  };

  const handleWishlistToggle = (product) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    const isInWishlist = wishlistItems.some((item) => item.id === product.id);
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product.id));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const isInWishlist = wishlistItems.some(
          (item) => item.id === product.id
        );
        const productImage = getProductImage(product.HinhAnh);

        return (
          <div
            key={product.id}
            className="group relative bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* Product Image */}
            <Link
              to={`/products/${product.id}`}
              className="block aspect-square overflow-hidden"
            >
              <img
                src={productImage}
                alt={product.Ten}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {product.GiaKhuyenMai && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
                  -
                  {Math.round(
                    ((Number(product.Gia) - Number(product.GiaKhuyenMai)) /
                      Number(product.Gia)) *
                      100
                  )}
                  %
                </div>
              )}
              {product.isNew && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
                  Mới
                </div>
              )}
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link to={`/products/${product.id}`} className="block">
                <h3 className="text-sm font-medium text-gray-800 mb-1 hover:text-primary-600 transition-colors">
                  {product.Ten}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {product.tenThuongHieu}
                </p>
                <div className="flex items-center space-x-2">
                  {product.GiaKhuyenMai ? (
                    <>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(Number(product.GiaKhuyenMai))}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {formatCurrency(Number(product.Gia))}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-gray-800">
                      {formatCurrency(Number(product.Gia))}
                    </span>
                  )}
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 bg-primary-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  {product.chiTietSanPham && product.chiTietSanPham.length > 0
                    ? "Thêm vào giỏ"
                    : "Chọn tùy chọn"}
                </button>
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className="ml-2 p-2 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label={
                    isInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
                  }
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isInWishlist ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
