import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { useAdmin } from '../contexts/AdminContext';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiTruck } from "react-icons/fi";


const Shippings = () => {
  const {
    loading,
    getShippingMethods,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod
  } = useAdmin();

  const [shippingMethods, setShippingMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    Ten: '',
    MoTa: '',
    PhiVanChuyen: '',
    ThoiGianDuKien: '',
    TrangThai: 1
  });

  // Load shipping methods
  const loadShippingMethods = async () => {
    try {
      const response = await getShippingMethods();
      if (response.success) {
        setShippingMethods(response.data || []);
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      toast.error('Lỗi khi tải danh sách phương thức vận chuyển');
    }
  };

  useEffect(() => {
    loadShippingMethods();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const methodData = {
        ...formData,
        PhiVanChuyen: parseFloat(formData.PhiVanChuyen) || 0,
        TrangThai: parseInt(formData.TrangThai)
      };

      let response;
      if (editingMethod) {
        response = await updateShippingMethod(editingMethod.id, methodData);
      } else {
        response = await createShippingMethod(methodData);
      }

      if (response.success) {
        toast.success(response.message || (editingMethod ? 'Cập nhật thành công' : 'Thêm thành công'));
        setShowModal(false);
        resetForm();
        loadShippingMethods();
      }
    } catch (error) {
      console.error('Error saving shipping method:', error);
      toast.error('Lỗi khi lưu phương thức vận chuyển');
    }
  };

  // Handle delete
  const handleDelete = async (method) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phương thức vận chuyển "${method.Ten}"?`)) {
      return;
    }

    try {
      const response = await deleteShippingMethod(method.id);

      if (response.success) {
        toast.success(response.message || 'Xóa thành công');
        loadShippingMethods();
      }
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast.error('Lỗi khi xóa phương thức vận chuyển');
    }
  };

  // Handle edit
  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      Ten: method.Ten || '',
      MoTa: method.MoTa || '',
      PhiVanChuyen: method.PhiVanChuyen?.toString() || '',
      ThoiGianDuKien: method.ThoiGianDuKien || '',
      TrangThai: method.TrangThai || 1
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      Ten: '',
      MoTa: '',
      PhiVanChuyen: '',
      ThoiGianDuKien: '',
      TrangThai: 1
    });
    setEditingMethod(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FiTruck className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quản lý Phương thức Vận chuyển</h1>
            <p className="text-gray-600 mt-1">
              Danh sách phương thức vận chuyển ({shippingMethods.length})
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadShippingMethods}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Thêm Phương thức</span>
          </button>
        </div>
      </div>

      {/* Shipping Methods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phí vận chuyển
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian dự kiến
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : shippingMethods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <FiTruck className="w-8 h-8 text-gray-400" />
                      <span>Không có phương thức vận chuyển nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                shippingMethods.map((method, index) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {method.Ten}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {method.MoTa || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(method.PhiVanChuyen)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {method.ThoiGianDuKien || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(method)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span className="hidden sm:inline"></span>
                        </button>
                        <button
                          onClick={() => handleDelete(method)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span className="hidden sm:inline"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-4">
                <FiTruck className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMethod ? 'Sửa Phương thức Vận chuyển' : 'Thêm Phương thức Vận chuyển'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên phương thức *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) => setFormData(prev => ({ ...prev, Ten: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.MoTa}
                    onChange={(e) => setFormData(prev => ({ ...prev, MoTa: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vận chuyển (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={formData.PhiVanChuyen}
                    onChange={(e) => setFormData(prev => ({ ...prev, PhiVanChuyen: e.target.value }))}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian dự kiến
                  </label>
                  <input
                    type="text"
                    value={formData.ThoiGianDuKien}
                    onChange={(e) => setFormData(prev => ({ ...prev, ThoiGianDuKien: e.target.value }))}
                    placeholder="VD: 2-3 ngày"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) => setFormData(prev => ({ ...prev, TrangThai: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Vô hiệu hóa</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : (editingMethod ? 'Cập nhật' : 'Tạo mới')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shippings;
