import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";

const RelatedProducts = ({ currentProductId, categoryId, relatedProducts }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getProductImage = (product) => {
    try {
      const imageJson = typeof product.HinhAnh === "string" ? JSON.parse(product.HinhAnh) : product.HinhAnh;
      const img = imageJson?.anhChinh || product.anhChinh;
      if (!img || img.includes("-mock") || (!img.startsWith("http") && !img.startsWith("/"))) {
        return "/placeholder.jpg";
      }
      return img;
    } catch {
      return "/placeholder.jpg";
    }
  };

  useEffect(() => {
    if (relatedProducts && Array.isArray(relatedProducts)) {
      const filtered = relatedProducts.filter(p => p.id !== currentProductId);
      setProducts(filtered);
    }
    setIsLoading(false);
  }, [currentProductId, categoryId, relatedProducts]);

  if (isLoading || products.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Sản phẩm tương tự
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map(product => {
          const image = getProductImage(product);
          const hasDiscount = product.GiaKhuyenMai && Number(product.GiaKhuyenMai) < Number(product.Gia);
          const discountPercent = hasDiscount
            ? Math.round(((Number(product.Gia) - Number(product.GiaKhuyenMai)) / Number(product.Gia)) * 100)
            : 0;

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={image}
                  alt={product.Ten}
                  onError={(e) => (e.target.src = "/placeholder.jpg")}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                    -{discountPercent}%
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 line-clamp-2">
                  {product.Ten}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {product.tenThuongHieu}
                </p>
                <div className="flex items-center space-x-2">
                  {hasDiscount ? (
                    <>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(product.GiaKhuyenMai)}
                      </span>
                      <span className="text-xs line-through text-gray-400">
                        {formatCurrency(product.Gia)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-gray-800">
                      {formatCurrency(product.Gia)}
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
