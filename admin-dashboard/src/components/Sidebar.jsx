import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiTag,
  FiPercent,
  FiTruck,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAdmin();
  const location = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome, path: "/" },
    { id: "products", label: "Sản phẩm", icon: FiPackage, path: "/products" },
    { id: "orders", label: "Đơn hàng", icon: FiShoppingBag, path: "/orders" },
    { id: "categories", label: "Danh mục", icon: FiTag, path: "/categories" },
    { id: "brands", label: "Thương hiệu", icon: FiTag, path: "/brands" },
    { id: "vouchers", label: "Giảm giá", icon: FiPercent, path: "/vouchers" },
    {
      id: "suppliers",
      label: "Nhà cung cấp",
      icon: FiTruck,
      path: "/suppliers",
    },
    {
      id: "analytics",
      label: "Thống kê",
      icon: FiBarChart2,
      path: "/analytics",
    },
    { id: "settings", label: "Cài đặt", icon: FiSettings, path: "/settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-sidebar-bg text-white z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-64 lg:translate-x-0 lg:static lg:h-screen
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Shoes Shop</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                      ${
                        isActive
                          ? "bg-primary-500 text-white"
                          : "text-gray-300 hover:bg-sidebar-hover hover:text-white"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-400">Quản trị viên</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
