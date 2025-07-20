import React, { useState } from 'react';
import { toast } from 'react-toastify';
import vnpayService from '../../services/vnpayService';
import { formatCurrency } from '../../utils/helpers';

const VNPayTest = () => {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleTestVNPay = async () => {
        try {
            setTesting(true);
            setTestResult(null);

            const result = await vnpayService.testVNPayConfig();
            setTestResult(result);

            if (result.success) {
                toast.success('VNPay test thành công!');
            } else {
                toast.error('VNPay test thất bại!');
            }
        } catch (error) {
            console.error('VNPay test error:', error);
            toast.error(error.message || 'Lỗi khi test VNPay');
            setTestResult({
                success: false,
                message: error.message || 'Lỗi khi test VNPay'
            });
        } finally {
            setTesting(false);
        }
    };

    const createTestPayment = () => {
        if (testResult?.success && testResult?.testResult?.paymentUrl) {
            window.open(testResult.testResult.paymentUrl, '_blank');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">VNPay Integration Test</h2>

            <div className="space-y-6">
                {/* Test Button */}
                <div className="text-center">
                    <button
                        onClick={handleTestVNPay}
                        disabled={testing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {testing ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang test VNPay...
                            </div>
                        ) : (
                            'Test VNPay Configuration'
                        )}
                    </button>
                </div>

                {/* Test Results */}
                {testResult && (
                    <div className={`p-4 rounded-lg border ${testResult.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center mb-3">
                            {testResult.success ? (
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                            <h3 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {testResult.success ? 'Test thành công!' : 'Test thất bại!'}
                            </h3>
                        </div>

                        <p className={`text-sm mb-4 ${testResult.success ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {testResult.message}
                        </p>

                        {/* Configuration Details */}
                        {testResult.config && (
                            <div className="bg-white rounded-md p-3 mb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Cấu hình VNPay:</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Terminal Code:</span>
                                        <span className="font-mono">{testResult.config.vnp_TmnCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">VNPay URL:</span>
                                        <span className="font-mono text-xs">{testResult.config.vnp_Url}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Return URL:</span>
                                        <span className="font-mono text-xs">{testResult.config.vnp_ReturnUrl}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IPN URL:</span>
                                        <span className="font-mono text-xs">{testResult.config.vnp_IpnUrl}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Test Payment Details */}
                        {testResult.testResult && (
                            <div className="bg-white rounded-md p-3 mb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Chi tiết đơn hàng test:</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                        <span className="font-mono">{testResult.testResult.orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Số tiền:</span>
                                        <span className="font-medium text-blue-600">
                                            {formatCurrency(testResult.testResult.amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Test Payment Button */}
                        {testResult.success && testResult.testResult?.paymentUrl && (
                            <div className="text-center">
                                <button
                                    onClick={createTestPayment}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                >
                                    Thử thanh toán test với VNPay
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Sẽ mở tab mới để test thanh toán VNPay
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Test Card Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Thông tin thẻ test VNPay:</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Ngân hàng:</span>
                            <span className="font-mono">NCB</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số thẻ:</span>
                            <span className="font-mono">9704198526191432198</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tên chủ thẻ:</span>
                            <span className="font-mono">NGUYEN VAN A</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Ngày phát hành:</span>
                            <span className="font-mono">07/15</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mật khẩu OTP:</span>
                            <span className="font-mono">123456</span>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Hướng dẫn test:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                        <li>Nhấn "Test VNPay Configuration" để kiểm tra cấu hình</li>
                        <li>Nếu thành công, nhấn "Thử thanh toán test với VNPay"</li>
                        <li>Sử dụng thông tin thẻ test ở trên để thanh toán</li>
                        <li>Kiểm tra kết quả trả về từ VNPay</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default VNPayTest;