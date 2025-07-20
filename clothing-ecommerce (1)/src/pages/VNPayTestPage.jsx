import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import vnpayAPI from '../services/vnpayAPI';
import { formatCurrency } from '../utils/helpers';

const VNPayTestPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(100000);
    const [orderInfo, setOrderInfo] = useState('Test thanh toán VNPay');

    const handlePayment = async () => {
        if (amount < 5000) {
            alert('Số tiền thanh toán tối thiểu là 5,000 VND');
            return;
        }

        setLoading(true);
        try {
            const response = await vnpayAPI.createDemoPayment(amount, orderInfo);

            if (response.success && response.data?.paymentUrl) {
                // Chuyển hướng đến VNPay
                window.location.href = response.data.paymentUrl;
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo thanh toán');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.message || 'Có lỗi xảy ra khi kết nối tới server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Test VNPay Payment
                    </h1>
                    <p className="text-gray-600">
                        Thử nghiệm tính năng thanh toán VNPay
                    </p>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số tiền thanh toán (VND) *
                            </label>
                            <input
                                type="number"
                                min="5000"
                                step="1000"
                                value={amount}
                                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập số tiền..."
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Số tiền: <span className="font-medium">{formatCurrency(amount)}</span>
                            </p>
                            {amount < 5000 && (
                                <p className="text-sm text-red-500 mt-1">
                                    Số tiền tối thiểu là 5,000 VND
                                </p>
                            )}
                        </div>

                        {/* Order Info Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thông tin đơn hàng
                            </label>
                            <input
                                type="text"
                                value={orderInfo}
                                onChange={(e) => setOrderInfo(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập thông tin đơn hàng..."
                            />
                        </div>

                        {/* Payment Button */}
                        <button
                            onClick={handlePayment}
                            disabled={loading || amount < 5000}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${loading || amount < 5000
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Đang xử lý...
                                </div>
                            ) : (
                                'Thanh toán với VNPay'
                            )}
                        </button>

                        {/* Test Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-3">
                                Thông tin test VNPay Sandbox:
                            </h3>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p><strong>Số thẻ:</strong> 9704198526191432198</p>
                                <p><strong>Tên chủ thẻ:</strong> NGUYEN VAN A</p>
                                <p><strong>Ngày phát hành:</strong> 07/15</p>
                                <p><strong>Mật khẩu OTP:</strong> 123456</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Về trang chủ
                            </button>
                            <button
                                onClick={() => navigate('/products')}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Xem sản phẩm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Đây là môi trường test VNPay Sandbox</p>
                    <p>Không có giao dịch thật nào được thực hiện</p>
                </div>
            </div>
        </div>
    );
};

export default VNPayTestPage;