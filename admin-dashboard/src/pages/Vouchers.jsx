import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPercent,
  FiCalendar,
  FiToggleLeft,
  FiToggleRight,
  FiTag,
  FiDollarSign,
} from "react-icons/fi";
import { useAdmin } from "../contexts/AdminContext";

const Vouchers = () => {
  const {
    getVouchers,
    createVoucher,
    updateVoucher,
    updateVoucherStatus,
    loading,
  } = useAdmin();
  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    Ma: "",
    Ten: "",
    MoTa: "",
    PhanTramGiam: "",
    GiaTriGiamToiDa: "",
    DieuKienApDung: "",
    SoLuotSuDung: "",
    NgayBatDau: "",
    NgayKetThuc: "",
    TrangThai: 1,
  });

  // Mock data for vouchers
  const mockVouchers = [
    {
      id: 1,
      Ma: "WELCOME10",
      Ten: "Giảm giá chào mừng",
      MoTa: "Voucher giảm giá 10% cho khách hàng mới",
      PhanTramGiam: 10,
      GiaTriGiamToiDa: 100000,
      DieuKienApDung: 500000,
      SoLuotSuDung: 100,
      SoLuotDaSuDung: 25,
      NgayBatDau: "2024-06-01",
      NgayKetThuc: "2024-12-31",
      TrangThai: 1,
    },
    {
      id: 2,
      Ma: "SUMMER25",
      Ten: "Giảm giá mùa hè",
      MoTa: "Voucher giảm giá 25% cho mùa hè",
      PhanTramGiam: 25,
      GiaTriGiamToiDa: 250000,
      DieuKienApDung: 1000000,
      SoLuotSuDung: 50,
      SoLuotDaSuDung: 12,
      NgayBatDau: "2024-06-15",
      NgayKetThuc: "2024-08-31",
      TrangThai: 1,
    },
    {
      id: 3,
      Ma: "FLASH20",
      Ten: "Flash Sale",
      MoTa: "Voucher giảm giá 20% trong 24h",
      PhanTramGiam: 20,
      GiaTriGiamToiDa: 200000,
      DieuKienApDung: 800000,
      SoLuotSuDung: 30,
      SoLuotDaSuDung: 30,
      NgayBatDau: "2024-06-10",
      NgayKetThuc: "2024-06-11",
      TrangThai: 0,
    },
  ];

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      // Temporarily use mock data
      setVouchers(mockVouchers);
      // const data = await getVouchers();
      // setVouchers(data || []);
    } catch (error) {
      console.error("Error loading vouchers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.Ma, formData);
      } else {
        await createVoucher(formData);
      }
      setShowModal(false);
      resetForm();
      loadVouchers();
    } catch (error) {
      console.error("Error saving voucher:", error);
      alert(
        "Lỗi khi lưu voucher: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData(voucher);
    setShowModal(true);
  };

  const handleToggleStatus = async (voucherCode, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await updateVoucherStatus(voucherCode, newStatus);

      // Update local state
      setVouchers(
        vouchers.map((v) =>
          v.Ma === voucherCode ? { ...v, TrangThai: newStatus } : v
        )
      );
    } catch (error) {
      console.error("Error updating voucher status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      Ma: "",
      Ten: "",
      MoTa: "",
      PhanTramGiam: "",
      GiaTriGiamToiDa: "",
      DieuKienApDung: "",
      SoLuotSuDung: "",
      NgayBatDau: "",
      NgayKetThuc: "",
      TrangThai: 1,
    });
    setEditingVoucher(null);
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.Ma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.Ten?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "" || voucher.TrangThai.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.NgayBatDau);
    const endDate = new Date(voucher.NgayKetThuc);

    if (voucher.TrangThai === 0)
      return { label: "Tạm dừng", color: "bg-red-100 text-red-800" };
    if (now < startDate)
      return { label: "Chưa bắt đầu", color: "bg-gray-100 text-gray-800" };
    if (now > endDate)
      return { label: "Đã hết hạn", color: "bg-gray-100 text-gray-800" };
    if (voucher.SoLuotDaSuDung >= voucher.SoLuotSuDung)
      return { label: "Đã hết lượt", color: "bg-orange-100 text-orange-800" };
    return { label: "Đang hoạt động", color: "bg-green-100 text-green-800" };
  };

  const voucherStats = {
    total: vouchers.length,
    active: vouchers.filter(
      (v) => v.TrangThai === 1 && new Date() <= new Date(v.NgayKetThuc)
    ).length,
    expired: vouchers.filter((v) => new Date() > new Date(v.NgayKetThuc))
      .length,
    disabled: vouchers.filter((v) => v.TrangThai === 0).length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý mã giảm giá
          </h1>
          <p className="text-gray-600">
            Tạo và quản lý các voucher giảm giá cho khách hàng
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo voucher mới</span>
        </button>
      </div>

      {/* Voucher Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiTag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tổng voucher</p>
              <p className="text-2xl font-bold text-gray-900">
                {voucherStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiPercent className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Đang hoạt động
              </p>
              <p className="text-2xl font-bold text-green-600">
                {voucherStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FiCalendar className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đã hết hạn</p>
              <p className="text-2xl font-bold text-gray-600">
                {voucherStats.expired}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiToggleLeft className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tạm dừng</p>
              <p className="text-2xl font-bold text-red-600">
                {voucherStats.disabled}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm mã voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Tạm dừng</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ngày hết hạn"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã voucher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giảm giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điều kiện
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sử dụng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời hạn
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
            {filteredVouchers.map((voucher) => {
              const status = getVoucherStatus(voucher);
              const usagePercent =
                (voucher.SoLuotDaSuDung / voucher.SoLuotSuDung) * 100;

              return (
                <tr key={voucher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {voucher.Ma}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {voucher.Ten}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiPercent className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm font-medium text-red-600">
                        {voucher.PhanTramGiam}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Tối đa {voucher.GiaTriGiamToiDa?.toLocaleString()}₫
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiDollarSign className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-900">
                        {voucher.DieuKienApDung?.toLocaleString()}₫
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Đơn hàng tối thiểu
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {voucher.SoLuotDaSuDung}/{voucher.SoLuotSuDung}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {voucher.NgayBatDau}
                    </div>
                    <div className="text-sm text-gray-500">
                      đến {voucher.NgayKetThuc}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() =>
                        handleToggleStatus(voucher.Ma, voucher.TrangThai)
                      }
                      className={`mr-3 ${
                        voucher.TrangThai === 1
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      title={voucher.TrangThai === 1 ? "Tạm dừng" : "Kích hoạt"}
                    >
                      {voucher.TrangThai === 1 ? (
                        <FiToggleRight className="w-4 h-4" />
                      ) : (
                        <FiToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(voucher)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingVoucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.Ma}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Ma: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="VD: SUMMER25"
                    required
                    disabled={editingVoucher}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.Ten}
                    onChange={(e) =>
                      setFormData({ ...formData, Ten: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Giảm giá mùa hè"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.MoTa}
                    onChange={(e) =>
                      setFormData({ ...formData, MoTa: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Mô tả về voucher..."
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
                    onChange={(e) =>
                      setFormData({ ...formData, PhanTramGiam: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị giảm tối đa (₫) *
                  </label>
                  <input
                    type="number"
                    value={formData.GiaTriGiamToiDa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        GiaTriGiamToiDa: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điều kiện áp dụng (₫) *
                  </label>
                  <input
                    type="number"
                    value={formData.DieuKienApDung}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        DieuKienApDung: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="500000"
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
                    onChange={(e) =>
                      setFormData({ ...formData, SoLuotSuDung: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
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
                    onChange={(e) =>
                      setFormData({ ...formData, NgayBatDau: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, NgayKetThuc: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
                    : editingVoucher
                    ? "Cập nhật"
                    : "Tạo voucher"}
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
