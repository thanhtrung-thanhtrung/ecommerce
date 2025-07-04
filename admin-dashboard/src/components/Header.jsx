import React from "react";
import { useLocation } from "react-router-dom";
import { FiMenu, FiBell, FiSearch, FiUser } from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Header = () => {
  const { sidebarOpen, setSidebarOpen } = useAdmin();
  const location = useLocation();

  const getSectionTitle = (pathname) => {
    const titles = {
      "/": "Dashboard",
      "/products": "Sản phẩm",
      "/orders": "Đơn hàng",
      "/categories": "Danh mục",
      "/brands": "Thương hiệu",
      "/vouchers": "Giảm giá",
      "/suppliers": "Nhà cung cấp",
      "/inventorys": "Kho hàng",
      "/payments": "Thanh toán",
      "/shippings": "Vận chuyển",
      "/wishlists": "Yêu thích",
      "/analytics": "Thống kê",
      "/settings": "Cài đặt",
    };
    return titles[pathname] || "Dashboard";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded text-gray-600 hover:bg-gray-100"
          >
            <FiMenu className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getSectionTitle(location.pathname)}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Quản lý cửa hàng
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded px-2 py-1.5">
            <FiSearch className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-500 w-32"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-1.5 rounded text-gray-600 hover:bg-gray-100">
            <FiBell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <FiUser className="w-3 h-3 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
