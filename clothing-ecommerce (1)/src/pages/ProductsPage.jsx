import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useShop } from "../contexts/ShopContext";
import ProductGrid from "../components/Product/ProductGrid";
import ProductFilters from "../components/Product/ProductFilters";
import ProductSort from "../components/Product/ProductSort";
import Pagination from "../components/Common/Pagination";
import LoadingSpinner from "../components/Common/LoadingSpinner"

const ITEMS_PER_PAGE = 12;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    loading,
    totalProducts,
    currentPage,
    totalPages,
    filters,
    fetchProducts,
    searchProducts,
    setFilters: updateFilters,
    setCurrentPage,
    setSearchQuery,
  } = useShop();

  const [showFilters, setShowFilters] = useState(false);

  // Lấy các bộ lọc từ URL params
  const getFiltersFromUrl = useCallback(() => {
    return {
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
    };
  }, [searchParams]);

  // Chuyển đổi bộ lọc từ frontend sang định dạng backend
  const formatSearchData = useCallback((urlFilters, searchTerm) => {
    const searchData = {};

    if (searchTerm) {
      searchData.tuKhoa = searchTerm;
    }

    if (urlFilters.category) {
      searchData.id_DanhMuc = parseInt(urlFilters.category);
    }

    if (urlFilters.brand) {
      searchData.id_ThuongHieu = parseInt(urlFilters.brand);
    }

    if (urlFilters.minPrice) {
      searchData.giaMin = parseInt(urlFilters.minPrice);
    }

    if (urlFilters.maxPrice) {
      searchData.giaMax = parseInt(urlFilters.maxPrice);
    }

    return searchData;
  }, []);

  // Cập nhật URL params
  const updateUrlParams = useCallback(
    (newParams) => {
      const params = new URLSearchParams();
      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== "" && value !== "0") {
          params.set(key, value.toString());
        }
      });

      navigate(
        {
          pathname: "/products",
          search: params.toString(),
        },
        { replace: true }
      );
    },
    [navigate]
  );

  // Hàm tải dữ liệu sản phẩm chung cho cả tìm kiếm và lọc
  const loadProducts = useCallback(
    async (urlFilters, page = 1) => {
      const searchTerm = urlFilters.search;

      updateFilters({
        ...urlFilters,
        page: page,
      });

      if (page !== currentPage) {
        setCurrentPage(page);
      }

      // Sử dụng API tìm kiếm nếu có tiêu chí tìm kiếm/lọc
      if (
        searchTerm ||
        urlFilters.category ||
        urlFilters.brand ||
        urlFilters.minPrice ||
        urlFilters.maxPrice
      ) {
        setSearchQuery(searchTerm || "");
        const searchData = formatSearchData(urlFilters, searchTerm);
        return await searchProducts({
          searchData,
          page: page,
          limit: ITEMS_PER_PAGE,
        });
      }

      // Nếu không có tiêu chí tìm kiếm, tải tất cả sản phẩm
      return await fetchProducts({
        page: page,
        limit: ITEMS_PER_PAGE,
        sortBy: urlFilters.sortBy,
      });
    },
    [updateFilters, formatSearchData, currentPage, setCurrentPage, setSearchQuery, searchProducts, fetchProducts]
  );

  // Load dữ liệu khi component mount và URL thay đổi
  useEffect(() => {
    const urlFilters = getFiltersFromUrl();
    loadProducts(urlFilters, urlFilters.page);
  }, [searchParams, getFiltersFromUrl, loadProducts]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = useCallback(
    (newFilters) => {
      const urlFilters = {
        ...getFiltersFromUrl(),
        ...newFilters,
        page: 1, // Reset về trang 1 khi thay đổi bộ lọc
      };

      updateUrlParams(urlFilters);
    },
    [getFiltersFromUrl, updateUrlParams]
  );

  // Xử lý thay đổi sắp xếp
  const handleSortChange = useCallback(
    (sortBy) => {
      const urlFilters = {
        ...getFiltersFromUrl(),
        sortBy,
        page: 1,
      };

      updateUrlParams(urlFilters);
    },
    [getFiltersFromUrl, updateUrlParams]
  );

  // Xử lý thay đổi trang
  const handlePageChange = useCallback(
    (page) => {
      const urlFilters = {
        ...getFiltersFromUrl(),
        page,
      };

      updateUrlParams(urlFilters);
    },
    [getFiltersFromUrl, updateUrlParams]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sản phẩm</h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </button>
              <p className="text-sm text-gray-500">
                {totalProducts} sản phẩm được tìm thấy
              </p>
            </div>
            <ProductSort
              currentSort={filters.sortBy}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"
              }`}
          >
            <div className="sticky top-8">
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
