import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { clearCart } from "../store/slices/cartSlice";
import CheckoutSummary from "../components/Checkout/CheckoutSummary";
import PaymentMethods from "../components/Checkout/PaymentMethods";
import ShippingMethods from "../components/Checkout/ShippingMethods";
import { formatCurrency } from "../utils/helpers";
import axios from "axios";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  // Fetch payment and shipping methods
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [paymentResponse, shippingResponse] = await Promise.all([
          axios.get("/api/payment-methods"),
          axios.get("/api/shipping-methods"),
        ]);

        // Ensure paymentMethods is always an array
        const paymentData = paymentResponse.data;
        setPaymentMethods(Array.isArray(paymentData) ? paymentData : []);

        // Ensure shippingMethods is always an array
        const shippingData = shippingResponse.data;
        setShippingMethods(Array.isArray(shippingData) ? shippingData : []);

        // Set defaults if available
        if (Array.isArray(paymentData) && paymentData.length > 0) {
          setSelectedPaymentMethod(paymentData[0].id);
        }

        if (Array.isArray(shippingData) && shippingData.length > 0) {
          setSelectedShippingMethod(shippingData[0].id);
          setShippingFee(shippingData[0].PhiVanChuyen || 0);
        }
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        setPaymentMethods([]);
        setShippingMethods([]);
      }
    };

    fetchCheckoutData();
  }, []);

  useEffect(() => {
    // Fetch provinces on component mount
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(
          "https://open.oapi.vn/location/provinces?page=0&size=30"
        );
        setProvinces(response.data?.data || []);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinces([]);
      }
    };

    fetchProvinces();
  }, []);

  const validationSchema = Yup.object({
    TenNguoiNhan: Yup.string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(50, "Họ tên không được quá 50 ký tự")
      .required("Vui lòng nhập họ tên"),
    SDTNguoiNhan: Yup.string()
      .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ")
      .required("Vui lòng nhập số điện thoại"),
    Email: Yup.string()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email"),
    DiaChi: Yup.string()
      .min(10, "Địa chỉ phải có ít nhất 10 ký tự")
      .required("Vui lòng nhập địa chỉ chi tiết"),
    thanhPho: Yup.string().required("Vui lòng chọn thành phố"),
    quan: Yup.string().required("Vui lòng chọn quận/huyện"),
    phuong: Yup.string().required("Vui lòng chọn phường/xã"),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setIsLoading(true);
      setSubmitting(true);

      // Validate cart items
      if (!items || items.length === 0) {
        alert("Giỏ hàng trống");
        navigate("/cart");
        return;
      }

      // Validate selected locations
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        alert("Vui lòng chọn đầy đủ thông tin địa chỉ");
        return;
      }

      // Validate payment and shipping methods
      if (!selectedPaymentMethod) {
        alert("Vui lòng chọn phương thức thanh toán");
        return;
      }

      if (!selectedShippingMethod) {
        alert("Vui lòng chọn phương thức vận chuyển");
        return;
      }

      // Construct full address
      const fullAddress = `${values.DiaChi}, ${selectedWard?.name || ""}, ${
        selectedDistrict?.name || ""
      }, ${selectedProvince?.name || ""}`;

      // Prepare order data according to backend expectations
      const orderData = {
        DiaChiNhan: fullAddress,
        SDTNguoiNhan: values.SDTNguoiNhan,
        TenNguoiNhan: values.TenNguoiNhan,
        Email: values.Email,
        id_ThanhToan: selectedPaymentMethod,
        id_VanChuyen: selectedShippingMethod,
        MaGiamGia: appliedVoucher ? voucherCode : null,
        GhiChu: values.GhiChu || "",
      };

      console.log("Order data:", orderData);

      // Send request to create order with session ID for guests
      const sessionId = !isAuthenticated
        ? localStorage.getItem("guest_session_id")
        : null;
      let apiUrl = "/api/orders";
      if (sessionId) {
        apiUrl += `?sessionId=${sessionId}`;
      }

      // Call API to create order
      const response = await axios.post(apiUrl, orderData);

      if (response.data) {
        // Clear cart after successful order
        dispatch(clearCart());

        // Handle payment gateway redirect if needed
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          // Redirect to success page
          navigate(`/order-success/${response.data.id}`, {
            state: { orderSuccess: true },
          });
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);

      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        Object.keys(error.response.data.errors).forEach((field) => {
          setFieldError(field, error.response.data.errors[field]);
        });
      } else {
        alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng");
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handleProvinceChange = async (e, setFieldValue) => {
    const provinceId = e.target.value;
    if (!provinceId) return;

    const province = provinces.find((p) => p.id.toString() === provinceId);
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);

    // Reset form values
    setFieldValue("thanhPho", provinceId);
    setFieldValue("quan", "");
    setFieldValue("phuong", "");

    try {
      const response = await axios.get(
        `https://open.oapi.vn/location/districts/${provinceId}?page=0&size=50`
      );
      setDistricts(response.data?.data || []);
      setWards([]);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (e, setFieldValue) => {
    const districtId = e.target.value;
    if (!districtId) return;

    const district = districts.find((d) => d.id.toString() === districtId);
    setSelectedDistrict(district);
    setSelectedWard(null);

    // Reset form values
    setFieldValue("quan", districtId);
    setFieldValue("phuong", "");

    try {
      const response = await axios.get(
        `https://open.oapi.vn/location/wards/${districtId}?page=0&size=100`
      );
      setWards(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
    }
  };

  const handleWardChange = (e, setFieldValue) => {
    const wardId = e.target.value;
    if (!wardId) return;

    const ward = wards.find((w) => w.id.toString() === wardId);
    setSelectedWard(ward);
    setFieldValue("phuong", wardId);
  };

  const handleShippingMethodChange = (methodId) => {
    setSelectedShippingMethod(methodId);

    // Only try to find the method if shippingMethods is an array
    if (Array.isArray(shippingMethods)) {
      const selectedMethod = shippingMethods.find(
        (method) => method.id === methodId
      );
      if (selectedMethod) {
        setShippingFee(selectedMethod.PhiVanChuyen || 0);
      }
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      const response = await axios.post("/api/vouchers/validate", {
        code: voucherCode,
        totalAmount,
      });

      if (response.data && response.data.valid) {
        setAppliedVoucher(response.data.voucher);
        setVoucherError(null);
      } else {
        setVoucherError(response.data?.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      console.error("Error validating voucher:", error);
      setVoucherError(
        error.response?.data?.message || "Lỗi kiểm tra mã giảm giá"
      );
    }
  };

  // Calculate totals
  const discount = appliedVoucher
    ? Math.min(
        (totalAmount * appliedVoucher.PhanTramGiam) / 100,
        appliedVoucher.GiaTriGiamToiDa
      )
    : 0;
  const totalWithShipping = totalAmount + shippingFee - discount;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>

      <Formik
        enableReinitialize
        initialValues={{
          TenNguoiNhan: user?.HoTen || "",
          SDTNguoiNhan: user?.SDT || "",
          Email: user?.Email || "",
          DiaChi: "",
          thanhPho: "",
          quan: "",
          phuong: "",
          GhiChu: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values, errors, touched }) => (
          <Form>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Thông tin giao hàng
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên *
                      </label>
                      <Field
                        name="TenNguoiNhan"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.TenNguoiNhan && touched.TenNguoiNhan
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Nhập họ và tên"
                      />
                      <ErrorMessage
                        name="TenNguoiNhan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <Field
                        name="SDTNguoiNhan"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.SDTNguoiNhan && touched.SDTNguoiNhan
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Nhập số điện thoại"
                      />
                      <ErrorMessage
                        name="SDTNguoiNhan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Field
                        name="Email"
                        type="email"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.Email && touched.Email
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Nhập email"
                      />
                      <ErrorMessage
                        name="Email"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ chi tiết *
                      </label>
                      <Field
                        name="DiaChi"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.DiaChi && touched.DiaChi
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Số nhà, tên đường..."
                      />
                      <ErrorMessage
                        name="DiaChi"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thành phố *
                      </label>
                      <Field
                        as="select"
                        name="thanhPho"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.thanhPho && touched.thanhPho
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        onChange={(e) => handleProvinceChange(e, setFieldValue)}
                      >
                        <option value="">Chọn thành phố</option>
                        {Array.isArray(provinces) &&
                          provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage
                        name="thanhPho"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quận/Huyện *
                      </label>
                      <Field
                        as="select"
                        name="quan"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.quan && touched.quan
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        onChange={(e) => handleDistrictChange(e, setFieldValue)}
                        disabled={!selectedProvince}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {Array.isArray(districts) &&
                          districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage
                        name="quan"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phường/Xã *
                      </label>
                      <Field
                        as="select"
                        name="phuong"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phuong && touched.phuong
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        onChange={(e) => handleWardChange(e, setFieldValue)}
                        disabled={!selectedDistrict}
                      >
                        <option value="">Chọn phường/xã</option>
                        {Array.isArray(wards) &&
                          wards.map((ward) => (
                            <option key={ward.id} value={ward.id}>
                              {ward.name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage
                        name="phuong"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú
                      </label>
                      <Field
                        as="textarea"
                        name="GhiChu"
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Methods */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Phương thức vận chuyển
                  </h2>
                  <div className="space-y-4">
                    {Array.isArray(shippingMethods) &&
                    shippingMethods.length > 0 ? (
                      shippingMethods.map((method) => (
                        <div key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            id={`shipping-${method.id}`}
                            name="shippingMethod"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={selectedShippingMethod === method.id}
                            onChange={() =>
                              handleShippingMethodChange(method.id)
                            }
                          />
                          <label
                            htmlFor={`shipping-${method.id}`}
                            className="ml-3 flex flex-grow justify-between"
                          >
                            <div>
                              <span className="font-medium text-gray-800">
                                {method.Ten}
                              </span>
                              <p className="text-sm text-gray-500">
                                {method.MoTa}
                              </p>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(method.PhiVanChuyen || 0)}
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">
                        Không có phương thức vận chuyển nào khả dụng
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
                    {Array.isArray(paymentMethods) &&
                    paymentMethods.length > 0 ? (
                      paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            id={`payment-${method.id}`}
                            name="paymentMethod"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => setSelectedPaymentMethod(method.id)}
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
                      <div className="text-gray-500">
                        Không có phương thức thanh toán nào khả dụng
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Tóm tắt đơn hàng
                  </h2>

                  {/* Items summary */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flow-root">
                      <ul className="-my-4 divide-y divide-gray-200">
                        {Array.isArray(items) &&
                          items.map((item) => (
                            <li key={item.id} className="flex py-4">
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <img
                                  src={item.image || "/placeholder.jpg"}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>
                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3 className="line-clamp-1">
                                      {item.name}
                                    </h3>
                                    <p className="ml-4">
                                      {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.color} | {item.size}
                                  </p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <p className="text-gray-500">
                                    SL: {item.quantity}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  {/* Voucher/Promo code input */}
                  <div className="flex items-center mb-6">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-red-500 text-sm mb-4">{voucherError}</p>
                  )}
                  {appliedVoucher && (
                    <p className="text-green-600 text-sm mb-4">
                      Đã áp dụng mã giảm giá {appliedVoucher.Ten} (-
                      {appliedVoucher.PhanTramGiam}%)
                    </p>
                  )}

                  {/* Order totals */}
                  <div className="border-t border-gray-200 pt-4 pb-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                      <p>Tạm tính</p>
                      <p>{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                      <p>Phí vận chuyển</p>
                      <p>{formatCurrency(shippingFee)}</p>
                    </div>
                    {appliedVoucher && (
                      <div className="flex justify-between text-base font-medium text-green-600 mb-2">
                        <p>Giảm giá</p>
                        <p>-{formatCurrency(discount)}</p>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-4 mt-4">
                      <p>Tổng tiền</p>
                      <p>{formatCurrency(totalWithShipping)}</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang xử lý...</span>
                      </div>
                    ) : (
                      `Đặt hàng - ${formatCurrency(totalWithShipping)}`
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
