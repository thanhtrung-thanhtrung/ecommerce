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
  FiX,
  FiLayers,
  FiAward,
  FiCreditCard,
  FiHeart,
  FiArchive,
  FiUser,
  FiLogOut,
  FiDollarSign,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, user, logout } = useAdmin();
  const location = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome, path: "/" },
    { id: "products", label: "Sản phẩm", icon: FiPackage, path: "/products" },
    { id: "orders", label: "Đơn hàng", icon: FiShoppingBag, path: "/orders" },
    { id: "categories", label: "Danh mục", icon: FiLayers, path: "/categories" },
    { id: "brands", label: "Thương hiệu", icon: FiAward, path: "/brands" },
    { id: "suppliers", label: "Nhà cung cấp", icon: FiTruck, path: "/suppliers" },
    { id: "inventorys", label: "Tồn kho", icon: FiArchive, path: "/inventorys" },
    { id: "import-receipts", label: "Phiếu nhập", icon: FiPackage, path: "/import-receipts" },
    { id: "vouchers", label: "Giảm giá", icon: FiPercent, path: "/vouchers" },
    { id: "payments", label: "Thanh toán", icon: FiCreditCard, path: "/payments" },
    { id: "shippings", label: "Vận chuyển", icon: FiTruck, path: "/shippings" },
    { id: "wishlists", label: "Yêu thích", icon: FiHeart, path: "/wishlists" },
    { id: "analytics", label: "Thống kê", icon: FiBarChart2, path: "/analytics" },
    { id: "settings", label: "Cài đặt", icon: FiSettings, path: "/settings" },

  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - compact design */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-40 bg-slate-800 text-white
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 border-r border-slate-700 flex flex-col
        `}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FiPackage className="w-3 h-3 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Shoes Shop</span>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
          >
            <FiX className="w-3 h-3" />
          </button>
        </div>

        {/* Compact Navigation */}
        <nav className="flex-1 py-1 px-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center px-2 py-1.5 rounded text-xs
                      ${isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }
                    `}
                  >
                    <Icon className="w-3 h-3 mr-2" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Compact User Section */}
        <div className="border-t border-slate-700 p-2">
          <div className="flex items-center space-x-2 p-1.5 rounded bg-slate-700">
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
              <FiUser className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-white">
                {user?.hoTen || 'Admin'}
              </p>
              <p className="text-xs text-slate-400">
                {user?.maQuyen === 1 ? 'Admin' : 'Nhân viên'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <FiLogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
