import React from "react";

const StockIndicator = ({ stock, className = "" }) => {
    if (stock === 0) {
        return (
            <span className={`inline-flex items-center text-sm text-red-600 ${className}`}>
                <span className="w-2 h-2 bg-red-600 rounded-full mr-1"></span>
                Hết hàng
            </span>
        );
    }

    if (stock <= 10) {
        return (
            <span className={`inline-flex items-center text-sm text-orange-600 ${className}`}>
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-1"></span>
                Sắp hết ({stock} sản phẩm)
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center text-sm text-green-600 ${className}`}>
            <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
            Còn hàng
        </span>
    );
};

export default StockIndicator;