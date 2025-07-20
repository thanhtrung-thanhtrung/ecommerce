import React from 'react';

const VNPayIcon = ({ className = "w-6 h-6" }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 100 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="100" height="40" rx="4" fill="#1E40AF" />
            <text
                x="50"
                y="25"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
            >
                VNPay
            </text>
        </svg>
    );
};

export default VNPayIcon;