import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiPercent } from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";
import { toast } from "react-toastify";

const Vouchers = () => {
  const { getVouchers, createVoucher, updateVoucher, deleteVoucher, updateVoucherStatus, loading } = useAdmin();

  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    Ma: "",
    Ten: "",
    MoTa: "",
    PhanTramGiam: "",
    GiaTriGiamToiDa: "",
    NgayBatDau: "",
    NgayKetThuc: "",
    SoLuotSuDung: "",
    DieuKienApDung: "",
    TrangThai: 1,
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await getVouchers();
      const data = response?.data || response || [];
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setVouchers([]);
      toast.error("Lỗi khi tải danh sách voucher");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Kiểm tra ngày không được trong quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh chính xác

    const startDate = new Date(formData.NgayBatDau);
    const endDate = new Date(formData.NgayKetThuc);

    // Kiểm tra ngày bắt đầu không được trong quá khứ
    if (startDate < today) {
      toast.error("Ngày bắt đầu không được trong quá khứ!");
      return;
    }

    // Kiểm tra ngày kết thúc không được trong quá khứ
    if (endDate < today) {
      toast.error("Ngày kết thúc không được trong quá khứ!");
      return;
    }

    // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
    if (endDate <= startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    // Validation bổ sung
    if (parseInt(formData.PhanTramGiam) <= 0 || parseInt(formData.PhanTramGiam) > 100) {
      toast.error("Phần trăm giảm phải từ 1% đến 100%!");
      return;
    }

    if (parseFloat(formData.GiaTriGiamToiDa) <= 0) {
      toast.error("Giá trị giảm tối đa phải lớn hơn 0!");
      return;
    }

    if (parseInt(formData.SoLuotSuDung) <= 0) {
      toast.error("Số lượt sử dụng phải lớn hơn 0!");
      return;
    }

    if (parseFloat(formData.DieuKienApDung) < 0) {
      toast.error("Điều kiện áp dụng không được âm!");
      return;
    }

    try {
      const voucherData = {
        ...formData,
        PhanTramGiam: parseInt(formData.PhanTramGiam),
        GiaTriGiamToiDa: parseFloat(formData.GiaTriGiamToiDa),
        SoLuotSuDung: parseInt(formData.SoLuotSuDung),
        DieuKienApDung: parseFloat(formData.DieuKienApDung),
      };

      if (editingVoucher) {
        await updateVoucher(editingVoucher.Ma, voucherData);
        toast.success("Cập nhật voucher thành công!");
      } else {
        await createVoucher(voucherData);
        toast.success("Thêm voucher thành công!");
      }

      setShowModal(false);
      resetForm();
      loadVouchers();
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("Lỗi khi lưu voucher: " + (error.message || "Không xác định"));
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      Ma: voucher.Ma || "",
      Ten: voucher.Ten || "",
      MoTa: voucher.MoTa || "",
      PhanTramGiam: voucher.PhanTramGiam || "",
      GiaTriGiamToiDa: voucher.GiaTriGiamToiDa || "",
      NgayBatDau: voucher.NgayBatDau ? voucher.NgayBatDau.split('T')[0] : "",
      NgayKetThuc: voucher.NgayKetThuc ? voucher.NgayKetThuc.split('T')[0] : "",
      SoLuotSuDung: voucher.SoLuotSuDung || "",
      DieuKienApDung: voucher.DieuKienApDung || "",
      TrangThai: voucher.TrangThai ?? 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (voucherCode) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) {
      try {
        await deleteVoucher(voucherCode);
        loadVouchers();
        toast.success("Xóa voucher thành công!");
      } catch (error) {
        console.error("Error deleting voucher:", error);
        toast.error("Lỗi khi xóa voucher: " + (error.message || "Không xác định"));
      }
    }
  };

  const handleStatusToggle = async (voucherCode, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await updateVoucherStatus(voucherCode, newStatus);
      loadVouchers();
      toast.success(`${newStatus === 1 ? 'Kích hoạt' : 'Vô hiệu hóa'} voucher thành công!`);
    } catch (error) {
      console.error("Error updating voucher status:", error);
      toast.error("Lỗi khi cập nhật trạng thái voucher");
    }
  };

  const resetForm = () => {
    setFormData({
      Ma: "",
      Ten: "",
      MoTa: "",
      PhanTramGiam: "",
      GiaTriGiamToiDa: "",
      NgayBatDau: "",
      NgayKetThuc: "",
      SoLuotSuDung: "",
      DieuKienApDung: "",
      TrangThai: 1,
    });
    setEditingVoucher(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredVouchers = vouchers.filter((voucher) =>
    (voucher.Ma || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (voucher.Ten || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
          <p className="text-sm text-gray-600">{vouchers.length} voucher</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadVouchers}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 text-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>Thêm Voucher</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
              <span>Đang tải...</span>
            </div>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiPercent className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có voucher nào</h3>
            <p className="text-sm text-gray-500 mb-4">Thêm voucher đầu tiên để bắt đầu</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Thêm voucher đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên & Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.Ma} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{voucher.Ma}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{voucher.Ten}</div>
                      <div className="text-sm text-gray-500">{voucher.MoTa}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{voucher.PhanTramGiam}%</div>
                      <div className="text-sm text-gray-500">
                        Tối đa: {formatCurrency(voucher.GiaTriGiamToiDa)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(voucher.NgayBatDau)}</div>
                      <div>đến {formatDate(voucher.NgayKetThuc)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{voucher.SoLuotDaSuDung || 0}/{voucher.SoLuotSuDung}</div>
                      <div className="text-xs text-gray-500">
                        Điều kiện: {formatCurrency(voucher.DieuKienApDung)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(voucher.Ma, voucher.TrangThai)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${voucher.TrangThai === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {voucher.TrangThai === 1 ? "Hoạt động" : "Không hoạt động"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(voucher)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.Ma)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-4 h-4" />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingVoucher ? "Chỉnh sửa Voucher" : "Thêm Voucher mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.Ma}
                    onChange={(e) => setFormData({ ...formData, Ma: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingVoucher}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) => setFormData({ ...formData, Ten: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.MoTa}
                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phần trăm giảm (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.PhanTramGiam}
                    onChange={(e) => setFormData({ ...formData, PhanTramGiam: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị giảm tối đa *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.GiaTriGiamToiDa}
                    onChange={(e) => setFormData({ ...formData, GiaTriGiamToiDa: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.NgayBatDau}
                    onChange={(e) => setFormData({ ...formData, NgayBatDau: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.NgayKetThuc}
                    onChange={(e) => setFormData({ ...formData, NgayKetThuc: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượt sử dụng *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.SoLuotSuDung}
                    onChange={(e) => setFormData({ ...formData, SoLuotSuDung: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điều kiện áp dụng *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.DieuKienApDung}
                    onChange={(e) => setFormData({ ...formData, DieuKienApDung: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Giá trị đơn hàng tối thiểu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.TrangThai}
                    onChange={(e) => setFormData({ ...formData, TrangThai: parseInt(e.target.value) })}
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
                  {loading ? "Đang lưu..." : editingVoucher ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
