import React, { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/helpers";
import { useShop } from "../contexts/ShopContext";
import { toast } from "react-toastify";

const TrackOrderPage = () => {
  const { getOrderById, loading } = useShop();
  const [orderNumber, setOrderNumber] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setOrderDetails(null);
    if (!orderNumber.trim() || !orderEmail.trim()) {
      setSearchError("Vui lòng nhập đầy đủ mã đơn hàng và email.");
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${orderNumber}&email=${orderEmail}`
      );
      const data = await res.json();
      if (data.success && data.order) {
        setOrderDetails(data.order);
      } else {
        setSearchError("Không tìm thấy đơn hàng với thông tin này.");
      }
    } catch (error) {
      setSearchError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Tra cứu đơn hàng</h1>
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-lg shadow p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Mã đơn hàng</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email nhận hàng</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={orderEmail}
            onChange={(e) => setOrderEmail(e.target.value)}
            required
          />
        </div>
        {searchError && (
          <div className="text-red-600 text-sm">{searchError}</div>
        )}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 font-medium"
          disabled={isSearching}
        >
          {isSearching ? "Đang tra cứu..." : "Tra cứu đơn hàng"}
        </button>
      </form>

      {orderDetails && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Thông tin đơn hàng</h2>
          <div className="mb-2 text-sm text-gray-600">
            Mã đơn:{" "}
            <span className="font-bold">
              {orderDetails.MaDonHang || orderDetails.id}
            </span>
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Trạng thái:{" "}
            <span className="font-bold">
              {orderDetails.TrangThaiText || orderDetails.TrangThai}
            </span>
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Ngày đặt:{" "}
            {orderDetails.NgayDatHang &&
              new Date(orderDetails.NgayDatHang).toLocaleString()}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Tên người nhận:{" "}
            <span className="font-bold">{orderDetails.TenNguoiNhan}</span>
          </div>
          <div className="mb-2 text-sm text-gray-600">
            SĐT: {orderDetails.SDTNguoiNhan}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Địa chỉ: {orderDetails.DiaChiNhan}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Email: {orderDetails.EmailNguoiNhan}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Phương thức thanh toán:{" "}
            {orderDetails.paymentMethod || orderDetails.id_ThanhToan}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Phương thức vận chuyển:{" "}
            {orderDetails.shippingMethod || orderDetails.id_VanChuyen}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Tạm tính:{" "}
            <span className="font-bold">
              {orderDetails.TongTienHang?.toLocaleString()}đ
            </span>
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Phí vận chuyển:{" "}
            <span className="font-bold">
              {orderDetails.PhiVanChuyen?.toLocaleString()}đ
            </span>
          </div>
          {orderDetails.GiamGia > 0 && (
            <div className="mb-2 text-sm text-green-600">
              Giảm giá: -{orderDetails.GiamGia?.toLocaleString()}đ
            </div>
          )}
          <div className="mb-2 text-sm text-gray-800 font-bold">
            Tổng cộng: {orderDetails.TongThanhToan?.toLocaleString()}đ
          </div>
          {orderDetails.MaGiamGia && (
            <div className="mb-2 text-sm text-blue-600">
              Mã giảm giá: {orderDetails.MaGiamGia}
            </div>
          )}
          {orderDetails.GhiChu && (
            <div className="mb-2 text-sm text-gray-600">
              Ghi chú: {orderDetails.GhiChu}
            </div>
          )}
          {/* Hiển thị danh sách sản phẩm */}
          {orderDetails.items && orderDetails.items.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sản phẩm đã đặt</h3>
              <ul className="divide-y">
                {orderDetails.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="py-2 flex justify-between items-center"
                  >
                    <span>
                      {item.TenSanPham} ({item.KichCo}, {item.MauSac}) x{" "}
                      {item.SoLuong}
                    </span>
                    <span>{item.ThanhTien?.toLocaleString()}đ</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;
