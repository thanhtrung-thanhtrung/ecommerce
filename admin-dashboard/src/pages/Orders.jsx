import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiFilter,
  FiDownload,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAdmin } from "../contexts/AdminContext";

// Helper function để format tiền không có đuôi .00
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0₫";

  const numAmount = typeof amount === "number" ? amount : parseFloat(amount) || 0;

  // Chỉ hiển thị số nguyên, không có dấu phẩy, không có .00
  return Math.round(numAmount).toString() + "₫";
};

const Orders = () => {
  const { getOrders, updateOrderStatus, getOrderDetail, loading } = useAdmin();

  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const orderStatuses = {
    pending: { label: "Chờ xử lý", color: "yellow", icon: FiClock },
    confirmed: { label: "Đã xác nhận", color: "blue", icon: FiCheckCircle },
    processing: { label: "Đang xử lý", color: "indigo", icon: FiPackage },
    shipping: { label: "Đang giao", color: "purple", icon: FiTruck },
    delivered: { label: "Đã giao", color: "green", icon: FiCheckCircle },
    cancelled: { label: "Đã hủy", color: "red", icon: FiXCircle },
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateFilter]);

  const loadOrders = async () => {
    try {
      const params = {
        limit: 1000, // Lấy tất cả đơn hàng
        ...(statusFilter && { status: statusFilter }),
        ...(dateFilter && { date: dateFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const data = await getOrders(params);
      setOrders(data?.orders || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
      toast.success("Cập nhật trạng thái đơn hàng thành công!");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        "Lỗi khi cập nhật trạng thái: " + (error.message || "Không xác định")
      );
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await getOrderDetail(orderId);
      setSelectedOrder(orderDetail);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading order detail:", error);
      toast.error(
        "Lỗi khi tải chi tiết đơn hàng: " + (error.message || "Không xác định")
      );
    }
  };

  const getStatusColor = (status) => {
    const statusInfo = orderStatuses[status] || orderStatuses["pending"];
    return statusInfo.color;
  };

  const getStatusIcon = (status) => {
    const statusInfo = orderStatuses[status] || orderStatuses["pending"];
    return statusInfo.icon;
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id?.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-600">Tổng cộng {filteredOrders.length} đơn hàng</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadOrders}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600">
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(orderStatuses).map(([key, status]) => (
              <option key={key} value={key}>
                {status.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => {
              setStatusFilter("");
              setDateFilter("");
              setSearchTerm("");
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FiFilter className="w-4 h-4" />
            <span>Xóa lọc</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-8 h-8 animate-spin mr-3 text-blue-500" />
              <span className="text-lg text-gray-600">Đang tải đơn hàng...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiPackage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng nào</h3>
            <p className="text-gray-500">Chưa có đơn hàng nào được tạo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại            </th>
                 
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const statusColor = getStatusColor(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 text-center">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail || "N/A"}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {order.customerPhone || "N/A"}
                        </div>
                      </td>
                     
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 text-${statusColor}-500`} />
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-sm border-0 bg-${statusColor}-100 text-${statusColor}-800 rounded-full px-3 py-1 font-medium focus:ring-2 focus:ring-${statusColor}-500`}
                          >
                            {Object.entries(orderStatuses).map(([key, status]) => (
                              <option key={key} value={key}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Xem chi tiết"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Chi tiết đơn hàng #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Thông tin khách hàng</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Tên:</span>{" "}
                    {selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedOrder.customerEmail}
                  </p>
                  <p>
                    <span className="font-medium">Điện thoại:</span>{" "}
                    {selectedOrder.customerPhone}
                  </p>
                  <p>
                    <span className="font-medium">Địa chỉ:</span>{" "}
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Thông tin đơn hàng</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Mã đơn:</span> #
                    {selectedOrder.id}
                  </p>
                  <p>
                    <span className="font-medium">Ngày đặt:</span>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <span className="font-medium">Phương thức thanh toán:</span>{" "}
                    {selectedOrder.paymentMethod}
                  </p>
                  <p>
                    <span className="font-medium">Trạng thái:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs bg-${getStatusColor(
                        selectedOrder.status
                      )}-100 text-${getStatusColor(selectedOrder.status)}-800`}
                    >
                      {orderStatuses[selectedOrder.status]?.label ||
                        "Chờ xử lý"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Sản phẩm đặt hàng</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4 text-sm font-medium text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.variant}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-4 text-sm">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
