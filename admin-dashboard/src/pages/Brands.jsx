import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Brands = () => {
  const { getBrands, createBrand, updateBrand, deleteBrand, loading } =
    useAdmin();
  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    Ten: "",
    MoTa: "",
    TrangThai: 1,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data || []);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData);
      } else {
        await createBrand(formData);
      }
      setShowModal(false);
      resetForm();
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData(brand);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      try {
        await deleteBrand(id);
        loadBrands();
      } catch (error) {
        console.error("Error deleting brand:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      Ten: "",
      MoTa: "",
      TrangThai: 1,
    });
    setEditingBrand(null);
  };

  const filteredBrands = brands.filter((brand) =>
    brand.Ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý thương hiệu
          </h1>
          <p className="text-gray-600">Quản lý các thương hiệu giày</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-600"
        >
          <FiPlus className="w-4 h-4" />
          <span>Thêm thương hiệu</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <div key={brand.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {brand.Ten}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  brand.TrangThai
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {brand.TrangThai ? "Hoạt động" : "Không hoạt động"}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{brand.MoTa}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(brand)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(brand.id)}
                className="text-red-600 hover:text-red-900"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBrand ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên thương hiệu
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) =>
                      setFormData({ ...formData, Ten: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.MoTa}
                    onChange={(e) =>
                      setFormData({ ...formData, MoTa: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    rows="3"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
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
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;
