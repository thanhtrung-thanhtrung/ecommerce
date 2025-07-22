import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { getAuthInfo } from '../utils/sessionUtils';

const VNPayReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processVNPayReturn = async () => {
            try {
                // ✅ THÊM: Kiểm tra nếu đang ở admin page thì redirect về customer
                if (window.location.port === '5713') {
                    console.warn("🚨 Detected admin port, redirecting to customer frontend...");
                    window.location.href = `http://localhost:5714/vnpay-return${window.location.search}`;
                    return;
                }

                // Convert URLSearchParams to plain object
                const params = {};
                for (const [key, value] of searchParams.entries()) {
                    params[key] = value;
                }

                console.log("🔄 VNPay Return Params:", params);

                // ✅ SỬA: Luôn sử dụng backend URL chính xác
                const backendUrl = 'http://localhost:5000'; // Hard-coded để tránh confusion
                const response = await fetch(`${backendUrl}/api/payments/vnpay/return?${searchParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();
                console.log("✅ VNPay Return Result:", data);
                setResult(data);

                // ✅ SỬA: Redirect logic an toàn với port đúng và thời gian chờ lâu hơn
                if (data.success) {
                    const { isAuthenticated } = getAuthInfo();
                    setTimeout(() => {
                        if (isAuthenticated) {
                            // Đảm bảo redirect đến customer orders, không phải admin
                            window.location.href = 'http://localhost:5714/user/orders';
                        } else {
                            // Guest user về customer homepage
                            window.location.href = 'http://localhost:5714/';
                        }
                    }, 10000); // ✅ SỬA: Tăng từ 5000ms (5 giây) lên 10000ms (10 giây)
                }
            } catch (error) {
                console.error("❌ VNPay Return Error:", error);
                setResult({
                    success: false,
                    message: "Lỗi khi xử lý kết quả thanh toán: " + error.message
                });
            } finally {
                setLoading(false);
            }
        };

        if (searchParams.size > 0) {
            processVNPayReturn();
        } else {
            setLoading(false);
            setResult({
                success: false,
                message: "Không có thông tin thanh toán"
            });
        }
    }, [searchParams, navigate]);

    // ✅ THÊM: Helper function để render redirect buttons an toàn với port đúng
    const renderActionButtons = () => {
        const { isAuthenticated } = getAuthInfo();

        if (result?.success) {
            return (
                <div className="space-y-3">
                    {isAuthenticated ? (
                        <a
                            href="http://localhost:5714/user/orders"
                            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                        >
                            Xem đơn hàng của tôi
                        </a>
                    ) : (
                        <a
                            href="http://localhost:5714/track-order"
                            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                        >
                            Tra cứu đơn hàng
                        </a>
                    )}
                    <a
                        href="http://localhost:5714/"
                        className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center"
                    >
                        Về trang chủ
                    </a>
                </div>
            );
        } else {
            return (
                <div className="space-y-3">
                    <a
                        href="http://localhost:5714/checkout"
                        className="block w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-center"
                    >
                        Thử lại thanh toán
                    </a>
                    <a
                        href="http://localhost:5714/"
                        className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center"
                    >
                        Về trang chủ
                    </a>
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">Đang xử lý kết quả thanh toán...</h2>
                    <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {result?.success ? (
                    <>
                        <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
                        <p className="text-gray-600 mb-6">{result.message}</p>

                        {result.order && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <h3 className="font-semibold text-gray-800 mb-2">Thông tin đơn hàng:</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                        <span className="font-medium">#{result.order.MaDonHang}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Số tiền:</span>
                                        <span className="font-medium">{new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(result.order.TongThanhToan)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Người nhận:</span>
                                        <span className="font-medium">{result.order.TenNguoiNhan}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderActionButtons()}

                        <p className="text-sm text-gray-500 mt-4">
                            Bạn sẽ được chuyển hướng tự động sau 10 giây...
                        </p>
                    </>
                ) : (
                    <>
                        <FiXCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại!</h1>
                        <p className="text-gray-600 mb-6">{result?.message || "Có lỗi xảy ra trong quá trình thanh toán"}</p>

                        {result?.order && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <h3 className="font-semibold text-gray-800 mb-2">Thông tin đơn hàng:</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                        <span className="font-medium">#{result.order.MaDonHang}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <span className="text-red-600 font-medium">Đã hủy</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderActionButtons()}
                    </>
                )}
            </div>
        </div>
    );
};

export default VNPayReturn;