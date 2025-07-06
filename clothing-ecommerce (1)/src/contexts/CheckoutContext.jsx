import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { getAuthInfo } from "../utils/sessionUtils";

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

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // 👉 Cập nhật user khi context khởi tạo
  useEffect(() => {
    const { user: storedUser, isAuthenticated: auth } = getAuthInfo();
    setUser(storedUser);
    setIsAuthenticated(auth);
  }, []);

  const refreshUser = useCallback(() => {
    const { user: storedUser, isAuthenticated: auth } = getAuthInfo();
    setUser(storedUser);
    setIsAuthenticated(auth);
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
      const res = await fetch(`https://open.oapi.vn/location/districts/${provinceId}?page=0&size=200`);
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

  const createOrder = useCallback(
    async (orderData) => {
      try {
        setSubmitting(true);
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
        const response = await apiCall("/api/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (response.success) {
          toast.success("Đặt hàng thành công!");
          return response;
        }
        throw new Error(response.message || "Đặt hàng thất bại");
      } catch (error) {
        toast.error(error.message || "Lỗi khi đặt hàng");
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [apiCall, selectedPaymentMethod, selectedShippingMethod, shippingFee]
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
    refreshUser,         // ✅ Thêm vào
    user,
    isAuthenticated,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
