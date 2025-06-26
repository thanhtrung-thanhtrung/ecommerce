import React, { useState } from "react";
import { Tag, X } from "lucide-react";

const VoucherInput = ({ onApplyVoucher, onRemoveVoucher, appliedVoucher, loading }) => {
    const [voucherCode, setVoucherCode] = useState("");
    const [applying, setApplying] = useState(false);

    const handleApplyVoucher = async (e) => {
        e.preventDefault();

        if (!voucherCode.trim() || applying) return;

        setApplying(true);
        try {
            const result = await onApplyVoucher(voucherCode.trim());
            if (result?.success) {
                setVoucherCode("");
            }
        } catch (error) {
            console.error("Error applying voucher:", error);
        } finally {
            setApplying(false);
        }
    };

    const handleRemoveVoucher = () => {
        onRemoveVoucher();
        setVoucherCode("");
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-green-600" />
                Mã giảm giá
            </h3>

            {appliedVoucher ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-2">
                                <Tag className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-800">
                                    {appliedVoucher.Ma}
                                </span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                                {appliedVoucher.Ten}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                Giảm {appliedVoucher.PhanTramGiam}%
                                {appliedVoucher.GiaTriGiamToiDa && (
                                    <span> (tối đa {appliedVoucher.GiaTriGiamToiDa.toLocaleString()}đ)</span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={handleRemoveVoucher}
                            className="text-green-600 hover:text-green-800 transition-colors p-1"
                            title="Xóa voucher"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleApplyVoucher} className="space-y-4">
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            placeholder="Nhập mã giảm giá..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={applying || loading || !!appliedVoucher}
                        />
                        <button
                            type="submit"
                            disabled={!voucherCode.trim() || applying || loading || !!appliedVoucher}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {applying ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Đang áp dụng...</span>
                                </div>
                            ) : (
                                "Áp dụng"
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        Nhập mã giảm giá để được giảm giá cho đơn hàng
                    </p>
                </form>
            )}
        </div>
    );
};

export default VoucherInput;