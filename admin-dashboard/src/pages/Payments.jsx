import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { useAdmin } from '../contexts/AdminContext';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiCreditCard, FiDollarSign, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const Payments = () => {
  const {
    loading,
    getPaymentMethodsAdmin,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    updatePaymentStatus
  } = useAdmin();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    Ten: '',
    MoTa: '',
    TrangThai: 1
  });

  // Load payment methods
  const loadPaymentMethods = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "") params.status = statusFilter;

      const methods = await getPaymentMethodsAdmin(params);
      setPaymentMethods(Array.isArray(methods) ? methods : []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Lỗi khi tải danh sách phương thức thanh toán');
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, [searchTerm, statusFilter]);

  // Reset form data
  const resetForm = () => {
    setFormData({
      Ten: '',
      MoTa: '',
      TrangThai: 1
    });
    setEditingMethod(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingMethod) {
        response = await updatePaymentMethod(editingMethod.id, formData);
      } else {
        response = await createPaymentMethod(formData);
      }

      if (response.success) {
        toast.success(response.message || (editingMethod ? 'Cập nhật thành công' : 'Thêm thành công'));
        setShowModal(false);
        resetForm();
        loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error saving payment method:', error);

      // Xử lý lỗi validation từ backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach((err, index) => {
          const message = err.msg || err.message;
          setTimeout(() => {
            toast.error(message, {
              autoClose: 4000,
              position: "top-right"
            });
          }, index * 200);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi khi lưu phương thức thanh toán');
      }
    }
  };

  // Handle delete
  const handleDelete = async (method) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phương thức thanh toán "${method.Ten}"?`)) {
      return;
    }

    try {
      const response = await deletePaymentMethod(method.id);

      if (response.success) {
        toast.success(response.message || 'Xóa thành công');
        loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi khi xóa phương thức thanh toán');
      }
    }
  };

  // Handle edit
  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      Ten: method.Ten || '',
      MoTa: method.MoTa || '',
      TrangThai: method.TrangThai || 1
    });
    setShowModal(true);
  };

  // Handle toggle status
  const handleToggleStatus = async (method) => {
    try {
      const newStatus = method.TrangThai === 1 ? 0 : 1;
      const response = await updatePaymentStatus(method.id, newStatus);

      if (response.success) {
        toast.success(response.message || 'Cập nhật trạng thái thành công');
        loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Hoạt động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Tạm dừng
      </span>
    );
  };

  // Get payment method icon
  const getPaymentIcon = (methodName) => {
    const name = methodName?.toLowerCase() || '';
    if (name.includes('vnpay')) {
      return '💳';
    } else if (name.includes('momo')) {
      return '📱';
    } else if (name.includes('zalo')) {
      return '💰';
    } else if (name.includes('cod') || name.includes('tiền mặt')) {
      return '💵';
    }
    return '💳';
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phương thức Thanh toán</h1>
          <p className="text-sm text-gray-600">{paymentMethods.length} phương thức</p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm phương thức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Hoạt động</option>
            <option value="0">Tạm dừng</option>
          </select>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={loadPaymentMethods}
              className="bg-gray-500 text-white px-3 py-2 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1.5 text-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương thức</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
                      <span className="text-sm text-gray-600">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : paymentMethods.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <FiCreditCard className="w-12 h-12 text-gray-400" />
                      <span className="text-sm">Không có phương thức thanh toán nào</span>
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
                paymentMethods.map((method, index) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getPaymentIcon(method.Ten)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{method.Ten}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 max-w-48 truncate">
                        {method.MoTa || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(method.TrangThai)}
                        <button
                          onClick={() => handleToggleStatus(method)}
                          className="text-gray-500 hover:text-gray-700"
                          title={method.TrangThai === 1 ? "Tạm dừng" : "Kích hoạt"}
                        >
                          {method.TrangThai === 1 ? (
                            <FiToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(method)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center space-x-2 mb-4">
              <FiCreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                {editingMethod ? 'Sửa Phương thức' : 'Thêm Phương thức'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="VNPay, MoMo, COD..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Mô tả ngắn gọn về phương thức thanh toán"
                />
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
                  <option value={0}>Tạm dừng</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
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

export default Payments;