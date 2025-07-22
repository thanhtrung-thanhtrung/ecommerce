"use client";

import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { useShop } from "../../contexts/ShopContext";
import { useCartContext } from "../../contexts/CartContext";
import { formatCurrency } from "../../utils/helpers";
import { toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";

const ProductGrid = ({ products }) => {
  const { isAuthenticated, addToWishlist, removeFromWishlist, wishlistItems } = useShop();

  const [wishlistStats, setWishlistStats] = useState(new Map());
  const { addToCart } = useCartContext();

  const showWishlist = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/wishlists/show");
      const result = await response.json();

      if (result && result.success) {
        // Lấy dữ liệu wishlist từ response
        const wishlistData = result.data?.data || result.data || [];

        // Thống kê số lượt yêu thích cho từng sản phẩm
        const statsMap = new Map();
        wishlistData.forEach(item => {
          const productId = item.id_SanPham;
          if (statsMap.has(productId)) {
            statsMap.set(productId, statsMap.get(productId) + 1);
          } else {
            statsMap.set(productId, 1);
          }
        });

        setWishlistStats(statsMap);
      } else {
        setWishlistStats(new Map());
      }
    } catch (error) {
      console.error("Lỗi khi gọi API wishlist:", error);
      setWishlistStats(new Map());
    }
  }, []);

  useEffect(() => {
    showWishlist();
  }, [showWishlist]);

  const getProductImage = (product) => {
    try {
      // Ưu tiên sử dụng images đã được parse từ ShopContext
      if (product.images && product.images.anhChinh) {
        return product.images.anhChinh;
      }

      // Fallback: parse trực tiếp từ HinhAnh nếu chưa được process
      if (typeof product.HinhAnh === "string" && product.HinhAnh !== "{}") {
        const imageData = JSON.parse(product.HinhAnh);

        if (imageData.anhChinh) {
          // Check if it's a mock file that doesn't exist
          if (imageData.anhChinh.includes('-mock.jpg') ||
            imageData.anhChinh.includes('-mock.png') ||
            (!imageData.anhChinh.startsWith('http') && !imageData.anhChinh.startsWith('/'))) {
            return "/placeholder.jpg";
          }
          return imageData.anhChinh;
        }
      }

      // Fallback: kiểm tra anhChinh đã được parse sẵn
      if (product.anhChinh) {
        // Check if it's a mock file that doesn't exist
        if (product.anhChinh.includes('-mock.jpg') ||
          product.anhChinh.includes('-mock.png') ||
          (!product.anhChinh.startsWith('http') && !product.anhChinh.startsWith('/'))) {
          return "/placeholder.jpg";
        }
        return product.anhChinh;
      }

      return "/placeholder.jpg";
    } catch (error) {
      console.error("Error parsing product image:", error);
      return "/placeholder.jpg";
    }
  };

  const handleAddToCart = (product) => {
    // Luôn chuyển sang trang chi tiết để chọn size/màu khi bấm Thêm vào giỏ hàng
    window.location.href = `/products/${product.id}`;
  };

  const handleWishlistToggle = async (product) => {
    try {
      if (!isAuthenticated) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
      }

      const isInWishlist = wishlistItems?.some((item) => item.id === product.id);
      if (isInWishlist) {
        await removeFromWishlist(product.id);
        toast.success("Đã xóa khỏi danh sách yêu thích");
        // Cập nhật lại stats sau khi xóa
        showWishlist();
      } else {
        await addToWishlist(product.id);
        toast.success("Đã thêm vào danh sách yêu thích");
        // Cập nhật lại stats sau khi thêm
        showWishlist();
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // SVG placeholder đơn giản không có text
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f8f9fa' stroke='%23e9ecef' stroke-width='2'/%3E%3Cpath d='M120 135h60v30h-60zm30-30c8.25 0 15 6.75 15 15s-6.75 15-15 15-15-6.75-15-15 6.75-15 15-15zm-45 90h90l-22.5-30-15 15-22.5-22.5z' fill='%23dee2e6'/%3E%3C/svg%3E";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products?.map((product) => {
        const isInWishlist = wishlistItems?.some(
          (item) => item.id === product.id
        );
        const productImage = getProductImage(product);

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
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderSvg;
                }}
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
                  <div className="flex items-center space-x-1">
                    <Heart
                      className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`}
                    />
                    <span className="text-xs text-gray-500">
                      {wishlistStats.get(product.id) || 0}
                    </span>
                  </div>
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
