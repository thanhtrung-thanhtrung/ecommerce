import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import { useCartContext } from "../contexts/CartContext";
import { useCheckoutContext } from "../contexts/CheckoutContext";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { formatCurrency } from "../utils/helpers";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useShop();
  const {
    cartItems,
    cartTotal,
    finalTotal,
    clearCart,
    appliedVoucher,
    voucherDiscount,
    validateVoucher,
    removeVoucher,
  } = useCartContext();

  const {
    loading,
    submitting,
    paymentMethods,
    shippingMethods,
    selectedPaymentMethod,
    selectedShippingMethod,
    shippingFee,
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    handlePaymentMethodChange,
    handleShippingMethodChange,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    createOrder,
  } = useCheckoutContext();

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState(null);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  const validationSchema = Yup.object({
    hoTen: Yup.string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(50, "Họ tên không được quá 50 ký tự")
      .required("Vui lòng nhập họ tên"),
    email: Yup.string()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email"),
    soDienThoai: Yup.string()
      .matches(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
      .required("Vui lòng nhập số điện thoại"),
    diaChiGiao: Yup.string()
      .min(10, "Địa chỉ phải có ít nhất 10 ký tự")
      .required("Vui lòng nhập địa chỉ giao hàng"),
    tinh: Yup.string().required("Vui lòng chọn tỉnh/thành phố"),
    quan: Yup.string().required("Vui lòng chọn quận/huyện"),
    phuong: Yup.string().required("Vui lòng chọn phường/xã"),
    // Thêm validation cho payment method và shipping method
    paymentMethod: Yup.mixed().test(
      'payment-required',
      'Vui lòng chọn phương thức thanh toán',
      () => selectedPaymentMethod !== null && selectedPaymentMethod !== undefined
    ),
    shippingMethod: Yup.mixed().test(
      'shipping-required',
      'Vui lòng chọn phương thức vận chuyển',
      () => selectedShippingMethod !== null && selectedShippingMethod !== undefined
    ),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setSubmitting(true);

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        alert("Giỏ hàng trống");
        navigate("/cart");
        return;
      }

      // Validate selected options với error messages cải thiện
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        alert("Vui lòng chọn đầy đủ thông tin địa chỉ (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã)");
        return;
      }

      // Kiểm tra chi tiết hơn cho payment method
      if (!selectedPaymentMethod || selectedPaymentMethod === null || selectedPaymentMethod === undefined) {
        alert("Vui lòng chọn phương thức thanh toán");
        return;
      }

      // Kiểm tra chi tiết hơn cho shipping method  
      if (!selectedShippingMethod || selectedShippingMethod === null || selectedShippingMethod === undefined) {
        alert("Vui lòng chọn phương thức vận chuyển");
        return;
      }

      // Validate that selected methods are valid numbers
      const paymentMethodId = parseInt(selectedPaymentMethod);
      const shippingMethodId = parseInt(selectedShippingMethod);

      if (isNaN(paymentMethodId) || paymentMethodId <= 0) {
        alert("Phương thức thanh toán không hợp lệ. Vui lòng chọn lại.");
        return;
      }

      if (isNaN(shippingMethodId) || shippingMethodId <= 0) {
        alert("Phương thức vận chuyển không hợp lệ. Vui lòng chọn lại.");
        return;
      }

      // Kiểm tra xem phương thức được chọn có trong danh sách không
      const validPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
      const validShippingMethod = shippingMethods.find(sm => sm.id === shippingMethodId);

      if (!validPaymentMethod) {
        alert("Phương thức thanh toán không có trong danh sách. Vui lòng chọn lại.");
        return;
      }

      if (!validShippingMethod) {
        alert("Phương thức vận chuyển không có trong danh sách. Vui lòng chọn lại.");
        return;
      }

      // Construct full address
      const fullAddress = `${values.diaChiGiao}, ${selectedWard?.name || ""}, ${selectedDistrict?.name || ""}, ${selectedProvince?.name || ""}`;

      // Prepare order data với tính toán chính xác khi có mã giảm giá
      const orderData = {
        hoTen: values.hoTen,
        email: values.email,
        soDienThoai: values.soDienThoai,
        diaChiGiao: fullAddress,
        id_ThanhToan: paymentMethodId,
        id_VanChuyen: shippingMethodId,
        // Đảm bảo gửi số, không phải chuỗi
        tongTien: Number(cartTotal), // Tổng tiền hàng gốc (trước giảm giá)
        phiVanChuyen: Number(shippingFee), // Phí vận chuyển
        tongTienSauGiam: Number(totalAmount), // Tổng cuối cùng (đã trừ voucher + phí ship)
        giamGia: Number(voucherDiscount), // Số tiền được giảm từ voucher
        ...(appliedVoucher && appliedVoucher.Ma && {
          MaGiamGia: appliedVoucher.Ma,
        }),
        ghiChu: values.ghiChu || "",
      };

      // Debug log để kiểm tra dữ liệu gửi đi
      console.log("🚀 Frontend - Submitting order:", {
        ...orderData,
        dataTypes: {
          tongTien: typeof orderData.tongTien,
          phiVanChuyen: typeof orderData.phiVanChuyen,
          tongTienSauGiam: typeof orderData.tongTienSauGiam,
          giamGia: typeof orderData.giamGia
        }
      });

      const response = await createOrder(orderData);

      if (response.success) {
        // Clear cart after successful order
        await clearCart();

        // Handle payment redirect or success page
        if (response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          // Redirect based on authentication status
          if (isAuthenticated) {
            // For logged in users, go to orders page
            navigate("/user/orders");
          } else {
            // For guest users, go to home page
            navigate("/");
          }
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);

      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            if (err.path) {
              setFieldError(err.path, err.msg);
            }
          });
        } else if (typeof errors === "object") {
          Object.keys(errors).forEach((field) => {
            setFieldError(field, errors[field]);
          });
        }
      } else {
        alert(error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    try {
      setVoucherError(null);
      const result = await validateVoucher(voucherCode.trim(), cartTotal);
      if (result.success) {
        setVoucherCode("");
      }
    } catch (error) {
      setVoucherError(error.message);
    }
  };

  const handleRemoveVoucher = () => {
    removeVoucher();
    setVoucherCode("");
    setVoucherError(null);
  };

  const totalAmount = finalTotal + shippingFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>

      <Formik
        initialValues={{
          hoTen: user?.HoTen || "",
          email: user?.Email || "",
          soDienThoai: user?.SDT || "",
          diaChiGiao: "",
          tinh: "",
          quan: "",
          phuong: "",
          ghiChu: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting: formSubmitting }) => (
          <Form>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Forms */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Thông tin giao hàng
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên *
                      </label>
                      <Field
                        name="hoTen"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập họ và tên"
                      />
                      <ErrorMessage name="hoTen" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <Field
                        name="soDienThoai"
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số điện thoại"
                      />
                      <ErrorMessage name="soDienThoai" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Field
                      name="email"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập email"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Address Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tỉnh/Thành phố *
                      </label>
                      <select
                        value={selectedProvince?.id || ""}
                        onChange={(e) => {
                          const province = provinces.find(p => p.id.toString() === e.target.value);
                          handleProvinceChange(province);
                          setFieldValue("tinh", e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage name="tinh" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quận/Huyện *
                      </label>
                      <select
                        value={selectedDistrict?.id || ""}
                        onChange={(e) => {
                          const district = districts.find(d => d.id.toString() === e.target.value);
                          handleDistrictChange(district);
                          setFieldValue("quan", e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedProvince}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage name="quan" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phường/Xã *
                      </label>
                      <select
                        value={selectedWard?.id || ""}
                        onChange={(e) => {
                          const ward = wards.find(w => w.id.toString() === e.target.value);
                          handleWardChange(ward);
                          setFieldValue("phuong", e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedDistrict}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.id} value={ward.id}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage name="phuong" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ cụ thể *
                    </label>
                    <Field
                      name="diaChiGiao"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Số nhà, tên đường..."
                    />
                    <ErrorMessage name="diaChiGiao" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <Field
                      name="ghiChu"
                      as="textarea"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú thêm về đơn hàng..."
                    />
                  </div>
                </div>

                {/* Shipping Methods */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Phương thức vận chuyển
                  </h2>
                  <div className="space-y-4">
                    {Array.isArray(shippingMethods) && shippingMethods.length > 0 ? (
                      shippingMethods.map((method) => (
                        <div key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            id={`shipping-${method.id}`}
                            name="shippingMethod"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={selectedShippingMethod === method.id}
                            onChange={() => handleShippingMethodChange(
                              method.id,
                              cartTotal,
                              selectedProvince && selectedDistrict && selectedWard
                                ? `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`
                                : null
                            )}
                          />
                          <label
                            htmlFor={`shipping-${method.id}`}
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            <span className="font-medium">{method.Ten}</span>
                            <span className="text-gray-500 block text-xs">
                              {method.MoTa}
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 p-4 text-center">
                        Đang tải phương thức vận chuyển...
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Phương thức thanh toán
                  </h2>
                  <div className="space-y-4">
                    {Array.isArray(paymentMethods) && paymentMethods.length > 0 ? (
                      paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            id={`payment-${method.id}`}
                            name="paymentMethod"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => handlePaymentMethodChange(method.id)}
                          />
                          <label
                            htmlFor={`payment-${method.id}`}
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            <span className="font-medium">{method.Ten}</span>
                            <p className="text-sm text-gray-500">
                              {method.MoTa}
                            </p>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 p-4 text-center">
                        Đang tải phương thức thanh toán...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Tóm tắt đơn hàng
                  </h2>

                  {/* Items summary */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flow-root">
                      <ul className="-my-4 divide-y divide-gray-200">
                        {Array.isArray(cartItems) &&
                          cartItems.map((item) => (
                            <li key={item.id || item.id_ChiTietSanPham} className="py-4 flex">
                              <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                                <img
                                  src={item.anhChinh || item.HinhAnh || "/placeholder.jpg"}
                                  alt={item.Ten || item.ten}
                                  className="w-full h-full object-center object-cover"
                                />
                              </div>
                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3 className="text-sm">{item.Ten || item.ten}</h3>
                                    <p className="ml-4">
                                      {formatCurrency((item.gia || item.price || 0) * (item.soLuong || item.quantity || 0))}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.mauSac && `${item.mauSac} - `}
                                    {item.kichCo && `Size ${item.kichCo}`}
                                  </p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <p className="text-gray-500">
                                    SL: {item.soLuong || item.quantity}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  {/* Voucher section */}
                  <div className="mb-6">
                    {appliedVoucher ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-green-800">
                              {appliedVoucher.Ma}
                            </span>
                            <p className="text-sm text-green-700 mt-1">
                              {appliedVoucher.Ten}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Mã giảm giá"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucher}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          Áp dụng
                        </button>
                      </div>
                    )}
                    {voucherError && (
                      <p className="text-red-500 text-sm mt-2">{voucherError}</p>
                    )}
                  </div>

                  {/* Order totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính</span>
                      <span className="font-medium">{formatCurrency(cartTotal)}</span>
                    </div>

                    {voucherDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">
                          Giảm giá ({appliedVoucher?.Ma})
                        </span>
                        <span className="text-green-600 font-medium">
                          -{formatCurrency(voucherDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span className="font-medium">
                        {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={formSubmitting || submitting || loading}
                    className="w-full mt-6 bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formSubmitting || submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      "Đặt hàng"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CheckoutPage;
