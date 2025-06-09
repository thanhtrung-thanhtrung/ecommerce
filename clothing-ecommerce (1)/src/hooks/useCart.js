import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import cartAPI from "../services/cartAPI";
import { useSelector } from "react-redux";

export const useCart = () => {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  // Đảm bảo sessionId được đồng bộ
  const ensureSessionSync = useCallback(async () => {
    if (!isAuthenticated) {
      await cartAPI.ensureSessionId();
    }
  }, [isAuthenticated]);

  // Lấy giỏ hàng
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Đảm bảo sessionId được đồng bộ trước khi lấy giỏ hàng
      await ensureSessionSync();

      const response = await cartAPI.getCart();
      const cartData = response.data;

      setCart(cartData);

      // Xử lý các trường hợp khác nhau của dữ liệu trả về
      if (Array.isArray(cartData)) {
        setCartItems(cartData);
        setCartCount(
          cartData.reduce(
            (total, item) => total + parseInt(item.SoLuong || 0),
            0
          )
        );
        setCartTotal(
          cartData.reduce(
            (total, item) =>
              total + parseFloat(item.Gia || 0) * parseInt(item.SoLuong || 0),
            0
          )
        );
      } else {
        setCartItems(cartData?.items || []);
        setCartCount(
          cartData?.items?.reduce(
            (total, item) =>
              total + parseInt(item.SoLuong || item.soLuong || 0),
            0
          ) || 0
        );
        setCartTotal(cartData?.tongTien || 0);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError(error.response?.data?.message || "Lỗi khi tải giỏ hàng");
      // Không hiển thị toast error khi lấy cart lần đầu (có thể chưa có cart)
      if (error.response?.status !== 404) {
        toast.error("Không thể tải giỏ hàng");
      }
    } finally {
      setLoading(false);
    }
  }, [ensureSessionSync]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = useCallback(
    async (item) => {
      try {
        setLoading(true);
        setError(null);

        // Đảm bảo sessionId được đồng bộ trước khi thêm vào giỏ hàng
        await ensureSessionSync();

        const response = await cartAPI.addToCart(item);

        await fetchCart(); // Refresh cart sau khi thêm
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
        return response.data;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchCart, ensureSessionSync]
  );

  // Cập nhật số lượng sản phẩm
  const updateCartItem = useCallback(
    async (id, soLuong) => {
      try {
        setLoading(true);
        setError(null);

        // Đảm bảo sessionId được đồng bộ trước khi cập nhật giỏ hàng
        await ensureSessionSync();

        await cartAPI.updateCartItem(id, { soLuong });

        await fetchCart(); // Refresh cart sau khi cập nhật
        toast.success("Đã cập nhật giỏ hàng");
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Lỗi khi cập nhật giỏ hàng";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchCart, ensureSessionSync]
  );

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        // Đảm bảo sessionId được đồng bộ trước khi xóa khỏi giỏ hàng
        await ensureSessionSync();

        await cartAPI.removeFromCart(id);

        await fetchCart(); // Refresh cart sau khi xóa
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Lỗi khi xóa sản phẩm";
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchCart, ensureSessionSync]
  );

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Đảm bảo sessionId được đồng bộ trước khi xóa giỏ hàng
      await ensureSessionSync();

      await cartAPI.clearCart();

      setCart(null);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi xóa giỏ hàng";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ensureSessionSync]);

  // Gộp giỏ hàng khi đăng nhập
  const mergeCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await cartAPI.mergeCart();

      await fetchCart(); // Refresh cart sau khi gộp
      toast.success("Đã gộp giỏ hàng thành công");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi gộp giỏ hàng";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Kiểm tra sản phẩm có trong giỏ hàng không
  const isItemInCart = useCallback(
    (productDetailId) => {
      const id = parseInt(productDetailId);
      return cartItems.some((item) => parseInt(item.id_ChiTietSanPham) === id);
    },
    [cartItems]
  );

  // Lấy sản phẩm từ giỏ hàng theo ID
  const getCartItem = useCallback(
    (productDetailId) => {
      const id = parseInt(productDetailId);
      return cartItems.find((item) => parseInt(item.id_ChiTietSanPham) === id);
    },
    [cartItems]
  );

  // Validate giỏ hàng
  const validateCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Đảm bảo sessionId được đồng bộ trước khi validate giỏ hàng
      await ensureSessionSync();

      const response = await cartAPI.validateCart();
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Lỗi khi kiểm tra giỏ hàng";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ensureSessionSync]);

  // Load cart khi component mount hoặc khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    fetchCart();
  }, [fetchCart, isAuthenticated]);

  return {
    // State
    cart,
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error,

    // Actions
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    mergeCart,
    validateCart,

    // Utilities
    isItemInCart,
    getCartItem,
  };
};

export default useCart;
