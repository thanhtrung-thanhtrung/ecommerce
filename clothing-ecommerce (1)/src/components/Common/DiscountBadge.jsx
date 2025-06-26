import React from "react";

const DiscountBadge = ({ originalPrice, salePrice, className = "" }) => {
    if (!salePrice || salePrice >= originalPrice) {
        return null;
    }

    const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    const savings = originalPrice - salePrice;

    return (
        <div className={`inline-flex items-center ${className}`}>
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                -{discountPercent}%
            </span>
            <span className="text-xs text-green-600 ml-2">
                Tiết kiệm {savings.toLocaleString()}đ
            </span>
        </div>
    );
};

export default DiscountBadge;