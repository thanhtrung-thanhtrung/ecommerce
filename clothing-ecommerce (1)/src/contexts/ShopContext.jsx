import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const ShopContext = createContext();

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error("useShop must be used within a ShopProvider");
    }
    return context;
};

export const ShopProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [orders, setOrders] = useState([]);

    // Product states for ProductsPage
    const [filters, setFilters] = useState({
        category: "",
        brand: "",
        search: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "newest",
        page: 1,
    });
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    // Product Detail Page states
    const [currentProduct, setCurrentProduct] = useState(null);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Helper function to get authentication token
    const getToken = useCallback(() => {
        return localStorage.getItem('token') || '';
    }, []);

    // Utility function for API calls
    const apiCall = useCallback(async (url, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
                    ...options.headers,
                },
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
            console.error("API call error:", error);
            throw error;
        }
    }, [API_BASE_URL, getToken]);

    // Helper functions for parsing product data
    const parseProductImages = useCallback((hinhAnh) => {
        try {
            if (!hinhAnh || hinhAnh === "{}") return { anhChinh: null, anhPhu: [] };
            const imageData = typeof hinhAnh === "string" ? JSON.parse(hinhAnh) : hinhAnh;
            return {
                anhChinh: imageData.anhChinh || null,
                anhPhu: imageData.anhPhu || [],
            };
        } catch (error) {
            console.error("Error parsing images:", error);
            return { anhChinh: null, anhPhu: [] };
        }
    }, []);

    const parseThongSoKyThuat = useCallback((thongSo) => {
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
    }, []);

    // Auth functions
    const loginUser = useCallback(async (credentials) => {
        try {
            setLoading(true);
            const response = await apiCall("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(credentials),
            });

            // Sửa logic kiểm tra thành công: chỉ cần có token và user là thành công
            if (response.token && response.user) {
                setUser(response.user);
                setIsAuthenticated(true);
                localStorage.setItem("token", response.token);
                localStorage.setItem("user", JSON.stringify(response.user));
                toast.success("Đăng nhập thành công!");
                return response;
            } else {
                throw new Error(response.message || "Đăng nhập thất bại");
            }
        } catch (error) {
            toast.error(error.message || "Lỗi đăng nhập");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    const registerUser = useCallback(async (userData) => {
        try {
            setLoading(true);
            const response = await apiCall("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(userData),
            });

            // Sửa logic: thành công nếu có userId hoặc message chứa 'thành công'
            if (response.userId || (response.message && response.message.toLowerCase().includes("thành công"))) {
                toast.success("Đăng ký thành công!");
                return response;
            } else {
                throw new Error(response.message || "Đăng ký thất bại");
            }
        } catch (error) {
            toast.error(error.message || "Lỗi đăng ký");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    const logoutUser = useCallback(async () => {
        try {
            await apiCall("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setWishlist([]);
            setOrders([]);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("wishlist");
            localStorage.removeItem("guestSessionId");
            toast.success("Đăng xuất thành công!");
        }
    }, [apiCall]);

    // Product functions
    const fetchProducts = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(params).toString();
            const response = await apiCall(`/api/products?${queryParams}`);

            const processedProducts = (response.products || []).map(product => ({
                ...product,
                images: parseProductImages(product.HinhAnh),
                ThongSoKyThuatParsed: parseThongSoKyThuat(product.ThongSoKyThuat),
                Gia: parseFloat(product.Gia) || 0,
                GiaKhuyenMai: product.GiaKhuyenMai ? parseFloat(product.GiaKhuyenMai) : null,
                TenThuongHieu: product.tenThuongHieu,
                TenDanhMuc: product.tenDanhMuc,
                chiTietSanPham: product.bienThe || [],
                variants: product.bienThe || []
            }));

            setProducts(processedProducts);

            // Update pagination states
            if (response.pagination) {
                setTotalProducts(response.pagination.total || processedProducts.length);
                setCurrentPage(response.pagination.currentPage || 1);
                setTotalPages(response.pagination.totalPages || 1);
            } else {
                setTotalProducts(processedProducts.length);
                setCurrentPage(1);
                setTotalPages(1);
            }

            return {
                success: true,
                products: processedProducts,
                pagination: response.pagination || {}
            };
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
            setTotalProducts(0);
            return { products: [], pagination: {} };
        } finally {
            setLoading(false);
        }
    }, [apiCall, parseProductImages, parseThongSoKyThuat]);

    const searchProducts = useCallback(async (params = {}) => {
        try {
            setLoading(true);

            let searchParams;
            if (typeof params === 'string') {
                const query = params;
                const filters = arguments[1] || {};
                searchParams = { q: query, ...filters };
            } else {
                searchParams = { ...params };
                if (params.searchData) {
                    searchParams = { ...searchParams, ...params.searchData };
                }
            }

            const queryString = new URLSearchParams(searchParams).toString();
            const response = await apiCall(`/api/products/search?${queryString}`);

            const processedProducts = (response.products || []).map(product => ({
                ...product,
                images: parseProductImages(product.HinhAnh),
                ThongSoKyThuatParsed: parseThongSoKyThuat(product.ThongSoKyThuat),
                Gia: parseFloat(product.Gia) || 0,
                GiaKhuyenMai: product.GiaKhuyenMai ? parseFloat(product.GiaKhuyenMai) : null,
                TenThuongHieu: product.tenThuongHieu,
                TenDanhMuc: product.tenDanhMuc,
                chiTietSanPham: product.bienThe || [],
                variants: product.bienThe || []
            }));

            setProducts(processedProducts);

            if (response.pagination) {
                setTotalProducts(response.pagination.total || processedProducts.length);
                setCurrentPage(response.pagination.currentPage || 1);
                setTotalPages(response.pagination.totalPages || 1);
            }

            return {
                success: true,
                products: processedProducts,
                pagination: response.pagination || {}
            };
        } catch (error) {
            console.error("Error searching products:", error);
            setProducts([]);
            setTotalProducts(0);
            return { products: [] };
        } finally {
            setLoading(false);
        }
    }, [apiCall, parseProductImages, parseThongSoKyThuat]);

    const fetchProductById = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiCall(`/api/products/${id}`);

            if (response && response.id && response.HinhAnh) {
                const processedProduct = {
                    ...response,
                    images: parseProductImages(response.HinhAnh),
                    ThongSoKyThuatParsed: parseThongSoKyThuat(response.ThongSoKyThuat),
                    Gia: parseFloat(response.Gia) || 0,
                    GiaKhuyenMai: response.GiaKhuyenMai ? parseFloat(response.GiaKhuyenMai) : null,
                    chiTietSanPham: response.bienThe || [],
                    variants: response.bienThe || []
                };

                setCurrentProduct(processedProduct);
                return processedProduct;
            } else if (response.success && response.data) {
                const processedProduct = {
                    ...response.data,
                    images: parseProductImages(response.data.HinhAnh),
                    ThongSoKyThuatParsed: parseThongSoKyThuat(response.data.ThongSoKyThuat),
                    Gia: parseFloat(response.data.Gia) || 0,
                    GiaKhuyenMai: response.data.GiaKhuyenMai ? parseFloat(response.data.GiaKhuyenMai) : null,
                    chiTietSanPham: response.data.bienThe || [],
                    variants: response.data.bienThe || []
                };

                setCurrentProduct(processedProduct);
                return processedProduct;
            } else {
                setError("Không tìm thấy sản phẩm");
                setCurrentProduct(null);
                return null;
            }
        } catch (error) {
            console.error("Error in fetchProductById:", error);
            setError(error.message || "Lỗi khi tải sản phẩm");
            setCurrentProduct(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [apiCall, parseProductImages, parseThongSoKyThuat]);

    const clearCurrentProduct = useCallback(() => {
        setCurrentProduct(null);
        setError(null);
    }, []);

    // Category and Brand functions
    const fetchCategories = useCallback(async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `/api/categories?${queryString}` : "/api/categories";
            const response = await apiCall(url);

            if (response.success && response.data) {
                setCategories(response.data);
                return response;
            } else if (Array.isArray(response)) {
                setCategories(response);
                return { success: true, data: response };
            } else if (response.data && Array.isArray(response.data)) {
                setCategories(response.data);
                return response;
            }

            return { data: [] };
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
            return { data: [] };
        }
    }, [apiCall]);

    const fetchBrands = useCallback(async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `/api/brands?${queryString}` : "/api/brands";
            const response = await apiCall(url);

            if (response.success && response.data) {
                setBrands(response.data);
                return response;
            } else if (Array.isArray(response)) {
                setBrands(response);
                return { success: true, data: response };
            } else if (response.data && Array.isArray(response.data)) {
                setBrands(response.data);
                return response;
            }

            return { data: [] };
        } catch (error) {
            console.error("Error fetching brands:", error);
            setBrands([]);
            return { data: [] };
        }
    }, [apiCall]);

    const getCategoryById = useCallback(async (id) => {
        try {
            return await apiCall(`/api/categories/${id}`);
        } catch (error) {
            console.error("Error fetching category:", error);
            throw error;
        }
    }, [apiCall]);

    const getBrandById = useCallback(async (id) => {
        try {
            return await apiCall(`/api/brands/${id}`);
        } catch (error) {
            console.error("Error fetching brand:", error);
            throw error;
        }
    }, [apiCall]);

    // Order functions
    const fetchOrders = useCallback(async () => {
        try {
            if (!isAuthenticated) return { data: [] };

            setLoading(true);
            const response = await apiCall("/api/orders");
            if (response.success) {
                setOrders(response.data || []);
                return response;
            }
            return { data: [] };
        } catch (error) {
            console.error("Error fetching orders:", error);
            return { data: [] };
        } finally {
            setLoading(false);
        }
    }, [apiCall, isAuthenticated]);

    // Search suggestions functions
    const getSearchSuggestions = useCallback(async (query) => {
        try {
            if (!query || query.trim().length < 2) {
                setSearchSuggestions([]);
                return;
            }

            const response = await apiCall(`/api/products/suggestions?q=${encodeURIComponent(query)}`);

            if (response.success && response.suggestions) {
                setSearchSuggestions(response.suggestions);
            } else if (response.products) {
                const suggestions = response.products.slice(0, 5).map(product => ({
                    Ten: product.Ten,
                    id: product.id,
                    type: 'product'
                }));
                setSearchSuggestions(suggestions);
            } else {
                setSearchSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching search suggestions:", error);
            setSearchSuggestions([]);
        }
    }, [apiCall]);

    const clearSearchSuggestions = useCallback(() => {
        setSearchSuggestions([]);
    }, []);

    // Wishlist functions
    const addToWishlist = useCallback(async (productId) => {
        try {
            if (isAuthenticated) {
                if (!productId) throw new Error("Thiếu productId");
                const response = await apiCall("/api/users/wishlist", {
                    method: "POST",
                    body: JSON.stringify({
                        id_SanPham: productId,
                    }), // chỉ gửi productId
                });
                if (response.success) {
                    const wishlistResponse = await apiCall("/api/users/wishlist");
                    if (wishlistResponse.success) {
                        setWishlist(wishlistResponse.data || []);
                    }
                    toast.success("Đã thêm vào danh sách yêu thích!");
                    return response;
                }
            } else {
                const newWishlist = [...wishlist, { id: productId }];
                setWishlist(newWishlist);
                localStorage.setItem("wishlist", JSON.stringify(newWishlist));
                toast.success("Đã thêm vào danh sách yêu thích!");
            }
        } catch (error) {
            toast.error(error.message || "Lỗi khi thêm vào danh sách yêu thích");
            throw error;
        }
    }, [apiCall, isAuthenticated, wishlist]);

    const removeFromWishlist = useCallback(async (productId) => {
        try {
            if (isAuthenticated) {
                const response = await apiCall(`/api/users/wishlist/${productId}`, {
                    method: "DELETE",
                });
                if (response.success) {
                    const wishlistResponse = await apiCall("/api/users/wishlist");
                    if (wishlistResponse.success) {
                        setWishlist(wishlistResponse.data || []);
                    }
                    toast.success("Đã xóa khỏi danh sách yêu thích!");
                    return response;
                }
            } else {
                const newWishlist = wishlist.filter(item => item.id !== productId);
                setWishlist(newWishlist);
                localStorage.setItem("wishlist", JSON.stringify(newWishlist));
                toast.success("Đã xóa khỏi danh sách yêu thích!");
            }
        } catch (error) {
            toast.error("Lỗi khi xóa khỏi danh sách yêu thích");
            throw error;
        }
    }, [apiCall, isAuthenticated, wishlist]);

    const fetchWishlist = useCallback(async () => {
        try {
            if (isAuthenticated) {
                const response = await apiCall("/api/users/wishlist");

                console.log("Wishlist API response:", response);

                if (response.success && Array.isArray(response.data)) {
                    setWishlist(response.data);
                    return { success: true, data: response.data };
                } else if (Array.isArray(response)) {
                    // fallback nếu API không trả chuẩn mà trả luôn mảng
                    setWishlist(response);
                    return { success: true, data: response };
                } else {
                    setWishlist([]);
                    return { success: false, data: [] };
                }
            } else {
                const savedWishlist = localStorage.getItem("wishlist");

                if (savedWishlist) {
                    try {
                        const wishlistData = JSON.parse(savedWishlist);
                        if (Array.isArray(wishlistData)) {
                            setWishlist(wishlistData);
                            return { success: true, data: wishlistData };
                        }
                    } catch (error) {
                        console.error("Lỗi parse local wishlist:", error);
                    }

                    localStorage.removeItem("wishlist");
                }
            }
        } catch (error) {
            console.error("Lỗi fetchWishlist:", error);
        }

        setWishlist([]);
        return { success: false, data: [] };
    }, [apiCall, isAuthenticated]);

    // ================= USER PROFILE & ACCOUNT =================
    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiCall("/api/users/profile");
            if (response && response.id) {
                setUser(response);
                setIsAuthenticated(true);
                localStorage.setItem("user", JSON.stringify(response));
            }
            return response;
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("user");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    const updateProfile = useCallback(async (profileData) => {
        try {
            setLoading(true);
            const response = await apiCall("/api/users/profile", {
                method: "PUT",
                body: JSON.stringify(profileData),
            });
            if (response && response.id) {
                setUser(response);
                localStorage.setItem("user", JSON.stringify(response));
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    const changePassword = useCallback(async (values) => {
        try {
            setLoading(true);
            const response = await apiCall("/api/users/change-password", {
                method: "PUT",
                body: JSON.stringify(values),
            });
            return response;
        } catch (error) {
            // Nếu lỗi dạng { errors: [...] } thì ném lại nguyên object để Formik xử lý field error
            if (error && error.message && error.message.includes('HTTP error!') && error.errors) {
                throw error;
            }
            // Nếu response có body dạng JSON với errors
            try {
                const errorData = JSON.parse(error.message);
                if (errorData && errorData.errors) throw errorData;
            } catch { }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // ================= ORDER HISTORY =================
    const fetchUserOrders = useCallback(async (params = {}) => {
        try {
            setLoading(true)
            setError("")
            const query = new URLSearchParams(params).toString()
            const res = await apiCall(`/api/users/order-history${query ? `?${query}` : ""}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                credentials: "include",
            })

            if (res && Array.isArray(res.orders)) {
                setOrders(res.orders)
            } else if (Array.isArray(res)) {
                setOrders(res)
            } else {
                setOrders([])
            }

            return res
        } catch (err) {
            setOrders([])
            setError("Lỗi khi tải đơn hàng")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])


    // ================= WISHLIST =================
    const clearWishlist = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiCall("/api/users/wishlist", {
                method: "DELETE",
            });
            if (response && response.success) {
                setWishlist([]);
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // ================= CANCEL ORDER =================
    const cancelOrder = useCallback(async (orderId, reason = "Khách hàng yêu cầu hủy") => {
        try {
            setLoading(true);
            const response = await apiCall(`/api/users/orders/${orderId}/cancel`, {
                method: "POST",
                body: JSON.stringify({ lyDoHuy: reason }),
            });
            return response;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // UI functions
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Initialize data
    useEffect(() => {
        const initializeApp = async () => {
            const savedUser = localStorage.getItem("user");

            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                    setIsAuthenticated(true);
                } catch (error) {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                }
            }

            try {
                await Promise.all([
                    fetchCategories(),
                    fetchBrands(),
                    fetchWishlist()
                ]);
            } catch (error) {
                console.error("Error loading initial data:", error);
            }
        };

        initializeApp();
    }, []); // Empty dependency array - only run once

    const value = {
        // State
        loading,
        user,
        isAuthenticated,
        wishlist,
        products,
        categories,
        brands,
        searchSuggestions,
        isMobileMenuOpen,
        orders,

        // Product states
        filters,
        setFilters,
        totalProducts,
        setTotalProducts,
        currentPage,
        setCurrentPage,
        totalPages,
        setTotalPages,
        searchQuery,
        setSearchQuery,

        // Product Detail Page states
        currentProduct,
        error,

        // Auth functions
        loginUser,
        registerUser,
        logoutUser,

        // Product functions
        fetchProducts,
        searchProducts,
        fetchProductById,
        clearCurrentProduct,
        getSearchSuggestions,
        clearSearchSuggestions,

        // Category functions
        fetchCategories,
        getCategoryById,

        // Brand functions
        fetchBrands,
        getBrandById,

        // Order functions
        fetchOrders,

        // Wishlist functions
        addToWishlist,
        removeFromWishlist,
        fetchWishlist,
        wishlistItems: wishlist, // Alias for compatibility

        // User profile/account
        getProfile,
        updateProfile,
        changePassword,
        // Orders
        fetchUserOrders,
        cancelOrder,
        // Wishlist
        clearWishlist,

        // UI functions
        toggleMobileMenu,
        closeMobileMenu,

        // Helper functions
        parseProductImages,
        parseThongSoKyThuat,
    };

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};