import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import { formatCurrency } from "../utils/helpers";

const HomePage = () => {
  const { products, loading, fetchProducts, categories, brands } = useShop();

  useEffect(() => {
    // Fetch featured products
    fetchProducts({ page: 1, limit: 10 });
  }, [fetchProducts]);

  // Helper function để parse hình ảnh từ JSON
  const getProductImage = (product) => {
    try {
      // Ưu tiên sử dụng images đã được parse từ ShopContext
      if (product.images && product.images.anhChinh) {
        return product.images.anhChinh;
      }

      // Fallback: parse trực tiếp từ HinhAnh nếu chưa được process
      if (typeof product.HinhAnh === "string" && product.HinhAnh !== "{}") {
        const imageData = JSON.parse(product.HinhAnh);
        return imageData.anhChinh || "/placeholder.svg?height=300&width=300";
      }

      // Fallback: kiểm tra anhChinh đã được parse sẵn
      if (product.anhChinh) {
        return product.anhChinh;
      }

      return "/placeholder.svg?height=300&width=300";
    } catch (error) {
      console.error("Error parsing product image:", error);
      return "/placeholder.svg?height=300&width=300";
    }
  };

  // Use real categories from API instead of hardcoded ones
  const displayCategories = categories.slice(0, 4).map((category) => ({
    id: category.id,
    name: category.Ten,
    image: "/placeholder.svg?height=300&width=400", // Use placeholder until we have category images
    link: `/products?category=${category.id}`,
  }));

  // Use real brands from API instead of hardcoded ones
  const displayBrands = brands.slice(0, 6).map((brand) => ({
    name: brand.Ten,
    logo: brand.Logo || "/placeholder.svg?height=80&width=120",
  }));

  return (
    <div className="min-h-screen">
      <section
        className="relative h-[70vh] bg-cover bg-center flex items-center"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/db7jn3ooa/image/upload/v1751255472/pexels-rdne-5698854_orodfy.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Bộ Sưu Tập Giày Mới Nhất
            </h1>
            <p className="text-xl mb-8">
              Khám phá những đôi giày thể thao chất lượng cao từ các thương hiệu
              hàng đầu thế giới
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn-primary text-center">
                Mua Ngay
              </Link>
              <Link to="/products?sale=true" className="btn-outline text-center">
                Xem Khuyến Mãi
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Danh Mục Sản Phẩm
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tìm kiếm đôi giày hoàn hảo cho phong cách của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCategories.map((category) => (
              <Link
                key={category.id}
                to={category.link}
                className="group relative overflow-hidden rounded-lg shadow-lg card-hover"
              >
                <div className="aspect-w-4 aspect-h-3">
                  <img
                    src='https://res.cloudinary.com/db7jn3ooa/image/upload/v1750488464/shoes_shop/products/t4fiba9mlh90ta25l3jh.jpg'
                    alt={category.name}
                    className="w-full h-40 sm:h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Sản Phẩm Nổi Bật
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những đôi giày được yêu thích nhất tại cửa hàng
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="card card-hover">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-w-1 aspect-h-1 mb-4">
                      <img
                        src={getProductImage(product)}
                        alt={product.Ten}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-800 text-base leading-tight">
                        {product.Ten}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {product.tenThuongHieu}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(
                            product.GiaKhuyenMai || product.Gia
                          )}{" "}

                        </span>
                        {product.GiaKhuyenMai && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.Gia)} đ
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products" className="btn-primary">
              Xem Tất Cả Sản Phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Thương Hiệu Đối Tác
            </h2>
            <p className="text-gray-600">
              Chúng tôi hợp tác với các thương hiệu hàng đầu thế giới
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  onClick={() => window.open(brand.Website || "#", "_blank")}
                  loading="lazy"
                  draggable="false"
                  style={{ maxWidth: "100px", maxHeight: "50px", cursor: "pointer" }}
                  src={brand.Logo || "/placeholder.svg"}
                  alt={brand.Ten}
                  className="max-h-12 w-auto grayscale hover:grayscale-0 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Giao Hàng Miễn Phí</h3>
              <p className="text-gray-600">
                Miễn phí giao hàng cho đơn hàng từ 500.000đ
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Đổi Trả Dễ Dàng</h3>
              <p className="text-gray-600">
                Đổi trả trong vòng 30 ngày nếu không hài lòng
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Bảo Hành Chính Hãng
              </h3>
              <p className="text-gray-600">
                Cam kết sản phẩm chính hãng với bảo hành đầy đủ
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
