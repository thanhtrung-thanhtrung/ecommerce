import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiTag,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAdmin } from "../contexts/AdminContext";

const Categories = () => {
  const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryStatus,
    loading,
  } = useAdmin();

  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    TenDanhMuc: "",
    TrangThai: 1,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      const categoriesData = response?.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      toast.error("Lỗi khi tải danh mục");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        Ten: formData.TenDanhMuc,
        TrangThai: formData.TrangThai,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, dataToSend);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory(dataToSend);
        toast.success("Thêm danh mục thành công!");
      }

      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(
        "Lỗi khi lưu danh mục: " +
          (error.response?.data?.message || error.message || "Không xác định")
      );
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      TenDanhMuc: category.Ten || "",
      TrangThai: category.TrangThai ?? 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(id);
        loadCategories();
        toast.success("Xóa danh mục thành công!");
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error(
          "Lỗi khi xóa danh mục: " + (error.message || "Không xác định")
        );
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateCategoryStatus(id, currentStatus ? 0 : 1);
      loadCategories();
      toast.success("Cập nhật trạng thái thành công!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        "Lỗi khi cập nhật trạng thái: " + (error.message || "Không xác định")
      );
    }
  };

  const resetForm = () => {
    setFormData({
      TenDanhMuc: "",
      TrangThai: 1,
    });
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter((category) =>
    (category.Ten || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục sản phẩm ({categories.length} danh mục)
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadCategories}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-8 h-8 animate-spin mr-3 text-blue-500" />
              <span className="text-lg text-gray-600">Đang tải danh mục...</span>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiTag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có danh mục nào
            </h3>
            <p className="text-gray-500 mb-6">
              Thêm danh mục đầu tiên để bắt đầu
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Thêm danh mục đầu tiên
            </button>
          </div>
        ) : (
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên danh mục
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="border-b">
                  <td className="px-4 py-2 text-gray-900">{index + 1}</td>
                  <td className="px-4 py-2 text-gray-900">{category.Ten}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex w-2 h-2 rounded-full ${
                        category.TrangThai
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      title={category.TrangThai ? "Hoạt động" : "Không hoạt động"}
                    >
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:underline flex items-center space-x-1"
                      >
                        <FiTrash2 className="w-4 h-4" />
                     
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    value={formData.TenDanhMuc}
                    onChange={(e) =>
                      setFormData({ ...formData, TenDanhMuc: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Giày thể thao"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        TrangThai: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading
                    ? "Đang lưu..."
                    : editingCategory
                    ? "Cập nhật"
                    : "Thêm danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
