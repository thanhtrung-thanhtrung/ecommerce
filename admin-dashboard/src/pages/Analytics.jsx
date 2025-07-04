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
  FiRefreshCw,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAdmin } from "../contexts/AdminContext";
import { toast } from "react-toastify";

const Analytics = () => {
  const {
    getAnalytics,
    getRevenueStats,
    getOrderStats,
    getProductsAdmin,
    loading,
  } = useAdmin();

  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
    totalProducts: 0,
    productsGrowth: 0,
  });
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("7days");
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Load order statistics
      const orderStats = await getOrderStats();
      console.log("Order stats:", orderStats);

      // Load products count
      const productsResponse = await getProductsAdmin({ page: 1, limit: 1 });
      console.log("Products response:", productsResponse);

      // Load revenue stats
      const currentDate = new Date();
      const daysAgo =
        timeFilter === "7days"
          ? 7
          : timeFilter === "30days"
            ? 30
            : 90;
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - daysAgo);

      const revenueResponse = await getRevenueStats({
        tuNgay: startDate.toISOString().split("T")[0],
        denNgay: currentDate.toISOString().split("T")[0],
        loaiThongKe: "ngay",
      });
      console.log("Revenue stats:", revenueResponse);

      // Update analytics data
      setAnalyticsData({
        totalRevenue: parseFloat(orderStats?.revenue?.total || 0),
        revenueGrowth: 12.5, // Mock growth data
        totalOrders: orderStats?.totalOrders || 0,
        ordersGrowth: 8.3, // Mock growth data
        totalCustomers: 89, // Mock customer data
        customersGrowth: 15.2, // Mock growth data
        totalProducts: productsResponse?.pagination?.total || 0,
        productsGrowth: 5.1, // Mock growth data
      });

      // Process revenue chart data
      if (
        revenueResponse?.success &&
        revenueResponse?.data?.doanhThuTheoThoiGian
      ) {
        const chartData = revenueResponse.data.doanhThuTheoThoiGian.map(
          (item, index) => {
            let dayLabel = `Ngày ${index + 1}`;
            try {
              if (item.ngay && item.ngay !== "Invalid Date") {
                const date = new Date(item.ngay);
                if (!isNaN(date.getTime())) {
                  dayLabel = date.toLocaleDateString("vi-VN", {
                    month: "short",
                    day: "numeric",
                  });
                }
              }
            } catch (error) {
              console.error("Error parsing date:", item.ngay, error);
            }

            return {
              date: dayLabel,
              revenue: parseFloat(item.tongThanhToan || 0),
              orders: parseInt(item.soDonHang || 0),
            };
          }
        );
        setRevenueChartData(chartData);
      } else {
        // Fallback mock data
        setRevenueChartData([
          { date: "19/6", revenue: 1250000, orders: 5 },
          { date: "20/6", revenue: 1850000, orders: 7 },
          { date: "21/6", revenue: 2100000, orders: 8 },
          { date: "22/6", revenue: 1950000, orders: 6 },
          { date: "23/6", revenue: 2350000, orders: 9 },
          { date: "24/6", revenue: 2750000, orders: 10 },
          { date: "25/6", revenue: 3200000, orders: 12 },
        ]);
      }

      // Process category data (mock for now)
      setCategoryData([
        { name: "Giày thể thao", value: 45.2, count: 28, color: "#3b82f6" },
        { name: "Giày lifestyle", value: 32.3, count: 20, color: "#10b981" },
        { name: "Giày chạy bộ", value: 22.5, count: 14, color: "#f59e0b" },
      ]);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Lỗi khi tải dữ liệu thống kê");

      // Fallback data
      setAnalyticsData({
        totalRevenue: 15750000,
        revenueGrowth: 12.5,
        totalOrders: 156,
        ordersGrowth: 8.3,
        totalCustomers: 89,
        customersGrowth: 15.2,
        totalProducts: 45,
        productsGrowth: 5.1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatGrowth = (growth) => {
    const isPositive = growth >= 0;
    return (
      <span className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
        <FiTrendingUp className={`w-3 h-3 mr-1 ${isPositive ? "" : "rotate-180"}`} />
        {Math.abs(growth)}%
      </span>
    );
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "7days": return "7 ngày qua";
      case "30days": return "30 ngày qua";
      case "90days": return "3 tháng qua";
      default: return "7 ngày qua";
    }
  };

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
          <p className="text-sm text-gray-600">Tổng quan hiệu quả kinh doanh</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadAnalytics}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
            disabled={isLoading}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="7days">7 ngày</option>
            <option value="30days">30 ngày</option>
            <option value="90days">3 tháng</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Doanh thu</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(analyticsData.totalRevenue)}
              </p>
              <div className="mt-1 text-xs">{formatGrowth(analyticsData.revenueGrowth)}</div>
            </div>
            <div className="p-2 bg-green-100 rounded">
              <FiDollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Đơn hàng</p>
              <p className="text-sm font-bold text-gray-900">{analyticsData.totalOrders}</p>
              <div className="mt-1 text-xs">{formatGrowth(analyticsData.ordersGrowth)}</div>
            </div>
            <div className="p-2 bg-blue-100 rounded">
              <FiShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Khách hàng</p>
              <p className="text-sm font-bold text-gray-900">{analyticsData.totalCustomers}</p>
              <div className="mt-1 text-xs">{formatGrowth(analyticsData.customersGrowth)}</div>
            </div>
            <div className="p-2 bg-purple-100 rounded">
              <FiUsers className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Sản phẩm</p>
              <p className="text-sm font-bold text-gray-900">{analyticsData.totalProducts}</p>
              <div className="mt-1 text-xs">{formatGrowth(analyticsData.productsGrowth)}</div>
            </div>
            <div className="p-2 bg-orange-100 rounded">
              <FiPackage className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compact Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Doanh thu ({getTimeFilterLabel()})
            </h3>
            <FiBarChart2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px"
                  }}
                  formatter={(value, name) => [formatCurrency(value), "Doanh thu"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compact Category Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Phân bố danh mục</h3>
            <FiPieChart className="w-4 h-4 text-gray-400" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelStyle={{ fontSize: "10px" }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: "12px" }}
                  formatter={(value, name) => [`${value}%`, "Tỷ lệ"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compact Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Thao tác nhanh</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-xs font-medium text-blue-900">Xuất báo cáo tháng</span>
              </div>
              <div className="text-blue-600 text-xs">→</div>
            </button>

            <button className="w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded transition-colors">
              <div className="flex items-center">
                <FiTrendingUp className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-xs font-medium text-green-900">Phân tích xu hướng</span>
              </div>
              <div className="text-green-600 text-xs">→</div>
            </button>

            <button className="w-full flex items-center justify-between p-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
              <div className="flex items-center">
                <FiUsers className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-xs font-medium text-purple-900">Báo cáo khách hàng</span>
              </div>
              <div className="text-purple-600 text-xs">→</div>
            </button>
          </div>
        </div>

        {/* Compact Summary Stats */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Tóm tắt {getTimeFilterLabel()}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-700">Doanh thu TB/ngày</span>
              <span className="text-xs font-bold text-gray-900">
                {formatCurrency(analyticsData.totalRevenue / 7)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-700">Đơn hàng TB/ngày</span>
              <span className="text-xs font-bold text-gray-900">
                {Math.round(analyticsData.totalOrders / 7)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-700">Giá trị ĐH TB</span>
              <span className="text-xs font-bold text-gray-900">
                {formatCurrency(analyticsData.totalRevenue / analyticsData.totalOrders || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
