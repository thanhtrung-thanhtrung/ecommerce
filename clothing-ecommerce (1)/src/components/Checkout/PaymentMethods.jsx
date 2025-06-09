"use client";

import { CreditCard, Smartphone, Banknote } from "lucide-react";

const PaymentMethods = ({ selectedMethod, onMethodChange }) => {
  const paymentMethods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      icon: <Banknote className="h-5 w-5" />,
      fee: 0,
    },
    {
      id: "vnpay",
      name: "VNPay",
      description: "Thanh toán qua VNPay (ATM, Visa, MasterCard)",
      icon: <CreditCard className="h-5 w-5" />,
      fee: 0,
    },
    {
      id: "momo",
      name: "Ví MoMo",
      description: "Thanh toán qua ví điện tử MoMo",
      icon: <Smartphone className="h-5 w-5" />,
      fee: 0,
    },
  ];

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selectedMethod === method.id
              ? "border-primary-600 bg-primary-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => onMethodChange(method.id)}
        >
          <div className="flex items-start">
            <input
              type="radio"
              id={method.id}
              name="paymentMethod"
              checked={selectedMethod === method.id}
              onChange={() => onMethodChange(method.id)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                {method.icon}
                <label
                  htmlFor={method.id}
                  className="ml-2 font-medium text-gray-800 cursor-pointer"
                >
                  {method.name}
                </label>
                {method.fee > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    (+{method.fee.toLocaleString()}đ)
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentMethods;
