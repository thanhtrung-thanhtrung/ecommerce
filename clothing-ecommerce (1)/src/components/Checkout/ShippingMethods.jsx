
import { useEffect } from "react";
import { Truck, Zap } from "lucide-react";

const ShippingMethods = ({ selectedMethod, onMethodChange, onFeeChange }) => {
  const shippingMethods = [
    {
      id: "standard",
      name: "Giao hàng tiêu chuẩn",
      description: "Giao hàng trong 3-5 ngày làm việc",
      icon: <Truck className="h-5 w-5" />,
      fee: 0,
      estimatedDays: "3-5 ngày",
    },
    {
      id: "express",
      name: "Giao hàng nhanh",
      description: "Giao hàng trong 1-2 ngày làm việc",
      icon: <Zap className="h-5 w-5" />,
      fee: 30000,
      estimatedDays: "1-2 ngày",
    },
  ];

  useEffect(() => {
    const selectedShipping = shippingMethods.find(
      (method) => method.id === selectedMethod
    );
    if (selectedShipping) {
      onFeeChange(selectedShipping.fee);
    }
  }, [selectedMethod, onFeeChange]);

  return (
    <div className="space-y-3">
      {shippingMethods.map((method) => (
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
              name="shippingMethod"
              checked={selectedMethod === method.id}
              onChange={() => onMethodChange(method.id)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {method.icon}
                  <label
                    htmlFor={method.id}
                    className="ml-2 font-medium text-gray-800 cursor-pointer"
                  >
                    {method.name}
                  </label>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">
                    {method.fee > 0
                      ? `${method.fee.toLocaleString()}đ`
                      : "Miễn phí"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {method.estimatedDays}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShippingMethods;
