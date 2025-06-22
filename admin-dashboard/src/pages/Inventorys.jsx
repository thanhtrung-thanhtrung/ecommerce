import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import {
    FiPackage,
    FiAlertTriangle,
    FiTrendingUp,
    FiBarChart2,
    FiRefreshCw,
    FiSearch,
    FiFilter,
    FiEdit,
    FiPlus,
    FiMinus,
    FiCalendar,
    FiFileText,
    FiCheck,
    FiX,
    FiEye
} from 'react-icons/fi';

const Inventorys = () => {
    const {
        getInventoryStats,
        getInventoryList,
        getInventoryImportStats,
        createImportReceipt,
        updateImportReceipt,
        getImportReceipts,
        getSuppliers,
        updateInventory,
        loading
    } = useAdmin();

    const [stats, setStats] = useState({});
    const [inventoryList, setInventoryList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [importStats, setImportStats] = useState([]);
    const [importReceipts, setImportReceipts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, import-stats, import-receipts

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newQuantity, setNewQuantity] = useState('');

    // Import receipt form
    const [showImportForm, setShowImportForm] = useState(false);
    const [importForm, setImportForm] = useState({
        id_NhaCungCap: '',
        GhiChu: '',
        chiTietPhieuNhap: []
    });

    // Date filters for import stats
    const [dateFilter, setDateFilter] = useState({
        tuNgay: '2024-01-01',
        denNgay: '2024-12-31'
    });

    // Add new state for product details search
    const [productDetails, setProductDetails] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadAllData();
    }, []);

    // Filter inventory list based on search and status
    useEffect(() => {
        let filtered = inventoryList;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.TenSanPham?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.TenThuongHieu?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter - using TonKho instead of SoLuongTon
        if (filterStatus === 'low') {
            filtered = filtered.filter(item => item.TonKho > 0 && item.TonKho <= 10);
        } else if (filterStatus === 'out') {
            filtered = filtered.filter(item => item.TonKho === 0);
        }

        setFilteredList(filtered);
    }, [inventoryList, searchTerm, filterStatus]);

    const loadProductDetails = async () => {
        try {
            // Load all product details for the dropdown
            const response = await getInventoryList(); // This gives us all product variants
            if (response.success) {
                setProductDetails(response.data || []);
            }
        } catch (error) {
            console.error('Error loading product details:', error);
        }
    };

    const loadAllData = async () => {
        try {
            await Promise.all([
                loadInventoryData(),
                loadImportStats(),
                loadSuppliers(),
                loadProductDetails() // Add this
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Filter product details based on search term - Only by MaSanPham
    const getFilteredProductDetails = (searchTerm = '') => {
        if (!searchTerm) return productDetails.slice(0, 50); // Show first 50 if no search

        return productDetails.filter(item =>
            item.MaSanPham?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 50); // Limit to 50 results
    };

    const loadInventoryData = async () => {
        try {
            // Load stats
            const response = await getInventoryStats();
            console.log('API Response:', response);

            if (response.success && response.data) {
                // Set inventory list from API data
                setInventoryList(response.data);

                // Calculate stats from the data
                const totalProducts = response.data.length;
                const totalStock = response.data.reduce((sum, item) => sum + (item.TonKho || 0), 0);
                const lowStock = response.data.filter(item => item.TonKho > 0 && item.TonKho <= 10).length;
                const outOfStock = response.data.filter(item => item.TonKho === 0).length;

                setStats({
                    tongSanPham: totalProducts,
                    tongTonKho: totalStock,
                    sapHetHang: lowStock,
                    hetHang: outOfStock
                });
            }
        } catch (error) {
            console.error('Error loading inventory data:', error);
        }
    };

    const loadImportStats = async () => {
        try {
            const response = await getInventoryImportStats(dateFilter);
            if (response.success) {
                setImportStats(response.data || []);
            }
        } catch (error) {
            console.error('Error loading import stats:', error);
        }
    };

    const loadImportReceipts = async () => {
        try {
            const response = await getImportReceipts({ page: 1, limit: 10 });
            if (response.success) {
                setImportReceipts(response.data || []);
            }
        } catch (error) {
            console.error('Error loading import receipts:', error);
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await getSuppliers();
            if (response.success) {
                setSuppliers(response.data || []);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    };

    const handleCreateImportReceipt = async () => {
        try {
            const response = await createImportReceipt({
                userId: 1, // Get from auth context in real app
                ...importForm
            });

            if (response.success) {
                alert(`Tạo phiếu nhập thành công! Mã: ${response.data.MaPhieuNhap}`);
                setShowImportForm(false);
                setImportForm({
                    id_NhaCungCap: '',
                    GhiChu: '',
                    chiTietPhieuNhap: []
                });
                await loadImportReceipts();
                await loadInventoryData();
            }
        } catch (error) {
            console.error('Error creating import receipt:', error);
            alert('Có lỗi khi tạo phiếu nhập');
        }
    };

    const addImportItem = () => {
        setImportForm({
            ...importForm,
            chiTietPhieuNhap: [
                ...importForm.chiTietPhieuNhap,
                { id_ChiTietSanPham: '', SoLuong: 0, GiaNhap: 0 }
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

        // If updating product ID, also store product info for display
        if (field === 'id_ChiTietSanPham') {
            const selectedProduct = productDetails.find(item => item.id == value);
            newItems[index].productInfo = selectedProduct;
        }

        setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
    };

    const handleUpdateInventory = async (productId, variantId, newQty) => {
        try {
            await updateInventory(productId, variantId, parseInt(newQty));
            await loadInventoryData(); // Reload data
            setSelectedProduct(null);
            setNewQuantity('');
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('Có lỗi khi cập nhật kho hàng');
        }
    };

    const getStatusColor = (quantity) => {
        if (quantity === 0) return 'text-red-600 bg-red-100';
        if (quantity <= 10) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const getStatusText = (quantity) => {
        if (quantity === 0) return 'Hết hàng';
        if (quantity <= 10) return 'Sắp hết';
        return 'Còn hàng';
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'import-stats') {
            loadImportStats();
        } else if (tab === 'import-receipts') {
            loadImportReceipts();
        }
    };

    const renderInventoryTab = () => (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FiPackage className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.tongSanPham || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FiTrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng tồn kho</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.tongTonKho || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.sapHetHang || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FiBarChart2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.hetHang || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <FiFilter className="text-gray-400 w-4 h-4" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Tất cả</option>
                            <option value="low">Sắp hết hàng</option>
                            <option value="out">Hết hàng</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thương hiệu
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Màu sắc
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kích cỡ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tồn kho
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
                            {filteredList.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.TenSanPham}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.MaSanPham}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.TenThuongHieu}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.MauSac}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.KichCo}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.TonKho === 2147483647 ? '∞' : item.TonKho}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.TonKho)}`}>
                                            {getStatusText(item.TonKho)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedProduct(item);
                                                setNewQuantity(item.TonKho === 2147483647 ? '999999' : item.TonKho.toString());
                                            }}
                                            className="text-blue-600 hover:text-blue-900 flex items-center"
                                        >
                                            <FiEdit className="w-4 h-4 mr-1" />
                                            Cập nhật
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredList.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <FiPackage className="mx-auto w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">Không có dữ liệu kho hàng</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderImportStatsTab = () => (
        <>
            {/* Date Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                        <input
                            type="date"
                            value={dateFilter.tuNgay}
                            onChange={(e) => setDateFilter({ ...dateFilter, tuNgay: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                        <input
                            type="date"
                            value={dateFilter.denNgay}
                            onChange={(e) => setDateFilter({ ...dateFilter, denNgay: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={loadImportStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <FiSearch className="w-4 h-4 mr-2 inline" />
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Import Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {importStats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Thống kê ngày {new Date(stat.NgayNhap).toLocaleDateString('vi-VN')}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số phiếu nhập:</span>
                                <span className="font-semibold">{stat.SoPhieuNhap}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng tiền:</span>
                                <span className="font-semibold text-green-600">
                                    {parseInt(stat.TongTien).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số nhà cung cấp:</span>
                                <span className="font-semibold">{stat.SoNhaCungCap}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {importStats.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <FiCalendar className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Không có dữ liệu thống kê nhập kho trong khoảng thời gian này</p>
                </div>
            )}
        </>
    );

    const renderImportReceiptsTab = () => (
        <>
            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Phiếu nhập kho</h2>
                <button
                    onClick={() => setShowImportForm(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Tạo phiếu nhập
                </button>
            </div>

            {/* Import Receipts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày nhập</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {importReceipts.map((receipt) => (
                            <tr key={receipt.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{receipt.MaPhieuNhap}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(receipt.NgayNhap).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{receipt.TenNhaCungCap}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {parseInt(receipt.TongTien || 0).toLocaleString('vi-VN')} ₫
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${receipt.TrangThai === 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {receipt.TrangThai === 2 ? 'Đã duyệt' : 'Chờ duyệt'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                                        <FiEye className="w-4 h-4" />
                                    </button>
                                    {receipt.TrangThai !== 2 && (
                                        <button
                                            onClick={() => updateImportReceipt(receipt.id, { TrangThai: 2 })}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            <FiCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>
                    <p className="text-gray-600">Theo dõi tồn kho và quản lý nhập hàng</p>
                </div>
                <button
                    onClick={loadAllData}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => handleTabChange('inventory')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'inventory'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Tồn kho
                    </button>
                    <button
                        onClick={() => handleTabChange('import-stats')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'import-stats'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Thống kê nhập kho
                    </button>
                    <button
                        onClick={() => handleTabChange('import-receipts')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'import-receipts'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Phiếu nhập kho
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'inventory' && renderInventoryTab()}
            {activeTab === 'import-stats' && renderImportStatsTab()}
            {activeTab === 'import-receipts' && renderImportReceiptsTab()}

            {/* Update Inventory Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Cập nhật số lượng tồn kho
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                                <p className="text-sm text-gray-600">{selectedProduct.TenSanPham}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Biến thể</label>
                                <p className="text-sm text-gray-600">
                                    {selectedProduct.MauSac} - {selectedProduct.KichCo}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số lượng hiện tại: {selectedProduct.TonKho === 2147483647 ? '∞' : selectedProduct.TonKho}
                                </label>
                                <input
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập số lượng mới"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setNewQuantity('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleUpdateInventory(
                                    selectedProduct.SanPhamID,
                                    selectedProduct.BienTheID,
                                    newQuantity
                                )}
                                disabled={!newQuantity || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Receipt Form Modal */}
            {showImportForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo phiếu nhập kho</h3>

                        <div className="space-y-4">
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nhà cung cấp</label>
                                <select
                                    value={importForm.id_NhaCungCap}
                                    onChange={(e) => setImportForm({ ...importForm, id_NhaCungCap: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Chọn nhà cung cấp</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.TenNhaCungCap}
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
                                />
                            </div>

                            {/* Import Items */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Chi tiết nhập hàng</label>
                                    <button
                                        onClick={addImportItem}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                        <FiPlus className="w-4 h-4 inline mr-1" />
                                        Thêm sản phẩm
                                    </button>
                                </div>

                                {importForm.chiTietPhieuNhap.map((item, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                                        {/* Product Search and Selection */}
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tìm sản phẩm
                                            </label>
                                            <div className="relative">
                                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã sản phẩm (VD: PUMA-RSX-GREEN-41)..."
                                                    value={item.searchTerm || ''}
                                                    onChange={(e) => {
                                                        const newItems = [...importForm.chiTietPhieuNhap];
                                                        newItems[index] = { ...newItems[index], searchTerm: e.target.value };
                                                        setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
                                                    }}
                                                    onFocus={(e) => {
                                                        if (!e.target.value) {
                                                            const newItems = [...importForm.chiTietPhieuNhap];
                                                            newItems[index] = { ...newItems[index], searchTerm: ' ' };
                                                            setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
                                                        }
                                                    }}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Dropdown Results - Fixed positioning */}
                                            {item.searchTerm && item.searchTerm.trim() && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {getFilteredProductDetails(item.searchTerm.trim()).map(product => (
                                                        <div
                                                            key={product.id}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent input blur
                                                                updateImportItem(index, 'id_ChiTietSanPham', product.id);
                                                                const newItems = [...importForm.chiTietPhieuNhap];
                                                                newItems[index].searchTerm = '';
                                                                newItems[index].productInfo = product;
                                                                setImportForm({ ...importForm, chiTietPhieuNhap: newItems });
                                                            }}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                        >
                                                            <div className="font-medium text-gray-900">
                                                                {product.TenSanPham}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Mã: <span className="font-mono bg-gray-100 px-1 rounded">{product.MaSanPham}</span> | {product.TenThuongHieu} | {product.MauSac} - {product.KichCo}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span className="inline-flex items-center">
                                                                    <FiPackage className="w-3 h-3 mr-1" />
                                                                    Tồn kho: <span className="font-semibold ml-1">{product.TonKho === 2147483647 ? '∞' : product.TonKho}</span>
                                                                </span>
                                                                <span className="mx-2">|</span>
                                                                <span className="text-green-600 font-semibold">
                                                                    {parseInt(product.Gia || 0).toLocaleString('vi-VN')}₫
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {getFilteredProductDetails(item.searchTerm.trim()).length === 0 && (
                                                        <div className="p-4 text-gray-500 text-center">
                                                            <FiSearch className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                                            <p>Không tìm thấy sản phẩm nào</p>
                                                            <p className="text-xs mt-1">Thử tìm với từ khóa khác</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                                    ID: {item.productInfo.id} | Tồn kho: {item.productInfo.TonKho === 2147483647 ? '∞' : item.productInfo.TonKho}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quantity and Price Inputs */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
                                                <input
                                                    type="number"
                                                    placeholder="Số lượng"
                                                    value={item.SoLuong}
                                                    onChange={(e) => updateImportItem(index, 'SoLuong', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Giá nhập</label>
                                                <input
                                                    type="number"
                                                    placeholder="Giá nhập"
                                                    value={item.GiaNhap}
                                                    onChange={(e) => updateImportItem(index, 'GiaNhap', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => removeImportItem(index)}
                                                    className="w-full p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200"
                                                >
                                                    <FiMinus className="w-4 h-4 mx-auto" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Total for this item */}
                                        {item.SoLuong && item.GiaNhap && (
                                            <div className="text-right text-sm font-medium text-gray-700">
                                                Thành tiền: {(parseInt(item.SoLuong || 0) * parseInt(item.GiaNhap || 0)).toLocaleString('vi-VN')}₫
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowImportForm(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateImportReceipt}
                                disabled={!importForm.id_NhaCungCap || importForm.chiTietPhieuNhap.length === 0 || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Tạo phiếu nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventorys;
