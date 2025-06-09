import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";

const HomePage = () => {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch featured products
    dispatch(fetchProducts({ page: 1, limit: 10 })); // KHÔNG có featured
  }, [dispatch]);

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

  const categories = [
    {
      id: 1,
      name: "Giày Nam",
      image: "/placeholder.svg?height=300&width=400",
      link: "/products?category=nam",
    },
    {
      id: 2,
      name: "Giày Nữ",
      image: "/placeholder.svg?height=300&width=400",
      link: "/products?category=nu",
    },
    {
      id: 3,
      name: "Giày Thể Thao",
      image: "/placeholder.svg?height=300&width=400",
      link: "/products?category=the-thao",
    },
    {
      id: 4,
      name: "Giày Chạy Bộ",
      image: "/placeholder.svg?height=300&width=400",
      link: "/products?category=chay-bo",
    },
  ];

  const brands = [
    { name: "Nike", logo: "/placeholder.svg?height=80&width=120" },
    { name: "Adidas", logo: "/placeholder.svg?height=80&width=120" },
    { name: "Puma", logo: "/placeholder.svg?height=80&width=120" },
    { name: "New Balance", logo: "/placeholder.svg?height=80&width=120" },
    { name: "Converse", logo: "/placeholder.svg?height=80&width=120" },
    { name: "Vans", logo: "/placeholder.svg?height=80&width=120" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-gradient-to-r from-primary-600 to-primary-800 flex items-center">
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
              <Link
                to="/products?sale=true"
                className="btn-outline text-center"
              >
                Xem Khuyến Mãi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
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
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.link}
                className="group relative overflow-hidden rounded-lg shadow-lg card-hover"
              >
                <div className="aspect-w-4 aspect-h-3">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
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

          {isLoading ? (
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
                        src={getProductImage(product.HinhAnh)}
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
                          {(
                            product.GiaKhuyenMai || product.Gia
                          )?.toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                        {product.GiaKhuyenMai && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.Gia?.toLocaleString("vi-VN")} đ
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
            {brands.map((brand, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={brand.logo || "/placeholder.svg"}
                  alt={brand.name}
                  className="max-h-12 w-auto grayscale hover:grayscale-0 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
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
