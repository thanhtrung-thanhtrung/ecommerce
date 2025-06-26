"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";

const RelatedProducts = ({ currentProductId, categoryId, relatedProducts }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to parse and get main image from HinhAnh JSON
  const getProductImage = (product) => {
    try {
      // Ưu tiên sử dụng images đã được parse từ ShopContext
      if (product.images && product.images.anhChinh) {
        return product.images.anhChinh;
      }

      // Fallback: parse trực tiếp từ HinhAnh nếu chưa được process
      if (typeof product.HinhAnh === "string" && product.HinhAnh !== "{}" && product.HinhAnh !== "") {
        const imageData = JSON.parse(product.HinhAnh);
        if (imageData.anhChinh) {
          // Check if it's a mock file that doesn't exist
          if (imageData.anhChinh.includes('-mock.jpg') ||
            imageData.anhChinh.includes('-mock.png') ||
            !imageData.anhChinh.startsWith('http') && !imageData.anhChinh.startsWith('/')) {
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
          !product.anhChinh.startsWith('http') && !product.anhChinh.startsWith('/')) {
          return "/placeholder.jpg";
        }

        return product.anhChinh;
      }

      return "/placeholder.jpg";
    } catch (error) {
      return "/placeholder.jpg";
    }
  };

  useEffect(() => {
    if (relatedProducts && relatedProducts.length > 0) {
      // Use actual related products from API
      setProducts(
        relatedProducts.filter((product) => product.id !== currentProductId)
      );
      setIsLoading(false);
    } else {
      // Fallback to mock data if no related products from API
      setTimeout(() => {
        const mockProducts = [
          {
            id: 101,
            Ten: "Giày Thể Thao Nam Nike Air Max",
            Gia: "2500000.00",
            GiaKhuyenMai: "1990000.00",
            HinhAnh: '{"anhChinh": "/placeholder.jpg"}',
            tenThuongHieu: "Nike",
          },
          {
            id: 102,
            Ten: "Giày Chạy Bộ Adidas Ultraboost",
            Gia: "3200000.00",
            GiaKhuyenMai: null,
            HinhAnh: '{"anhChinh": "/placeholder.jpg"}',
            tenThuongHieu: "Adidas",
          },
          {
            id: 103,
            Ten: "Giày Thể Thao Puma RS-X",
            Gia: "1800000.00",
            GiaKhuyenMai: "1620000.00",
            HinhAnh: '{"anhChinh": "/placeholder.jpg"}',
            tenThuongHieu: "Puma",
          },
          {
            id: 104,
            Ten: "Giày Sneaker New Balance 574",
            Gia: "1950000.00",
            GiaKhuyenMai: null,
            HinhAnh: '{"anhChinh": "/placeholder.jpg"}',
            tenThuongHieu: "New Balance",
          },
        ].filter((product) => product.id !== currentProductId);

        setProducts(mockProducts);
        setIsLoading(false);
      }, 1000);
    }
  }, [currentProductId, categoryId, relatedProducts]);

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Sản phẩm tương tự
        </h2>
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Sản phẩm tương tự
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => {
          const productImage = getProductImage(product);

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white rounded-lg shadow-sm overflow-hidden relative"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={productImage}
                  alt={product.Ten}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
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
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
