"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { fetchCategories, fetchBrands } from "../../store/slices/productSlice";

const ProductFilters = ({ filters, onFilterChange }) => {
  const dispatch = useDispatch();
  const { categories, brands } = useSelector((state) => state.products);

  // Initialize with proper default values to prevent controlled/uncontrolled errors
  const [localFilters, setLocalFilters] = useState({
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    ...filters,
  });

  // State for UI optimizations
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
  });

  const INITIAL_DISPLAY_COUNT = 5;

  useEffect(() => {
    // Fetch categories and brands from API
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    // Update local filters when props change, ensuring all values are strings
    setLocalFilters({
      category: filters.category || "",
      brand: filters.brand || "",
      minPrice: filters.minPrice || "",
      maxPrice: filters.maxPrice || "",
      ...filters,
    });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (min, max) => {
    const newFilters = {
      ...localFilters,
      minPrice: min || "",
      maxPrice: max || "",
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
    };
    setLocalFilters(clearedFilters);
    // Reset search inputs
    setCategorySearch("");
    setBrandSearch("");
    // Reset show all states
    setShowAllCategories(false);
    setShowAllBrands(false);
    onFilterChange(clearedFilters);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const priceRanges = [
    { label: "Dưới 500.000đ", min: "", max: "500000" },
    { label: "500.000đ - 1.000.000đ", min: "500000", max: "1000000" },
    { label: "1.000.000đ - 2.000.000đ", min: "1000000", max: "2000000" },
    { label: "Trên 2.000.000đ", min: "2000000", max: "" },
  ];

  // Ensure categories and brands are arrays before rendering
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBrands = Array.isArray(brands) ? brands : [];

  // Filter and limit categories
  const filteredCategories = safeCategories
    .filter((category) =>
      (category.Ten || category.name || "")
        .toLowerCase()
        .includes(categorySearch.toLowerCase())
    )
    .filter((category) => !category.id_DanhMucCha); // Only show parent categories

  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, INITIAL_DISPLAY_COUNT);

  // Filter and limit brands
  const filteredBrands = safeBrands.filter((brand) =>
    (brand.Ten || brand.name || "")
      .toLowerCase()
      .includes(brandSearch.toLowerCase())
  );

  const displayedBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Bộ lọc</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
        >
          <X className="h-4 w-4 mr-1" />
          Xóa bộ lọc
        </button>
      </div>

      {/* Categories */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-700">Danh mục</h4>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.categories && (
          <div className="px-4 pb-4 space-y-3">
            {/* Search input for categories */}
            {safeCategories.length > INITIAL_DISPLAY_COUNT && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm danh mục..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayedCategories.length > 0 ? (
                displayedCategories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${category.id}`}
                      name="category"
                      checked={localFilters.category === category.id.toString()}
                      onChange={() =>
                        handleFilterChange("category", category.id.toString())
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="ml-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      {category.Ten || category.name || "Không có tên"}
                    </label>
                  </div>
                ))
              ) : categorySearch ? (
                <div className="text-sm text-gray-500">
                  Không tìm thấy danh mục nào
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Đang tải danh mục...
                </div>
              )}
            </div>

            {/* Show more/less button for categories */}
            {filteredCategories.length > INITIAL_DISPLAY_COUNT &&
              !categorySearch && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showAllCategories
                    ? `Ẩn bớt (${
                        filteredCategories.length - INITIAL_DISPLAY_COUNT
                      } mục)`
                    : `Xem thêm ${
                        filteredCategories.length - INITIAL_DISPLAY_COUNT
                      } danh mục`}
                </button>
              )}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection("brands")}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-700">Thương hiệu</h4>
          {expandedSections.brands ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.brands && (
          <div className="px-4 pb-4 space-y-3">
            {/* Search input for brands */}
            {safeBrands.length > INITIAL_DISPLAY_COUNT && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm thương hiệu..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayedBrands.length > 0 ? (
                displayedBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`brand-${brand.id}`}
                      name="brand"
                      checked={localFilters.brand === brand.id.toString()}
                      onChange={() =>
                        handleFilterChange("brand", brand.id.toString())
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="ml-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      {brand.Ten || brand.name || "Không có tên"}
                    </label>
                  </div>
                ))
              ) : brandSearch ? (
                <div className="text-sm text-gray-500">
                  Không tìm thấy thương hiệu nào
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Đang tải thương hiệu...
                </div>
              )}
            </div>

            {/* Show more/less button for brands */}
            {filteredBrands.length > INITIAL_DISPLAY_COUNT && !brandSearch && (
              <button
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAllBrands
                  ? `Ẩn bớt (${
                      filteredBrands.length - INITIAL_DISPLAY_COUNT
                    } mục)`
                  : `Xem thêm ${
                      filteredBrands.length - INITIAL_DISPLAY_COUNT
                    } thương hiệu`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-700">Khoảng giá</h4>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.price && (
          <div className="px-4 pb-4 space-y-4">
            {/* Predefined price ranges */}
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`price-${index}`}
                    name="price"
                    checked={
                      localFilters.minPrice === range.min &&
                      localFilters.maxPrice === range.max
                    }
                    onChange={() => handlePriceChange(range.min, range.max)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`price-${index}`}
                    className="ml-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    {range.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Custom Price Range */}
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">
                Khoảng giá tùy chọn
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min-price" className="sr-only">
                    Giá tối thiểu
                  </label>
                  <input
                    type="number"
                    id="min-price"
                    placeholder="Từ"
                    value={localFilters.minPrice || ""}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, localFilters.maxPrice)
                    }
                    className="form-input text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="sr-only">
                    Giá tối đa
                  </label>
                  <input
                    type="number"
                    id="max-price"
                    placeholder="Đến"
                    value={localFilters.maxPrice || ""}
                    onChange={(e) =>
                      handlePriceChange(localFilters.minPrice, e.target.value)
                    }
                    className="form-input text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
