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
      const response = await fetch("http://localhost:5000/api/brands"); // Corrected API endpoint
      const data = await response.json();
      if (data.success) {
        setBrands(data.data);
      }
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

      // Append form fields - using correct API field names
      formDataToSend.append("Ten", formData.Ten);
      formDataToSend.append("MoTa", formData.MoTa);
      formDataToSend.append("Website", formData.Website);
      formDataToSend.append("TrangThai", formData.TrangThai);

      // Append logo if selected
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
      Logo: brand.Logo || "", // Keep current logo URL
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

  const renderBrandList = () => (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              STT
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thương hiệu
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              Website
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              Trạng thái
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredBrands.map((brand, index) => (
            <tr key={brand.id} className="hover:bg-gray-50">
              <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                {index + 1}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center space-x-3">
                  {brand.Logo ? (
                    <img
                      src={brand.Logo}
                      alt={brand.Ten || brand.TenThuongHieu}
                      className="h-8 w-8 object-cover rounded-md border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                      <FiImage className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate" title={brand.Ten || brand.TenThuongHieu}>
                      {brand.Ten || brand.TenThuongHieu}
                    </div>
                    {brand.MoTa && (
                      <div 
                        className="text-xs text-gray-500 line-clamp-2 max-w-xs" 
                        title={brand.MoTa}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
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
              <td className="px-3 py-3 whitespace-nowrap">
                {brand.Website ? (
                  <a
                    href={brand.Website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                    title={brand.Website}
                  >
                    {brand.Website.replace(/^https?:\/\//, '').substring(0, 20)}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="px-2 py-3 whitespace-nowrap">
                <span className={`inline-flex w-2 h-2 rounded-full ${
                  brand.TrangThai === 1 || brand.TrangThai === "1"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`} title={brand.TrangThai === 1 || brand.TrangThai === "1" ? "Hoạt động" : "Không hoạt động"}>
                </span>
              </td>
              <td className="px-2 py-3 whitespace-nowrap">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Thêm thương hiệu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : filteredBrands.length === 0 ? (
          <p className="text-center text-gray-500">Không có thương hiệu nào.</p>
        ) : (
          renderBrandList()
        )}
      </div>

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
                    value={formData.Ten}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Ten: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                  
                  {/* Hiển thị ảnh hiện tại nếu có */}
                  {editingBrand && formData.Logo && !selectedLogo && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                      <img
                        src={formData.Logo}
                        alt="Logo hiện tại"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  
                  {/* Hiển thị ảnh mới được chọn */}
                  {selectedLogo && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Ảnh mới được chọn:</p>
                      <img
                        src={URL.createObjectURL(selectedLogo)}
                        alt="Logo mới"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedLogo && (
                    <p className="text-sm text-gray-500 mt-1">
                      Đã chọn: {selectedLogo.name}
                    </p>
                  )}
                  {editingBrand && formData.Logo && !selectedLogo && (
                    <p className="text-sm text-gray-500 mt-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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
