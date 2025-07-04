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
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-sm text-gray-600">
            {categories.length} danh mục
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadCategories}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
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
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Compact Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
              <span className="text-sm text-gray-600">Đang tải...</span>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiTag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có danh mục nào
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Thêm danh mục đầu tiên để bắt đầu
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Thêm danh mục đầu tiên
            </button>
          </div>
        ) : (
          <table className="table-auto w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên danh mục
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-900">{index + 1}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{category.Ten}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleToggleStatus(category.id, category.TrangThai)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${category.TrangThai
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                      title={category.TrangThai ? "Click để ẩn" : "Click để hiện"}
                    >
                      {category.TrangThai ? (
                        <>
                          <FiEye className="w-3 h-3 mr-1" />
                          Hiện
                        </>
                      ) : (
                        <>
                          <FiEyeOff className="w-3 h-3 mr-1" />
                          Ẩn
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
        )}
      </div>

      {/* Compact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {loading
                    ? "Đang lưu..."
                    : editingCategory
                      ? "Cập nhật"
                      : "Thêm"}
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
