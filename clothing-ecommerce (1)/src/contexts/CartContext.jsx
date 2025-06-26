import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { getAuthInfo } from "../utils/sessionUtils";

const CartContext = createContext();

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Voucher state
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // API call utility with better error handling
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
        console.error("Cart API call error:", error);

        // Check if it's a network error
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new Error(
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
          );
        }

        throw error;
      }
    },
    [API_BASE_URL]
  );

  // Helper function to parse product images with priority order
  const parseProductImages = useCallback((item) => {
    // Priority 1: Use anhChinh if already provided by backend
    if (item.anhChinh && item.anhChinh.trim() !== "") {
      return item.anhChinh;
    }

    // Priority 2: Parse HinhAnh JSON string
    if (item.HinhAnh && item.HinhAnh.trim() !== "" && item.HinhAnh !== "{}") {
      try {
        const imageData = JSON.parse(item.HinhAnh);
        if (imageData.anhChinh && imageData.anhChinh.trim() !== "") {
          return imageData.anhChinh;
        }
      } catch (error) {
        console.error("Error parsing HinhAnh JSON:", error);
      }
    }

    // Priority 3: Fallback to placeholder
    return "/placeholder.jpg";
  }, []);

  // Enhanced mapping function for cart items
  const mapCartItem = useCallback(
    (item) => {
      const anhChinh = parseProductImages(item);
      const originalPrice = parseFloat(item.gia) || 0;
      const salePrice = item.GiaKhuyenMai
        ? parseFloat(item.GiaKhuyenMai)
        : null;
      const finalPrice = salePrice || originalPrice; // Ưu tiên GiaKhuyenMai

      return {
        // Cart specific fields
        id: item.id,
        id_ChiTietSanPham: item.id_ChiTietSanPham,
        soLuong: item.soLuong,

        // Product info
        id_SanPham: item.id_SanPham,
        Ten: item.Ten,
        gia: originalPrice,
        GiaKhuyenMai: salePrice,

        // Variant info
        kichCo: item.kichCo,
        mauSac: item.mauSac,
        SoLuongTon: item.SoLuongTon || 0,

        // Brand and images
        tenThuongHieu: item.tenThuongHieu,
        HinhAnh: item.HinhAnh, // Keep original for reference
        anhChinh: anhChinh,

        // Computed fields
        finalPrice: finalPrice,
        hasDiscount: salePrice && salePrice < originalPrice,
        discountPercent:
          salePrice && salePrice < originalPrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0,

        // Compatibility fields for legacy components
        name: item.Ten,
        price: finalPrice,
        originalPrice: originalPrice,
        quantity: item.soLuong,
        image: anhChinh,
        size: item.kichCo,
        color: item.mauSac,
        brand: item.tenThuongHieu,
        stock: item.SoLuongTon || 0,
      };
    },
    [parseProductImages]
  );

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall("/api/cart");

      if (response.success && Array.isArray(response.data)) {
        const mappedItems = response.data.map(mapCartItem);
        setCartItems(mappedItems);
        return mappedItems;
      } else if (Array.isArray(response)) {
        const mappedItems = response.map(mapCartItem);
        setCartItems(mappedItems);
        return mappedItems;
      } else {
        setCartItems([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall, mapCartItem]);

  // Add item to cart with proper response handling
  const addToCart = useCallback(
    async (cartData) => {
      try {
        setLoading(true);

        // Validate required fields
        if (!cartData.id_ChiTietSanPham || !cartData.soLuong) {
          throw new Error("Thiếu thông tin sản phẩm hoặc số lượng");
        }

        console.log("Adding to cart:", cartData);

        const response = await apiCall("/api/cart", {
          method: "POST",
          body: JSON.stringify({
            id_ChiTietSanPham: parseInt(cartData.id_ChiTietSanPham, 10),
            SoLuong: parseInt(cartData.soLuong || 1, 10), // Sửa đúng chuẩn backend
          }),
        });

        console.log("Add to cart response:", response);

        if (response && response.success && Array.isArray(response.data)) {
          const mappedItems = response.data.map(mapCartItem);
          setCartItems(mappedItems);
          toast.success(response.message || "Đã thêm vào giỏ hàng!");
          return response;
        } else {
          throw new Error(response?.message || "Không thể thêm vào giỏ hàng");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);

        const errorMessage = error.message.includes("kết nối")
          ? error.message
          : error.message || "Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại.";

        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, mapCartItem]
  );

  // Update cart item quantity
  const updateCartItem = useCallback(
    async (cartId, soLuong) => {
      try {
        setLoading(true);

        if (soLuong < 1) {
          throw new Error("Số lượng phải lớn hơn 0");
        }

        const response = await apiCall(`/api/cart/${cartId}`, {
          method: "PUT",
          body: JSON.stringify({ SoLuong: parseInt(soLuong, 10) }), // Sửa đúng chuẩn backend
        });

        if (response.success && Array.isArray(response.data)) {
          const mappedItems = response.data.map(mapCartItem);
          setCartItems(mappedItems);
          return response;
        } else {
          throw new Error(response.message || "Không thể cập nhật giỏ hàng");
        }
      } catch (error) {
        toast.error(error.message || "Lỗi khi cập nhật giỏ hàng");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, mapCartItem]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartId) => {
      try {
        setLoading(true);

        const response = await apiCall(`/api/cart/${cartId}`, {
          method: "DELETE",
        });

        if (response.success) {
          if (Array.isArray(response.data)) {
            const mappedItems = response.data.map(mapCartItem);
            setCartItems(mappedItems);
          } else {
            await fetchCart();
          }
          toast.success(response.message || "Đã xóa khỏi giỏ hàng!");
          return response;
        } else {
          throw new Error(response.message || "Không thể xóa khỏi giỏ hàng");
        }
      } catch (error) {
        toast.error(error.message || "Lỗi khi xóa khỏi giỏ hàng");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, mapCartItem, fetchCart]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiCall("/api/cart", {
        method: "DELETE",
      });

      if (response.success) {
        setCartItems([]);
        // Also clear voucher when clearing cart
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        toast.success("Đã xóa tất cả sản phẩm khỏi giỏ hàng!");
        return response;
      } else {
        throw new Error(response.message || "Không thể xóa giỏ hàng");
      }
    } catch (error) {
      toast.error(error.message || "Lỗi khi xóa giỏ hàng");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Sync cart after login
  const syncCartAfterLogin = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiCall("/api/cart/sync-after-login", {
        method: "POST",
      });

      if (response.success || response.data) {
        const cartData = response.data || response;
        if (Array.isArray(cartData)) {
          setCartItems(cartData);
        } else {
          await fetchCart();
        }

        console.log("Cart synced after login successfully");
      }
    } catch (error) {
      console.error("Error syncing cart after login:", error);
      // If sync fails, just fetch the current cart
      await fetchCart();
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchCart]);

  // Voucher functions
  const validateVoucher = useCallback(
    async (voucherCode, orderTotal) => {
      try {
        setLoading(true);

        const response = await apiCall(`/api/vouchers/${voucherCode}/apply`, {
          method: "POST",
          body: JSON.stringify({ tongTien: orderTotal }),
        });

        // Sửa lại để lấy đúng dữ liệu từ API trả về
        if (response.success && response.data && response.data.voucher) {
          setAppliedVoucher(response.data.voucher);
          setVoucherDiscount(Number(response.data.giaTriGiam) || 0);
          toast.success(
            `Áp dụng voucher thành công! Giảm ${(Number(response.data.giaTriGiam) || 0).toLocaleString()}đ`
          );
          return {
            success: true,
            voucher: response.data.voucher,
            discount: Number(response.data.giaTriGiam) || 0,
            finalTotal: response.data.tongTienSauGiam || orderTotal,
          };
        } else {
          throw new Error(response.message || "Voucher không hợp lệ");
        }
      } catch (error) {
        toast.error(error.message || "Mã voucher không hợp lệ");
        return { success: false, message: error.message };
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    toast.info("Đã hủy mã giảm giá");
  }, []);

  // Cart calculations - CHÍNH XÁC THEO NGHIỆP VỤ WEB BÁN GIÀY
  const cartSubtotal = cartItems.reduce((sum, item) => {
    // Ưu tiên GiaKhuyenMai nếu có, không thì dùng gia
    const finalPrice = item.GiaKhuyenMai || item.gia || 0;
    const quantity = item.soLuong || 0;
    return sum + finalPrice * quantity;
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => {
    const quantity = item.soLuong || 0;
    return sum + quantity;
  }, 0);

  const cartTotal = cartSubtotal;

  // Tính tổng cuối cùng sau khi áp dụng voucher
  const finalTotal = Math.max(0, cartSubtotal - voucherDiscount);

  // Initialize cart on mount and when auth status changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Listen for auth changes to sync cart
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" && e.newValue) {
        // User just logged in, sync cart
        syncCartAfterLogin();
      } else if (e.key === "token" && !e.newValue) {
        // User logged out, clear cart
        setCartItems([]);
        setAppliedVoucher(null);
        setVoucherDiscount(0);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncCartAfterLogin]);

  const value = {
    // State
    cartItems,
    loading,
    appliedVoucher,
    voucherDiscount,

    // Calculations
    cartSubtotal,
    cartTotal,
    finalTotal,
    totalItems,

    // Functions
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCartAfterLogin,

    // Voucher functions
    validateVoucher,
    removeVoucher,

    // Utility
    getSessionId: () => sessionId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
