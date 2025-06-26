import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import { useCartContext } from "../contexts/CartContext";
import ProductImageGallery from "../components/Product/ProductImageGallery";
import ProductReviews from "../components/Product/ProductReviews";
import RelatedProducts from "../components/Product/RelatedProducts";
import LoadingSpinner from "../components/Common/LoadingSpinner"
import { formatCurrency } from "../utils/helpers";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentProduct,
    loading,
    error,
    isAuthenticated,
    wishlist,
    fetchProductById,
    clearCurrentProduct,
    addToWishlist,
    removeFromWishlist,
  } = useShop();

  // Use CartContext for cart operations
  const { addToCart } = useCartContext();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const isInWishlist = wishlist.some(
    (item) => item.id === Number.parseInt(id)
  );

  // Function to get product images based on available data
  const getProductImages = (hinhAnh, currentProduct) => {
    let images = [];

    // Try to parse HinhAnh first
    if (hinhAnh && typeof hinhAnh === 'string' && hinhAnh.trim() !== '' && hinhAnh !== '{}') {
      try {
        const imageData = JSON.parse(hinhAnh);

        // Add main image
        if (imageData.anhChinh && imageData.anhChinh.trim() !== '') {
          images.push(imageData.anhChinh);
        }

        // Add additional images
        if (imageData.anhPhu && Array.isArray(imageData.anhPhu)) {
          const validAdditionalImages = imageData.anhPhu.filter(img => img && img.trim() !== '');
          images.push(...validAdditionalImages);
        }

        // Add any other images (like anh1, anh2, etc.)
        Object.keys(imageData).forEach(key => {
          if (key.startsWith('anh') && key !== 'anhChinh' && key !== 'anhPhu' && !key.includes('public_id')) {
            if (imageData[key] && imageData[key].trim() !== '' && !images.includes(imageData[key])) {
              images.push(imageData[key]);
            }
          }
        });

        const filteredImages = images.filter(img => img && img.trim() !== '');

        if (filteredImages.length > 0) {
          return filteredImages;
        }
      } catch (error) {
        console.error('❌ Error parsing HinhAnh JSON:', error);
      }
    }

    // Try to use already parsed images from currentProduct
    if (currentProduct && currentProduct.images) {
      if (Array.isArray(currentProduct.images)) {
        images = currentProduct.images.filter(img => img && img.trim() !== '');
      } else if (typeof currentProduct.images === 'object') {
        // Handle object structure similar to above
        if (currentProduct.images.anhChinh) {
          images.push(currentProduct.images.anhChinh);
        }
        if (currentProduct.images.anhPhu && Array.isArray(currentProduct.images.anhPhu)) {
          images.push(...currentProduct.images.anhPhu);
        }
      }

      const filteredImages = images.filter(img => img && img.trim() !== '');
      if (filteredImages.length > 0) {
        return filteredImages;
      }
    }

    // Fallback to placeholder if no images found
    return ["/placeholder.jpg"];
  };

  // Helper function to parse technical specifications
  const parseThongSoKyThuat = (thongSo) => {
    try {
      return typeof thongSo === "string" ? JSON.parse(thongSo) : thongSo || {};
    } catch (error) {
      return {};
    }
  };

  // Helper function to get available sizes from bienThe
  const getAvailableSizes = (bienThe) => {
    if (!bienThe || !Array.isArray(bienThe)) return [];
    return [...new Set(bienThe.map((item) => item.tenKichCo))];
  };

  // Helper function to get available colors from bienThe
  const getAvailableColors = (bienThe) => {
    if (!bienThe || !Array.isArray(bienThe)) return [];
    return [...new Set(bienThe.map((item) => item.tenMau))];
  };

  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }

    return () => {
      clearCurrentProduct();
    };
  }, [id, fetchProductById, clearCurrentProduct]);

  useEffect(() => {
    if (currentProduct && currentProduct.bienThe?.length > 0) {
      const sizes = getAvailableSizes(currentProduct.bienThe);
      const colors = getAvailableColors(currentProduct.bienThe);

      if (sizes.length > 0) {
        setSelectedSize(sizes[0]);
      }
      if (colors.length > 0) {
        setSelectedColor(colors[0]);
      }
    }
  }, [currentProduct]);

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      alert("Vui lòng chọn size và màu sắc");
      return;
    }

    // Find the corresponding bienThe (chi tiết sản phẩm)
    const selectedVariant = currentProduct.bienThe?.find(
      (item) => item.tenKichCo === selectedSize && item.tenMau === selectedColor
    );

    if (!selectedVariant) {
      alert("Không tìm thấy sản phẩm với tùy chọn đã chọn");
      return;
    }

    try {
      // Sử dụng đúng cấu trúc dữ liệu theo backend
      const cartItem = {
        id_ChiTietSanPham: selectedVariant.id,
        soLuong: quantity,
      };

      await addToCart(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isInWishlist) {
      removeFromWishlist(currentProduct.id);
    } else {
      addToWishlist(currentProduct.id);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">😞</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-gray-600 mb-6">
          Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link to="/products" className="btn-primary">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const availableSizes = getAvailableSizes(currentProduct.bienThe);
  const availableColors = getAvailableColors(currentProduct.bienThe);
  const productImages = getProductImages(currentProduct.HinhAnh);
  const specifications = parseThongSoKyThuat(currentProduct.ThongSoKyThuat);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-primary-600">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">
          Sản phẩm
        </Link>
        <span>/</span>
        <span className="text-gray-800">{currentProduct.Ten}</span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div>
          <ProductImageGallery
            images={productImages}
            productName={currentProduct.Ten}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {currentProduct.Ten}
            </h1>
            <p className="text-gray-600">{currentProduct.tenThuongHieu}</p>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-4">
            {currentProduct.GiaKhuyenMai ? (
              <>
                <span className="text-3xl font-bold text-red-600">
                  {formatCurrency(Number(currentProduct.GiaKhuyenMai))}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  {formatCurrency(Number(currentProduct.Gia))}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                  -
                  {Math.round(
                    ((Number(currentProduct.Gia) -
                      Number(currentProduct.GiaKhuyenMai)) /
                      Number(currentProduct.Gia)) *
                    100
                  )}
                  %
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-800">
                {formatCurrency(Number(currentProduct.Gia))}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-700 leading-relaxed">
              {currentProduct.MoTa}
            </p>
          </div>

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Kích cỡ:</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${selectedSize === size
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-gray-300 text-gray-700 hover:border-primary-600"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Màu sắc:</h3>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${selectedColor === color
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-gray-300 text-gray-700 hover:border-primary-600"
                      }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Số lượng:</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-600"
              >
                -
              </button>
              <span className="w-16 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-600"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleAddToCart} className="btn-primary flex-1">
              🛒 Thêm vào giỏ hàng
            </button>
            <button onClick={handleBuyNow} className="btn-secondary flex-1">
              Mua ngay
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`px-4 py-2 border rounded-lg transition-colors ${isInWishlist
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600"
                }`}
            >
              {isInWishlist ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Product Info */}
          <div className="border-t pt-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-medium">{currentProduct.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Danh mục:</span>
                <span className="font-medium">{currentProduct.tenDanhMuc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thương hiệu:</span>
                <span className="font-medium">
                  {currentProduct.tenThuongHieu}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tình trạng:</span>
                <span className="font-medium text-green-600">Còn hàng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mb-16">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {["description", "specifications", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab === "description" && "Mô tả"}
                {tab === "specifications" && "Thông số"}
                {tab === "reviews" && "Đánh giá"}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {currentProduct.MoTaChiTiet || currentProduct.MoTa}
              </p>
            </div>
          )}

          {activeTab === "specifications" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Thông số kỹ thuật</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  {Object.keys(specifications).length === 0 && (
                    <p className="text-gray-500">
                      Thông tin đang được cập nhật
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews productId={currentProduct.id} />
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        currentProductId={currentProduct.id}
        categoryId={currentProduct.id_DanhMuc}
        relatedProducts={currentProduct.sanPhamLienQuan}
      />
    </div>
  );
};

export default ProductDetailPage;
