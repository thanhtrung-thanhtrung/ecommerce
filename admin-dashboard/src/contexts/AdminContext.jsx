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

  // Products API - Based on product.routes.js
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
    return await apiCall(url);
  };

  const getProductDetail = async (productId) => {
    return await apiCall(`/api/products/${productId}`);
  };

  const searchProducts = async (searchParams) => {
    const queryString = new URLSearchParams(searchParams).toString();
    return await apiCall(`/api/products/search?${queryString}`);
  };

  const createProduct = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/admin/create`,
        {
          method: "POST",
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
      console.error("Create product error:", error);
      throw error;
    } finally {
      setLoading(false);
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
    return await apiCall(`/api/products/admin/delete/${productId}`, {
      method: "DELETE",
    });
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

  // Categories API
  const getCategories = async () => {
    return await apiCall("/api/categories");
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

  const getCategoryStats = async () => {
    return await apiCall("/api/categories/stats");
  };

  const updateCategoryStatus = async (categoryId, status) => {
    return await apiCall(`/api/categories/${categoryId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ TrangThai: status }),
    });
  };

  // Brands API
  const getBrands = async () => {
    return await apiCall("/api/brands");
  };

  const createBrand = async (brandData) => {
    return await apiCall("/api/brands", {
      method: "POST",
      body: JSON.stringify(brandData),
    });
  };

  const updateBrand = async (brandId, brandData) => {
    return await apiCall(`/api/brands/${brandId}`, {
      method: "PUT",
      body: JSON.stringify(brandData),
    });
  };

  const deleteBrand = async (brandId) => {
    return await apiCall(`/api/brands/${brandId}`, {
      method: "DELETE",
    });
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
