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
      "/products": "Quản lý sản phẩm",
      "/orders": "Quản lý đơn hàng",
      "/categories": "Quản lý danh mục",
      "/brands": "Quản lý thương hiệu",
      "/vouchers": "Quản lý giảm giá",
      "/suppliers": "Quản lý nhà cung cấp",
      "/inventorys": "Quản lý kho hàng",
      "/payments": "Quản lý thanh toán",
      "/shippings": "Quản lý vận chuyển",
      "/wishlists": "Danh sách yêu thích",
      "/analytics": "Thống kê & báo cáo",
      "/settings": "Cài đặt",
    };
    return titles[pathname] || "Dashboard";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {getSectionTitle(location.pathname)}
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Quản lý cửa hàng giày
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded px-3 py-2">
            <FiSearch className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded text-gray-600 hover:bg-gray-100">
            <FiBell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <FiUser className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Quản trị viên</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
