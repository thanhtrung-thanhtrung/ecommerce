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
    throw new Error(
      "useCheckoutContext must be used within a CheckoutProvider"
    );
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment & Shipping methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);

  // Address data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // API call utility
  const apiCall = useCallback(
    async (url, options = {}) => {
      const { token, isAuthenticated } = getAuthInfo();

      try {
        const headers = {
          "Content-Type": "application/json",
          ...options.headers,
        };

        // Add authentication for logged-in users
        if (isAuthenticated && token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
          credentials: "include",
          headers,
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Checkout API call error:", error);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/payments/methods");

      if (response.success && Array.isArray(response.data)) {
        setPaymentMethods(response.data);
        // Set default payment method
        if (response.data.length > 0) {
          setSelectedPaymentMethod(response.data[0].id);
        }
        return response.data;
      } else if (Array.isArray(response)) {
        setPaymentMethods(response);
        if (response.length > 0) {
          setSelectedPaymentMethod(response[0].id);
        }
        return response;
      } else {
        setPaymentMethods([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch shipping methods
  const fetchShippingMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/shipping");

      if (response.success && Array.isArray(response.data)) {
        setShippingMethods(response.data);
        // Set default shipping method
        if (response.data.length > 0) {
          setSelectedShippingMethod(response.data[0].id);
          setShippingFee(
            parseFloat(
              response.data[0].PhiVanChuyen || response.data[0].phiVanChuyen
            ) || 0
          );
        }
        return response.data;
      } else if (Array.isArray(response)) {
        setShippingMethods(response);
        if (response.length > 0) {
          setSelectedShippingMethod(response[0].id);
          setShippingFee(
            parseFloat(response[0].PhiVanChuyen || response[0].phiVanChuyen) ||
            0
          );
        }
        return response;
      } else {
        setShippingMethods([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      setShippingMethods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Calculate shipping fee
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
        } else {
          // Fallback to default shipping fee from method
          const method = shippingMethods.find((m) => m.id === shippingMethodId);
          if (method) {
            const fee =
              parseFloat(method.PhiVanChuyen || method.phiVanChuyen) || 0;
            setShippingFee(fee);
          }
          return { success: true, data: { phiVanChuyen: shippingFee } };
        }
      } catch (error) {
        console.error("Error calculating shipping fee:", error);
        // Fallback to default shipping fee
        const method = shippingMethods.find((m) => m.id === shippingMethodId);
        if (method) {
          const fee =
            parseFloat(method.PhiVanChuyen || method.phiVanChuyen) || 0;
          setShippingFee(fee);
        }
        return { success: false, data: { phiVanChuyen: shippingFee } };
      }
    },
    [apiCall, shippingMethods, shippingFee]
  );

  // Fetch provinces from external API
  const fetchProvinces = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://open.oapi.vn/location/provinces?page=0&size=100"
      );
      const data = await response.json();

      if (data?.data && Array.isArray(data.data)) {
        setProvinces(data.data);
        return data.data;
      } else {
        setProvinces([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      setProvinces([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch districts by province ID
  const fetchDistricts = useCallback(async (provinceId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://open.oapi.vn/location/districts/${provinceId}?page=0&size=200`
      );
      const data = await response.json();

      if (data?.data && Array.isArray(data.data)) {
        setDistricts(data.data);
        return data.data;
      } else {
        setDistricts([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wards by district ID
  const fetchWards = useCallback(async (districtId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://open.oapi.vn/location/wards/${districtId}?page=0&size=500`
      );
      const data = await response.json();

      if (data?.data && Array.isArray(data.data)) {
        setWards(data.data);
        return data.data;
      } else {
        setWards([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create order
  const createOrder = useCallback(
    async (orderData) => {
      try {
        setSubmitting(true);
        // Build payload đúng chuẩn API backend
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
        } else {
          throw new Error(response.message || "Đặt hàng thất bại");
        }
      } catch (error) {
        console.error("❌ Checkout API call error:", error);
        toast.error(error.message || "Lỗi khi đặt hàng");
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [apiCall, selectedPaymentMethod, selectedShippingMethod, shippingFee]
  );

  // Handle payment method change
  const handlePaymentMethodChange = useCallback((methodId) => {
    setSelectedPaymentMethod(methodId);
  }, []);

  // Handle shipping method change
  const handleShippingMethodChange = useCallback(
    async (methodId, orderValue, address) => {
      setSelectedShippingMethod(methodId);

      // Calculate shipping fee for the new method
      if (address && orderValue > 0) {
        await calculateShippingFee(methodId, orderValue, address);
      } else {
        // Use default fee from method
        const method = shippingMethods.find((m) => m.id === methodId);
        if (method) {
          const fee =
            parseFloat(method.PhiVanChuyen || method.phiVanChuyen) || 0;
          setShippingFee(fee);
        }
      }
    },
    [calculateShippingFee, shippingMethods]
  );

  // Handle address selection
  const handleProvinceChange = useCallback(
    async (province) => {
      setSelectedProvince(province);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setDistricts([]);
      setWards([]);

      if (province?.id) {
        await fetchDistricts(province.id);
      }
    },
    [fetchDistricts]
  );

  const handleDistrictChange = useCallback(
    async (district) => {
      setSelectedDistrict(district);
      setSelectedWard(null);
      setWards([]);

      if (district?.id) {
        await fetchWards(district.id);
      }
    },
    [fetchWards]
  );

  const handleWardChange = useCallback((ward) => {
    setSelectedWard(ward);
  }, []);

  // Reset checkout state
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

  // Initialize checkout data
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

  // Lấy thông tin khách hàng khi đã đăng nhập
  const { user, isAuthenticated } = getAuthInfo();

  const value = {
    // State
    loading,
    submitting,

    // Payment & Shipping
    paymentMethods,
    shippingMethods,
    selectedPaymentMethod,
    selectedShippingMethod,
    shippingFee,

    // Address
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,

    // Functions
    fetchPaymentMethods,
    fetchShippingMethods,
    calculateShippingFee,
    fetchProvinces,
    fetchDistricts,
    fetchWards,
    createOrder,

    // Handlers
    handlePaymentMethodChange,
    handleShippingMethodChange,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,

    // Utility
    resetCheckoutState,

    // User
    user,
    isAuthenticated,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
