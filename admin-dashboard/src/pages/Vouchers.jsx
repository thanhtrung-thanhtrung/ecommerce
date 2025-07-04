import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiGift,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAdmin } from "../contexts/AdminContext";

const Vouchers = () => {
  const { getVouchers, createVoucher, updateVoucher, deleteVoucher, loading } =
    useAdmin();

  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await getVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      setVouchers([]);
      toast.error("Lỗi khi tải voucher");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation trước khi submit
    if (!formData.Ten.trim()) {
      toast.error("Tên voucher không được để trống");
      return;
    }

    if (
      !formData.PhanTramGiam ||
      formData.PhanTramGiam <= 0 ||
      formData.PhanTramGiam > 100
    ) {
      toast.error("Phần trăm giảm phải từ 1% đến 100%");
      return;
    }

    if (!formData.GiaTriGiamToiDa || formData.GiaTriGiamToiDa <= 0) {
      toast.error("Giá trị giảm tối đa phải lớn hơn 0");
      return;
    }

    if (!formData.DieuKienApDung || formData.DieuKienApDung < 0) {
      toast.error("Điều kiện áp dụng không được âm");
      return;
    }

    if (!formData.SoLuotSuDung || formData.SoLuotSuDung <= 0) {
      toast.error("Số lượt sử dụng phải lớn hơn 0");
      return;
    }

    if (!formData.NgayBatDau || !formData.NgayKetThuc) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return;
    }

    if (new Date(formData.NgayBatDau) >= new Date(formData.NgayKetThuc)) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    // Chuẩn bị dữ liệu gửi API theo đúng format của curl command
    const submitData = {
      Ten: formData.Ten.trim(),
      MoTa: formData.MoTa.trim(),
      PhanTramGiam: Number(formData.PhanTramGiam),
      GiaTriGiamToiDa: Number(formData.GiaTriGiamToiDa),
      DieuKienApDung: Number(formData.DieuKienApDung),
      SoLuotSuDung: Number(formData.SoLuotSuDung),
      NgayBatDau: formData.NgayBatDau,
      NgayKetThuc: formData.NgayKetThuc,
    };

    // Kiểm tra dữ liệu sau khi parse
    if (
      isNaN(submitData.PhanTramGiam) ||
      isNaN(submitData.GiaTriGiamToiDa) ||
      isNaN(submitData.DieuKienApDung) ||
      isNaN(submitData.SoLuotSuDung)
    ) {
      toast.error("Dữ liệu số không hợp lệ");
      return;
    }

    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.Ma, submitData);
        toast.success("Cập nhật voucher thành công!");
      } else {
        await createVoucher(submitData);
        toast.success("Thêm voucher thành công!");
      }

      setShowModal(false);
      resetForm();
      loadVouchers();
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error(
        "Lỗi khi lưu voucher: " + (error.message || "Không xác định")
      );
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      Ten: voucher.Ten || "",
      MoTa: voucher.MoTa || "",
      PhanTramGiam: voucher.PhanTramGiam?.toString() || "",
      GiaTriGiamToiDa: voucher.GiaTriGiamToiDa?.toString() || "",
      DieuKienApDung: voucher.DieuKienApDung?.toString() || "",
      SoLuotSuDung: voucher.SoLuotSuDung?.toString() || "",
      NgayBatDau: voucher.NgayBatDau ? voucher.NgayBatDau.split("T")[0] : "",
      NgayKetThuc: voucher.NgayKetThuc ? voucher.NgayKetThuc.split("T")[0] : "",
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
        toast.error(
          "Lỗi khi xóa voucher: " + (error.message || "Không xác định")
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
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

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      voucher.Ma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.Ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý voucher</h1>
          <p className="text-sm text-gray-600">{vouchers.length} voucher</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadVouchers}
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
            placeholder="Tìm kiếm voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Compact Vouchers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
              <span className="text-sm text-gray-600">Đang tải...</span>
            </div>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiGift className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có voucher nào
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tạo voucher đầu tiên để thu hút khách hàng
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Tạo voucher đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã / Tên
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điều kiện
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TT
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher, index) => {
                  const expired = isExpired(voucher.NgayKetThuc);

                  return (
                    <tr key={voucher.Ma} className="hover:bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap text-center text-xs">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {voucher.Ma}
                        </div>
                        <div className="text-xs text-gray-500">{voucher.Ten}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {voucher.PhanTramGiam}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Max:{" "}
                          {parseFloat(voucher.GiaTriGiamToiDa || 0)
                            .toLocaleString("vi-VN")
                            .replace(",", ".")}
                          ₫
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {parseFloat(voucher.DieuKienApDung || 0)
                            .toLocaleString("vi-VN")
                            .replace(",", ".")}
                          ₫
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {new Date(voucher.NgayBatDau).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-xs text-gray-500">
                          đến{" "}
                          {new Date(voucher.NgayKetThuc).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {voucher.SoLuotDaSuDung || 0} / {voucher.SoLuotSuDung || 0}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex w-2 h-2 rounded-full ${expired
                              ? "bg-gray-500"
                              : voucher.TrangThai
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          title={
                            expired
                              ? "Hết hạn"
                              : voucher.TrangThai
                                ? "Hoạt động"
                                : "Tạm dừng"
                          }
                        >
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(voucher)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.Ma)}
                            className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Xóa"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">
              {editingVoucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Column */}
                <div className="space-y-3">
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Giảm giá mùa hè"
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
                      placeholder="Mô tả chi tiết"
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        % giảm *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.PhanTramGiam}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            PhanTramGiam: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max (VND) *
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="200000"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điều kiện (VND) *
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
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
                      value={formData.SoLuotSuDung}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          SoLuotSuDung: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bắt đầu *
                      </label>
                      <input
                        type="date"
                        value={formData.NgayBatDau}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            NgayBatDau: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kết thúc *
                      </label>
                      <input
                        type="date"
                        value={formData.NgayKetThuc}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            NgayKetThuc: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Tạm dừng</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
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
