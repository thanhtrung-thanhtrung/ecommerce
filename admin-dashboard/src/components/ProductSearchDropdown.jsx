import React from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';

const ProductSearchDropdown = ({
    searchTerm,
    onSearchChange,
    onProductSelect,
    productDetails,
    placeholder = "Nhập mã sản phẩm (VD: PUMA-RSX-GREEN-41)...",
    className = ""
}) => {
    // Filter product details based on search term - Search by MaSanPham and TenSanPham
    const getFilteredProductDetails = (searchTerm = '') => {
        if (!searchTerm || searchTerm.trim() === '') return [];
        if (!productDetails || productDetails.length === 0) return [];

        const trimmedSearch = searchTerm.trim().toLowerCase();

        return productDetails.filter(item => {
            // Tìm theo mã sản phẩm (ưu tiên)
            const matchMaSanPham = item.MaSanPham?.toLowerCase().includes(trimmedSearch);
            // Tìm theo tên sản phẩm
            const matchTenSanPham = item.TenSanPham?.toLowerCase().includes(trimmedSearch);
            // Tìm theo thương hiệu
            const matchThuongHieu = item.TenThuongHieu?.toLowerCase().includes(trimmedSearch);

            return matchMaSanPham || matchTenSanPham || matchThuongHieu;
        })
            .sort((a, b) => {
                // Ưu tiên kết quả khớp với mã sản phẩm
                const aMatchMa = a.MaSanPham?.toLowerCase().includes(trimmedSearch);
                const bMatchMa = b.MaSanPham?.toLowerCase().includes(trimmedSearch);

                if (aMatchMa && !bMatchMa) return -1;
                if (!aMatchMa && bMatchMa) return 1;

                return 0;
            })
            .slice(0, 50); // Limit to 50 results
    };

    const handleProductClick = (product) => {
        onProductSelect(product);
        onSearchChange(''); // Clear search
    };

    const filteredProducts = getFilteredProductDetails(searchTerm);

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm sản phẩm *
            </label>
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Dropdown Results */}
            {searchTerm && searchTerm.trim() && (
                <div
                    className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    style={{ zIndex: 9999 }}
                >
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className={`p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors select-none ${(product.TrangThai === 0 || product.TrangThai === false) ? 'bg-red-50 border-red-100' : ''
                                    }`}
                                style={{
                                    userSelect: 'none',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-gray-900">
                                        {product.TenSanPham}
                                    </div>
                                    {(product.TrangThai === 0 || product.TrangThai === false) && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                            ⚠️ Ngừng bán
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Mã: <span className="font-mono bg-gray-100 px-1 rounded">{product.MaSanPham}</span> |
                                    {product.TenThuongHieu} | {product.MauSac} - {product.KichCo}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    <span className="inline-flex items-center">
                                        <FiPackage className="w-3 h-3 mr-1" />
                                        Tồn kho: <span className="font-semibold ml-1">{product.TonKho === 2147483647 ? '∞' : product.TonKho}</span>
                                    </span>
                                    <span className="mx-2">|</span>
                                    <span className="text-blue-600 font-semibold">
                                        ID: {product.id}
                                    </span>
                                    <span className="mx-2">|</span>
                                    <span className="text-purple-600 font-semibold">
                                        {product.TenDanhMuc || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {product.MoTaNgan || product.MoTa}
                                </div>
                                {(product.TrangThai === 0 || product.TrangThai === false) && (
                                    <div className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Sản phẩm này hiện không được bán
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-gray-500 text-center">
                            <FiSearch className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                            <p>Không tìm thấy sản phẩm nào</p>
                            <p className="text-xs mt-1">Thử tìm với mã sản phẩm, tên sản phẩm hoặc thương hiệu</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchDropdown;