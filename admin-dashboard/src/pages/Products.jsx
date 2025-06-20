import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiImage,
  FiUpload,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Products = () => {
  const {
    getProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
  } = useAdmin();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  const [formData, setFormData] = useState({
    Ten: "",
    MoTa: "",
    MoTaChiTiet: "",
    ThongSoKyThuat: {
      ChatLieu: "",
      KieuGiay: "",
      XuatXu: "",
    },
    Gia: "",
    GiaKhuyenMai: "",
    id_DanhMuc: "",
    id_ThuongHieu: "",
    id_NhaCungCap: "",
    bienThe: [],
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProductsAdmin();
      setProducts(data?.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
      // Fallback to mock data if API fails
      setProducts([
        {
          id: 1,
          Ten: "Giày Nike Air Max 2024",
          MoTa: "Giày thể thao cao cấp với công nghệ đệm khí",
          Gia: 2500000,
          GiaKhuyenMai: 2200000,
          TenThuongHieu: "Nike",
          TenDanhMuc: "Giày thể thao",
          TongSoLuong: 50,
          SoLuongDaBan: 15,
          TrangThai: 1,
          anhChinh: null,
        },
        {
          id: 2,
          Ten: "Giày Adidas Ultraboost",
          MoTa: "Giày chạy bộ với công nghệ Boost",
          Gia: 1800000,
          GiaKhuyenMai: null,
          TenThuongHieu: "Adidas",
          TenDanhMuc: "Giày chạy bộ",
          TongSoLuong: 30,
          SoLuongDaBan: 8,
          TrangThai: 1,
          anhChinh: null,
        },
      ]);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Append form fields
      Object.keys(formData).forEach((key) => {
        if (key === "ThongSoKyThuat" || key === "bienThe") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append images
      if (selectedImages.length > 0) {
        formDataToSend.append("anhChinh", selectedImages[0]);
        selectedImages.slice(1).forEach((img) => {
          formDataToSend.append("anhPhu", img);
        });
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, formDataToSend);
      } else {
        await createProduct(formDataToSend);
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(
        "Lỗi khi lưu sản phẩm: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      Ten: "",
      MoTa: "",
      MoTaChiTiet: "",
      Gia: "",
      GiaKhuyenMai: "",
      id_DanhMuc: "",
      id_ThuongHieu: "",
      id_NhaCungCap: "",
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((product) =>
    product.Ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý sản phẩm giày
          </h1>
          <p className="text-gray-600">
            Quản lý tất cả sản phẩm giày trong cửa hàng
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600"
        >
          <FiPlus className="w-4 h-4" />
          <span>Thêm sản phẩm giày</span>
        </button>
      </div>

      {/* Enhanced Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm giày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
            <option value="">Tất cả danh mục</option>
            <option value="1">Giày thể thao</option>
            <option value="2">Giày công sở</option>
            <option value="3">Giày casual</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
            <option value="">Tất cả thương hiệu</option>
            <option value="1">Nike</option>
            <option value="2">Adidas</option>
            <option value="3">Converse</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
            <option value="">Trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Enhanced Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm giày
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá bán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kho hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center">
                      {product.anhChinh ? (
                        <img
                          src={product.anhChinh}
                          alt={product.Ten}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <FiImage className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.Ten}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.MoTa}
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.TenThuongHieu} • {product.TenDanhMuc}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-semibold">
                    {product.Gia?.toLocaleString()}₫
                  </div>
                  {product.GiaKhuyenMai && (
                    <div className="text-sm text-red-500 line-through">
                      {product.GiaKhuyenMai?.toLocaleString()}₫
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.TongSoLuong || 0} đôi
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.SoLuongDaBan || 0} đã bán
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.TrangThai
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.TrangThai ? "Đang bán" : "Ngừng bán"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Modal with Image Upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct
                ? "Chỉnh sửa sản phẩm giày"
                : "Thêm sản phẩm giày mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm giày *
                    </label>
                    <input
                      type="text"
                      value={formData.Ten}
                      onChange={(e) =>
                        setFormData({ ...formData, Ten: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Giày Nike Air Max 2024"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả ngắn
                    </label>
                    <textarea
                      value={formData.MoTa}
                      onChange={(e) =>
                        setFormData({ ...formData, MoTa: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Mô tả ngắn gọn về sản phẩm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá bán *
                      </label>
                      <input
                        type="number"
                        value={formData.Gia}
                        onChange={(e) =>
                          setFormData({ ...formData, Gia: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá khuyến mãi
                      </label>
                      <input
                        type="number"
                        value={formData.GiaKhuyenMai}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            GiaKhuyenMai: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh sản phẩm
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="text-center">
                          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            Click để chọn hình ảnh
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF tối đa 10MB
                          </p>
                        </div>
                      </label>
                      {selectedImages.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-green-600">
                            Đã chọn {selectedImages.length} hình ảnh
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      value={formData.MoTaChiTiet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          MoTaChiTiet: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Mô tả chi tiết về sản phẩm giày..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chất liệu
                      </label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.ChatLieu}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ThongSoKyThuat: {
                              ...formData.ThongSoKyThuat,
                              ChatLieu: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Da, vải, cao su..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kiểu giày
                      </label>
                      <select
                        value={formData.ThongSoKyThuat.KieuGiay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ThongSoKyThuat: {
                              ...formData.ThongSoKyThuat,
                              KieuGiay: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn kiểu</option>
                        <option value="Thể thao">Thể thao</option>
                        <option value="Công sở">Công sở</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Chạy bộ">Chạy bộ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Xuất xứ
                      </label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.XuatXu}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ThongSoKyThuat: {
                              ...formData.ThongSoKyThuat,
                              XuatXu: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Chính hãng, Replica..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Danh mục *
                      </label>
                      <select
                        value={formData.id_DanhMuc}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_DanhMuc: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        <option value="1">Giày thể thao</option>
                        <option value="2">Giày công sở</option>
                        <option value="3">Giày casual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thương hiệu *
                      </label>
                      <select
                        value={formData.id_ThuongHieu}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_ThuongHieu: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Chọn thương hiệu</option>
                        <option value="1">Nike</option>
                        <option value="2">Adidas</option>
                        <option value="3">Converse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhà cung cấp *
                      </label>
                      <select
                        value={formData.id_NhaCungCap}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_NhaCungCap: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Chọn nhà cung cấp</option>
                        <option value="1">Nhà cung cấp A</option>
                        <option value="2">Nhà cung cấp B</option>
                        <option value="3">Nhà cung cấp C</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
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
                    : editingProduct
                    ? "Cập nhật"
                    : "Thêm sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
