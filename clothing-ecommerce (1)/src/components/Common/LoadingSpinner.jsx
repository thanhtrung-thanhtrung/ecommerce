import React from "react";
import { useShop } from "../../contexts/ShopContext";

const LoadingSpinner = ({
    size = "md",
    className = "",
    global = false,
    show = true
}) => {
    const { loading } = useShop();

    // Nếu là global loading, sử dụng state từ ShopContext
    const shouldShow = global ? loading : show;

    if (!shouldShow) return null;

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    };

    // Global loading overlay
    if (global) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}>
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    // Local loading spinner
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
};

export default LoadingSpinner;