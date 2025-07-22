import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiTag, FiUpload, FiImage } from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";
import { toast } from "react-toastify";

const Brands = () => {
  const { getBrands, createBrand, updateBrand, deleteBrand, loading } = useAdmin();

  const [brands, setBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [formData, setFormData] = useState({
    Ten: "",
    MoTa: "",
    Website: "",
    Logo: "",
    TrangThai: 1,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      const data = response?.data || response;
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching brands:", error);
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

      formDataToSend.append("Ten", formData.Ten);
      formDataToSend.append("MoTa", formData.MoTa);
      formDataToSend.append("Website", formData.Website);
      formDataToSend.append("TrangThai", formData.TrangThai);

      if (selectedLogo) {
        formDataToSend.append("Logo", selectedLogo);
      }

      if (editingBrand) {
        await updateBrand(editingBrand.id, formDataToSend);
        toast.success("Cập nhật thương hiệu thành công!");
      } else {
        await createBrand(formDataToSend);
        toast.success("Thêm thương hiệu thành công!");
      }

      setShowModal(false);
      resetForm();
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      toast.error("Lỗi khi lưu thương hiệu: " + (error.message || "Không xác định"));
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      Ten: brand.Ten || brand.TenThuongHieu || "",
      MoTa: brand.MoTa || "",
      Website: brand.Website || "",
      TrangThai: brand.TrangThai ?? 1,
      Logo: brand.Logo || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) {
      try {
        await deleteBrand(id);
        loadBrands();
        toast.success("Xóa thương hiệu thành công!");
      } catch (error) {
        console.error("Error deleting brand:", error);
        toast.error(
          error.message === "Không thể xóa thương hiệu đang có sản phẩm"
            ? "Không thể xóa thương hiệu này vì đang được liên kết với sản phẩm. Vui lòng cập nhật hoặc xóa các sản phẩm trước."
            : "Lỗi khi xóa thương hiệu: " + (error.message || "Không xác định")
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      Ten: "",
      MoTa: "",
      Website: "",
      TrangThai: 1,
    });
    setEditingBrand(null);
    setSelectedLogo(null);
  };

  const filteredBrands = brands.filter((brand) =>
    (brand.Ten || brand.TenThuongHieu || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý thương hiệu</h1>
          <p className="text-sm text-gray-600">{brands.length} thương hiệu</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadBrands}
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
            placeholder="Tìm kiếm thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Compact Brands List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
              <span className="text-sm text-gray-600">Đang tải...</span>
            </div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiTag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thương hiệu nào</h3>
            <p className="text-sm text-gray-500 mb-4">Thêm thương hiệu đầu tiên để bắt đầu</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Thêm thương hiệu đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Website
                  </th>
                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Trạng thái
                    </th> */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBrands.map((brand, index) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        {brand.Logo ? (
                          <img
                            src={brand.Logo}
                            alt={brand.Ten || brand.TenThuongHieu}
                            className="h-6 w-6 object-cover rounded border flex-shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <FiImage className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate" title={brand.Ten || brand.TenThuongHieu}>
                            {brand.Ten || brand.TenThuongHieu}
                          </div>
                          {brand.MoTa && (
                            <div
                              className="text-xs text-gray-500 line-clamp-1 max-w-xs"
                              title={brand.MoTa}
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {brand.MoTa}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 whitespace-nowrap">
                      {brand.Website ? (
                        <a
                          href={brand.Website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block"
                          title={brand.Website}
                        >
                          {brand.Website.replace(/^https?:\/\//, '').substring(0, 15)}...
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {/* <td className="px-2 py-2 whitespace-nowrap">
                        <span className={`inline-flex w-2 h-2 rounded-full ${brand.TrangThai === 1 || brand.TrangThai === "1"
                          ? "bg-green-500"
                          : "bg-red-500"
                          }`} title={brand.TrangThai === 1 || brand.TrangThai === "1" ? "Hoạt động" : "Không hoạt động"}>
                        </span>
                      </td> */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
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
          <div className="bg-white rounded-lg p-4 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-3">
              {editingBrand ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên thương hiệu *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Ten: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo thương hiệu
                  </label>

                  {/* Hiển thị ảnh hiện tại */}
                  {editingBrand && formData.Logo && !selectedLogo && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Ảnh hiện tại:</p>
                      <img
                        src={formData.Logo}
                        alt="Logo hiện tại"
                        className="h-16 w-16 object-cover rounded border"
                      />
                    </div>
                  )}

                  {/* Hiển thị ảnh mới */}
                  {selectedLogo && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Ảnh mới:</p>
                      <img
                        src={URL.createObjectURL(selectedLogo)}
                        alt="Logo mới"
                        className="h-16 w-16 object-cover rounded border"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {selectedLogo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Đã chọn: {selectedLogo.name}
                    </p>
                  )}
                  {editingBrand && formData.Logo && !selectedLogo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống nếu không muốn thay đổi logo
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) =>
                      setFormData({ ...formData, TrangThai: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
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
                  {loading ? "Đang lưu..." : editingBrand ? "Cập nhật" : "Thêm"}
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
