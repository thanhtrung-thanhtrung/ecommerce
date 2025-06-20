import React, { useState, useEffect } from "react";
import {
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Analytics = () => {
  const { getAnalytics, getRevenueStats, loading } = useAdmin();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeFilter, setTimeFilter] = useState("7days");

  // Mock data for demonstration
  const mockAnalytics = {
    totalRevenue: 15750000,
    revenueGrowth: 12.5,
    totalOrders: 156,
    ordersGrowth: 8.3,
    totalCustomers: 89,
    customersGrowth: 15.2,
    totalProducts: 45,
    productsGrowth: 5.1,
    topProducts: [
      { Ten: "Giày Nike Air Max 2024", SoLuongBan: 25, DoanhThu: 6250000 },
      { Ten: "Giày Adidas Ultraboost", SoLuongBan: 18, DoanhThu: 3240000 },
      { Ten: "Giày Converse Chuck Taylor", SoLuongBan: 15, DoanhThu: 2250000 },
      { Ten: "Giày Vans Old Skool", SoLuongBan: 12, DoanhThu: 1800000 },
      { Ten: "Giày Puma Suede", SoLuongBan: 10, DoanhThu: 1500000 },
    ],
    revenueByDay: [
      { date: "2024-06-14", revenue: 1250000 },
      { date: "2024-06-15", revenue: 1850000 },
      { date: "2024-06-16", revenue: 2100000 },
      { date: "2024-06-17", revenue: 1950000 },
      { date: "2024-06-18", revenue: 2350000 },
      { date: "2024-06-19", revenue: 2750000 },
      { date: "2024-06-20", revenue: 3200000 },
    ],
    categoryStats: [
      { TenDanhMuc: "Giày thể thao", SoLuong: 28, PhanTram: 45.2 },
      { TenDanhMuc: "Giày lifestyle", SoLuong: 20, PhanTram: 32.3 },
      { TenDanhMuc: "Giày chạy bộ", SoLuong: 14, PhanTram: 22.5 },
    ],
  };

  const loadAnalytics = async () => {
    try {
      // Try to load real data from API
      const analytics = await getAnalytics({ period: timeFilter });
      const revenue = await getRevenueStats({ period: timeFilter });
      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
      // Use mock data as fallback
      setAnalyticsData(mockAnalytics);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter, loadAnalytics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatGrowth = (growth) => {
    const isPositive = growth >= 0;
    return (
      <span
        className={`flex items-center ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        <FiTrendingUp
          className={`w-4 h-4 mr-1 ${isPositive ? "" : "rotate-180"}`}
        />
        {Math.abs(growth)}%
      </span>
    );
  };

  if (loading || !analyticsData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải dữ liệu thống kê...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Thống kê & Báo cáo
          </h1>
          <p className="text-gray-600">
            Tổng quan hiệu quả kinh doanh cửa hàng giày
          </p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">3 tháng qua</option>
          <option value="1year">1 năm qua</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData.totalRevenue)}
              </p>
              <div className="mt-1">
                {formatGrowth(analyticsData.revenueGrowth)}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.totalOrders}
              </p>
              <div className="mt-1">
                {formatGrowth(analyticsData.ordersGrowth)}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Khách hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.totalCustomers}
              </p>
              <div className="mt-1">
                {formatGrowth(analyticsData.customersGrowth)}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiUsers className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.totalProducts}
              </p>
              <div className="mt-1">
                {formatGrowth(analyticsData.productsGrowth)}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiPackage className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Doanh thu theo ngày
            </h3>
            <FiBarChart2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.revenueByDay.map((day, index) => {
              const maxRevenue = Math.max(
                ...analyticsData.revenueByDay.map((d) => d.revenue)
              );
              const percentage = (day.revenue / maxRevenue) * 100;

              return (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString("vi-VN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-32 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top sản phẩm bán chạy
            </h3>
            <FiTrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-600"
                        : "bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {product.Ten}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.SoLuongBan} đôi đã bán
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(product.DoanhThu)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Phân bố theo danh mục
            </h3>
            <FiPieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.categoryStats.map((category, index) => {
              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-orange-500",
              ];
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      colors[index % colors.length]
                    } mr-3`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {category.TenDanhMuc}
                      </span>
                      <span className="text-sm text-gray-500">
                        {category.PhanTram}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          colors[index % colors.length]
                        }`}
                        style={{ width: `${category.PhanTram}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-medium text-gray-900">
                    {category.SoLuong}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thao tác nhanh
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <FiCalendar className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-blue-900">
                  Xuất báo cáo tháng
                </span>
              </div>
              <div className="text-blue-600">→</div>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <FiTrendingUp className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-green-900">
                  Phân tích xu hướng
                </span>
              </div>
              <div className="text-green-600">→</div>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <FiUsers className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-purple-900">
                  Báo cáo khách hàng
                </span>
              </div>
              <div className="text-purple-600">→</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
