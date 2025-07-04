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
    FiEdit2
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Inventorys = () => {
    const {
        getInventoryStats,
        updateInventory,
        loading
    } = useAdmin();

    const [stats, setStats] = useState({});
    const [inventoryList, setInventoryList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newQuantity, setNewQuantity] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadInventoryData();
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

        // Status filter - using TonKho with special handling for infinite stock
        if (filterStatus === 'low') {
            filtered = filtered.filter(item => item.TonKho > 0 && item.TonKho <= 10 && item.TonKho !== 2147483647);
        } else if (filterStatus === 'out') {
            filtered = filtered.filter(item => item.TonKho === 0);
        } else if (filterStatus === 'available') {
            filtered = filtered.filter(item => item.TonKho > 10);
        }

        setFilteredList(filtered);
    }, [inventoryList, searchTerm, filterStatus]);

    const loadInventoryData = async () => {
        try {
            const response = await getInventoryStats();
            if (response.success && response.data) {
                setInventoryList(response.data);

                const totalProducts = response.data.length;
                const totalStock = response.data.reduce((sum, item) => sum + item.TonKho, 0);
                const lowStock = response.data.filter(item => item.TonKho > 0 && item.TonKho <= 10 && item.TonKho !== 2147483647).length;
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

    const handleUpdateInventory = async (productId, variantId, newQty) => {
        try {
            await updateInventory(productId, variantId, parseInt(newQty));
            await loadInventoryData();
            setSelectedProduct(null);
            setNewQuantity('');
        } catch (error) {
            console.error('Error updating inventory:', error);
            toast.error('Có lỗi khi cập nhật kho hàng');
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

    return (
        <div className="p-2">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý kho hàng</h1>
                    <p className="text-sm text-gray-600">Theo dõi tồn kho sản phẩm</p>
                </div>
                <button
                    onClick={loadInventoryData}
                    disabled={loading}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                    <FiRefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Compact Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg shadow p-3">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-blue-100 rounded">
                            <FiPackage className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-600">Tổng SP</p>
                            <p className="text-sm font-bold text-gray-900">{stats.tongSanPham || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-green-100 rounded">
                            <FiTrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-600">Tổng tồn</p>
                            <p className="text-sm font-bold text-gray-900">{stats.tongTonKho || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-yellow-100 rounded">
                            <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-600">Sắp hết</p>
                            <p className="text-sm font-bold text-gray-900">{stats.sapHetHang || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-red-100 rounded">
                            <FiBarChart2 className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-600">Hết hàng</p>
                            <p className="text-sm font-bold text-gray-900">{stats.hetHang || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Filters */}
            <div className="bg-white rounded-lg shadow p-3 mb-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <FiFilter className="text-gray-400 w-4 h-4" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="all">Tất cả</option>
                            <option value="low">Sắp hết</option>
                            <option value="out">Hết hàng</option>
                            <option value="available">Còn hàng</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Compact Inventory Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu/Size</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredList.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="text-xs font-medium text-gray-900">{index + 1}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="text-xs font-medium text-gray-900">{item.TenSanPham}</div>
                                        <div className="text-xs text-gray-500">{item.MaSanPham}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="text-xs text-gray-900">{item.TenThuongHieu}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="text-xs text-gray-900">{item.MauSac}</div>
                                        <div className="text-xs text-gray-500">{item.KichCo}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="text-xs font-medium text-gray-900">{item.TonKho}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.TonKho)}`}>
                                            {getStatusText(item.TonKho)}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedProduct(item);
                                                setNewQuantity(item.TonKho === 2147483647 ? '999999' : item.TonKho.toString());
                                            }}
                                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                            title="Cập nhật tồn kho"
                                        >
                                            <FiEdit2 className="w-3.5 h-3.5" />
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
                        <p className="mt-2 text-sm text-gray-500">Không có dữ liệu kho hàng</p>
                    </div>
                )}
            </div>

            {/* Compact Update Inventory Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                            Cập nhật số lượng tồn kho
                        </h3>

                        <div className="space-y-3">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hiện tại: {selectedProduct.TonKho === 2147483647 ? '∞' : selectedProduct.TonKho}
                                </label>
                                <input
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Nhập số lượng mới"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setNewQuantity('');
                                }}
                                className="px-3 py-1.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
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
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventorys;
