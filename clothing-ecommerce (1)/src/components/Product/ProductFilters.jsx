"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { fetchCategories, fetchBrands } from "../../store/slices/productSlice";

const ProductFilters = ({ filters, onFilterChange }) => {
  const dispatch = useDispatch();
  const { categories, brands } = useSelector((state) => state.products);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // Fetch categories and brands from API
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (min, max) => {
    const newFilters = { ...localFilters, minPrice: min, maxPrice: max };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      ...filters,
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const priceRanges = [
    { label: "Dưới 500.000đ", min: "", max: "500000" },
    { label: "500.000đ - 1.000.000đ", min: "500000", max: "1000000" },
    { label: "1.000.000đ - 2.000.000đ", min: "1000000", max: "2000000" },
    { label: "Trên 2.000.000đ", min: "2000000", max: "" },
  ];

  return (
    <div className="space-y-6">
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
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Danh mục</h4>
        <div className="space-y-2">
          {categories.map((category) => (
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
                className="ml-2 text-sm text-gray-700"
              >
                {category.Ten || category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Thương hiệu</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
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
                className="ml-2 text-sm text-gray-700"
              >
                {brand.Ten || brand.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Giá</h4>
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
                className="ml-2 text-sm text-gray-700"
              >
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Price Range */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Khoảng giá tùy chọn</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="min-price" className="sr-only">
              Giá tối thiểu
            </label>
            <input
              type="number"
              id="min-price"
              placeholder="Từ"
              value={localFilters.minPrice}
              onChange={(e) =>
                handlePriceChange(e.target.value, localFilters.maxPrice)
              }
              className="form-input text-sm"
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
              value={localFilters.maxPrice}
              onChange={(e) =>
                handlePriceChange(localFilters.minPrice, e.target.value)
              }
              className="form-input text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
