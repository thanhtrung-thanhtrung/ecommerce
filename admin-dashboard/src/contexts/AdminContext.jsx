import React, { createContext, useContext, useState } from "react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const getToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
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

  // Utility function for API calls
  const apiCall = async (url, options = {}) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: "include", // Include cookies for session
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API call error:", error);
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
      response.products = response.products.map((product) => ({
        ...product,
        // Parse images
        images: parseProductImages(product.HinhAnh),
        anhChinh: parseProductImages(product.HinhAnh).anhChinh,
        anhPhu: parseProductImages(product.HinhAnh).anhPhu,

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
      }));
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
      console.log("Creating product with data:", productData);

      const response = await fetch(`${API_BASE_URL}/api/products/admin/create`, {
        method: "POST",
        body: productData, // FormData object
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        // Try to get detailed error information
        let errorData;
        try {
          errorData = await response.json();
          console.log("Error response data:", errorData);
        } catch (parseError) {
          console.log("Could not parse error response as JSON");
          errorData = { message: `HTTP error! status: ${response.status}` };
        }

        // If we have validation errors, show them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err) => err.msg || err.message)
            .join(", ");
          throw new Error(`Validation errors: ${errorMessages}`);
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Create product success:", result);
      return result;
    } catch (error) {
      console.error("Create product error:", error);
      throw error;
    }
  };

  const updateProduct = async (productId, formData) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/admin/update/${productId}`,
        {
          method: "PUT",
          credentials: "include",
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
      const response = await fetch(
        `${API_BASE_URL}/api/products/admin/delete/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
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
      const response = await fetch(`${API_BASE_URL}/api/brands`, {
        method: "POST",
        credentials: "include", // Use session cookies instead of Authorization header
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
      const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
        method: "PUT",
        credentials: "include", // Use session cookies instead of Authorization header
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
      const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
        method: "DELETE",
        credentials: "include", // Use session cookies
        headers: {
          "Content-Type": "application/json",
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

  // Vouchers API - Based on the Postman collection
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
    const url = queryString ? `/api/revenue?${queryString}` : "/api/revenue";
    return await apiCall(url);
  };

  // Orders API (assuming similar structure)
  const getOrders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/orders?${queryString}` : "/api/orders";
    return await apiCall(url);
  };

  const updateOrderStatus = async (orderId, status) => {
    return await apiCall(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  const getOrderDetail = async (orderId) => {
    return await apiCall(`/api/orders/${orderId}`);
  };

  // Wishlists API
  const getWishlists = async () => {
    return await apiCall("/api/wishlists");
  };

  const value = {
    loading,
    sidebarOpen,
    setSidebarOpen,
    dashboardData,
    loadDashboardData,

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

    // Wishlists
    getWishlists,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
