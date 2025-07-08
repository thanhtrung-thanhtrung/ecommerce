import React, { createContext, useContext, useState, useEffect } from "react";

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Thêm state cho initial loading
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    weeklyProgress: [
      { day: "T2", duration: 12 },
      { day: "T3", duration: 15 },
      { day: "T4", duration: 8 },
      { day: "T5", duration: 20 },
      { day: "T6", duration: 18 },
      { day: "T7", duration: 25 },
      { day: "CN", duration: 10 },
    ],
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      completedOrders: 0,
    },
  });

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Helper function to get authentication token
  const isBrowser = typeof window !== 'undefined';

  const getToken = () => {
    // Return empty string if not in browser (during build)
    if (!isBrowser) return '';
    return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  };

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    setInitialLoading(true); // Bắt đầu loading
    try {
      const token = getToken();
      const userData = localStorage.getItem('adminUser');

      if (token && userData) {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
    } finally {
      setInitialLoading(false); // Kết thúc loading
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // You can implement API calls to get real dashboard data here
      // For now, we'll use mock data
      const mockData = {
        weeklyProgress: [
          { day: "T2", duration: 12 },
          { day: "T3", duration: 15 },
          { day: "T4", duration: 8 },
          { day: "T5", duration: 20 },
          { day: "T6", duration: 18 },
          { day: "T7", duration: 25 },
          { day: "CN", duration: 10 },
        ],
        stats: {
          totalOrders: 145,
          totalRevenue: 25000000,
          totalProducts: 89,
          completedOrders: 132,
        },
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Authentication functions
  const loginAdmin = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, matKhau: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Đăng nhập thất bại');
      }

      const data = await response.json();

      // Check if user has admin or staff role
      if (!data.user || (data.user.maQuyen !== 1 && data.user.maQuyen !== 2)) {
        throw new Error('Bạn không có quyền truy cập vào trang quản trị');
      }

      // Store token and user data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Utility function for API calls
  const apiCall = async (url, options = {}) => {
    // Skip API calls during build time
    if (!isBrowser) {
      return { success: false, message: 'API call skipped during build' };
    }

    setLoading(true);
    try {
      const token = getToken();
      
      // Skip authenticated API calls if no token available
      if (!token && url.includes('/admin')) {
        console.warn('Skipping admin API call - no token available');
        return { success: false, message: 'No token available' };
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Nếu lỗi 401 (Unauthorized), tự động logout
        if (response.status === 401) {
          logout();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse product images
  const parseProductImages = (hinhAnh) => {
    try {
      if (!hinhAnh || hinhAnh === "{}") return { anhChinh: null, anhPhu: [] };

      const imageData =
        typeof hinhAnh === "string" ? JSON.parse(hinhAnh) : hinhAnh;
      return {
        anhChinh: imageData.anhChinh || null,
        anhPhu: imageData.anhPhu || [],
      };
    } catch (error) {
      console.error("Error parsing images:", error);
      return { anhChinh: null, anhPhu: [] };
    }
  };

  // Helper function to parse ThongSoKyThuat
  const parseThongSoKyThuat = (thongSo) => {
    try {
      if (!thongSo) return { ChatLieu: "", KieuGiay: "", XuatXu: "" };

      const specs = typeof thongSo === "string" ? JSON.parse(thongSo) : thongSo;
      return {
        ChatLieu: specs.ChatLieu || "",
        KieuGiay: specs.KieuGiay || "",
        XuatXu: specs.XuatXu || "",
      };
    } catch (error) {
      console.error("Error parsing specifications:", error);
      return { ChatLieu: "", KieuGiay: "", XuatXu: "" };
    }
  };

  // Products API - Based on product.routes.js and test data
  const getProducts = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/products?${queryString}` : "/api/products";
    return await apiCall(url);
  };

  const getProductsAdmin = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `/api/products/admin/list?${queryString}`
      : "/api/products/admin/list";

    const response = await apiCall(url);

    // Process products to parse JSON fields and add computed fields
    if (response.products) {
      response.products = response.products.map((product) => {
        // Parse images properly
        const parsedImages = parseProductImages(product.HinhAnh);

        return {
          ...product,
          // Parse images
          images: parsedImages,
          anhChinh: parsedImages.anhChinh,
          anhPhu: parsedImages.anhPhu,

          // Parse specifications
          ThongSoKyThuatParsed: parseThongSoKyThuat(product.ThongSoKyThuat),

          // Convert string numbers to numbers
          Gia: parseFloat(product.Gia) || 0,
          GiaKhuyenMai: product.GiaKhuyenMai
            ? parseFloat(product.GiaKhuyenMai)
            : null,

          // Add computed fields
          TenThuongHieu: product.tenThuongHieu,
          TenDanhMuc: product.tenDanhMuc,
          TenNhaCungCap: product.tenNhaCungCap,
          TongSoLuong: product.soBienThe || 0,
          SoLuongDaBan: product.SoLuongDaBan || 0,
        };
      });
    }

    return response;
  };

  const getProductDetail = async (productId) => {
    const response = await apiCall(`/api/products/${productId}`);

    // Process single product
    if (response) {
      return {
        ...response,
        images: parseProductImages(response.HinhAnh),
        ThongSoKyThuatParsed: parseThongSoKyThuat(response.ThongSoKyThuat),
        Gia: parseFloat(response.Gia) || 0,
        GiaKhuyenMai: response.GiaKhuyenMai
          ? parseFloat(response.GiaKhuyenMai)
          : null,
      };
    }

    return response;
  };

  const searchProducts = async (searchParams) => {
    const queryString = new URLSearchParams(searchParams).toString();
    return await apiCall(`/api/products/search?${queryString}`);
  };

  // Create product
  const createProduct = async (productData) => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/products/admin/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: productData, // Gửi FormData trực tiếp, không set Content-Type
      });

      if (!response.ok) {
        let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Keep default error message if response is not JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, formData) => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/products/admin/update/${productId}`,
        {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData, // FormData for file upload
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Update product error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/products/admin/delete/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Nếu là lỗi 400 và có flag cannotDelete, đây là trường hợp đặc biệt
        if (response.status === 400 && data.cannotDelete) {
          const error = new Error(data.message);
          error.response = { data };
          throw error;
        }

        // Các lỗi khác
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Delete product error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId, status) => {
    return await apiCall(`/api/products/admin/${productId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  // Lấy biến thể sản phẩm cho trang admin
  const getProductVariants = async (productId) => {
    return await apiCall(`/api/products/admin/${productId}/variants`);

  };

  const getProductStockInfo = async (productId) => {
    return await apiCall(`/api/products/admin/${productId}/stock`);
  };

  const checkStock = async (productId, variants) => {
    return await apiCall(`/api/products/${productId}/check-stock`, {
      method: "POST",
      body: JSON.stringify({ variants }),
    });
  };

  const reviewProduct = async (productId, reviewData) => {
    return await apiCall(`/api/products/${productId}/review`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  };

  // Categories API - Based on testdanhmuc.txt
  const getCategories = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `/api/categories?${queryString}`
      : "/api/categories";
    return await apiCall(url);
  };

  const getallcate = async () => {
    return await apiCall("/api/categories/danhsach");
  }
  const getCategoryStats = async () => {
    return await apiCall("/api/categories/thong-ke/all");
  };

  const getCategoryDetail = async (categoryId) => {
    return await apiCall(`/api/categories/${categoryId}`);
  };

  const createCategory = async (categoryData) => {
    return await apiCall("/api/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  };

  const updateCategory = async (categoryId, categoryData) => {
    return await apiCall(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  };

  const deleteCategory = async (categoryId) => {
    return await apiCall(`/api/categories/${categoryId}`, {
      method: "DELETE",
    });
  };

  const updateCategoryStatus = async (categoryId, status) => {
    return await apiCall(`/api/categories/${categoryId}/trang-thai`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  // Brands API
  const getBrands = async () => {
    return await apiCall("/api/brands");
  };

  const createBrand = async (brandData) => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/brands`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: brandData, // FormData object
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating brand");
      }

      return await response.json();
    } catch (error) {
      console.error("Create brand error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (brandId, brandData) => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: brandData, // FormData object
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating brand");
      }

      return await response.json();
    } catch (error) {
      console.error("Update brand error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (brandId) => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting brand");
      }

      return await response.json();
    } catch (error) {
      console.error("Delete brand error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBrandStats = async () => {
    return await apiCall("/api/brands/stats");
  };

  const getVouchers = async () => {
    return await apiCall("/api/vouchers");
  };

  const createVoucher = async (voucherData) => {
    return await apiCall("/api/vouchers", {
      method: "POST",
      body: JSON.stringify(voucherData),
    });
  };

  const updateVoucher = async (voucherCode, voucherData) => {
    return await apiCall(`/api/vouchers/${voucherCode}`, {
      method: "PUT",
      body: JSON.stringify(voucherData),
    });
  };

  const deleteVoucher = async (voucherCode) => {
    return await apiCall(`/api/vouchers/${voucherCode}`, {
      method: "DELETE",
    });
  };

  const updateVoucherStatus = async (voucherCode, status) => {
    return await apiCall(`/api/vouchers/${voucherCode}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  const searchVouchers = async (searchParams) => {
    const queryString = new URLSearchParams(searchParams).toString();
    return await apiCall(`/api/vouchers/search?${queryString}`);
  };

  // Suppliers API
  const getSuppliers = async () => {
    // Thử cả hai endpoint để đảm bảo có dữ liệu
    try {
      const response = await apiCall("/api/suppliers/hoat-dong");
      if (response.success && response.data && response.data.length > 0) {
        return response;
      }
      // Nếu endpoint hoat-dong không có dữ liệu, thử endpoint chính
      return await apiCall("/api/suppliers");
    } catch (error) {
      console.error('Error with hoat-dong endpoint, trying main endpoint:', error);
      return await apiCall("/api/suppliers");
    }
  };

  const getSuppliersAll = async () => {
    // Lấy tất cả nhà cung cấp cho trang quản lý
    return await apiCall("/api/suppliers");
  };

  const createSupplier = async (supplierData) => {
    return await apiCall("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(supplierData),
    });
  };

  const updateSupplier = async (supplierId, supplierData) => {
    return await apiCall(`/api/suppliers/${supplierId}`, {
      method: "PUT",
      body: JSON.stringify(supplierData),
    });
  };

  const deleteSupplier = async (supplierId) => {
    return await apiCall(`/api/suppliers/${supplierId}`, {
      method: "DELETE",
    });
  };

  // Analytics API
  const getAnalytics = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `/api/analytics?${queryString}`
      : "/api/analytics";
    return await apiCall(url);
  };

  const getRevenueStats = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/revenue/stats?${queryString}` : "/api/revenue/stats";
    return await apiCall(url);
  };


  // Orders API (assuming similar structure)
  const getOrders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/orders/admin?${queryString}` : "/api/orders/admin";
    return await apiCall(url);
  };

  const updateOrderStatus = async (orderId, status) => {
    return await apiCall(`/api/orders/admin/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  };

  const getOrderDetail = async (orderId) => {
    return await apiCall(`/api/orders/admin/${orderId}`);
  };

  const getOrderStats = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/orders/admin/stats/overview?${queryString}` : "/api/orders/admin/stats/overview";
    return await apiCall(url);
  };

  // Wishlists API
  const getWishlists = async () => {
    return await apiCall("/api/wishlists/statistics");
  };

  // Inventory API
  const getInventoryStats = async () => {
    return await apiCall("/api/inventory/thong-ke/ton-kho");
  };

  const getInventoryList = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/thong-ke/ton-kho?${queryString}` : "/api/inventory/thong-ke/ton-kho";
    return await apiCall(url);
  };

  const getInventoryImportStats = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/thong-ke/nhap-kho?${queryString}` : "/api/inventory/thong-ke/nhap-kho";
    return await apiCall(url);
  };

  const searchProductsInventory = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/products/search?${queryString}` : "/api/inventory/products/search";
    return await apiCall(url);
  };

  const getInventoryProductVariants = async (productId) => {
    return await apiCall(`/api/inventory/products/${productId}/variants`);
  };

  const updateImportReceipt = async (receiptId, updateData) => {
    return await apiCall(`/api/inventory/admin/phieu-nhap/${receiptId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  };

  const createImportReceipt = async (receiptData) => {
    return await apiCall("/api/inventory/admin/phieu-nhap/smart-create", {
      method: "POST",
      body: JSON.stringify(receiptData),
    });
  };

  const generateVariantCode = async (productId, colorId, sizeId) => {
    return await apiCall("/api/inventory/generate-variant-code", {
      method: "POST",
      body: JSON.stringify({
        productId,
        colorId,
        sizeId
      }),
    });
  };

  const getImportReceipts = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/admin/phieu-nhap/list?${queryString}` : "/api/inventory/admin/phieu-nhap/list?page=1&limit=10";
    return await apiCall(url);
  };

  const getImportReceiptDetail = async (receiptId) => {
    return await apiCall(`/api/inventory/admin/phieu-nhap/${receiptId}`);
  };

  const updateInventory = async (productId, variantId, quantity) => {
    return await apiCall(`/api/inventory/update`, {
      method: "POST",
      body: JSON.stringify({
        productId,
        variantId,
        quantity
      }),
    });
  };

  const getInventoryHistory = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/history?${queryString}` : "/api/inventory/history";
    return await apiCall(url);
  };
  const getShippingMethods = async (params = {}) => {
    return await apiCall("/api/shipping")
  }
  const getShippingMethodById = async (methodId) => {
    return await apiCall(`/api/shipping/${methodId}`);
  }
  const createShippingMethod = async (methodData) => {
    return await apiCall("/api/shipping", {
      method: "POST",
      body: JSON.stringify(methodData),
    });
  }
  const updateShippingMethod = async (methodId, methodData) => {
    return await apiCall(`/api/shipping/${methodId}`, {
      method: "PUT",
      body: JSON.stringify(methodData),
    });
  }
  const updateShippingStatus = async (methodId, status) => {
    return await apiCall(`/api/shipping/${methodId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });

  }
  const deleteShippingMethod = async (methodId) => {
    return await apiCall(`/api/shipping/${methodId}`, {
      method: "DELETE",
    });
  };

  // Payments API
  const getPaymentMethods = async () => {
    return await apiCall("/api/payments/methods");
  };

  const getPaymentMethodsAdmin = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/payments/admin?${queryString}` : "/api/payments/admin";
    return await apiCall(url);
  };

  const createPaymentMethod = async (paymentData) => {
    return await apiCall("/api/payments/admin", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  };

  const updatePaymentMethod = async (methodId, paymentData) => {
    return await apiCall(`/api/payments/admin/${methodId}`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    });
  };

  const updatePaymentStatus = async (methodId, status) => {
    return await apiCall(`/api/payments/admin/${methodId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  const deletePaymentMethod = async (methodId) => {
    return await apiCall(`/api/payments/admin/${methodId}`, {
      method: "DELETE",
    });
  };

  const value = {
    loading,
    initialLoading, // Thêm vào value
    sidebarOpen,
    setSidebarOpen,
    dashboardData,
    loadDashboardData,

    // Authentication
    isAuthenticated,
    user,
    loginAdmin,
    logout,

    // Products
    getProducts,
    getProductsAdmin,
    getProductDetail,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    getProductVariants,
    getProductStockInfo,
    checkStock,
    reviewProduct,

    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats,
    updateCategoryStatus,
    getallcate,
    // Brands
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrandStats,

    // Vouchers
    getVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    updateVoucherStatus,
    searchVouchers,

    // Suppliers
    getSuppliers,
    getSuppliersAll,
    createSupplier,
    updateSupplier,
    deleteSupplier,

    // Analytics
    getAnalytics,
    getRevenueStats,

    // Orders
    getOrders,
    updateOrderStatus,
    getOrderDetail,
    getOrderStats,

    // Wishlists
    getWishlists,

    // Inventory
    getInventoryStats,
    getInventoryList,
    getInventoryImportStats,
    searchProductsInventory,
    getInventoryProductVariants,
    updateImportReceipt,
    createImportReceipt,
    generateVariantCode,
    getImportReceipts,
    getImportReceiptDetail,
    updateInventory,
    getInventoryHistory,

    // Shipping Methods
    getShippingMethods,
    createShippingMethod,
    updateShippingMethod,
    updateShippingStatus,
    deleteShippingMethod,

    // Payments
    getPaymentMethods,
    getPaymentMethodsAdmin,
    createPaymentMethod,
    updatePaymentMethod,
    updatePaymentStatus,
    deletePaymentMethod,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
