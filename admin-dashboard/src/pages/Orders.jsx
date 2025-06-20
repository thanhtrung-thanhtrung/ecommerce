import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEye,
  FiTruck,
  FiCheck,
  FiX,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Mock data for orders
  const mockOrders = [
    {
      id: 1,
      MaDonHang: "DH001",
      TenKhachHang: "Nguyễn Văn A",
      Email: "nguyenvana@email.com",
      SoDienThoai: "0123456789",
      TongTien: 2500000,
      TrangThai: "pending",
      NgayDatHang: "2024-06-20",
      DiaChiGiaoHang: "Số 123, Đường ABC, Quận 1, TP.HCM",
      SanPham: [
        {
          Ten: "Giày Nike Air Max",
          SoLuong: 1,
          Gia: 2500000,
          KichCo: 42,
          MauSac: "Đen",
        },
      ],
    },
    {
      id: 2,
      MaDonHang: "DH002",
      TenKhachHang: "Trần Thị B",
      Email: "tranthib@email.com",
      SoDienThoai: "0987654321",
      TongTien: 1800000,
      TrangThai: "confirmed",
      NgayDatHang: "2024-06-19",
      DiaChiGiaoHang: "Số 456, Đường XYZ, Quận 2, TP.HCM",
      SanPham: [
        {
          Ten: "Giày Adidas Ultraboost",
          SoLuong: 1,
          Gia: 1800000,
          KichCo: 39,
          MauSac: "Trắng",
        },
      ],
    },
    {
      id: 3,
      MaDonHang: "DH003",
      TenKhachHang: "Lê Văn C",
      Email: "levanc@email.com",
      SoDienThoai: "0369258147",
      TongTien: 1500000,
      TrangThai: "shipping",
      NgayDatHang: "2024-06-18",
      DiaChiGiaoHang: "Số 789, Đường DEF, Quận 3, TP.HCM",
      SanPham: [
        {
          Ten: "Giày Converse Chuck Taylor",
          SoLuong: 1,
          Gia: 1500000,
          KichCo: 41,
          MauSac: "Đỏ",
        },
      ],
    },
    {
      id: 4,
      MaDonHang: "DH004",
      TenKhachHang: "Phạm Thị D",
      Email: "phamthid@email.com",
      SoDienThoai: "0741852963",
      TongTien: 3200000,
      TrangThai: "delivered",
      NgayDatHang: "2024-06-17",
      DiaChiGiaoHang: "Số 321, Đường GHI, Quận 4, TP.HCM",
      SanPham: [
        {
          Ten: "Giày Nike Jordan",
          SoLuong: 1,
          Gia: 3200000,
          KichCo: 40,
          MauSac: "Đen đỏ",
        },
      ],
    },
  ];

  useEffect(() => {
    setOrders(mockOrders);
  }, []);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-yellow-100 text-yellow-800",
        icon: FiCalendar,
      },
      confirmed: {
        label: "Đã xác nhận",
        color: "bg-blue-100 text-blue-800",
        icon: FiCheck,
      },
      shipping: {
        label: "Đang giao hàng",
        color: "bg-purple-100 text-purple-800",
        icon: FiTruck,
      },
      delivered: {
        label: "Đã giao hàng",
        color: "bg-green-100 text-green-800",
        icon: FiPackage,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800",
        icon: FiX,
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, TrangThai: newStatus } : order
      )
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, TrangThai: newStatus });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.MaDonHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.TenKhachHang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "" || order.TrangThai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.TrangThai === "pending").length,
    confirmed: orders.filter((o) => o.TrangThai === "confirmed").length,
    shipping: orders.filter((o) => o.TrangThai === "shipping").length,
    delivered: orders.filter((o) => o.TrangThai === "delivered").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Theo dõi và xử lý các đơn hàng giày</p>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {orderStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiCalendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Chờ xác nhận</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orderStats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đã xác nhận</p>
              <p className="text-2xl font-bold text-blue-600">
                {orderStats.confirmed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiTruck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đang giao</p>
              <p className="text-2xl font-bold text-purple-600">
                {orderStats.shipping}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đã giao</p>
              <p className="text-2xl font-bold text-green-600">
                {orderStats.delivered}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng, khách hàng..."
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
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.TrangThai);
              const StatusIcon = statusInfo.icon;

              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.MaDonHang}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.NgayDatHang}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.TenKhachHang}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.SoDienThoai}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.SanPham[0]?.Ten}
                      {order.SanPham.length > 1 && (
                        <span className="text-gray-500">
                          {" "}
                          +{order.SanPham.length - 1} sản phẩm khác
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Size {order.SanPham[0]?.KichCo} •{" "}
                      {order.SanPham[0]?.MauSac}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiDollarSign className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {order.TongTien.toLocaleString()}₫
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetail(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Xem chi tiết"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>

                    {/* Quick Status Update Buttons */}
                    {order.TrangThai === "pending" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="Xác nhận đơn hàng"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}

                    {order.TrangThai === "confirmed" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "shipping")}
                        className="text-purple-600 hover:text-purple-900 mr-2"
                        title="Bắt đầu giao hàng"
                      >
                        <FiTruck className="w-4 h-4" />
                      </button>
                    )}

                    {order.TrangThai === "shipping" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "delivered")}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Hoàn thành giao hàng"
                      >
                        <FiPackage className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Chi tiết đơn hàng #{selectedOrder.MaDonHang}
              </h2>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Tên:</span>{" "}
                    {selectedOrder.TenKhachHang}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedOrder.Email}
                  </p>
                  <p>
                    <span className="font-medium">SĐT:</span>{" "}
                    {selectedOrder.SoDienThoai}
                  </p>
                  <p>
                    <span className="font-medium">Địa chỉ:</span>{" "}
                    {selectedOrder.DiaChiGiaoHang}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Mã đơn hàng:</span> #
                    {selectedOrder.MaDonHang}
                  </p>
                  <p>
                    <span className="font-medium">Ngày đặt:</span>{" "}
                    {selectedOrder.NgayDatHang}
                  </p>
                  <p>
                    <span className="font-medium">Tổng tiền:</span>{" "}
                    {selectedOrder.TongTien.toLocaleString()}₫
                  </p>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Trạng thái:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusInfo(selectedOrder.TrangThai).color
                      }`}
                    >
                      {getStatusInfo(selectedOrder.TrangThai).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Sản phẩm đã đặt</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Size
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Màu sắc
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        SL
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                        Giá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.SanPham.map((product, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {product.Ten}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.KichCo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.MauSac}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.SoLuong}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {product.Gia.toLocaleString()}₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Update Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              {selectedOrder.TrangThai === "pending" && (
                <>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "cancelled");
                      setShowOrderDetail(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Hủy đơn hàng
                  </button>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "confirmed");
                      setShowOrderDetail(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Xác nhận đơn hàng
                  </button>
                </>
              )}

              {selectedOrder.TrangThai === "confirmed" && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "shipping");
                    setShowOrderDetail(false);
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Bắt đầu giao hàng
                </button>
              )}

              {selectedOrder.TrangThai === "shipping" && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "delivered");
                    setShowOrderDetail(false);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Hoàn thành giao hàng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
