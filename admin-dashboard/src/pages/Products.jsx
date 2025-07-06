"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiUpload, FiRefreshCw, FiSave, FiX } from "react-icons/fi"
import { toast } from "react-toastify"
import { useAdmin } from "../contexts/AdminContext"

const Products = () => {
  const {
    getProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getBrands,
    getSuppliers,
    loading,
    getProductVariants,
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
    limit: 10,
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

  // Product variants - mặc định số lượng = 0 khi thêm mới
  const [variants, setVariants] = useState([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])

  // Images
  const [selectedImages, setSelectedImages] = useState({
    anhChinh: null,
    anhPhu: [],
  })

  const [existingImages, setExistingImages] = useState({
    anhChinh: null,
    anhPhu: [],
  })

  // Load data functions
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
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/products/colors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setColors(Array.isArray(data) ? data : data?.data || []);
      } else {
        throw new Error('Failed to fetch colors');
      }
    } catch (error) {
      console.error("Error loading colors:", error);
      setColors([]);
    }
  };

  const loadSizes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/products/sizes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSizes(Array.isArray(data) ? data : data?.data || []);
      } else {
        throw new Error('Failed to fetch sizes');
      }
    } catch (error) {
      console.error("Error loading sizes:", error);
      setSizes([]);
    }
  };

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
    // Khi thêm variant mới, mặc định số lượng = 0
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
  // Validation nghiệp vụ
  const validateForm = () => {
    const errors = []

    // Validation cơ bản
    if (!formData.Ten?.trim()) errors.push("Tên sản phẩm không được để trống")
    if (!formData.MoTa?.trim()) errors.push("Mô tả không được để trống")
    if (!formData.Gia || Number.parseFloat(formData.Gia) <= 0) errors.push("Giá bán phải lớn hơn 0")
    if (!formData.id_DanhMuc) errors.push("Vui lòng chọn danh mục")
    if (!formData.id_ThuongHieu) errors.push("Vui lòng chọn thương hiệu")
    if (!formData.id_NhaCungCap) errors.push("Vui lòng chọn nhà cung cấp")
    if (!selectedImages.anhChinh && !editingProduct) errors.push("Vui lòng chọn ảnh chính")

    // Validation nghiệp vụ - Giá khuyến mãi
    const giaGoc = Number.parseFloat(formData.Gia) || 0
    const giaKhuyenMai = Number.parseFloat(formData.GiaKhuyenMai) || 0

    if (giaKhuyenMai > 0) {
      if (giaKhuyenMai >= giaGoc) {
        errors.push("Giá khuyến mãi phải nhỏ hơn giá gốc")
      }

      // Kiểm tra tỷ lệ giảm giá hợp lý (không quá 70%)
      const tiLeGiam = ((giaGoc - giaKhuyenMai) / giaGoc) * 100
      if (tiLeGiam > 70) {
        errors.push("Tỷ lệ giảm giá không được vượt quá 70%")
      }

      if (tiLeGiam < 5) {
        errors.push("Tỷ lệ giảm giá tối thiểu phải từ 5%")
      }
    }

    // Validation variants
    const validVariants = variants.filter((v) => v.id_KichCo && v.id_MauSac && v.MaSanPham?.trim())
    if (validVariants.length === 0) {
      errors.push("Phải có ít nhất một biến thể hợp lệ")
    }

    // Kiểm tra trùng lặp mã sản phẩm trong variants
    const maSanPhamSet = new Set()
    const duplicateCodes = []
    validVariants.forEach((variant, index) => {
      const maSP = variant.MaSanPham?.trim().toUpperCase()
      if (maSP) {
        if (maSanPhamSet.has(maSP)) {
          duplicateCodes.push(`Mã "${maSP}" (biến thể ${index + 1})`)
        } else {
          maSanPhamSet.add(maSP)
        }
      }
    })

    if (duplicateCodes.length > 0) {
      errors.push(`Mã sản phẩm bị trùng lặp: ${duplicateCodes.join(", ")}`)
    }

    // Kiểm tra trùng lặp size-màu trong variants
    const sizeColorSet = new Set()
    const duplicateSizeColor = []
    validVariants.forEach((variant, index) => {
      const key = `${variant.id_KichCo}-${variant.id_MauSac}`
      if (sizeColorSet.has(key)) {
        const sizeName = sizes.find(s => s.id == variant.id_KichCo)?.Ten || variant.id_KichCo
        const colorName = colors.find(c => c.id == variant.id_MauSac)?.Ten || variant.id_MauSac
        duplicateSizeColor.push(`${sizeName}-${colorName} (biến thể ${index + 1})`)
      } else {
        sizeColorSet.add(key)
      }
    })

    if (duplicateSizeColor.length > 0) {
      errors.push(`Kết hợp size-màu bị trùng lặp: ${duplicateSizeColor.join(", ")}`)
    }

    // Validation mã sản phẩm format
    validVariants.forEach((variant, index) => {
      const maSP = variant.MaSanPham?.trim()
      if (maSP) {
        // Kiểm tra format: chỉ chứa chữ in hoa, số và dấu gạch ngang
        if (!/^[A-Z0-9\-]+$/.test(maSP)) {
          errors.push(`Mã sản phẩm biến thể ${index + 1}: chỉ được chứa chữ in hoa, số và dấu gạch ngang`)
        }

        // Kiểm tra độ dài
        if (maSP.length < 3 || maSP.length > 20) {
          errors.push(`Mã sản phẩm biến thể ${index + 1}: phải từ 3-20 ký tự`)
        }

        // Kiểm tra không được bắt đầu hoặc kết thúc bằng dấu gạch ngang
        if (maSP.startsWith('-') || maSP.endsWith('-')) {
          errors.push(`Mã sản phẩm biến thể ${index + 1}: không được bắt đầu/kết thúc bằng dấu gạch ngang`)
        }

        // Kiểm tra không được có nhiều dấu gạch ngang liên tiếp
        if (maSP.includes('--')) {
          errors.push(`Mã sản phẩm biến thể ${index + 1}: không được có dấu gạch ngang liên tiếp`)
        }
      }
    })

    // Validation thông số kỹ thuật
    const { ChatLieu, KieuGiay, XuatXu } = formData.ThongSoKyThuat
    if (ChatLieu && ChatLieu.length > 100) {
      errors.push("Chất liệu không được vượt quá 100 ký tự")
    }
    if (KieuGiay && KieuGiay.length > 100) {
      errors.push("Kiểu giày không được vượt quá 100 ký tự")
    }
    if (XuatXu && XuatXu.length > 100) {
      errors.push("Xuất xứ không được vượt quá 100 ký tự")
    }

    // Validation tên sản phẩm
    if (formData.Ten?.trim().length < 3) {
      errors.push("Tên sản phẩm phải có ít nhất 3 ký tự")
    }
    if (formData.Ten?.trim().length > 255) {
      errors.push("Tên sản phẩm không được vượt quá 255 ký tự")
    }

    // Validation mô tả
    if (formData.MoTa?.trim().length < 10) {
      errors.push("Mô tả phải có ít nhất 10 ký tự")
    }
    if (formData.MoTa?.trim().length > 1000) {
      errors.push("Mô tả không được vượt quá 1000 ký tự")
    }

    // Validation mô tả chi tiết
    if (formData.MoTaChiTiet?.trim() && formData.MoTaChiTiet.trim().length > 5000) {
      errors.push("Mô tả chi tiết không được vượt quá 5000 ký tự")
    }

    // Validation giá - kiểm tra giá hợp lý
    if (giaGoc > 0) {
      if (giaGoc < 1000) {
        errors.push("Giá sản phẩm tối thiểu là 1,000 VNĐ")
      }
      if (giaGoc > 100000000) {
        errors.push("Giá sản phẩm không được vượt quá 100,000,000 VNĐ")
      }
    }

    // Validation số lượng variants hợp lý
    if (validVariants.length > 50) {
      errors.push("Số lượng biến thể không được vượt quá 50")
    }

    return errors
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
      return
    }

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

      // Process variants - đảm bảo có ít nhất một variant hợp lệ
      const processedVariants = variants
        .filter((v) => v.id_KichCo && v.id_MauSac && v.MaSanPham?.trim())
        .map((variant) => ({
          ...(variant.id && { id: variant.id }), // Chỉ thêm id nếu đang edit
          id_KichCo: Number.parseInt(variant.id_KichCo),
          id_MauSac: Number.parseInt(variant.id_MauSac),
          MaSanPham: variant.MaSanPham.trim().toUpperCase(),
          SoLuong: editingProduct ? Number.parseInt(variant.SoLuong) || 0 : 0, // Khi thêm mới = 0, khi sửa = giá trị hiện tại
        }))

      // Kiểm tra lại số lượng variants sau khi filter
      if (processedVariants.length === 0) {
        toast.error("Phải có ít nhất một biến thể hợp lệ (có đủ size, màu và mã sản phẩm)")
        return
      }

      // Log để debug
      console.log("Processed variants:", processedVariants)

      // Append variants as JSON string
      formDataToSend.append("bienThe", JSON.stringify(processedVariants))

      // Images
      if (selectedImages.anhChinh) {
        formDataToSend.append("anhChinh", selectedImages.anhChinh)
      }
      selectedImages.anhPhu.forEach((file) => {
        formDataToSend.append("anhPhu", file)
      })

      // Log FormData để debug
      console.log("FormData entries:")
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value)
      }

      // API call
      if (editingProduct) {
        await updateProduct(editingProduct.id, formDataToSend)
        toast.success("Cập nhật sản phẩm thành công!")
      } else {
        await createProduct(formDataToSend)
        toast.success("Thêm sản phẩm thành công!")
      }

      setShowModal(false)
      resetForm()
      loadProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      const errorMessage = error.response?.data?.message || error.message || "Lỗi khi lưu sản phẩm"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNew = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = async (product) => {
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

    // Load existing variants với số lượng hiện tại từ kho
    try {
      // Nếu có getProductVariants thì dùng để lấy số lượng chính xác từ kho
      let productVariants = product.bienThe || []

      if (getProductVariants && product.id) {
        try {
          const variantsData = await getProductVariants(product.id)
          productVariants = variantsData?.data || variantsData || product.bienThe || []
        } catch (error) {
          console.error("Error loading product variants:", error)
          // Fallback to product.bienThe if API call fails
        }
      }

      if (productVariants && Array.isArray(productVariants) && productVariants.length > 0) {
        setVariants(
          productVariants.map((bt) => ({
            id: bt.id || null,
            id_KichCo: bt.id_KichCo?.toString() || "",
            id_MauSac: bt.id_MauSac?.toString() || "",
            MaSanPham: bt.MaSanPham || "",
            SoLuong: bt.SoLuong || 0, // Số lượng hiện tại trong kho
            TenMauSac: bt.TenMauSac || "",
            TenKichCo: bt.TenKichCo || "",
          })),
        )
      } else {
        setVariants([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
      }
    } catch (error) {
      console.error("Error processing variants:", error)
      setVariants([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
    }

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
    // Reset variants với số lượng mặc định = 0 cho thêm mới
    setVariants([{ id_KichCo: "", id_MauSac: "", MaSanPham: "", SoLuong: 0 }])
    setSelectedImages({ anhChinh: null, anhPhu: [] })
    setExistingImages({ anhChinh: null, anhPhu: [] })
  }

  // Image functions
  const replaceMainImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImages((prev) => ({ ...prev, anhChinh: file }))
      setExistingImages((prev) => ({ ...prev, anhChinh: null }))
    }
  }

  const removeExistingAdditionalImage = (index) => {
    setExistingImages((prev) => ({
      ...prev,
      anhPhu: prev.anhPhu.filter((_, i) => i !== index),
    }))
  }

  const replaceAdditionalImage = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImages((prev) => ({
        ...prev,
        anhPhu: [...prev.anhPhu, file],
      }))
      removeExistingAdditionalImage(index)
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const filteredProducts = products.filter((product) => product.Ten?.toLowerCase().includes(searchTerm.toLowerCase()))
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
              <p className="text-sm text-gray-600">Tổng: {pagination.total} sản phẩm</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadProducts}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-200 transition-colors text-sm"
                disabled={loading}
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Làm mới</span>
              </button>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm text-sm"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Compact Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-500" />
              <span className="text-sm text-gray-600">Đang tải...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <FiImage className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sản phẩm</h3>
              <p className="text-sm text-gray-500 mb-4">Thử thay đổi từ khóa hoặc thêm mới</p>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Thêm sản phẩm đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thương hiệu
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá bán
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {product.anhChinh ? (
                              <img
                                className="h-8 w-8 rounded object-cover border border-gray-200"
                                src={product.anhChinh || "/placeholder.svg"}
                                alt={product.Ten}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                                <FiImage className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-medium text-gray-900 max-w-xs truncate">{product.Ten}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{product.MoTa}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {product.TenThuongHieu || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {product.TenDanhMuc || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          {product.GiaKhuyenMai && product.GiaKhuyenMai > 0 && product.GiaKhuyenMai < product.Gia ? (
                            <div>
                              <span className="font-bold text-red-600 text-sm">
                                {product.GiaKhuyenMai?.toLocaleString("vi-VN")}₫
                              </span>
                              <div className="text-xs text-gray-500 line-through">
                                {product.Gia?.toLocaleString("vi-VN")}₫
                              </div>
                            </div>
                          ) : (
                            <span className="font-bold text-gray-900 text-sm">
                              {product.Gia?.toLocaleString("vi-VN")}₫
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.TrangThai ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.TrangThai ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
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

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                  className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> - {" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "} / {" "}
                    <span className="font-medium">{pagination.total}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${page === pagination.page
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
                      className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal - keep existing but make header more compact */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Keep existing form but reduce padding */}
              <form onSubmit={handleSubmit} className="p-4 space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên sản phẩm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.Ten}
                          onChange={(e) => handleInputChange("Ten", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập tên sản phẩm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả ngắn <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.MoTa}
                          onChange={(e) => handleInputChange("MoTa", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập mô tả ngắn"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                        <textarea
                          value={formData.MoTaChiTiet}
                          onChange={(e) => handleInputChange("MoTaChiTiet", e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập mô tả chi tiết"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giá bán <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.Gia}
                            onChange={(e) => handleInputChange("Gia", e.target.value)}
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Giá khuyến mãi</label>
                          <input
                            type="number"
                            value={formData.GiaKhuyenMai}
                            onChange={(e) => handleInputChange("GiaKhuyenMai", e.target.value)}
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.id_DanhMuc}
                          onChange={(e) => handleInputChange("id_DanhMuc", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thương hiệu <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.id_ThuongHieu}
                          onChange={(e) => handleInputChange("id_ThuongHieu", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhà cung cấp <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.id_NhaCungCap}
                          onChange={(e) => handleInputChange("id_NhaCungCap", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>

                {/* Thông số kỹ thuật */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông số kỹ thuật</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.ChatLieu}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.ChatLieu", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Vải mesh, cao su..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kiểu giày</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.KieuGiay}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.KieuGiay", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Thể thao, chạy bộ..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Xuất xứ</label>
                      <input
                        type="text"
                        value={formData.ThongSoKyThuat.XuatXu}
                        onChange={(e) => handleInputChange("ThongSoKyThuat.XuatXu", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Chính hãng, Việt Nam..."
                      />
                    </div>
                  </div>
                </div>

                {/* Biến thể sản phẩm */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chi tiết sản phẩm {editingProduct && "(Hiện có)"}
                    </h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Thêm size - Màu
                      {editingProduct ? " (Không thể chỉnh sửa số lượng tồn kho)" : ""}

                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {variants.map((variant, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Chọn Size - Màu #{index + 1}
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
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                              placeholder="VD: NIKE-001"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Số lượng {editingProduct && "(Hiện tại trong kho)"}

                            </label>
                            <input
                              type="number"
                              value={variant.SoLuong}
                              onChange={(e) => updateVariant(index, "SoLuong", e.target.value)}
                              min="0"
                              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 ${editingProduct ? "bg-gray-100 cursor-not-allowed" : ""
                                }`}
                              placeholder="0"
                              readOnly={editingProduct} // Không cho phép sửa số lượng khi edit
                              disabled={editingProduct}
                            />
                          </div>
                        </div>

                        {/* Hiển thị thông tin hiện có nếu đang edit */}
                        {editingProduct && variant.id && (
                          <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                            <span className="font-medium">Hiện có:</span> {variant.TenMauSac} - Size {variant.TenKichCo}{" "}
                            - Mã: {variant.MaSanPham} - Tồn kho: {variant.SoLuong}
                            <div className="mt-1 text-orange-600 font-medium">
                              * Số lượng tồn kho không thể chỉnh sửa ở đây
                            </div>
                          </div>
                        )}

                        {/* Hiển thị thông báo cho variant mới khi thêm sản phẩm */}
                        {!editingProduct && (
                          <div className="mt-2 text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
                            <span className="font-medium">Lưu ý:</span> Số lượng mặc định sẽ được đặt là 0 khi tạo sản
                            phẩm mới
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hình ảnh sản phẩm */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Hình ảnh sản phẩm</h3>

                  {/* Ảnh chính */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh chính <span className="text-red-500">*</span>
                    </label>

                    {/* Hiển thị ảnh chính hiện có */}
                    {existingImages.anhChinh && (
                      <div className="mb-3">
                        <div className="relative inline-block">
                          <img
                            src={existingImages.anhChinh || "/placeholder.svg"}
                            alt="Ảnh chính hiện có"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-blue-200"
                          />
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            <label className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                              <FiEdit2 className="w-4 h-4" />
                              <input type="file" accept="image/*" onChange={replaceMainImage} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={() => setExistingImages((prev) => ({ ...prev, anhChinh: null }))}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Ảnh chính hiện có</p>
                      </div>
                    )}

                    {/* Upload ảnh chính mới */}
                    {!existingImages.anhChinh && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-white">
                        {selectedImages.anhChinh ? (
                          <div className="space-y-4">
                            <img
                              src={URL.createObjectURL(selectedImages.anhChinh) || "/placeholder.svg"}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImages((prev) => ({ ...prev, anhChinh: null }))}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-sm text-gray-600 font-medium">Click để chọn ảnh chính</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                            <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
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
                        <div className="flex flex-wrap gap-4">
                          {existingImages.anhPhu.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Ảnh phụ ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="absolute -top-2 -right-2 flex gap-1">
                                <label className="bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
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
                                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg"
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
                        <div className="flex flex-wrap gap-4">
                          {selectedImages.anhPhu.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border-2 border-green-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload ảnh phụ mới */}
                    {existingImages.anhPhu.length + selectedImages.anhPhu.length < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-white">
                        <label className="cursor-pointer">
                          <FiUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">Click để thêm ảnh phụ</p>
                          <p className="text-xs text-gray-500 mt-1">Có thể chọn nhiều ảnh cùng lúc</p>
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <FiSave className="w-3.5 h-3.5" />
                        <span>{editingProduct ? "Cập nhật" : "Thêm mới"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
