import React, { useState } from "react";
import { CreditCard, Smartphone, Banknote, Building2 } from "lucide-react";

const PaymentMethods = ({
  paymentMethods = [],
  selectedMethod,
  onMethodChange,
  loading = false,
}) => {
  const [expandedMethod, setExpandedMethod] = useState(null);

  // Default payment methods nếu backend không trả về
  const defaultMethods = [
    {
      id: 1,
      Ten: "Thanh toán khi nhận hàng (COD)",
      MoTa: "Thanh toán bằng tiền mặt khi nhận hàng",
      icon: <Banknote className="h-5 w-5" />,
      fee: 0,
      type: "cod",
    },
    {
      id: 2,
      Ten: "VNPay",
      MoTa: "Thanh toán qua VNPay (ATM, Visa, MasterCard)",
      icon: <CreditCard className="h-5 w-5" />,
      fee: 0,
      type: "vnpay",
    },
  ];

  // Map backend data với icons
  const getPaymentIcon = (methodName) => {
    const name = methodName?.toLowerCase() || "";
    if (name.includes("vnpay") || name.includes("vnp")) {
      return <CreditCard className="h-5 w-5 text-blue-600" />;
    }
    if (name.includes("momo")) {
      return <Smartphone className="h-5 w-5 text-pink-600" />;
    }
    if (
      name.includes("cod") ||
      name.includes("tiền mặt") ||
      name.includes("nhận hàng")
    ) {
      return <Banknote className="h-5 w-5 text-green-600" />;
    }
    if (
      name.includes("bank") ||
      name.includes("ngân hàng") ||
      name.includes("chuyển khoản")
    ) {
      return <Building2 className="h-5 w-5 text-purple-600" />;
    }
    return <CreditCard className="h-5 w-5 text-gray-600" />;
  };

  const getPaymentType = (methodName) => {
    const name = methodName?.toLowerCase() || "";
    if (name.includes("vnpay") || name.includes("vnp")) return "vnpay";
    if (name.includes("momo")) return "momo";
    if (
      name.includes("cod") ||
      name.includes("tiền mặt") ||
      name.includes("nhận hàng")
    )
      return "cod";
    if (
      name.includes("bank") ||
      name.includes("ngân hàng") ||
      name.includes("chuyển khoản")
    )
      return "bank";
    return "other";
  };

  // Sử dụng data từ backend hoặc fallback to default
  const methods =
    Array.isArray(paymentMethods) && paymentMethods.length > 0
      ? paymentMethods.map((method) => ({
        ...method,
        icon: getPaymentIcon(method.Ten),
        type: getPaymentType(method.Ten),
        fee: 0, // Phí thanh toán thường là 0
      }))
      : defaultMethods;

  const getPaymentDescription = (method) => {
    const name = method.Ten?.toLowerCase() || '';

    if (name.includes('vnpay')) {
      return {
        description: "Thanh toán qua VNPay - Hỗ trợ thẻ ATM, Internet Banking, Visa/MasterCard",
        features: [
          "Bảo mật cao với công nghệ mã hóa",
          "Hỗ trợ nhiều ngân hàng",
          "Giao dịch nhanh chóng",
          "Có thể thanh toán bằng QR Code"
        ]
      };
    }

    if (name.includes('momo')) {
      return {
        description: "Thanh toán qua ví điện tử MoMo",
        features: [
          "Thanh toán bằng QR Code",
          "Liên kết với tài khoản ngân hàng",
          "Tích lũy điểm thưởng",
          "Giao dịch an toàn"
        ]
      };
    }

    if (name.includes('tiền mặt') || name.includes('cod')) {
      return {
        description: "Thanh toán khi nhận hàng (COD)",
        features: [
          "Kiểm tra hàng trước khi thanh toán",
          "Không cần thẻ ngân hàng",
          "Phù hợp mọi đối tượng",
          "An toàn, tin cậy"
        ]
      };
    }

    return {
      description: method.MoTa || "Phương thức thanh toán",
      features: []
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
                </div>
                <div className="w-12 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center border border-gray-200 rounded-lg">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">Không có phương thức thanh toán</p>
        <p className="text-gray-500">Vui lòng liên hệ với chúng tôi để được hỗ trợ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {methods.map((method) => {
        const isSelected = selectedMethod === method.id;
        const isExpanded = expandedMethod === method.id;
        const paymentInfo = getPaymentDescription(method);

        return (
          <div
            key={method.id}
            className={`border rounded-lg transition-all duration-200 ${isSelected
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => onMethodChange(method.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`payment-${method.id}`}
                  name="paymentMethod"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={isSelected}
                  onChange={() => onMethodChange(method.id)}
                />

                <div className="ml-3 flex-1">
                  <label
                    htmlFor={`payment-${method.id}`}
                    className="block cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {getPaymentIcon(method.Ten)}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {method.Ten}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {paymentInfo.description}
                          </p>
                        </div>
                      </div>

                      {paymentInfo.features.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMethod(isExpanded ? null : method.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                              }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Expanded features */}
            {isExpanded && paymentInfo.features.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Tính năng nổi bật:
                </h4>
                <ul className="space-y-1">
                  {paymentInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* VNPay special notice */}
            {isSelected && method.Ten?.toLowerCase().includes('vnpay') && (
              <div className="border-t border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Lưu ý khi thanh toán VNPay:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>Bạn sẽ được chuyển đến trang thanh toán VNPay</li>
                      <li>Vui lòng không tắt trình duyệt trong quá trình thanh toán</li>
                      <li>Đơn hàng sẽ được xác nhận sau khi thanh toán thành công</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentMethods;
