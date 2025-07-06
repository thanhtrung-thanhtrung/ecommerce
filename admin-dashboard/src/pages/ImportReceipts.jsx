import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import {
    FiPackage,
    FiRefreshCw,
    FiEye,
    FiCheck,
    FiX,
    FiDollarSign,
    FiTruck,
    FiUser,
    FiBox,
    FiLayers,
    FiPlus,
    FiSearch,
    FiMinus,
    FiSave,
    FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const ImportReceipts = () => {
    const {
        getImportReceipts,
        getImportReceiptDetail,
        updateImportReceipt,
        getSuppliers,
        getInventoryStats,
        searchProductsInventory,
        getInventoryProductVariants,
        createImportReceipt,
        generateVariantCode,
        loading
    } = useAdmin();

    const [importReceipts, setImportReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [productDetails, setProductDetails] = useState([]);
    const [receiptDetails, setReceiptDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [filterStatus, setFilterStatus] = useState('all');

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const [createForm, setCreateForm] = useState({
        id_NhaCungCap: '',
        GhiChu: '',
        chiTietPhieuNhap: []
    });

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        let filtered = importReceipts;

        if (filterStatus !== 'all') {
            filtered = filtered.filter(item => item.TrangThai.toString() === filterStatus);
        }

        setFilteredReceipts(filtered);
    }, [importReceipts, filterStatus]);

    const loadAllData = async () => {
        try {
            await Promise.all([
                loadImportReceipts(),
                loadSuppliers(),
                loadProductDetails()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Có lỗi khi tải dữ liệu');
        }
    };

    const loadImportReceipts = async () => {
        try {
            const response = await getImportReceipts({ page: 1, limit: 100 });
            if (response.success) {
                setImportReceipts(response.data || []);
            } else {
                toast.error('Không thể tải danh sách phiếu nhập');
            }
        } catch (error) {
            console.error('Error loading import receipts:', error);
            toast.error('Có lỗi khi tải danh sách phiếu nhập');
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await getSuppliers();
            if (response.success) {
                setSuppliers(response.data || []);
            } else {
                toast.error('Không thể tải danh sách nhà cung cấp');
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    };

    const loadProductDetails = async () => {
        try {
            const response = await getInventoryStats();
            if (response.success) {
                setProductDetails(response.data || []);
            } else {
                console.error('Failed to load product details');
            }
        } catch (error) {
            console.error('Error loading product details:', error);
        }
    };

    const loadReceiptDetails = async (receiptId) => {
        setLoadingDetails(true);
        try {
            const response = await getImportReceiptDetail(receiptId);
            if (response.success) {
                setReceiptDetails(response.data);
            } else {
                toast.error('Không thể tải chi tiết phiếu nhập');
            }
        } catch (error) {
            console.error('Error loading receipt details:', error);
            toast.error('Có lỗi khi tải chi tiết phiếu nhập');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleApproveReceipt = async (receiptId) => {
        if (!window.confirm('Bạn có chắc chắn muốn duyệt phiếu nhập này?')) {
            return;
        }

        try {
            const response = await updateImportReceipt(receiptId, { TrangThai: 2 });
            if (response.success) {
                toast.success('Duyệt phiếu nhập thành công!');
                await loadImportReceipts();
            } else {
                toast.error(response.message || 'Có lỗi khi duyệt phiếu nhập');
            }
        } catch (error) {
            console.error('Error approving receipt:', error);
            toast.error('Có lỗi khi duyệt phiếu nhập');
        }
    };

    const handleCancelReceipt = async (receiptId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu nhập này?')) {
            return;
        }

        try {
            const response = await updateImportReceipt(receiptId, { TrangThai: 3 });
            if (response.success) {
                toast.success('Hủy phiếu nhập thành công!');
                await loadImportReceipts();
            } else {
                toast.error(response.message || 'Có lỗi khi hủy phiếu nhập');
            }
        } catch (error) {
            console.error('Error canceling receipt:', error);
            toast.error('Có lỗi khi hủy phiếu nhập');
        }
    };

    const handleProductSearch = async () => {
        if (!productSearchTerm.trim()) {
            setSearchResults([]);
            toast.info('Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        setSearchLoading(true);
        try {
            const response = await searchProductsInventory({
                keyword: productSearchTerm,
                page: 1,
                limit: 10
            });

            if (response.success) {
                const products = response.data || [];
                setSearchResults(products);

                if (products.length === 0) {
                    toast.info(`Không tìm thấy sản phẩm nào với từ khóa "${productSearchTerm}"`);
                }
            } else {
                setSearchResults([]);
                toast.error('Không thể tìm kiếm sản phẩm');
            }
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
            toast.error('Có lỗi khi tìm kiếm sản phẩm');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleProductSearch();
        }
    };

    const handleAddProduct = async (product) => {
        try {
            const variantsResponse = await getInventoryProductVariants(product.id);

            if (variantsResponse.success) {
                const productData = variantsResponse.data;

                const existingVariantsForImport = productData.existingVariants.map(variant => ({
                    id_KichCo: variant.id_KichCo,
                    id_MauSac: variant.id_MauSac,
                    SoLuong: 0,
                    MaSanPham: variant.MaSanPham,
                    TenKichCo: variant.TenKichCo,
                    TenMauSac: variant.TenMauSac,
                    MaMau: variant.MaMau,
                    TonKho: variant.TonKho,
                    isExisting: true
                }));

                const productWithVariants = {
                    ...product,
                    ...productData,
                    variants: existingVariantsForImport,
                    GiaNhap: 0
                };

                setSelectedProducts(prev => [...prev, productWithVariants]);
                setProductSearchTerm('');
                setSearchResults([]);

                toast.success(`Đã thêm sản phẩm "${product.TenSanPham}" với ${existingVariantsForImport.length} biến thể hiện có`);
            } else {
                toast.error('Không thể tải thông tin biến thể sản phẩm');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('Có lỗi khi thêm sản phẩm');
        }
    };

    const handleRemoveProduct = (productIndex) => {
        setSelectedProducts(prev => prev.filter((_, index) => index !== productIndex));
    };

    const handleAddVariant = async (productIndex, colorId, sizeId) => {
        try {
            const product = selectedProducts[productIndex];

            const codeResponse = await generateVariantCode(product.id, colorId, sizeId);

            if (codeResponse.success) {
                const newVariant = {
                    id_KichCo: sizeId,
                    id_MauSac: colorId,
                    SoLuong: 1,
                    MaSanPham: codeResponse.data.code,
                    TenKichCo: product.allSizes.find(s => s.id === sizeId)?.Ten || '',
                    TenMauSac: product.allColors.find(c => c.id === colorId)?.Ten || '',
                    MaMau: product.allColors.find(c => c.id === colorId)?.MaMau || '#000000'
                };

                setSelectedProducts(prev => {
                    const updated = [...prev];
                    updated[productIndex] = {
                        ...updated[productIndex],
                        variants: [...updated[productIndex].variants, newVariant]
                    };
                    return updated;
                });
            } else {
                toast.error('Không thể tạo mã biến thể');
            }
        } catch (error) {
            console.error('Error adding variant:', error);
            toast.error('Có lỗi khi thêm biến thể');
        }
    };

    const handleRemoveVariant = (productIndex, variantIndex) => {
        setSelectedProducts(prev => {
            const updated = [...prev];
            updated[productIndex] = {
                ...updated[productIndex],
                variants: updated[productIndex].variants.filter((_, index) => index !== variantIndex)
            };
            return updated;
        });
    };

    const handleUpdateVariantQuantity = (productIndex, variantIndex, quantity) => {
        setSelectedProducts(prev => {
            const updated = [...prev];
            updated[productIndex] = {
                ...updated[productIndex],
                variants: updated[productIndex].variants.map((variant, index) =>
                    index === variantIndex ? { ...variant, SoLuong: Math.max(0, parseInt(quantity) || 0) } : variant
                )
            };
            return updated;
        });
    };

    const handleUpdateProductPrice = (productIndex, price) => {
        setSelectedProducts(prev => {
            const updated = [...prev];
            updated[productIndex] = {
                ...updated[productIndex],
                GiaNhap: Math.max(0, parseFloat(price) || 0)
            };
            return updated;
        });
    };

    const handleCreateImportReceipt = async () => {
        if (!createForm.id_NhaCungCap) {
            toast.error('Vui lòng chọn nhà cung cấp');
            return;
        }

        if (selectedProducts.length === 0) {
            toast.error('Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        const validProducts = selectedProducts.filter(product => {
            const hasPrice = product.GiaNhap > 0;
            const hasVariantsWithQuantity = product.variants.some(variant => variant.SoLuong > 0);
            return hasPrice && hasVariantsWithQuantity;
        });

        if (validProducts.length === 0) {
            toast.error('Vui lòng nhập giá và số lượng cho ít nhất một sản phẩm');
            return;
        }

        // Validation: Kiểm tra ngày nhập không được trong quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt về đầu ngày

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Phiếu nhập chỉ được tạo cho ngày hiện tại hoặc tương lai
        // (trong thực tế có thể cho phép tạo cho hôm nay)

        try {
            const receiptData = {
                id_NhaCungCap: parseInt(createForm.id_NhaCungCap),
                userId: 1,
                GhiChu: createForm.GhiChu?.trim() || '',
                chiTietPhieuNhap: validProducts.map(product => ({
                    id_SanPham: product.id,
                    GiaNhap: parseFloat(product.GiaNhap),
                    variants: product.variants
                        .filter(variant => variant.SoLuong > 0)
                        .map(variant => ({
                            id_KichCo: variant.id_KichCo,
                            id_MauSac: variant.id_MauSac,
                            SoLuong: parseInt(variant.SoLuong),
                            MaSanPham: variant.MaSanPham
                        }))
                }))
            };

            const response = await createImportReceipt(receiptData);

            if (response.success) {
                const totalVariants = receiptData.chiTietPhieuNhap.reduce((sum, p) => sum + p.variants.length, 0);
                toast.success(
                    `✅ Tạo phiếu nhập thành công!\n` +
                    `📄 Mã phiếu: ${response.data.MaPhieuNhap}\n` +
                    `📦 ${totalVariants} biến thể sản phẩm`,
                    {
                        position: 'top-center',
                        autoClose: 5000
                    }
                );
                setShowCreateModal(false);
                resetCreateForm();
                await loadImportReceipts();
            } else {
                toast.error(`❌ ${response.message || 'Có lỗi khi tạo phiếu nhập'}`);
            }
        } catch (error) {
            console.error('❌ Error creating import receipt:', error);
            const errorMessage = error.message?.includes('database')
                ? 'Lỗi hệ thống. Vui lòng thử lại sau.'
                : error.message || 'Có lỗi khi tạo phiếu nhập';
            toast.error(`❌ ${errorMessage}`);
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            id_NhaCungCap: '',
            GhiChu: '',
            chiTietPhieuNhap: []
        });
        setSelectedProducts([]);
        setProductSearchTerm('');
        setSearchResults([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 1: return 'bg-yellow-100 text-yellow-800';
            case 2: return 'bg-green-100 text-green-800';
            case 3: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1: return 'Chờ duyệt';
            case 2: return 'Đã nhập';
            case 3: return 'Đã hủy';
            default: return 'N/A';
        }
    };

    return (
        <div className="p-2">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Phiếu nhập kho</h1>
                    <p className="text-sm text-gray-600">{filteredReceipts.length} phiếu</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={loadAllData}
                        disabled={loading}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-green-700 text-sm"
                    >
                        <FiPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tạo mới</span>
                    </button>
                </div>
            </div>

            {/* Compact Filter */}
            <div className="bg-white rounded-lg shadow p-3 mb-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="1">Chờ duyệt</option>
                    <option value="2">Đã nhập kho</option>
                    <option value="3">Đã hủy</option>
                </select>
            </div>

            {/* Compact Import Receipts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã phiếu</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="flex justify-center items-center">
                                            <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
                                            <span className="text-sm text-gray-600">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReceipts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <FiPackage className="w-12 h-12 text-gray-400" />
                                            <span className="text-sm">Không có phiếu nhập nào</span>
                                            {filterStatus !== 'all' && (
                                                <span className="text-xs text-gray-400">Thử thay đổi bộ lọc</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReceipts.map((receipt, index) => (
                                    <tr key={receipt.id} className="hover:bg-gray-50">
                                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs font-medium text-blue-600">{receipt.MaPhieuNhap}</div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs text-gray-900">
                                                {new Date(receipt.NgayNhap).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-900">
                                                {parseInt(receipt.TongTien || 0).toLocaleString('vi-VN')}₫
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.TrangThai)}`}>
                                                {getStatusText(receipt.TrangThai)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedReceipt(receipt);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                </button>
                                                {receipt.TrangThai === 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveReceipt(receipt.id)}
                                                            className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded transition-colors"
                                                            title="Duyệt"
                                                        >
                                                            <FiCheck className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelReceipt(receipt.id)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                            title="Hủy"
                                                        >
                                                            <FiX className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compact Detail Modal */}
            {showDetailModal && selectedReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Chi tiết: {selectedReceipt.MaPhieuNhap}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setReceiptDetails(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            {loadingDetails ? (
                                <div className="text-center py-8">
                                    <FiRefreshCw className="mx-auto w-8 h-8 text-blue-500 animate-spin" />
                                    <p className="mt-2 text-sm text-gray-500">Đang tải chi tiết...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Basic Info */}
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                            <FiPackage className="w-4 h-4 mr-2" />
                                            Thông tin phiếu
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Ngày:</span>
                                                <p className="text-gray-900">
                                                    {new Date(selectedReceipt.NgayNhap).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Trạng thái:</span>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReceipt.TrangThai)} ml-2`}>
                                                    {getStatusText(selectedReceipt.TrangThai)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">NCC:</span>
                                                <p className="text-gray-900 flex items-center">
                                                    <FiTruck className="w-3 h-3 mr-1 text-gray-400" />
                                                    {selectedReceipt.TenNhaCungCap}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Tổng tiền:</span>
                                                <p className="text-green-600 font-bold">
                                                    {parseInt(selectedReceipt.TongTien || 0).toLocaleString('vi-VN')}₫
                                                </p>
                                            </div>
                                        </div>

                                        {selectedReceipt.GhiChu && (
                                            <div className="mt-3">
                                                <span className="text-gray-600 text-sm">Ghi chú:</span>
                                                <p className="text-sm text-gray-700 bg-white p-2 rounded border mt-1">
                                                    {selectedReceipt.GhiChu}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Products Table */}
                                    {receiptDetails ? (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                                <FiLayers className="w-4 h-4 mr-2" />
                                                Chi tiết sản phẩm ({receiptDetails.chiTiet?.length || 0})
                                            </h4>

                                            {receiptDetails.chiTiet && receiptDetails.chiTiet.length > 0 ? (
                                                <div className="overflow-x-auto border rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">stt</th>

                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>

                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã - Biến thể</th>
                                                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">SL</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Giá nhập</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {receiptDetails.chiTiet.map((item, index) => (
                                                                <tr key={index} className="hover:bg-gray-50 ">
                                                                    <td className="  px-3 py-2 whitespace-nowrap text-left">
                                                                        <div className="text-xs text-gray-500">
                                                                            {index + 1}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <div className="flex items-start">
                                                                            <FiBox className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                                                            <div>
                                                                                <div className="text-xs font-medium text-gray-900">
                                                                                    {item.TenSanPham || 'N/A'}
                                                                                </div>

                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                                        <div className="text-xs text-gray-900 font-mono">
                                                                            {item.MaSanPham || '-'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {item.MauSac} - {item.KichCo}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2 whitespace-nowrap text-center">
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {parseInt(item.SoLuong || 0).toLocaleString('vi-VN')}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                                                        <div className="text-xs text-gray-900">
                                                                            {parseFloat(item.GiaNhap || 0).toLocaleString('vi-VN')}₫
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                                                        <div className="text-xs font-semibold text-gray-900">
                                                                            {(parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)).toLocaleString('vi-VN')}₫
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50">
                                                            <tr>
                                                                <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                                                                    Tổng cộng:
                                                                </td>
                                                                <td className="px-3 py-2 text-right text-sm font-bold text-green-600">
                                                                    {receiptDetails.chiTiet
                                                                        .reduce((sum, item) => sum + (parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)), 0)
                                                                        .toLocaleString('vi-VN')}₫
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <FiBox className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-gray-500 text-sm">Không có sản phẩm</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                                            <FiPackage className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-gray-500 text-sm">Không thể tải chi tiết</p>
                                            <button
                                                onClick={() => loadReceiptDetails(selectedReceipt.id)}
                                                className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
                            <div className="flex space-x-2">
                                {selectedReceipt.TrangThai === 1 && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                handleApproveReceipt(selectedReceipt.id);
                                            }}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center space-x-1"
                                        >
                                            <FiCheck className="w-3.5 h-3.5" />
                                            <span>Duyệt</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                handleCancelReceipt(selectedReceipt.id);
                                            }}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center space-x-1"
                                        >
                                            <FiX className="w-3.5 h-3.5" />
                                            <span>Hủy</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setReceiptDetails(null);
                                }}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl my-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Tạo phiếu nhập mới
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nhà cung cấp *
                                            </label>
                                            {suppliers.length === 0 ? (
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                                                    <div className="flex items-center">
                                                        <FiRefreshCw className="w-3 h-3 mr-2 animate-spin" />
                                                        Đang tải...
                                                    </div>
                                                </div>
                                            ) : (
                                                <select
                                                    value={createForm.id_NhaCungCap || ''}
                                                    onChange={(e) => setCreateForm({ ...createForm, id_NhaCungCap: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                >
                                                    <option value="">-- Chọn nhà cung cấp --</option>
                                                    {suppliers?.length > 0 && suppliers.map(supplier => (
                                                        <option key={supplier.id} value={supplier.id}>
                                                            {supplier.Ten} {supplier.DiaChi ? `- ${supplier.DiaChi}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                            <textarea
                                                value={createForm.GhiChu}
                                                onChange={(e) => setCreateForm({ ...createForm, GhiChu: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                                rows="2"
                                                placeholder="Ghi chú (tùy chọn)..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Search */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <FiSearch className="w-4 h-4 mr-2 text-blue-600" />
                                        Tìm kiếm sản phẩm
                                    </h4>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            placeholder="Tên sản phẩm, thương hiệu..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            onKeyDown={handleSearchKeyPress}
                                        />
                                        <button
                                            onClick={handleProductSearch}
                                            disabled={searchLoading || !productSearchTerm.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                                        >
                                            {searchLoading ? (
                                                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <FiSearch className="w-3.5 h-3.5" />
                                            )}
                                            <span className="hidden sm:inline">Tìm</span>
                                        </button>
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-3">
                                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                                <h5 className="text-sm font-medium text-gray-700">
                                                    Kết quả ({searchResults.length})
                                                </h5>
                                            </div>
                                            <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                                {searchResults.map((product) => (
                                                    <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {product.TenSanPham}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {product.TenThuongHieu} • {product.TenDanhMuc}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddProduct(product)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedProducts.some(p => p.id === product.id)
                                                                ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                            disabled={selectedProducts.some(p => p.id === product.id)}
                                                        >
                                                            {selectedProducts.some(p => p.id === product.id) ? (
                                                                <>
                                                                    <FiCheck className="w-3 h-3 mr-1 inline" />
                                                                    Đã thêm
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FiPlus className="w-3 h-3 mr-1 inline" />
                                                                    Thêm
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {productSearchTerm && searchResults.length === 0 && !searchLoading && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                            <div className="flex items-start">
                                                <FiSearch className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm text-yellow-800">
                                                    Không tìm thấy sản phẩm "{productSearchTerm}"
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {searchLoading && (
                                        <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                                            <FiRefreshCw className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
                                            <p className="mt-1 text-sm text-blue-700">Đang tìm...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Products */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <FiBox className="w-4 h-4 mr-2 text-green-600" />
                                        Sản phẩm đã chọn ({selectedProducts.length})
                                    </h4>

                                    {selectedProducts.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <FiBox className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm">Chưa có sản phẩm nào</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedProducts.map((product, productIndex) => (
                                                <div key={product.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    {/* Product Header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-sm font-medium text-gray-900 truncate">
                                                                {product.TenSanPham}
                                                            </h5>
                                                            <p className="text-xs text-gray-500">
                                                                {product.TenThuongHieu} • {product.TenDanhMuc}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-3">
                                                            <div className="flex items-center gap-1">
                                                                <label className="text-xs font-medium text-gray-700">Giá nhập:</label>
                                                                <input
                                                                    type="number"
                                                                    value={product.GiaNhap}
                                                                    onChange={(e) => handleUpdateProductPrice(productIndex, e.target.value)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                    placeholder="0"
                                                                    min="0"
                                                                />
                                                                <span className="text-xs text-gray-500">₫</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveProduct(productIndex)}
                                                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Xóa sản phẩm"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Variants */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h6 className="text-sm font-medium text-gray-700">
                                                                Biến thể ({product.variants.length})
                                                            </h6>
                                                            {product.allColors && product.allSizes && (
                                                                <div className="flex items-center gap-1">
                                                                    <select
                                                                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                                                        id={`color-select-${productIndex}`}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="">Màu</option>
                                                                        {product.allColors.map(color => (
                                                                            <option key={color.id} value={color.id}>
                                                                                {color.Ten}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                                                        id={`size-select-${productIndex}`}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="">Size</option>
                                                                        {product.allSizes.map(size => (
                                                                            <option key={size.id} value={size.id}>
                                                                                {size.Ten}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => {
                                                                            const colorSelect = document.getElementById(`color-select-${productIndex}`);
                                                                            const sizeSelect = document.getElementById(`size-select-${productIndex}`);
                                                                            const colorId = colorSelect.value;
                                                                            const sizeId = sizeSelect.value;

                                                                            if (!colorId || !sizeId) {
                                                                                toast.error('Vui lòng chọn màu và size');
                                                                                return;
                                                                            }

                                                                            const existingVariant = product.variants.find(v =>
                                                                                v.id_MauSac === parseInt(colorId) && v.id_KichCo === parseInt(sizeId)
                                                                            );

                                                                            if (existingVariant) {
                                                                                toast.error('Biến thể này đã tồn tại');
                                                                                return;
                                                                            }

                                                                            handleAddVariant(productIndex, parseInt(colorId), parseInt(sizeId));
                                                                            colorSelect.value = "";
                                                                            sizeSelect.value = "";
                                                                        }}
                                                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                                                    >
                                                                        <FiPlus className="w-3 h-3" />
                                                                        Thêm
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {product.variants.length === 0 ? (
                                                            <div className="text-center py-3 text-gray-500 bg-white rounded border-2 border-dashed border-gray-200">
                                                                <p className="text-xs">Chưa có biến thể</p>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                {product.variants.map((variant, variantIndex) => (
                                                                    <div key={variant.MaSanPham} className="bg-white rounded-lg border border-gray-200 p-2">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <div className="flex items-center gap-1">
                                                                                <div
                                                                                    className="w-3 h-3 rounded-full border border-gray-300"
                                                                                    style={{ backgroundColor: variant.MaMau }}
                                                                                ></div>
                                                                                <div>
                                                                                    <div className="text-xs font-medium text-gray-800">
                                                                                        {variant.TenMauSac} - {variant.TenKichCo}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {variant.MaSanPham}
                                                                                        {variant.isExisting && variant.TonKho !== undefined && (
                                                                                            <span className="ml-1 text-blue-600 font-medium">
                                                                                                (Tồn: {variant.TonKho})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {!variant.isExisting && (
                                                                                <button
                                                                                    onClick={() => handleRemoveVariant(productIndex, variantIndex)}
                                                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                                                    title="Xóa biến thể"
                                                                                >
                                                                                    <FiTrash2 className="w-3 h-3" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <label className="text-xs text-gray-600 whitespace-nowrap">SL:</label>
                                                                            <input
                                                                                type="number"
                                                                                value={variant.SoLuong}
                                                                                onChange={(e) => handleUpdateVariantQuantity(productIndex, variantIndex, e.target.value)}
                                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:ring-1 focus:ring-blue-500"
                                                                                min="0"
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">
                                    Tổng: {selectedProducts.reduce((total, product) =>
                                        total + product.variants.reduce((variantTotal, variant) =>
                                            variantTotal + (variant.SoLuong * product.GiaNhap), 0), 0).toLocaleString('vi-VN')}₫
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateImportReceipt}
                                    disabled={loading || !createForm.id_NhaCungCap || selectedProducts.length === 0}
                                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                                >
                                    {loading ? (
                                        <>
                                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave className="w-3.5 h-3.5" />
                                            Tạo phiếu
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-load receipt details */}
            {showDetailModal && selectedReceipt && (
                (() => {
                    if (!receiptDetails && !loadingDetails) {
                        loadReceiptDetails(selectedReceipt.id);
                    }
                    return null;
                })()
            )}
        </div>
    );
};

export default ImportReceipts;
