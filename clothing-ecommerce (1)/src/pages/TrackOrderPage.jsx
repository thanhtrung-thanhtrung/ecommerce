import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/helpers";
import orderAPI from "../services/orderAPI";

const TrackOrderPage = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validationSchema = Yup.object({
    orderId: Yup.string()
      .required("Vui lòng nhập mã đơn hàng")
      .matches(/^\d+$/, "Mã đơn hàng phải là số"),
    email: Yup.string()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      setError(null);
      setOrderDetails(null);

      const response = await orderAPI.getGuestOrder(
        values.orderId,
        values.email
      );
      setOrderDetails(response.data);
    } catch (error) {
      console.error("Error tracking order:", error);
      setError(
        error.response?.data?.message ||
          "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return "text-yellow-600 bg-yellow-100";
      case 2:
        return "text-blue-600 bg-blue-100";
      case 3:
        return "text-green-600 bg-green-100";
      case 4:
        return "text-green-600 bg-green-100";
      case 5:
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "Chờ xác nhận";
      case 2:
        return "Đã xác nhận";
      case 3:
        return "Đang giao hàng";
      case 4:
        return "Đã giao hàng";
      case 5:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tra cứu đơn hàng
          </h1>
          <p className="text-lg text-gray-600">
            Nhập thông tin đơn hàng để kiểm tra trạng thái
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <Formik
            initialValues={{
              orderId: "",
              email: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã đơn hàng *
                    </label>
                    <Field
                      name="orderId"
                      type="text"
                      placeholder="Nhập mã đơn hàng (VD: 123)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name="orderId"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email đặt hàng *
                    </label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="Nhập email đã dùng khi đặt hàng"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                  >
                    {loading || isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang tìm kiếm...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        Tra cứu đơn hàng
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Không tìm thấy đơn hàng
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Đơn hàng #{orderDetails.id}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Đặt ngày:{" "}
                    {new Date(orderDetails.NgayDat).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    orderDetails.TrangThai
                  )}`}
                >
                  {getStatusText(orderDetails.TrangThai)}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Thông tin khách hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Họ tên:</span>{" "}
                      {orderDetails.TenNguoiNhan}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {orderDetails.EmailNguoiNhan}
                    </p>
                    <p>
                      <span className="font-medium">SĐT:</span>{" "}
                      {orderDetails.SDTNguoiNhan}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Địa chỉ giao hàng
                  </h3>
                  <p className="text-sm text-gray-600">
                    {orderDetails.DiaChiNhan}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              {orderDetails.ChiTietDonHang &&
                orderDetails.ChiTietDonHang.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Sản phẩm đã đặt
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {orderDetails.ChiTietDonHang.map((item, index) => (
                          <div
                            key={index}
                            className="p-4 flex items-center space-x-4"
                          >
                            <div className="flex-shrink-0 w-16 h-16">
                              <img
                                src={item.HinhAnh || "/placeholder.jpg"}
                                alt={item.tenSanPham}
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.tenSanPham}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.tenMau} | {item.tenKichCo}
                              </p>
                              <p className="text-sm text-gray-500">
                                Số lượng: {item.SoLuong}
                              </p>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.ThanhTien)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Payment Summary */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Tổng tiền hàng</p>
                    <p>{formatCurrency(orderDetails.TongSanPham || 0)}</p>
                  </div>
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Phí vận chuyển</p>
                    <p>{formatCurrency(orderDetails.PhiVanChuyen || 0)}</p>
                  </div>
                  {orderDetails.GiamGia > 0 && (
                    <div className="flex justify-between text-base font-medium text-green-600">
                      <p>Giảm giá</p>
                      <p>-{formatCurrency(orderDetails.GiamGia)}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <p>Tổng thanh toán</p>
                    <p>{formatCurrency(orderDetails.TongThanhToan)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {orderDetails.GhiChu && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Ghi chú
                  </h3>
                  <p className="text-sm text-gray-600">{orderDetails.GhiChu}</p>
                </div>
              )}

              {/* Cancel Order Button */}
              {orderDetails.TrangThai === 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Implement cancel order functionality
                      const reason = prompt(
                        "Vui lòng nhập lý do hủy đơn hàng:"
                      );
                      if (reason) {
                        orderAPI
                          .cancelGuestOrder(
                            orderDetails.id,
                            orderDetails.EmailNguoiNhan,
                            reason
                          )
                          .then(() => {
                            alert("Đơn hàng đã được hủy thành công");
                            setOrderDetails({ ...orderDetails, TrangThai: 5 });
                          })
                          .catch((error) => {
                            alert("Có lỗi xảy ra khi hủy đơn hàng");
                          });
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    Hủy đơn hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
