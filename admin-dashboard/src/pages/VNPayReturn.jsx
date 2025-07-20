import React, { useEffect } from 'react';

const VNPayReturn = () => {
    useEffect(() => {
        // ✅ SỬA: Kiểm tra tất cả các trường hợp với port đúng
        const currentParams = window.location.search;
        const currentPath = window.location.pathname;
        const currentPort = window.location.port;

        // Nếu đang ở admin port (5713) hoặc có bất kỳ VNPay params nào
        if (currentPort === '5713' || currentParams.includes('vnp_') ||
            currentPath.includes('vnpay') || currentPath.includes('api/test')) {

            const customerUrl = `http://localhost:5714/vnpay-return${currentParams}`;

            console.warn("🚨 Admin detected VNPay return - Redirecting to customer:", {
                currentUrl: window.location.href,
                redirectTo: customerUrl,
                port: currentPort,
                path: currentPath,
                params: currentParams
            });

            // Multiple redirect methods to ensure it works
            try {
                // Method 1: Direct location change
                window.location.replace(customerUrl);

                // Method 2: Backup after 100ms
                setTimeout(() => {
                    window.location.href = customerUrl;
                }, 100);

                // Method 3: Backup after 500ms  
                setTimeout(() => {
                    window.open(customerUrl, '_self');
                }, 500);

            } catch (error) {
                console.error("Redirect error:", error);
                // Method 4: Manual navigation as last resort
                alert(`Vui lòng truy cập: ${customerUrl}`);
            }
        }

        return () => {
            // Cleanup: ensure redirect even on component unmount
            if (window.location.port === '5713') {
                window.location.href = `http://localhost:5714/vnpay-return${window.location.search}`;
            }
        };
    }, []);

    // Show loading immediately while redirect happens
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Đang chuyển hướng đến trang khách hàng...</h2>
                <p className="text-gray-600 mt-2">Nếu không tự động chuyển, vui lòng truy cập:
                    <br />
                    <a href={`http://localhost:5714/vnpay-return${window.location.search}`}
                        className="text-blue-600 underline">
                        http://localhost:5714/vnpay-return
                    </a>
                </p>
            </div>
        </div>
    );
};

export default VNPayReturn;