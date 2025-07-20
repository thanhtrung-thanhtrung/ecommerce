import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiLoader } from "react-icons/fi";
import vnpayAPI from "../services/vnpayAPI";
import { formatCurrency } from "../utils/helpers";

const VNPayReturnPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [paymentResult, setPaymentResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleVNPayReturn = async () => {
            try {
                setLoading(true);

                // Convert URLSearchParams to plain object
                const params = Object.fromEntries(searchParams.entries());

                // Validate basic VNPay parameters
                if (!params.vnp_TxnRef || !params.vnp_ResponseCode) {
                    throw new Error("Dữ liệu trả về từ VNPay không hợp lệ");
                }

                // Handle payment return using our vnpayAPI
                const result = await vnpayAPI.handlePaymentReturn(params);
                setPaymentResult(result);

                // Store result in localStorage for order confirmation
                if (result.success) {
                    localStorage.setItem('paymentResult', JSON.stringify({
                        success: true,
                        orderId: result.orderId || params.vnp_TxnRef,
                        amount: result.amount || parseInt(params.vnp_Amount) / 100,
                        transactionTime: new Date().toISOString(),
                        bankCode: params.vnp_BankCode,
                        transactionNo: params.vnp_TransactionNo
                    }));

                    // Auto redirect after 3 seconds for successful payment
                    setTimeout(() => {
                        navigate('/user/orders');
                    }, 3000);
                }

            } catch (error) {
                console.error("VNPay return error:", error);
                setError(error.message || "Có lỗi xảy ra khi xử lý kết quả thanh toán");
            } finally {
                setLoading(false);
            }
        };

        if (searchParams.toString()) {
            handleVNPayReturn();
        } else {
            setError("Không tìm thấy thông tin giao dịch");
            setLoading(false);
        }
    }, [searchParams, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <FiLoader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            Đang xử lý kết quả thanh toán...
                        </h1>
                        <p className="text-gray-600">
                            Vui lòng đợi trong giây lát
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <FiXCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            Lỗi xử lý thanh toán
                        </h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/cart')}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Quay lại giỏ hàng
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isSuccess = paymentResult?.success;
    const params = Object.fromEntries(searchParams.entries());

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full mx-4">
                <div className="text-center">
                    {/* Status Icon */}
                    {isSuccess ? (
                        <FiCheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    ) : (
                        <FiXCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    )}

                    {/* Title */}
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">
                        {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                        {paymentResult?.message || (isSuccess ? "Đơn hàng của bạn đã được xác nhận" : "Vui lòng thử lại sau")}
                    </p>

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-medium text-gray-800 mb-3">Chi tiết giao dịch</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-medium">#{paymentResult?.orderId || params.vnp_TxnRef}</span>
                            </div>
                            {params.vnp_TransactionNo && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã giao dịch:</span>
                                    <span className="font-medium">{params.vnp_TransactionNo}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số tiền:</span>
                                <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(paymentResult?.amount || parseInt(params.vnp_Amount) / 100)}
                                </span>
                            </div>
                            {params.vnp_BankCode && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngân hàng:</span>
                                    <span className="font-medium">{params.vnp_BankCode}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Thời gian:</span>
                                <span className="font-medium">
                                    {new Date().toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phương thức:</span>
                                <span className="font-medium">VNPay</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {isSuccess ? (
                            <>
                                <button
                                    onClick={() => navigate('/user/orders')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Xem đơn hàng của tôi
                                </button>
                                <button
                                    onClick={() => navigate('/products')}
                                    className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Tiếp tục mua sắm
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Thử thanh toán lại
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Về trang chủ
                                </button>
                            </>
                        )}
                    </div>

                    {/* Auto redirect notice for success */}
                    {isSuccess && (
                        <p className="text-xs text-gray-500 mt-4">
                            Bạn sẽ được chuyển hướng tự động sau 3 giây...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VNPayReturnPage;