import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchProducts,
  searchProducts,
  setFilters,
  setCurrentPage,
  setSearchQuery,
} from "../store/slices/productSlice";
import ProductGrid from "../components/Product/ProductGrid";
import ProductFilters from "../components/Product/ProductFilters";
import ProductSort from "../components/Product/ProductSort";
import Pagination from "../components/Common/Pagination";

const ITEMS_PER_PAGE = 8;

const ProductsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    isLoading,
    isSearching,
    totalProducts,
    currentPage,
    totalPages,
    filters,
  } = useSelector((state) => state.products);

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

  // Cập nhật URL dựa trên các bộ lọc và trang hiện tại
  const updateUrl = useCallback(
    (filters, page) => {
      const params = new URLSearchParams();

      if (filters.category) params.set("category", filters.category);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sortBy && filters.sortBy !== "newest")
        params.set("sortBy", filters.sortBy);
      if (page && page > 1) params.set("page", page.toString());

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
    (urlFilters, page = 1) => {
      const searchTerm = urlFilters.search;

      dispatch(
        setFilters({
          ...urlFilters,
          page: page,
        })
      );

      if (page !== currentPage) {
        dispatch(setCurrentPage(page));
      }

      // Sử dụng API tìm kiếm nếu có tiêu chí tìm kiếm/lọc
      if (
        searchTerm ||
        urlFilters.category ||
        urlFilters.brand ||
        urlFilters.minPrice ||
        urlFilters.maxPrice
      ) {
        dispatch(setSearchQuery(searchTerm || ""));
        const searchData = formatSearchData(urlFilters, searchTerm);
        return dispatch(
          searchProducts({
            searchData,
            
            limit: ITEMS_PER_PAGE,
          })
        );
      }
      // Sử dụng API sản phẩm thông thường nếu không có tiêu chí
      else {
        return dispatch(
          fetchProducts({
            sortBy: urlFilters.sortBy,
            page,
            limit: ITEMS_PER_PAGE,
          })
        );
      }
    },
    [dispatch, formatSearchData, currentPage]
  );

  // Effect chính để tải dữ liệu khi URL hoặc trang thay đổi
  useEffect(() => {
    const urlFilters = getFiltersFromUrl();
    const page = urlFilters.page;

    loadProducts(urlFilters, page);
  }, [getFiltersFromUrl, loadProducts]);

  // Xử lý khi thay đổi trang
  const handlePageChange = (page) => {
    const urlFilters = getFiltersFromUrl();
    updateUrl(urlFilters, page);
    loadProducts(urlFilters, page);
  };

  // Xử lý khi thay đổi bộ lọc
  const handleFilterChange = (newFilters) => {
    // Khi thay đổi bộ lọc, luôn quay về trang 1
    updateUrl(newFilters, 1);
    loadProducts(newFilters, 1);
  };

  const isLoadingData = isLoading || isSearching;
  const hasSearchQuery = searchParams.get("search");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {hasSearchQuery
              ? `Kết quả tìm kiếm: "${hasSearchQuery}"`
              : "Sản Phẩm"}
          </h1>
          <p className="text-gray-600">
            {totalProducts > 0
              ? `Tìm thấy ${totalProducts} sản phẩm`
              : "Không tìm thấy sản phẩm nào"}
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-outline flex items-center space-x-2"
          >
            <span>🔍</span>
            <span>Bộ lọc</span>
          </button>
          <ProductSort
            onSortChange={(sortBy) =>
              handleFilterChange({ ...filters, sortBy })
            }
            currentSort={filters.sortBy}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div
          className={`lg:w-1/4 ${showFilters ? "block" : "hidden lg:block"}`}
        >
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:w-3/4">
          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : products.length > 0 ? (
            <>
              <ProductGrid products={products} />
              {totalPages > 0 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={totalProducts}
                    showItemsInfo={true}
                    className="mb-4"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {hasSearchQuery
                  ? "Không tìm thấy sản phẩm"
                  : "Chưa có sản phẩm"}
              </h3>
              <p className="text-gray-600">
                {hasSearchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                  : "Thử thay đổi bộ lọc hoặc quay lại sau"}
              </p>
              {hasSearchQuery && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      navigate("/products");
                    }}
                    className="btn-primary"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
