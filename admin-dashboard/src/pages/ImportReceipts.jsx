import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import {
    FiPackage,
    FiPlus,
    FiMinus,
    FiRefreshCw,
    FiEye,
    FiCheck,
    FiX,
    FiDollarSign,
    FiTruck,
    FiUser,
    FiBox,
    FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const ImportReceipts = () => {
    const {
        getImportReceipts,
        getImportReceiptDetail,
        createImportReceipt,
        updateImportReceipt,
        getSuppliers,
        getInventoryStats,
        loading
    } = useAdmin();

    const [importReceipts, setImportReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [productDetails, setProductDetails] = useState([]);
    const [receiptDetails, setReceiptDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Filter states - chỉ giữ filterStatus
    const [filterStatus, setFilterStatus] = useState('all');

    // Form states
    const [showImportForm, setShowImportForm] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showDropdownIndex, setShowDropdownIndex] = useState(-1);
    const [importForm, setImportForm] = useState({
        id_NhaCungCap: '',
        GhiChu: '',
        chiTietPhieuNhap: []
    });

    // Load data on component mount
    useEffect(() => {
        loadAllData();
    }, []);

    // Filter receipts chỉ theo status
    useEffect(() => {
        let filtered = importReceipts;

        // Status filter
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

    const handleCreateImportReceipt = async () => {
        try {
            // Validation
            if (!importForm.id_NhaCungCap || isNaN(Number(importForm.id_NhaCungCap))) {
                toast.error('Vui lòng chọn nhà cung cấp');
                return;
            }
            if (!Array.isArray(importForm.chiTietPhieuNhap) || importForm.chiTietPhieuNhap.length === 0) {
                toast.error('Vui lòng thêm ít nhất một sản phẩm');
                return;
            }

            // Validate each item
            for (let item of importForm.chiTietPhieuNhap) {
                if (!item.id || !item.SoLuong || !item.GiaNhap) {
                    toast.error('Vui lòng điền đầy đủ thông tin cho tất cả sản phẩm');
                    return;
                }
                if (parseInt(item.SoLuong) <= 0) {
                    toast.error('Số lượng phải lớn hơn 0');
                    return;
                }
                if (parseFloat(item.GiaNhap) <= 0) {
                    toast.error('Giá nhập phải lớn hơn 0');
                    return;
                }
            }

            const formData = {
                userId: 1, // Should get from auth context
                id_NhaCungCap: Number(importForm.id_NhaCungCap),
                GhiChu: importForm.GhiChu?.trim() || '',
                chiTietPhieuNhap: importForm.chiTietPhieuNhap.map(item => ({
                    id_ChiTietSanPham: item.id,
                    SoLuong: parseInt(item.SoLuong),
                    GiaNhap: parseFloat(item.GiaNhap)
                }))
            };

            const response = await createImportReceipt(formData);
            if (response.success) {
                toast.success(`Tạo phiếu nhập thành công! Mã: ${response.data.MaPhieuNhap}`);
                setShowImportForm(false);
                resetForm();
                await loadImportReceipts();
            } else {
                if (response.errors && Array.isArray(response.errors)) {
                    toast.error(response.errors[0]?.msg || 'Tạo phiếu nhập thất bại');
                } else {
                    toast.error(response.message || 'Tạo phiếu nhập thất bại. Vui lòng thử lại.');
                }
            }
        } catch (error) {
            console.error('Error creating import receipt:', error);
            toast.error('Có lỗi khi tạo phiếu nhập: ' + (error?.message || 'Lỗi không xác định'));
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

    const resetForm = () => {
        setImportForm({
            id_NhaCungCap: '',
            GhiChu: '',
            chiTietPhieuNhap: []
        });
    };

    const addImportItem = () => {
        setImportForm({
            ...importForm,
            chiTietPhieuNhap: [
                ...importForm.chiTietPhieuNhap,
                {
                    id: '',
                    SoLuong: '',
                    GiaNhap: '',
                    searchTerm: '',
                    productInfo: null
                }
            ]
        });
    };

    const removeImportItem = (index) => {
        const newItems = importForm.chiTietPhieuNhap.filter((_, i) => i !== index);
        setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
    };

    const updateImportItem = (index, field, value) => {
        const newItems = [...importForm.chiTietPhieuNhap];
        newItems[index] = { ...newItems[index], [field]: value };
        setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
    };

    const selectProductForImport = (index, product) => {
        const newItems = [...importForm.chiTietPhieuNhap];
        newItems[index] = {
            ...newItems[index],
            id: product.id,
            productInfo: product,
            searchTerm: product.TenSanPham
        };
        setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
        setShowDropdownIndex(-1); // Ẩn dropdown sau khi chọn sản phẩm
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
            case 1: return 'Chờ xác nhận';
            case 2: return 'Đã nhập kho';
            case 3: return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const getTotalAmount = () => {
        return importForm.chiTietPhieuNhap.reduce((sum, item) =>
            sum + (parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)), 0
        );
    };

    const getTotalQuantity = () => {
        return importForm.chiTietPhieuNhap.reduce((sum, item) => sum + parseInt(item.SoLuong || 0), 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý phiếu nhập kho</h1>
                    <p className="text-gray-600">Tạo và quản lý phiếu nhập hàng từ nhà cung cấp</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={loadAllData}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <button
                        onClick={() => setShowImportForm(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FiPlus className="w-4 h-4 mr-2" />
                        Tạo phiếu nhập
                    </button>
                </div>
            </div>

            {/* Simple Filter - chỉ combobox trạng thái */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="w-64">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="1">Chờ xác nhận</option>
                        <option value="2">Đã nhập kho</option>
                        <option value="3">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Import Receipts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mã phiếu
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày nhập
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổng tiền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReceipts.map((receipt, index) => (
                                <tr key={receipt.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-blue-600">{receipt.MaPhieuNhap}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {new Date(receipt.NgayNhap).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(receipt.NgayNhap).toLocaleTimeString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {parseInt(receipt.TongTien || 0).toLocaleString('vi-VN')}₫
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.TrangThai)}`}>
                                            {getStatusText(receipt.TrangThai)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedReceipt(receipt);
                                                    setShowDetailModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Xem chi tiết"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            {receipt.TrangThai === 1 && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveReceipt(receipt.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Duyệt phiếu nhập"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelReceipt(receipt.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Hủy phiếu nhập"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredReceipts.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <FiPackage className="mx-auto w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">Không có phiếu nhập nào</p>
                        {filterStatus !== 'all' && (
                            <p className="text-sm text-gray-400 mt-1">Hãy thử thay đổi bộ lọc</p>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-8">
                        <FiRefreshCw className="mx-auto w-8 h-8 text-blue-500 animate-spin" />
                        <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                )}
            </div>

            {/* Import Receipt Form Modal */}
            {showImportForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo phiếu nhập kho</h3>

                        <div className="space-y-4">
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nhà cung cấp <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={importForm.id_NhaCungCap}
                                    onChange={(e) => setImportForm({ ...importForm, id_NhaCungCap: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Chọn nhà cung cấp</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.Ten}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                <textarea
                                    value={importForm.GhiChu}
                                    onChange={(e) => setImportForm({ ...importForm, GhiChu: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Nhập ghi chú (tuỳ chọn)"
                                />
                            </div>

                            {/* Import Items */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Chi tiết nhập hàng <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        onClick={addImportItem}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                        <FiPlus className="w-4 h-4 inline mr-1" />
                                        Thêm sản phẩm
                                    </button>
                                </div>

                                {importForm.chiTietPhieuNhap.length === 0 && (
                                    <div className="text-center py-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                        <FiPackage className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                                        <p className="text-gray-500">Chưa có sản phẩm nào</p>
                                        <p className="text-sm text-gray-400">Click "Thêm sản phẩm" để bắt đầu</p>
                                    </div>
                                )}

                                {importForm.chiTietPhieuNhap.map((item, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3 mb-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-gray-700">Sản phẩm #{index + 1}</h4>
                                            <button
                                                onClick={() => removeImportItem(index)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                                            >
                                                <FiMinus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Product Selection */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Chọn sản phẩm <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm sản phẩm..."
                                                    value={item.searchTerm}
                                                    onChange={(e) => updateImportItem(index, 'searchTerm', e.target.value)}
                                                    onFocus={() => setShowDropdownIndex(index)}
                                                    onBlur={() => {
                                                        // Delay để cho phép click vào dropdown item
                                                        setTimeout(() => setShowDropdownIndex(-1), 200);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />

                                                {/* Dropdown for product search results */}
                                                {showDropdownIndex === index && item.searchTerm && item.searchTerm.length > 0 && !item.productInfo && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        {productDetails
                                                            .filter(product =>
                                                                product.TenSanPham.toLowerCase().includes(item.searchTerm.toLowerCase()) ||
                                                                product.MaSanPham.toLowerCase().includes(item.searchTerm.toLowerCase())
                                                            )
                                                            .slice(0, 10)
                                                            .map(product => (
                                                                <div
                                                                    key={product.id}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault(); // Ngăn onBlur trigger
                                                                        selectProductForImport(index, product);
                                                                    }}
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                >
                                                                    <div className="font-medium">{product.TenSanPham}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {product.TenThuongHieu} | {product.MauSac} - {product.KichCo} |
                                                                        Tồn kho: {product.TonKho === 2147483647 ? '∞' : product.TonKho}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">
                                                                        Mã: {product.MaSanPham}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                        {productDetails.filter(product =>
                                                            product.TenSanPham.toLowerCase().includes(item.searchTerm.toLowerCase()) ||
                                                            product.MaSanPham.toLowerCase().includes(item.searchTerm.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="px-3 py-2 text-gray-500">
                                                                    Không tìm thấy sản phẩm
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Product Info */}
                                        {item.productInfo && (
                                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                <div className="font-medium text-blue-900">
                                                    ✓ Đã chọn: {item.productInfo.TenSanPham}
                                                </div>
                                                <div className="text-sm text-blue-700">
                                                    {item.productInfo.TenThuongHieu} | {item.productInfo.MauSac} - {item.productInfo.KichCo}
                                                </div>
                                                <div className="text-xs text-blue-600">
                                                    ID: {item.productInfo.id} | Tồn kho hiện tại: {item.productInfo.TonKho === 2147483647 ? '∞' : item.productInfo.TonKho}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quantity and Price Inputs */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Số lượng nhập <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Nhập số lượng"
                                                    value={item.SoLuong}
                                                    onChange={(e) => updateImportItem(index, 'SoLuong', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Giá nhập (VNĐ) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Nhập giá nhập"
                                                    value={item.GiaNhap}
                                                    onChange={(e) => updateImportItem(index, 'GiaNhap', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Total for this item */}
                                        {item.SoLuong && item.GiaNhap && (
                                            <div className="bg-gray-100 p-2 rounded text-right">
                                                <span className="text-sm text-gray-600">Thành tiền: </span>
                                                <span className="font-semibold text-gray-900">
                                                    {(parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)).toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Total Summary */}
                                {importForm.chiTietPhieuNhap.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-blue-700">
                                                    Tổng số sản phẩm: <span className="font-semibold">{importForm.chiTietPhieuNhap.length}</span>
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    Tổng số lượng: <span className="font-semibold">{getTotalQuantity()}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-blue-700">Tổng tiền phiếu nhập:</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    {getTotalAmount().toLocaleString('vi-VN')}₫
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowImportForm(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateImportReceipt}
                                disabled={!importForm.id_NhaCungCap || importForm.chiTietPhieuNhap.length === 0 || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang xử lý...' : 'Tạo phiếu nhập'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Chi tiết phiếu nhập: {selectedReceipt.MaPhieuNhap}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setReceiptDetails(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="text-center py-8">
                                <FiRefreshCw className="mx-auto w-8 h-8 text-blue-500 animate-spin" />
                                <p className="mt-2 text-gray-500">Đang tải chi tiết phiếu nhập...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                        <FiPackage className="w-5 h-5 mr-2" />
                                        Thông tin phiếu nhập
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhập</label>
                                            <p className="text-sm text-gray-900">
                                                {new Date(selectedReceipt.NgayNhap).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReceipt.TrangThai)}`}>
                                                {getStatusText(selectedReceipt.TrangThai)}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <FiTruck className="w-4 h-4 mr-2 text-gray-400" />
                                                {selectedReceipt.TenNhaCungCap}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                                {selectedReceipt.NguoiTao}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền</label>
                                            <p className="text-lg font-bold text-green-600 flex items-center">
                                                <FiDollarSign className="w-4 h-4 mr-1" />
                                                {parseInt(selectedReceipt.TongTien || 0).toLocaleString('vi-VN')}₫
                                            </p>
                                        </div>
                                    </div>

                                    {selectedReceipt.GhiChu && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                            <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                                {selectedReceipt.GhiChu}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Products Table */}
                                {receiptDetails ? (
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                            <FiLayers className="w-5 h-5 mr-2" />
                                            Chi tiết sản phẩm ({receiptDetails.chiTiet?.length || 0} mặt hàng)
                                        </h4>

                                        {receiptDetails.chiTiet && receiptDetails.chiTiet.length > 0 ? (
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Sản phẩm
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Sản phẩm
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Mã SP - Biến thể
                                                            </th>
                                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                SL nhập
                                                            </th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Giá nhập
                                                            </th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Thành tiền
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {receiptDetails.chiTiet.map((item, index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-start">
                                                                        <FiBox className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {item.TenSanPham || 'Tên sản phẩm không có'}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                {item.TenThuongHieu} | {item.TenDanhMuc}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 font-mono">
                                                                        {item.MaSanPham || '-'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {item.MauSac} - {item.KichCo}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {parseInt(item.SoLuong || 0).toLocaleString('vi-VN')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <div className="text-sm text-gray-900">
                                                                        {parseFloat(item.GiaNhap || 0).toLocaleString('vi-VN')}₫
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {(parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)).toLocaleString('vi-VN')}₫
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50">
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                                                                Tổng cộng:
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-lg font-bold text-green-600">
                                                                {receiptDetails.chiTiet
                                                                    .reduce((sum, item) => sum + (parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)), 0)
                                                                    .toLocaleString('vi-VN')}₫
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <FiBox className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                                                <p className="text-gray-500">Không có sản phẩm nào trong phiếu nhập này</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <FiPackage className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                                        <p className="text-gray-500">Không thể tải chi tiết sản phẩm</p>
                                        <button
                                            onClick={() => loadReceiptDetails(selectedReceipt.id)}
                                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                )}

                                {/* Summary Stats */}
                                {receiptDetails && receiptDetails.chiTiet && receiptDetails.chiTiet.length > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h5 className="text-md font-semibold text-green-800 mb-2">Tóm tắt phiếu nhập</h5>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-green-700">Tổng sản phẩm khác nhau:</span>
                                                <span className="font-bold text-green-800 ml-2">{receiptDetails.chiTiet.length}</span>
                                            </div>
                                            <div>
                                                <span className="text-green-700">Tổng số lượng:</span>
                                                <span className="font-bold text-green-800 ml-2">
                                                    {receiptDetails.chiTiet.reduce((sum, item) => sum + parseInt(item.SoLuong || 0), 0).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-green-700">Giá trị trung bình/sản phẩm:</span>
                                                <span className="font-bold text-green-800 ml-2">
                                                    {Math.round(receiptDetails.chiTiet.reduce((sum, item) => sum + (parseInt(item.SoLuong || 0) * parseFloat(item.GiaNhap || 0)), 0) / receiptDetails.chiTiet.length).toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <div className="flex space-x-3">
                                {selectedReceipt.TrangThai === 1 && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                handleApproveReceipt(selectedReceipt.id);
                                            }}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <FiCheck className="w-4 h-4 mr-2" />
                                            Duyệt phiếu nhập
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                handleCancelReceipt(selectedReceipt.id);
                                            }}
                                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            <FiX className="w-4 h-4 mr-2" />
                                            Hủy phiếu nhập
                                        </button>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setReceiptDetails(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-load receipt details when modal opens */}
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
