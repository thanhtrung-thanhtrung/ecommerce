import React, { useState } from 'react';

const VNPayTest = () => {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(50000);
    const [orderInfo, setOrderInfo] = useState('Đơn hàng test VNPay');

    const showMessage = (message, type = 'info') => {
        if (type === 'error') {
            alert('❌ ' + message);
        } else {
            alert('✅ ' + message);
        }
    };

    const handlePayment = async () => {
        if (amount < 5000) {
            showMessage('Số tiền thanh toán tối thiểu là 5,000 VND', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/test/vnpay/demo-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseInt(amount),
                    orderInfo: orderInfo
                })
            });

            const data = await response.json();

            if (data.success && data.data?.paymentUrl) {
                // Chuyển hướng đến VNPay
                window.location.href = data.data.paymentUrl;
            } else {
                showMessage(data.message || 'Có lỗi xảy ra khi tạo thanh toán', 'error');
            }
        } catch (error) {
            console.error('Payment error:', error);
            showMessage('Có lỗi xảy ra khi kết nối tới server', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Test VNPay Payment
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền thanh toán (VND)
                    </label>
                    <input
                        type="number"
                        min="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số tiền..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Số tiền: {formatCurrency(amount)}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thông tin đơn hàng
                    </label>
                    <input
                        type="text"
                        value={orderInfo}
                        onChange={(e) => setOrderInfo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập thông tin đơn hàng..."
                    />
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading || amount < 5000}
                    className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${loading || amount < 5000
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

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <h3 className="font-semibold mb-2">Thông tin test VNPay Sandbox:</h3>
                    <ul className="space-y-1">
                        <li>• Số thẻ: 9704198526191432198</li>
                        <li>• Tên chủ thẻ: NGUYEN VAN A</li>
                        <li>• Ngày phát hành: 07/15</li>
                        <li>• Mật khẩu OTP: 123456</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VNPayTest;