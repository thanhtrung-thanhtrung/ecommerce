"use client";

const OrderFilters = ({ orderStatuses = {}, selectedStatus, onStatusChange }) => {
  const statusOptions = [
    { value: "", label: "Tất cả đơn hàng" },
    ...Object.entries(orderStatuses || {}).map(([key, value]) => ({
      value: key,
      label: value,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onStatusChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === option.value
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default OrderFilters;
