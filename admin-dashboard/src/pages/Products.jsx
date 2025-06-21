import React, { useState, useEffect } from "react"
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiUpload, FiRefreshCw, FiSave, FiX } from "react-icons/fi"
import { toast } from "react-toastify"
import { useAdmin } from "../contexts/AdminContext"

const Products = () => {
  const {
    getProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    getCategories,
    getBrands,
    getSuppliers,
    loading,
  } = useAdmin()

  // States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  })

  // Form data
  const [formData, setFormData] = useState({
    Ten: "",
    MoTa: "",
    MoTaChiTiet: "",
    Gia: "",
    GiaKhuyenMai: "",
    id_DanhMuc: "",
    id_ThuongHieu: "",
    id_NhaCungCap: "",
    ThongSoKyThuat: {
      ChatLieu: "",
      KieuGiay: "",
      XuatXu: "",
    },
  })

  // Product variants
  const [variants, setVariants] = useState([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])

  // Images
  const [selectedImages, setSelectedImages] = useState({
    anhChinh: null,
    anhPhu: [],
  })

  // Thêm state cho ảnh hiện có khi edit
  const [existingImages, setExistingImages] = useState({
    anhChinh: null,
    anhPhu: [],
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [pagination.page, searchTerm])

  const loadInitialData = async () => {
    try {
      await Promise.all([loadProducts(), loadCategories(), loadBrands(), loadSuppliers(), loadColors(), loadSizes()])
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const loadProducts = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
      }

      const data = await getProductsAdmin(params)
      setProducts(data?.products || [])
      setPagination((prev) => ({
        ...prev,
        total: data?.pagination?.total || 0,
      }))
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await getCategories()
      const data = response?.data || response
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading categories:", error)
      setCategories([])
    }
  }

  const loadBrands = async () => {
    try {
      const response = await getBrands()
      const data = response?.data || response
      setBrands(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading brands:", error)
      setBrands([])
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers()
      const data = response?.data || response
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading suppliers:", error)
      setSuppliers([])
    }
  }

  const loadColors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/products/colors`)
      if (response.ok) {
        const data = await response.json()
        setColors(Array.isArray(data) ? data : data?.data || [])
      }
    } catch (error) {
      console.error("Error loading colors:", error)
      setColors([])
    }
  }

  const loadSizes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/products/sizes`)
      if (response.ok) {
        const data = await response.json()
        setSizes(Array.isArray(data) ? data : data?.data || [])
      }
    } catch (error) {
      console.error("Error loading sizes:", error)
      setSizes([])
    }
  }

  // Form handlers
  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const updateVariant = (index, field, value) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)))
  }

  const addVariant = () => {
    setVariants((prev) => [...prev, { id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
  }

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleMainImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImages((prev) => ({ ...prev, anhChinh: file }))
    }
  }

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedImages((prev) => ({
      ...prev,
      anhPhu: [...prev.anhPhu, ...files],
    }))
  }

  const removeAdditionalImage = (index) => {
    setSelectedImages((prev) => ({
      ...prev,
      anhPhu: prev.anhPhu.filter((_, i) => i !== index),
    }))
  }

  // Validation
  const validateForm = () => {
    const errors = []

    if (!formData.Ten?.trim()) errors.push("Tên sản phẩm không được để trống")
    if (!formData.MoTa?.trim()) errors.push("Mô tả không được để trống")
    if (!formData.Gia || Number.parseFloat(formData.Gia) <= 0) errors.push("Giá bán phải lớn hơn 0")
    if (!formData.id_DanhMuc) errors.push("Vui lòng chọn danh mục")
    if (!formData.id_ThuongHieu) errors.push("Vui lòng chọn thương hiệu")
    if (!formData.id_NhaCungCap) errors.push("Vui lòng chọn nhà cung cấp")
    if (!selectedImages.anhChinh && !editingProduct) errors.push("Vui lòng chọn ảnh chính")

    const validVariants = variants.filter((v) => v.id_KichCo && v.id_MauSac && v.MaSanPham?.trim())
    if (validVariants.length === 0) errors.push("Phải có ít nhất một biến thể hợp lệ")

    return errors
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Basic info
      formDataToSend.append("Ten", formData.Ten.trim())
      formDataToSend.append("MoTa", formData.MoTa.trim())
      formDataToSend.append("MoTaChiTiet", formData.MoTaChiTiet?.trim() || "")
      formDataToSend.append("ThongSoKyThuat", JSON.stringify(formData.ThongSoKyThuat))
      formDataToSend.append("Gia", Number.parseFloat(formData.Gia).toString())
      formDataToSend.append(
        "GiaKhuyenMai",
        formData.GiaKhuyenMai ? Number.parseFloat(formData.GiaKhuyenMai).toString() : "0",
      )
      formDataToSend.append("id_DanhMuc", Number.parseInt(formData.id_DanhMuc).toString())
      formDataToSend.append("id_ThuongHieu", Number.parseInt(formData.id_ThuongHieu).toString())
      formDataToSend.append("id_NhaCungCap", Number.parseInt(formData.id_NhaCungCap).toString())

      // Variants
      const processedVariants = variants
        .filter((v) => v.id_KichCo && v.id_MauSac && v.MaSanPham?.trim())
        .map((variant) => ({
          id_KichCo: Number.parseInt(variant.id_KichCo),
          id_MauSac: Number.parseInt(variant.id_MauSac),
          MaSanPham: variant.MaSanPham.trim().toUpperCase(),
          SoLuong: Number.parseInt(variant.SoLuong) || 0,
        }))

      formDataToSend.append("bienThe", JSON.stringify(processedVariants))

      // Images
      if (selectedImages.anhChinh) {
        formDataToSend.append("anhChinh", selectedImages.anhChinh)
      }

      selectedImages.anhPhu.forEach((file) => {
        formDataToSend.append("anhPhu", file)
      })

      // API call
      let result
      if (editingProduct) {
        result = await updateProduct(editingProduct.id, formDataToSend)
      } else {
        result = await createProduct(formDataToSend)
      }

      setShowModal(false)
      resetForm()
      loadProducts()

      toast.success(editingProduct ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!")
    } catch (error) {
      console.error("Error saving product:", error)

      let errorMessage = "Lỗi khi lưu sản phẩm"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNew = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)

    let thongSoKyThuat = { ChatLieu: "", KieuGiay: "", XuatXu: "" }
    if (product.ThongSoKyThuat) {
      try {
        thongSoKyThuat =
          typeof product.ThongSoKyThuat === "string" ? JSON.parse(product.ThongSoKyThuat) : product.ThongSoKyThuat
      } catch (error) {
        console.error("Error parsing ThongSoKyThuat:", error)
      }
    }

    setFormData({
      Ten: product.Ten || "",
      MoTa: product.MoTa || "",
      MoTaChiTiet: product.MoTaChiTiet || "",
      ThongSoKyThuat: thongSoKyThuat,
      Gia: product.Gia?.toString() || "",
      GiaKhuyenMai: product.GiaKhuyenMai?.toString() || "",
      id_DanhMuc: product.id_DanhMuc?.toString() || "",
      id_ThuongHieu: product.id_ThuongHieu?.toString() || "",
      id_NhaCungCap: product.id_NhaCungCap?.toString() || "",
    })

    // Load existing variants
    if (product.bienThe && Array.isArray(product.bienThe) && product.bienThe.length > 0) {
      setVariants(
        product.bienThe.map((bt) => ({
          id: bt.id || null, // Thêm ID để track biến thể hiện có
          id_KichCo: bt.id_KichCo?.toString() || "",
          id_MauSac: bt.id_MauSac?.toString() || "",
          MaSanPham: bt.MaSanPham || "",
          SoLuong: bt.SoLuong || 0,
          TenMauSac: bt.TenMauSac || "", // Để hiển thị tên
          TenKichCo: bt.TenKichCo || "", // Để hiển thị tên
        })),
      )
    } else {
      setVariants([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
    }

    // Load existing images
    if (product.HinhAnh) {
      try {
        const images = typeof product.HinhAnh === "string" ? JSON.parse(product.HinhAnh) : product.HinhAnh
        setExistingImages({
          anhChinh: images.anhChinh || null,
          anhPhu: images.anhPhu || [],
        })
      } catch (error) {
        console.error("Error parsing images:", error)
        setExistingImages({ anhChinh: null, anhPhu: [] })
      }
    } else {
      setExistingImages({ anhChinh: product.anhChinh || null, anhPhu: [] })
    }

    // Reset selected images
    setSelectedImages({ anhChinh: null, anhPhu: [] })

    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(id)
        loadProducts()
        toast.success("Xóa sản phẩm thành công!")
      } catch (error) {
        console.error("Error deleting product:", error)
        toast.error("Lỗi khi xóa sản phẩm: " + (error.message || "Không xác định"))
      }
    }
  }

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
      ThongSoKyThuat: { ChatLieu: "", KieuGiay: "", XuatXu: "" },
    })
    setEditingProduct(null)
    setVariants([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
    setSelectedImages({ anhChinh: null, anhPhu: [] })
    setExistingImages({ anhChinh: null, anhPhu: [] })
  }

  // Thêm function để thay thế ảnh chính hiện có
  const replaceMainImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImages((prev) => ({ ...prev, anhChinh: file }))
      // Xóa ảnh hiện có
      setExistingImages((prev) => ({ ...prev, anhChinh: null }))
    }
  }

  // Thêm function để xóa ảnh phụ hiện có
  const removeExistingAdditionalImage = (index) => {
    setExistingImages((prev) => ({
      ...prev,
      anhPhu: prev.anhPhu.filter((_, i) => i !== index),
    }))
  }

  // Thêm function để thay thế ảnh phụ hiện có
  const replaceAdditionalImage = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      // Thêm ảnh mới vào selected
      setSelectedImages((prev) => ({
        ...prev,
        anhPhu: [...prev.anhPhu, file],
      }))
      // Xóa ảnh hiện có tại vị trí này
      removeExistingAdditionalImage(index)
    }
  }

  const filteredProducts = products.filter((product) => product.Ten?.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-1">Tổng cộng {pagination.total} sản phẩm</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadProducts}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={handleAddNew}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-8 h-8 animate-spin mr-3 text-blue-500" />
              <span className="text-lg text-gray-600">Đang tải sản phẩm...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiImage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sản phẩm nào</h3>
            <p className="text-gray-500 mb-6">Thử thay đổi từ khóa tìm kiếm hoặc thêm sản phẩm mới</p>
            <button
              onClick={handleAddNew}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                    {product.anhChinh ? (
                      <img
                        src={product.anhChinh || "/placeholder.svg"}
                        alt={product.Ten}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiImage className="w-12 h-12 text-gray-300" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.TrangThai ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.TrangThai ? "Đang bán" : "Ngừng bán"}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {product.GiaKhuyenMai && product.GiaKhuyenMai > 0 && product.GiaKhuyenMai < product.Gia && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-full">
                          -{Math.round(((product.Gia - product.GiaKhuyenMai) / product.Gia) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">{product.Ten}</h3>

                    {/* Brand & Category */}
                    <div className="flex items-center space-x-1 mb-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {product.TenThuongHieu}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full">
                        {product.TenDanhMuc}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      {product.GiaKhuyenMai && product.GiaKhuyenMai > 0 && product.GiaKhuyenMai < product.Gia ? (
                        <div className="space-y-1">
                          <span className="text-lg font-bold text-red-600">
                            {product.GiaKhuyenMai?.toLocaleString("vi-VN")}₫
                          </span>
                          <div className="text-sm text-gray-500 line-through">
                            {product.Gia?.toLocaleString("vi-VN")}₫
                          </div>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">{product.Gia?.toLocaleString("vi-VN")}₫</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                      >
                        <FiEdit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                      >
                        <FiTrash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến{" "}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{" "}
                  trong tổng số <span className="font-medium">{pagination.total}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.Ten}
                        onChange={(e) => handleInputChange("Ten", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập tên sản phẩm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả ngắn <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.MoTa}
                        onChange={(e) => handleInputChange("MoTa", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mô tả ngắn"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
                      <textarea
                        value={formData.MoTaChiTiet}
                        onChange={(e) => handleInputChange("MoTaChiTiet", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mô tả chi tiết"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá bán <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.Gia}
                          onChange={(e) => handleInputChange("Gia", e.target.value)}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Giá khuyến mãi</label>
                        <input
                          type="number"
                          value={formData.GiaKhuyenMai}
                          onChange={(e) => handleInputChange("GiaKhuyenMai", e.target.value)}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.id_DanhMuc}
                        onChange={(e) => handleInputChange("id_DanhMuc", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.Ten}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thương hiệu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.id_ThuongHieu}
                        onChange={(e) => handleInputChange("id_ThuongHieu", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Chọn thương hiệu</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.Ten}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhà cung cấp <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.id_NhaCungCap}
                        onChange={(e) => handleInputChange("id_NhaCungCap", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Chọn nhà cung cấp</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.Ten}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thông số kỹ thuật */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Chất liệu</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.ChatLieu}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.ChatLieu", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Vải mesh, cao su..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu giày</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.KieuGiay}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.KieuGiay", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Thể thao, chạy bộ..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Xuất xứ</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.XuatXu}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.XuatXu", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Chính hãng, Việt Nam..."
                      />
                    </div>
                  </div>
                </div>

                {/* Biến thể sản phẩm */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Biến thể sản phẩm {editingProduct && "(Hiện có)"}
                    </h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      <FiPlus className="w-4 h-4 inline mr-1" />
                      Thêm biến thể
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {variants.map((variant, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Biến thể #{index + 1}
                            {variant.id && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                ID: {variant.id}
                              </span>
                            )}
                          </span>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Kích cỡ</label>
                            <select
                              value={variant.id_KichCo}
                              onChange={(e) => updateVariant(index, "id_KichCo", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Chọn size</option>
                              {sizes.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.Ten}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Màu sắc</label>
                            <select
                              value={variant.id_MauSac}
                              onChange={(e) => updateVariant(index, "id_MauSac", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Chọn màu</option>
                              {colors.map((color) => (
                                <option key={color.id} value={color.id}>
                                  {color.Ten}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mã SP</label>
                            <input
                              type="text"
                              value={variant.MaSanPham}
                              onChange={(e) => updateVariant(index, "MaSanPham", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="VD: NIKE-001"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
                            <input
                              type="number"
                              value={variant.SoLuong}
                              onChange={(e) => updateVariant(index, "SoLuong", e.target.value)}
                              min="0"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {/* Hiển thị thông tin hiện có nếu đang edit */}
                        {editingProduct && variant.id && (
                          <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                            <span className="font-medium">Hiện có:</span> {variant.TenMauSac} - Size {variant.TenKichCo} - Mã: {variant.MaSanPham} - Tồn kho: {variant.SoLuong}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hình ảnh sản phẩm */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh sản phẩm</h3>

                  {/* Ảnh chính */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh chính <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Hiển thị ảnh chính hiện có */}
                    {existingImages.anhChinh && (
                      <div className="mb-3">
                        <div className="relative inline-block">
                          <img
                            src={existingImages.anhChinh}
                            alt="Ảnh chính hiện có"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-blue-200"
                          />
                          <div className="absolute -top-2 -right-2 space-x-1">
                            <label className="bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                              <FiEdit2 className="w-3 h-3" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={replaceMainImage}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setExistingImages(prev => ({...prev, anhChinh: null}))}
                              className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ảnh chính hiện có</p>
                      </div>
                    )}

                    {/* Upload ảnh chính mới */}
                    {!existingImages.anhChinh && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        {selectedImages.anhChinh ? (
                          <div className="space-y-3">
                            <img
                              src={URL.createObjectURL(selectedImages.anhChinh)}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImages(prev => ({...prev, anhChinh: null}))}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">Click để chọn ảnh chính</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleMainImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ảnh phụ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh phụ (Tối đa 5 ảnh)</label>
                    
                    {/* Hiển thị ảnh phụ hiện có */}
                    {existingImages.anhPhu.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Ảnh phụ hiện có:</p>
                        <div className="flex flex-wrap gap-3">
                          {existingImages.anhPhu.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Ảnh phụ ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border"
                              />
                              <div className="absolute -top-2 -right-2 space-x-1">
                                <label className="bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                                  <FiEdit2 className="w-3 h-3" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => replaceAdditionalImage(index, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeExistingAdditionalImage(index)}
                                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hiển thị ảnh phụ mới được chọn */}
                    {selectedImages.anhPhu.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Ảnh phụ mới:</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedImages.anhPhu.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border-2 border-green-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload ảnh phụ mới */}
                    {(existingImages.anhPhu.length + selectedImages.anhPhu.length) < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <label className="cursor-pointer">
                          <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">Click để thêm ảnh phụ</p>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAdditionalImagesChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" />
                        <span>{editingProduct ? "Cập nhật" : "Thêm mới"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
