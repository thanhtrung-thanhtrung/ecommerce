"use client"

import { ChevronDown } from "lucide-react"

const ProductSort = ({ onSortChange, currentSort }) => {
  const sortOptions = [
    { value: "newest", label: "Mới nhất" },
    { value: "price_asc", label: "Giá: Thấp đến cao" },
    { value: "price_desc", label: "Giá: Cao đến thấp" },
    { value: "popular", label: "Phổ biến nhất" },
    { value: "rating", label: "Đánh giá cao nhất" },
  ]

  const handleSortChange = (e) => {
    onSortChange({ sortBy: e.target.value })
  }

  return (
    <div className="relative">
      <label htmlFor="sort" className="sr-only">
        Sắp xếp
      </label>
      <div className="relative">
        <select
          id="sort"
          value={currentSort}
          onChange={handleSortChange}
          className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export default ProductSort
