import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import { useAdmin } from '../contexts/AdminContext';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiTag } from "react-icons/fi";

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
    return <div className="p-6 text-gray-600">Đang tải phương thức thanh toán...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FiTag className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phương thức Thanh toán</h1>
            <p className="text-gray-600 mt-1">
              Danh sách phương thức thanh toán ({paymentMethods.length})
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPaymentMethods}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <FiPlus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách phương thức thanh toán */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phương thức</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentMethods.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <FiTag className="w-8 h-8 text-gray-400" />
                    <span>Không có phương thức thanh toán nào</span>
                  </div>
                </td>
              </tr>
            ) : (
              paymentMethods.map((method, index) => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.Ten}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{method.MoTa || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(method)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${method.TrangThai === 1
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {method.TrangThai === 1 ? 'Hoạt động' : 'Tạm dừng'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(method)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-900 transition-colors"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <FiTag className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">
                {editingMethod ? 'Cập nhật' : 'Thêm mới'} phương thức thanh toán
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên phương thức *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) => setFormData({ ...formData, TrangThai: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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