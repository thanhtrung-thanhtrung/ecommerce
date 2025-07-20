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
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    Ten: '',
    MoTa: '',
    PhiVanChuyen: '',
    ThoiGianDuKien: '',
    TrangThai: 1
  });

  // Hàm xử lý lỗi từ API response
  const handleApiError = (errorResponse) => {
    if (errorResponse.errors && errorResponse.errors.length > 0) {
      // Hiển thị lỗi đầu tiên
      const firstError = errorResponse.errors[0];
      toast.error(firstError.msg);
      
      // Hoặc hiển thị tất cả lỗi (nếu muốn)
      // errorResponse.errors.forEach(error => {
      //   toast.error(error.msg);
      // });
    } else if (errorResponse.message) {
      // Hiển thị message chung
      toast.error(errorResponse.message);
    } else {
      // Lỗi mặc định
      toast.error('Đã có lỗi xảy ra!');
    }
  };

  // Load shipping methods
  const loadShippingMethods = async () => {
    try {
      const response = await getShippingMethods();
      if (response.success) {
        setShippingMethods(response.data || []);
      } else {
        // Xử lý lỗi khi load data
        handleApiError(response);
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      
      // Kiểm tra nếu error có response data
      if (error.response && error.response.data) {
        handleApiError(error.response.data);
      } else {
        toast.error('Lỗi khi tải danh sách phương thức vận chuyển');
      }
    }
  };

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const filterSearch = shippingMethods.filter(method =>
    method.Ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.ThoiGianDuKien?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Reset form data
  useEffect(() => {
    resetForm();
  }, [showModal]);

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
      } else {
        // Xử lý lỗi validation hoặc lỗi khác
        handleApiError(response);
      }
    } catch (error) {
      console.error('Error saving shipping method:', error);
      
      // Kiểm tra nếu error có response data từ backend
      if (error.response && error.response.data) {
        handleApiError(error.response.data);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi khi lưu phương thức vận chuyển');
      }
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
      } else {
        handleApiError(response);
      }
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      
      if (error.response && error.response.data) {
        handleApiError(error.response.data);
      } else {
        toast.error('Lỗi khi xóa phương thức vận chuyển');
      }
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
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phương thức Vận chuyển</h1>
          <p className="text-sm text-gray-600">{shippingMethods.length} phương thức</p>
        </div>
        <div className="flex space-x-2">
          <div className="mb-2 w-full max-w-xs">
            <input
              type="text"
              placeholder="Tìm kiếm tên phương thức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            onClick={loadShippingMethods}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm</span>
          </button>
        </div>
      </div>

      {/* Compact Shipping Methods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phương thức</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phí VC</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
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
              ) : shippingMethods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <FiTruck className="w-12 h-12 text-gray-400" />
                      <span className="text-sm">Không có phương thức vận chuyển nào</span>
                      <button
                        onClick={() => {
                          resetForm();
                          setShowModal(true);
                        }}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Thêm phương thức đầu tiên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filterSearch.map((method, index) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 text-center">{index + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiTruck className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-xs font-medium text-gray-900">{method.Ten}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900 max-w-32 truncate">
                        {method.MoTa || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(method.PhiVanChuyen)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {method.ThoiGianDuKien || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(method)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(method)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
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

      {/* Compact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-4 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center space-x-2 mb-3">
              <FiTruck className="w-4 h-4 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                {editingMethod ? 'Sửa Phương thức' : 'Thêm Phương thức'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phương thức *
                </label>
                <input
                  type="text"
                  value={formData.Ten}
                  onChange={(e) => setFormData(prev => ({ ...prev, Ten: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Giao hàng nhanh, Giao hàng tiêu chuẩn..."
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
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Mô tả ngắn gọn về phương thức vận chuyển"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí VC (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={formData.PhiVanChuyen}
                    onChange={(e) => setFormData(prev => ({ ...prev, PhiVanChuyen: e.target.value }))}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="30000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    value={formData.ThoiGianDuKien}
                    onChange={(e) => setFormData(prev => ({ ...prev, ThoiGianDuKien: e.target.value }))}
                    placeholder="2-3 ngày"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.TrangThai}
                  onChange={(e) => setFormData(prev => ({ ...prev, TrangThai: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Vô hiệu hóa</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Đang lưu...' : (editingMethod ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shippings;