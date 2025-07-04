import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import { useAdmin } from '../contexts/AdminContext';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiCreditCard } from "react-icons/fi";

const Payments = () => {
  const {
    getPaymentMethodsAdmin,
    createPaymentMethod,
    updatePaymentMethod,
    updatePaymentStatus,
    deletePaymentMethod
  } = useAdmin();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    Ten: '',
    MoTa: '',
    TrangThai: 1
  });

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await getPaymentMethodsAdmin();
      if (Array.isArray(data)) {
        setPaymentMethods(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải phương thức thanh toán:", err);
      toast.error("Lỗi khi tải phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
        toast.success("Cập nhật phương thức thanh toán thành công");
      } else {
        await createPaymentMethod(formData);
        toast.success("Tạo phương thức thanh toán thành công");
      }

      setShowModal(false);
      setEditingMethod(null);
      setFormData({ Ten: '', MoTa: '', TrangThai: 1 });
      fetchPaymentMethods();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      Ten: method.Ten,
      MoTa: method.MoTa || '',
      TrangThai: method.TrangThai
    });
    setShowModal(true);
  };

  const handleStatusToggle = async (method) => {
    try {
      const newStatus = method.TrangThai === 1 ? 0 : 1;
      await updatePaymentStatus(method.id, newStatus);
      toast.success("Cập nhật trạng thái thành công");
      fetchPaymentMethods();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (method) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phương thức "${method.Ten}"?`)) {
      try {
        await deletePaymentMethod(method.id);
        toast.success("Xóa phương thức thanh toán thành công");
        fetchPaymentMethods();
      } catch (error) {
        toast.error(error.message || "Có lỗi xảy ra");
      }
    }
  };

  const resetForm = () => {
    setFormData({ Ten: '', MoTa: '', TrangThai: 1 });
    setEditingMethod(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="p-2">
        <div className="flex justify-center items-center py-8">
          <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
          <span className="text-sm text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phương thức Thanh toán</h1>
          <p className="text-sm text-gray-600">{paymentMethods.length} phương thức</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchPaymentMethods}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-blue-700 text-sm"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm</span>
          </button>
        </div>
      </div>

      {/* Compact Payment Methods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phương thức</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentMethods.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <FiCreditCard className="w-12 h-12 text-gray-400" />
                    <span className="text-sm">Không có phương thức thanh toán nào</span>
                    <button
                      onClick={() => setShowModal(true)}
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
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 text-center">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiCreditCard className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-xs font-medium text-gray-900">{method.Ten}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs text-gray-700">{method.MoTa || '-'}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(method)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${method.TrangThai === 1
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {method.TrangThai === 1 ? 'Hoạt động' : 'Tạm dừng'}
                    </button>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(method)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
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

      {/* Compact Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center space-x-2 mb-3">
              <FiCreditCard className="w-4 h-4 text-blue-600" />
              <h2 className="text-lg font-bold">
                {editingMethod ? 'Cập nhật' : 'Thêm mới'} phương thức
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên phương thức *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Mô tả ngắn gọn về phương thức thanh toán"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) => setFormData({ ...formData, TrangThai: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {editingMethod ? 'Cập nhật' : 'Tạo mới'}
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