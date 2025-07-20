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
  FiBox,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAdmin } from "../contexts/AdminContext";

// Helper function để format tiền VNĐ
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0₫";
  const numAmount = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat("vi-VN").format(Math.round(numAmount)) + "₫";
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
    1: { key: 1, label: "Chờ xác nhận", color: "yellow", icon: FiClock },
    2: { key: 2, label: "Đã xác nhận", color: "blue", icon: FiCheckCircle },
    3: { key: 3, label: "Đang giao", color: "purple", icon: FiTruck },
    4: { key: 4, label: "Đã giao", color: "green", icon: FiCheckCircle },
    5: { key: 5, label: "Đã hủy", color: "red", icon: FiXCircle },
  };

  const statusStringToNumber = {
    "pending": 1,
    "confirmed": 2,
    "shipping": 3,
    "delivered": 4,
    "cancelled": 5,
    "processing": 3,
  };

  const getStatusInfo = (status) => {
    if (typeof status === "number") {
      return orderStatuses[status] || orderStatuses[1];
    }
    if (!isNaN(Number(status))) {
      return orderStatuses[Number(status)] || orderStatuses[1];
    }
    const numberStatus = statusStringToNumber[status];
    return orderStatuses[numberStatus] || orderStatuses[1];
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateFilter]);

  const loadOrders = async () => {
    try {
      const params = {
        limit: 1000,
        ...(statusFilter && { status: statusFilter }),
        ...(dateFilter && { date: dateFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const data = await getOrders(params);
      setOrders(data?.orders || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
      toast.error("Lỗi khi tải danh sách đơn hàng");
    }
  };
  
  const validTransitions = {
    1: [2, 5], // Chờ xác nhận: Có thể chuyển sang Đã xác nhận (2) hoặc Đã hủy (5)
    2: [3, 5], // Đã xác nhận: Có thể chuyển sang Đang giao (3) hoặc Đã hủy (5)
    3: [4, 5], // Đang giao: Có thể chuyển sang Đã giao (4) hoặc Đã hủy (5)
    4: [],     // Đã giao: Không thể chuyển trạng thái nữa
    5: []      // Đã hủy: Không thể chuyển trạng thái nữa
  };

  const handleStatusChange = async (orderId, newStatus, currentStatus) => {
    const currentStatusNumber = typeof currentStatus === "number" ? currentStatus : parseInt(currentStatus);
    const backendStatus = typeof newStatus === "number" ? newStatus : parseInt(newStatus);

    // Kiểm tra quy tắc chuyển trạng thái hợp lệ
    if (!validTransitions[currentStatusNumber] || !validTransitions[currentStatusNumber].includes(backendStatus)) {
      toast.error("Không thể chuyển trạng thái này! Vui lòng tuân theo quy trình: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao");
      return;
    }

    // Xác nhận trước khi chuyển trạng thái
    const statusMessages = {
      1: "Chờ xác nhận",
      2: "Đã xác nhận",
      3: "Đang giao",
      4: "Đã giao",
      5: "Đã hủy"
    };

    const currentStatusText = statusMessages[currentStatusNumber];
    const newStatusText = statusMessages[backendStatus];

    // Xử lý đặc biệt cho việc hủy đơn hàng
    if (backendStatus === 5) {
      const confirmMessage = `Bạn có chắc chắn muốn hủy đơn hàng #${orderId}?\n\nTrạng thái hiện tại: ${currentStatusText}\nSẽ chuyển thành: ${newStatusText}`;
      if (window.confirm(confirmMessage)) {
        await doUpdateStatus(orderId, backendStatus);
      }
      return;
    }

    // Xác nhận cho các trạng thái khác
    const confirmMessage = `Xác nhận chuyển trạng thái đơn hàng #${orderId}?\n\nTừ: ${currentStatusText}\nSang: ${newStatusText}`;
    if (window.confirm(confirmMessage)) {
      await doUpdateStatus(orderId, backendStatus);
    }
  };

  const doUpdateStatus = async (orderId, newStatusNumber) => {
    try {
      await updateOrderStatus(orderId, newStatusNumber);
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

  const filteredOrders = orders.filter(
    (order) =>
      order.id?.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm)
  );

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-600">
            Tổng: {filteredOrders.length} đơn hàng
            {orders.length !== filteredOrders.length &&
              ` (từ ${orders.length})`}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadOrders}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 transition-colors text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button className="bg-green-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-green-600 transition-colors text-sm">
            <FiDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      {/* <div className="mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(orderStatuses).map(([number, statusInfo]) => (
              <option key={statusInfo.key} value={statusInfo.key}>
                {statusInfo.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <button
            onClick={() => {
              setStatusFilter("");
              setDateFilter("");
              setSearchTerm("");
              loadOrders();
            }}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <FiFilter className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        </div>
      </div> */}

      {/* Compact Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
              <span className="text-sm text-gray-600">Đang tải...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {orders.length === 0
                ? "Không có đơn hàng nào"
                : "Không tìm thấy đơn hàng"}
            </h3>
            <p className="text-sm text-gray-500">
              {orders.length === 0
                ? "Chưa có đơn hàng nào được tạo"
                : "Thử thay đổi bộ lọc để tìm đơn hàng khác"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SĐT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => {
                  const orderStatus = order.TrangThai || order.status;
                  const statusInfo = getStatusInfo(orderStatus);
                  const StatusIcon = statusInfo.icon;

                  const statusNumber = typeof orderStatus === "number" ? orderStatus : parseInt(orderStatus);
                  const isFinalStatus = statusNumber === 4 || statusNumber === 5;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 text-center">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-blue-600">
                          #{order.id}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium text-gray-900">
                          {order.customerName || "Khách vãng lai"}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {order.customerEmail || "Không có email"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {order.customerPhone || "Không có"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-bold text-green-600">
                          {formatCurrency(order.total)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <StatusIcon className={`w-3 h-3 text-${statusInfo.color}-500`} />
                          {/* Chỉ hiển thị select nếu có thể chuyển trạng thái */}
                          {validTransitions[statusNumber] && validTransitions[statusNumber].length > 0 ? (
                            <select
                              value={statusNumber}
                              onChange={(e) => handleStatusChange(order.id, parseInt(e.target.value), statusNumber)}
                              className={`text-xs border-0 bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full px-2 py-1 font-medium focus:ring-2 focus:ring-${statusInfo.color}-500 cursor-pointer`}
                            >
                              {/* Trạng thái hiện tại */}
                              <option value={statusNumber}>
                                {orderStatuses[statusNumber]?.label || ""}
                              </option>
                              {/* Các trạng thái có thể chuyển đến */}
                              {validTransitions[statusNumber].map((nextStatus) => (
                                <option key={nextStatus} value={nextStatus}>
                                  {nextStatus === 5 ? "🚫 " : "➡️ "}{orderStatuses[nextStatus]?.label || ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            // Hiển thị badge tĩnh nếu không thể chuyển trạng thái
                            <span className={`text-xs bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full px-2 py-1 font-medium`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center"
                          title="Xem chi tiết"
                        >
                          <FiEye className="w-3.5 h-3.5" />
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

      {/* Compact Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết đơn hàng #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2 text-gray-900 text-sm">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-20">Tên:</span>
                    <span className="text-gray-900">
                      {selectedOrder.customerName || "Khách vãng lai"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-20">Email:</span>
                    <span className="text-gray-900">
                      {selectedOrder.customerEmail || "Không có"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-20">SĐT:</span>
                    <span className="text-gray-900">
                      {selectedOrder.customerPhone || "Không có"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600 mb-1">
                      Địa chỉ:
                    </span>
                    <span className="text-gray-900">
                      {selectedOrder.shippingAddress || "Không có"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2 text-gray-900 text-sm">
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-24">Mã đơn:</span>
                    <span className="text-blue-600 font-medium">#{selectedOrder.id}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-24">Ngày đặt:</span>
                    <span className="text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-24">Thanh toán:</span>
                    <span className="text-gray-900">
                      {selectedOrder.paymentMethod || "Tiền mặt"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-24">Vận chuyển:</span>
                    <span className="text-gray-900">
                      {selectedOrder.shippingMethod || "Giao hàng tiêu chuẩn"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-24">Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusInfo(
                        selectedOrder.TrangThai || selectedOrder.status
                      ).color}-100 text-${getStatusInfo(selectedOrder.TrangThai || selectedOrder.status).color}-800`}
                    >
                      {getStatusInfo(selectedOrder.TrangThai || selectedOrder.status).label}
                    </span>
                  </div>
                  {selectedOrder.note && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600 mb-1">Ghi chú:</span>
                      <span className="text-gray-900 italic">{selectedOrder.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3 text-gray-900 text-sm">
                Sản phẩm đặt hàng ({selectedOrder.items?.length || 0} sản phẩm)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        STT
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Đơn giá
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        SL
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-medium text-center text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 mb-1">
                                {item.name || "Sản phẩm"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.variant || item.size + " / " + item.color}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-xs text-center font-medium text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-bold text-gray-900">
                          {formatCurrency(item.total || item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-gray-900 text-sm">Tổng kết đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(selectedOrder.discount)}
                    </span>
                  </div>
                )}
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-900">Tổng thanh toán:</span>
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
