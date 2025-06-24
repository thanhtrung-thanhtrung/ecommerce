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
    s.Ten.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhà cung cấp</h1>
          <p className="text-gray-600 mt-1">
            Danh sách nhà cung cấp ({suppliers.length})
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSuppliers}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600"
          >
            <FiPlus className="w-4 h-4" />
            <span>Thêm nhà cung cấp</span>
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-lg text-gray-600 mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiUsers className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có nhà cung cấp nào
            </h3>
          </div>
        ) : (
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">Tên</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">SĐT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">Địa chỉ</th>
                <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase tracking-wider  text-center">Trạng thái</th>
                <th className="px-4 py-2  text-xs font-medium text-gray-500 uppercase tracking-wider  text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s, idx) => (
                <tr key={s.id} className="border-b">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{s.Ten}</td>
                  <td className="px-4 py-2">{s.Email}</td>
                  <td className="px-4 py-2">{s.SDT}</td>
                  <td className="px-4 py-2">{s.DiaChi}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${s.TrangThai ? "bg-green-500" : "bg-red-500"}`}
                      title={s.TrangThai ? "Hoạt động" : "Không hoạt động"}
                    ></span>
                  </td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:underline"
                    >
                      <FiEdit2 className="inline w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:underline"
                    >
                      <FiTrash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Tên"
                value={formData.Ten}
                onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={formData.SDT}
                onChange={(e) => setFormData({ ...formData, SDT: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Địa chỉ"
                value={formData.DiaChi}
                onChange={(e) => setFormData({ ...formData, DiaChi: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {editingSupplier ? "Cập nhật" : "Thêm mới"}
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
