import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">👟</span>
              </div>
              <span className="text-xl font-bold">ShoeShop</span>
            </div>
            <p className="text-gray-300 mb-4">
              Cửa hàng giày thể thao hàng đầu Việt Nam với các thương hiệu nổi tiếng thế giới.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                📘
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                📷
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                🐦
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                📺
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/products?category=nam" className="text-gray-300 hover:text-white">
                  Giày nam
                </Link>
              </li>
              <li>
                <Link to="/products?category=nu" className="text-gray-300 hover:text-white">
                  Giày nữ
                </Link>
              </li>
              <li>
                <Link to="/products?category=the-thao" className="text-gray-300 hover:text-white">
                  Giày thể thao
                </Link>
              </li>
              <li>
                <Link to="/products?sale=true" className="text-gray-300 hover:text-white">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-300 hover:text-white">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-300 hover:text-white">
                  Chính sách giao hàng
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-300 hover:text-white">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="text-gray-300 hover:text-white">
                  Hướng dẫn chọn size
                </Link>
              </li>
              <li>
                <Link to="/warranty" className="text-gray-300 hover:text-white">
                  Chính sách bảo hành
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Thông tin liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span>📍</span>
                <span className="text-gray-300">123 Đường Nguyễn Huệ, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📞</span>
                <span className="text-gray-300">1900-1234</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <span className="text-gray-300">support@shoeshop.vn</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🕒</span>
                <span className="text-gray-300">8:00 - 22:00 (Hàng ngày)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">© 2024 ShoeShop. Tất cả quyền được bảo lưu.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-300 hover:text-white text-sm">
                Chính sách bảo mật
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-white text-sm">
                Điều khoản sử dụng
              </Link>
              <Link to="/cookies" className="text-gray-300 hover:text-white text-sm">
                Chính sách Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
