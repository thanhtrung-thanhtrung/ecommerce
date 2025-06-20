import React from "react";
import {
  FiActivity,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAdmin } from "../contexts/AdminContext";

const Dashboard = () => {
  const { dashboardData } = useAdmin();

  const statsCards = [
    {
      title: "Đơn hàng hoàn thành",
      value: "12",
      icon: FiActivity,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Doanh thu",
      value: "3,500,000₫",
      icon: FiDollarSign,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Tổng thời gian",
      value: "8h 30m",
      icon: FiClock,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tiến độ",
      value: "15%",
      icon: FiTrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const recentOrders = [
    {
      id: 1,
      name: "Giày Nike Air Max",
      date: "2023-06-01",
      amount: "2,500,000₫",
    },
    {
      id: 2,
      name: "Giày Adidas Ultraboost",
      date: "2023-05-30",
      amount: "3,200,000₫",
    },
    {
      id: 3,
      name: "Giày Converse Chuck Taylor",
      date: "2023-05-28",
      amount: "1,500,000₫",
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border"
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
              Tiến độ bán hàng hàng tuần
            </h2>
            <p className="text-sm text-gray-600">Doanh thu (triệu đồng)</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.weeklyProgress}>
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
                />
                <Bar
                  dataKey="duration"
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
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {order.name}
                  </p>
                  <p className="text-xs text-gray-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    {order.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả đơn hàng
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left hover:bg-blue-100 transition-colors">
          <FiActivity className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Thêm sản phẩm mới</h3>
          <p className="text-sm text-gray-600">
            Thêm sản phẩm giày mới vào cửa hàng
          </p>
        </button>

        <button className="p-4 bg-green-50 border border-green-200 rounded-xl text-left hover:bg-green-100 transition-colors">
          <FiDollarSign className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Xem báo cáo</h3>
          <p className="text-sm text-gray-600">
            Kiểm tra doanh thu và thống kê
          </p>
        </button>

        <button className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-left hover:bg-purple-100 transition-colors">
          <FiTrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Quản lý khuyến mãi</h3>
          <p className="text-sm text-gray-600">Tạo và quản lý mã giảm giá</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
