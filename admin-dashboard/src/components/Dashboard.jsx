import React, { useEffect, useState } from "react";
import {
  FiActivity,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiCalendar,
  FiPackage,
  FiUsers,
  FiShoppingCart,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAdmin } from "../contexts/AdminContext";
import { toast } from "react-toastify";

const Dashboard = () => {
  const {
    dashboardData,
    getOrderStats,
    getOrders,
    getProductsAdmin,
    getRevenueStats,
  } = useAdmin();

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load order statistics
      const orderStatsResponse = await getOrderStats();
      console.log("Order stats:", orderStatsResponse);

      // Load recent orders - 3 đơn hàng gần đây
      const ordersResponse = await getOrders({ page: 1, limit: 3 });
      console.log("Recent orders:", ordersResponse);

      // Load product count
      const productsResponse = await getProductsAdmin({ page: 1, limit: 1 });
      console.log("Products response:", productsResponse);

      // Load revenue stats for chart - Lấy dữ liệu 7 ngày gần đây
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      const revenueResponse = await getRevenueStats({
        tuNgay: sevenDaysAgo.toISOString().split("T")[0], // Format: YYYY-MM-DD
        denNgay: currentDate.toISOString().split("T")[0],
        loaiThongKe: "ngay", // Thống kê theo ngày
      });
      console.log("Revenue stats:", revenueResponse);

      // Update stats
      setStats({
        totalOrders: orderStatsResponse?.totalOrders || 0,
        totalRevenue: parseFloat(orderStatsResponse?.revenue?.total || 0),
        totalProducts: productsResponse?.pagination?.total || 0,
        completedOrders: orderStatsResponse?.revenue?.completedOrders || 0,
        pendingOrders:
          orderStatsResponse?.statusBreakdown?.find((s) => s.status === "pending")
            ?.count || 0,
        cancelledOrders:
          orderStatsResponse?.statusBreakdown?.find((s) => s.status === "cancelled")
            ?.count || 0,
      });

      // Set recent orders - 3 đơn hàng gần đây
      setRecentOrders(ordersResponse?.orders?.slice(0, 3) || []);

      // Set chart data from revenue API
      if (revenueResponse?.success && revenueResponse?.data?.doanhThuTheoThoiGian && revenueResponse.data.doanhThuTheoThoiGian.length > 0) {
        const formattedChartData = revenueResponse.data.doanhThuTheoThoiGian.map((item, index) => {
          // Handle date parsing more safely
          let dayLabel = `Ngày ${index + 1}`;
          try {
            if (item.ngay && item.ngay !== 'Invalid Date') {
              const date = new Date(item.ngay);
              if (!isNaN(date.getTime())) {
                dayLabel = date.toLocaleDateString("vi-VN", { weekday: "short" });
              }
            }
          } catch (error) {
            console.error("Error parsing date:", item.ngay, error);
          }

          return {
            day: dayLabel,
            revenue: Math.round(parseFloat(item.tongThanhToan || 0) / 1000000000), // Convert to billions (tỷ)
            orders: parseInt(item.soDonHang || 0),
          };
        });
        setChartData(formattedChartData);
        console.log("Formatted chart data:", formattedChartData);
      } else {
        // Fallback to mock data when no revenue data available
        console.log("Using mock data - no revenue trend data available");
        const mockChartData = [
          { day: "T2", revenue: 15 },
          { day: "T3", revenue: 25 },
          { day: "T4", revenue: 18 },
          { day: "T5", revenue: 32 },
          { day: "T6", revenue: 28 },
          { day: "T7", revenue: 45 },
          { day: "CN", revenue: 38 },
        ];
        setChartData(mockChartData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Lỗi khi tải dữ liệu dashboard");

      // Fallback to mock data
      setStats({
        totalOrders: 145,
        totalRevenue: 25000000,
        totalProducts: 89,
        completedOrders: 132,
        pendingOrders: 8,
        cancelledOrders: 5,
      });

      const mockChartData = [
        { day: "T2", revenue: 15 },
        { day: "T3", revenue: 25 },
        { day: "T4", revenue: 18 },
        { day: "T5", revenue: 32 },
        { day: "T6", revenue: 28 },
        { day: "T7", revenue: 45 },
        { day: "CN", revenue: 38 },
      ];
      setChartData(mockChartData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Stats cards with real data
  const statsCards = [
    {
      title: "Tổng đơn hàng",
      value: stats.totalOrders.toLocaleString(),
      icon: FiShoppingCart,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Doanh thu",
      value: formatCurrency(stats.totalRevenue),
      icon: FiDollarSign,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts.toLocaleString(),
      icon: FiPackage,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Đơn hoàn thành",
      value: stats.completedOrders.toLocaleString(),
      icon: FiActivity,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Chào mừng trở lại! Đây là tổng quan về cửa hàng giày của bạn.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Progress Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Doanh thu 7 ngày gần đây
            </h2>
            <p className="text-sm text-gray-600">Doanh thu (tỷ đồng)</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [`${value} tỷ VNĐ`, "Doanh thu"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Doanh thu (triệu)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Đơn hàng gần đây
            </h2>
            <p className="text-sm text-gray-600">Các đơn hàng mới nhất</p>
          </div>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Đơn hàng #{order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(order.total)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {order.status === "completed"
                        ? "Hoàn thành"
                        : order.status === "pending"
                          ? "Chờ xử lý"
                          : order.status === "cancelled"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FiCalendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
          <button
            onClick={() => (window.location.href = "/orders")}
            className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả đơn hàng
          </button>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Đã hủy</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.cancelledOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => (window.location.href = "/products")}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left hover:bg-blue-100 transition-colors"
        >
          <FiPackage className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Quản lý sản phẩm</h3>
          <p className="text-sm text-gray-600">Thêm, sửa, xóa sản phẩm giày</p>
        </button>

        <button
          onClick={() => (window.location.href = "/orders")}
          className="p-4 bg-green-50 border border-green-200 rounded-xl text-left hover:bg-green-100 transition-colors"
        >
          <FiShoppingCart className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Quản lý đơn hàng</h3>
          <p className="text-sm text-gray-600">Xem và xử lý đơn hàng</p>
        </button>

        <button
          onClick={() => (window.location.href = "/vouchers")}
          className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-left hover:bg-purple-100 transition-colors"
        >
          <FiTrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Quản lý khuyến mãi</h3>
          <p className="text-sm text-gray-600">Tạo và quản lý mã giảm giá</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
