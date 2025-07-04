// Converted from Categories management to Suppliers management
import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAdmin } from "../contexts/AdminContext";

const Suppliers = () => {
  const {
    getSuppliersAll,
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useAdmin();

  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    Ten: "",
    Email: "",
    SDT: "",
    DiaChi: "",
    TrangThai: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await getSuppliersAll();
      setSuppliers(res?.data || []);
    } catch (error) {
      toast.error("Lỗi khi tải nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success("Cập nhật nhà cung cấp thành công!");
      } else {
        await createSupplier(formData);
        toast.success("Thêm nhà cung cấp thành công!");
      }
      setShowModal(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      toast.error(error?.message || "Lỗi khi lưu nhà cung cấp");
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      Ten: supplier.Ten || "",
      Email: supplier.Email || "",
      SDT: supplier.SDT || "",
      DiaChi: supplier.DiaChi || "",
      TrangThai: supplier.TrangThai ?? 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) {
      try {
        await deleteSupplier(id);
        toast.success("Xóa thành công!");
        loadSuppliers();
      } catch (error) {
        toast.error(error?.message || "Lỗi khi xóa nhà cung cấp");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      Ten: "",
      Email: "",
      SDT: "",
      DiaChi: "",
      TrangThai: 1,
    });
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.Ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý nhà cung cấp</h1>
          <p className="text-sm text-gray-600">{suppliers.length} nhà cung cấp</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadSuppliers}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-blue-600 text-sm"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm</span>
          </button>
        </div>
      </div>

      {/* Compact Search */}
      <div className="mb-4 bg-white p-3 rounded-lg shadow">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Compact Suppliers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p className="text-sm text-gray-600 mt-2">Đang tải...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có nhà cung cấp nào
            </h3>
            <p className="text-sm text-gray-500 mb-4">Thêm nhà cung cấp đầu tiên để bắt đầu</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Thêm nhà cung cấp đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">TT</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs text-gray-900">{idx + 1}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{s.Ten}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{s.Email}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{s.SDT}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate" title={s.DiaChi}>{s.DiaChi}</td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${s.TrangThai ? "bg-green-500" : "bg-red-500"}`}
                        title={s.TrangThai ? "Hoạt động" : "Không hoạt động"}
                      ></span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">
              {editingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Tên nhà cung cấp"
                value={formData.Ten}
                onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={formData.SDT}
                onChange={(e) => setFormData({ ...formData, SDT: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Địa chỉ"
                value={formData.DiaChi}
                onChange={(e) => setFormData({ ...formData, DiaChi: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  {editingSupplier ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
