import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { getAuthInfo } from "../utils/sessionUtils";
import vnpayService from "../services/vnpayAPI";

const CheckoutContext = createContext();

export const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckoutContext must be used within a CheckoutProvider");
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // User data
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Initialize auth state
  useEffect(() => {
    const { token, user: authUser, isAuthenticated: authStatus } = getAuthInfo();
    setUser(authUser);
    setIsAuthenticated(authStatus);
  }, []);

  const refreshUser = useCallback(() => {
    const { token, user: authUser, isAuthenticated: authStatus } = getAuthInfo();
    setUser(authUser);
    setIsAuthenticated(authStatus);
  }, []);

  const apiCall = useCallback(
    async (url, options = {}) => {
      const { token } = getAuthInfo();
      try {
        const headers = {
          "Content-Type": "application/json",
          ...options.headers,
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL}${url}`, {
          credentials: "include",
          headers,
          ...options,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Checkout API call error:", error);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/payments/methods");
      const methods = response.data || response;
      if (Array.isArray(methods)) {
        setPaymentMethods(methods);
        if (methods.length > 0) setSelectedPaymentMethod(methods[0].id);
        return methods;
      }
      setPaymentMethods([]);
      return [];
    } catch {
      setPaymentMethods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const fetchShippingMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/shipping");
      const methods = response.data || response;
      if (Array.isArray(methods)) {
        setShippingMethods(methods);
        if (methods.length > 0) {
          setSelectedShippingMethod(methods[0].id);
          setShippingFee(parseFloat(methods[0].PhiVanChuyen || methods[0].phiVanChuyen) || 0);
        }
        return methods;
      }
      setShippingMethods([]);
      return [];
    } catch {
      setShippingMethods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const calculateShippingFee = useCallback(
    async (shippingMethodId, orderValue, address) => {
      try {
        const response = await apiCall("/api/shipping/calculate", {
          method: "POST",
          body: JSON.stringify({
            id_VanChuyen: shippingMethodId,
            tongGiaTriDonHang: orderValue,
            diaChi: address,
          }),
        });
        if (response.success) {
          setShippingFee(response.data?.phiVanChuyen || 0);
          return response;
        }
      } catch { }
      const method = shippingMethods.find((m) => m.id === shippingMethodId);
      const fee = parseFloat(method?.PhiVanChuyen || method?.phiVanChuyen) || 0;
      setShippingFee(fee);
      return { success: false, data: { phiVanChuyen: fee } };
    },
    [apiCall, shippingMethods]
  );

  const fetchProvinces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("https://open.oapi.vn/location/provinces?page=0&size=100");
      const data = await res.json();
      setProvinces(data?.data || []);
      return data?.data || [];
    } catch {
      setProvinces([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (provinceId) => {
    try {
      setLoading(true);
      const res = await fetch(`https://open.oapi.vn/location/districts/${provinceId}?page=0&size=500`);
      const data = await res.json();
      setDistricts(data?.data || []);
      return data?.data || [];
    } catch {
      setDistricts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWards = useCallback(async (districtId) => {
    try {
      setLoading(true);
      const res = await fetch(`https://open.oapi.vn/location/wards/${districtId}?page=0&size=500`);
      const data = await res.json();
      setWards(data?.data || []);
      return data?.data || [];
    } catch {
      setWards([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced createOrder with VNPay support
  const createOrder = useCallback(
    async (orderData) => {
      try {
        setSubmitting(true);

        // Get selected payment method info
        const selectedPayment = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
        const isVNPayPayment = selectedPayment?.Ten?.toLowerCase().includes('vnpay') ||
          selectedPayment?.Ten?.toLowerCase().includes('vnp');

        const payload = {
          hoTen: orderData.hoTen,
          email: orderData.email,
          diaChiGiao: orderData.diaChiGiao,
          soDienThoai: orderData.soDienThoai,
          id_ThanhToan: orderData.id_ThanhToan || selectedPaymentMethod,
          id_VanChuyen: orderData.id_VanChuyen || selectedShippingMethod,
          MaGiamGia: orderData.MaGiamGia || undefined,
          ghiChu: orderData.ghiChu || undefined,
          tongTien: orderData.tongTien,
          phiVanChuyen: orderData.phiVanChuyen || shippingFee,
          tongTienSauGiam: orderData.tongTienSauGiam,
        };

        console.log("🚀 Creating order:", { payload, isVNPayPayment, userType: isAuthenticated ? "Logged" : "Guest" });

        // Create order first (cho cả VNPay và COD)
        const orderResponse = await apiCall("/api/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!orderResponse.success) {
          throw new Error(orderResponse.message || "Đặt hàng thất bại");
        }

        console.log("✅ Order created successfully:", orderResponse.data);

        // For VNPay payment, create payment URL after order is created
        if (isVNPayPayment) {
          try {
            console.log("🔄 Creating VNPay payment for order:", orderResponse.data.id);

            const paymentResponse = await apiCall("/api/payments/create", {
              method: "POST",
              body: JSON.stringify({
                orderId: orderResponse.data.id,
                paymentMethodId: selectedPaymentMethod
              }),
            });

            if (paymentResponse.success && paymentResponse.paymentUrl) {
              console.log("✅ VNPay URL created:", paymentResponse.paymentUrl);
              toast.info("Đang chuyển hướng đến VNPay...");
              return {
                success: true,
                data: {
                  paymentUrl: paymentResponse.paymentUrl,
                  orderId: paymentResponse.orderId,
                  isVNPayPayment: true,
                  orderData: orderResponse.data
                }
              };
            } else {
              throw new Error(paymentResponse.message || "Không thể tạo link thanh toán VNPay");
            }
          } catch (paymentError) {
            // ✅ SỬA: Thông báo rõ ràng hơn cho user
            console.error("❌ VNPay payment URL creation failed:", paymentError);
            toast.error(`Đơn hàng đã được tạo (ID: ${orderResponse.data.id}) nhưng không thể chuyển đến VNPay. Vui lòng liên hệ hỗ trợ hoặc chọn phương thức thanh toán khác.`);

            // Trả về thông tin đơn hàng để user có thể xử lý
            throw new Error(`Đơn hàng đã được tạo (ID: ${orderResponse.data.id}) nhưng không thể chuyển đến VNPay. Lỗi: ${paymentError.message}`);
          }
        } else {
          // For COD payment
          console.log("✅ COD order completed:", orderResponse.data);
          toast.success("Đặt hàng thành công!");
          return orderResponse;
        }
      } catch (error) {
        console.error("❌ Create order error:", error);
        toast.error(error.message || "Lỗi khi đặt hàng");
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [apiCall, selectedPaymentMethod, selectedShippingMethod, shippingFee, paymentMethods, isAuthenticated]
  );

  const handlePaymentMethodChange = useCallback((methodId) => {
    setSelectedPaymentMethod(methodId);
  }, []);

  const handleShippingMethodChange = useCallback(
    async (methodId, orderValue, address) => {
      setSelectedShippingMethod(methodId);
      if (address && orderValue > 0) {
        await calculateShippingFee(methodId, orderValue, address);
      } else {
        const method = shippingMethods.find((m) => m.id === methodId);
        if (method) {
          const fee = parseFloat(method.PhiVanChuyen || method.phiVanChuyen) || 0;
          setShippingFee(fee);
        }
      }
    },
    [calculateShippingFee, shippingMethods]
  );

  const handleProvinceChange = useCallback(async (province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    if (province?.id) await fetchDistricts(province.id);
  }, [fetchDistricts]);

  const handleDistrictChange = useCallback(async (district) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    if (district?.id) await fetchWards(district.id);
  }, [fetchWards]);

  const handleWardChange = useCallback((ward) => {
    setSelectedWard(ward);
  }, []);

  const resetCheckoutState = useCallback(() => {
    setSelectedPaymentMethod(null);
    setSelectedShippingMethod(null);
    setShippingFee(0);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setSubmitting(false);
  }, []);

  // VNPay specific functions
  const checkPaymentStatus = useCallback(async (orderId) => {
    try {
      return await vnpayService.checkPaymentStatus(orderId);
    } catch (error) {
      console.error("Error checking payment status:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        await Promise.all([
          fetchPaymentMethods(),
          fetchShippingMethods(),
          fetchProvinces(),
        ]);
      } catch (error) {
        console.error("Error initializing checkout:", error);
      }
    };
    initializeCheckout();
  }, [fetchPaymentMethods, fetchShippingMethods, fetchProvinces]);

  const value = {
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
    fetchPaymentMethods,
    fetchShippingMethods,
    calculateShippingFee,
    fetchProvinces,
    fetchDistricts,
    fetchWards,
    createOrder,
    handlePaymentMethodChange,
    handleShippingMethodChange,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    resetCheckoutState,
    refreshUser,
    user,
    isAuthenticated,
    // VNPay functions
    checkPaymentStatus,
    vnpayService,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
