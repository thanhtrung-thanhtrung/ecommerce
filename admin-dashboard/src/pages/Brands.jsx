import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiTag,
  FiUpload,
  FiImage,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Brands = () => {
  const { getBrands, createBrand, updateBrand, deleteBrand, loading } =
    useAdmin();

  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [formData, setFormData] = useState({
    TenThuongHieu: "",
    MoTa: "",
    Website: "",
    TrangThai: 1,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading brands:", error);
      setBrands([]);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    setSelectedLogo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Append form fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Append logo if selected
      if (selectedLogo) {
        formDataToSend.append("logo", selectedLogo);
      }

      if (editingBrand) {
        await updateBrand(editingBrand.id, formDataToSend);
        alert("Cập nhật thương hiệu thành công!");
      } else {
        await createBrand(formDataToSend);
        alert("Thêm thương hiệu thành công!");
      }

      setShowModal(false);
      resetForm();
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      alert("Lỗi khi lưu thương hiệu: " + (error.message || "Không xác định"));
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      TenThuongHieu: brand.TenThuongHieu || brand.Ten || "",
      MoTa: brand.MoTa || "",
      Website: brand.Website || "",
      TrangThai: brand.TrangThai ?? 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      try {
        await deleteBrand(id);
        loadBrands();
        alert("Xóa thương hiệu thành công!");
      } catch (error) {
        console.error("Error deleting brand:", error);
        alert(
          "Lỗi khi xóa thương hiệu: " + (error.message || "Không xác định")
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      TenThuongHieu: "",
      MoTa: "",
      Website: "",
      TrangThai: 1,
    });
    setEditingBrand(null);
    setSelectedLogo(null);
  };

  const filteredBrands = brands.filter((brand) =>
    (brand.TenThuongHieu || brand.Ten || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý thương hiệu
          </h1>
          <p className="text-gray-600">
            Quản lý thương hiệu sản phẩm ({brands.length} thương hiệu)
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadBrands}
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
            <span className="hidden sm:inline">Thêm thương hiệu</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Brands Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-8 h-8 animate-spin mr-3 text-blue-500" />
              <span className="text-lg text-gray-600">
                Đang tải thương hiệu...
              </span>
            </div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiTag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có thương hiệu nào
            </h3>
            <p className="text-gray-500 mb-6">
              Thêm thương hiệu đầu tiên để bắt đầu
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Thêm thương hiệu đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Brand Logo */}
                <div className="h-32 bg-gray-50 flex items-center justify-center">
                  {brand.Logo ? (
                    <img
                      src={brand.Logo}
                      alt={brand.TenThuongHieu || brand.Ten}
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <FiImage className="w-12 h-12 text-gray-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        brand.TrangThai
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {brand.TrangThai ? "Hoạt động" : "Ẩn"}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {brand.TenThuongHieu || brand.Ten}
                  </h3>

                  {brand.MoTa && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {brand.MoTa}
                    </p>
                  )}

                  {brand.Website && (
                    <a
                      href={brand.Website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 mb-3 block truncate"
                    >
                      {brand.Website}
                    </a>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    ID: {brand.id}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      <FiEdit2 className="w-3 h-3 inline mr-1" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-3 h-3 inline mr-1" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingBrand ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên thương hiệu *
                  </label>
                  <input
                    type="text"
                    value={formData.TenThuongHieu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        TenThuongHieu: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Nike, Adidas"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Mô tả về thương hiệu này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.Website}
                    onChange={(e) =>
                      setFormData({ ...formData, Website: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo thương hiệu
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="text-center">
                        <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click để chọn logo
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG tối đa 5MB
                        </p>
                      </div>
                    </label>
                    {selectedLogo && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          Đã chọn: {selectedLogo.name}
                        </p>
                      </div>
                    )}
                  </div>
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
                    : editingBrand
                    ? "Cập nhật"
                    : "Thêm thương hiệu"}
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
