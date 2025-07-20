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
  FiCheckCircle, FiTruck, FiXCircle
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
import axios from "axios";

const orderStatuses = {
  1: { key: 1, label: "Chờ xác nhận", color: "yellow", icon: FiClock },
  2: { key: 2, label: "Đã xác nhận", color: "blue", icon: FiCheckCircle },
  3: { key: 3, label: "Đang giao", color: "purple", icon: FiTruck },
  4: { key: 4, label: "Đã giao", color: "green", icon: FiCheckCircle },
  5: { key: 5, label: "Đã hủy", color: "red", icon: FiXCircle },
};

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
    confirmedOrders: 0,
    shippedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Gọi các API
      const orderStatsResponse = await getOrderStats();
      const ordersResponse = await getOrders({ page: 1, limit: 3 });
      const productsResponse = await getProductsAdmin({ page: 1, limit: 1 });

      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      const revenueResponse = await getRevenueStats({
        tuNgay: sevenDaysAgo.toISOString().split("T")[0],
        denNgay: currentDate.toISOString().split("T")[0],
        loaiThongKe: "ngay",
      });

      // Cập nhật thống kê tổng quan - sửa tên trường cho đúng API response
      const overview = orderStatsResponse?.overview || {};

      setStats({
        totalOrders: parseInt(overview.totalOrders || 0),
        totalRevenue: parseFloat(overview.totalRevenue || 0),
        totalProducts: parseInt(productsResponse?.pagination?.total || 0),
        completedOrders: parseInt(overview.deliveredOrders || 0),
        pendingOrders: parseInt(overview.pendingOrders || 0),
        cancelledOrders: parseInt(overview.cancelledOrders || 0),
        confirmedOrders: parseInt(overview.confirmedOrders || 0),
        shippedOrders: parseInt(overview.shippedOrders || 0),
      });

      // Đơn hàng gần đây
      setRecentOrders(ordersResponse?.orders?.slice(0, 3) || []);

      // Doanh thu theo ngày - sử dụng revenueByDate từ orderStatsResponse nếu có
      if (orderStatsResponse?.revenueByDate && Array.isArray(orderStatsResponse.revenueByDate)) {
        const formattedChartData = orderStatsResponse.revenueByDate.map((item, index) => {
          let dayLabel = `Ngày ${index + 1}`;
          try {
            if (item.date) {
              const date = new Date(item.date);
              if (!isNaN(date.getTime())) {
                dayLabel = date.toLocaleDateString("vi-VN", { weekday: "short" });
              }
            }
          } catch {
            // fallback giữ lại label
          }

          return {
            day: dayLabel,
            revenue: Math.round(parseFloat(item.revenue || 0) / 1_000_000), // triệu VNĐ
            orders: parseInt(item.orders || 0),
          };
        });

        setChartData(formattedChartData);
      } else if (
        revenueResponse?.success &&
        Array.isArray(revenueResponse?.data?.doanhThuTheoThoiGian)
      ) {
        const formattedChartData = revenueResponse.data.doanhThuTheoThoiGian.map((item, index) => {
          let dayLabel = `Ngày ${index + 1}`;
          try {
            if (item.thoiGian) {
              const date = new Date(item.thoiGian);
              if (!isNaN(date.getTime())) {
                dayLabel = date.toLocaleDateString("vi-VN", { weekday: "short" });
              }
            }
          } catch {
            // fallback giữ lại label
          }

          return {
            day: dayLabel,
            revenue: Math.round(parseFloat(item.tongThanhToan || 0) / 1_000_000), // triệu VNĐ
            orders: parseInt(item.soDonHang || 0),
          };
        });

        setChartData(formattedChartData);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Lỗi khi tải dữ liệu dashboard");

      // fallback data
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
      });

      setChartData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Đơn hàng",
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
      title: "Sản phẩm",
      value: stats.totalProducts.toLocaleString(),
      icon: FiPackage,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Hoàn thành",
      value: stats.completedOrders.toLocaleString(),
      icon: FiActivity,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const OrderList = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
      const fetchOrders = async () => {
        try {
          const response = await axios.get("/api/orders");
          if (response?.data?.success) {
            setOrders(response.data.data);
          }
        } catch (error) {
          console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        }
      };

      fetchOrders();
    }, []);

    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Danh sách đơn hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => {
            const status = orderStatuses[order.TrangThai];
            const StatusIcon = status?.icon || FiClock;

            return (
              <div
                key={order.id}
                className="border rounded-xl shadow-md p-4 bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">
                    Mã đơn: #{order.id}
                  </h3>
                  <div
                    className={`flex items-center gap-2 text-${status.color}-600`}
                  >
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-medium">{status.label}</span>
                  </div>
                </div>
                <p>Ngày đặt: {new Date(order.NgayDat).toLocaleDateString()}</p>
                <p>Tổng tiền: {order.TongTien?.toLocaleString()}₫</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">Tổng quan cửa hàng giày</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-3 border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compact Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 border">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Doanh thu 7 ngày
            </h2>
            <p className="text-xs text-gray-600">Doanh thu </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [`${value}  VNĐ`, "Doanh thu"]}
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

        {/* Compact Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Đơn hàng gần đây
            </h2>
            <p className="text-xs text-gray-600">Các đơn hàng mới nhất</p>
          </div>
          <div className="space-y-2">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      #{order.id}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Sửa trạng thái dùng order.TrangThai và mapping qua orderStatuses */}
                    {(() => {
                      const statusInfo = orderStatuses[order.TrangThai] || orderStatuses[1];
                      return (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
                        >
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FiCalendar className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Chưa có đơn hàng</p>
              </div>
            )}
          </div>
          <button
            onClick={() => (window.location.href = "/orders")}
            className="w-full mt-3 text-center text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả
          </button>
        </div>
      </div>

      {/* Compact Order Status */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-3 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Chờ xử lý</p>
              <p className="text-lg font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FiActivity className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Hoàn thành</p>
              <p className="text-lg font-bold text-gray-900">{stats.completedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Đã hủy</p>
              <p className="text-lg font-bold text-gray-900">{stats.cancelledOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Quick Actions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => (window.location.href = "/products")}
          className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
        >
          <FiPackage className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">Sản phẩm</h3>
          <p className="text-xs text-gray-600">Quản lý sản phẩm</p>
        </button>

        <button
          onClick={() => (window.location.href = "/orders")}
          className="p-3 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
        >
          <FiShoppingCart className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">Đơn hàng</h3>
          <p className="text-xs text-gray-600">Xử lý đơn hàng</p>
        </button>

        <button
          onClick={() => (window.location.href = "/vouchers")}
          className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors"
        >
          <FiTrendingUp className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">Khuyến mãi</h3>
          <p className="text-xs text-gray-600">Mã giảm giá</p>
        </button>
      </div>

      {/* Order List Component - Uncomment to use */}
      {/* <OrderList /> */}
    </div>
  );
};

export default Dashboard;
