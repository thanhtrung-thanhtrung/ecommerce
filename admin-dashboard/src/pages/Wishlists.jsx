import React, { useEffect, useState } from 'react';
import { FiHeart, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';

const Wishlists = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/wishlists/statistics", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-2">
        <div className="flex justify-center items-center py-8">
          <FiRefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
          <span className="text-sm text-gray-600">Đang tải thống kê...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-2">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FiHeart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-red-500">Không thể tải dữ liệu thống kê.</p>
          <button
            onClick={fetchStats}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const { thongKeTongQuan, topSanPhamYeuThich } = stats;

  return (
    <div className="p-2">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thống kê Wishlist</h1>
          <p className="text-sm text-gray-600">Sản phẩm được yêu thích nhất</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-gray-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-gray-600 text-sm"
          disabled={loading}
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Compact Stats Cards */}
      {thongKeTongQuan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-pink-100 rounded">
                <FiHeart className="w-4 h-4 text-pink-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Tổng wishlist</p>
                <p className="text-sm font-bold text-gray-900">{thongKeTongQuan.tongSoWishlist || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded">
                <FiUsers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Người dùng</p>
                <p className="text-sm font-bold text-gray-900">{thongKeTongQuan.soNguoiDungCoWishlist || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded">
                <FiTrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">SP phổ biến</p>
                <p className="text-sm font-bold text-gray-900">{thongKeTongQuan.sanPhamPhoBienNhat || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-purple-100 rounded">
                <FiHeart className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">TB/người</p>
                <p className="text-sm font-bold text-gray-900">
                  {thongKeTongQuan.soNguoiDungCoWishlist > 0
                    ? Math.round(thongKeTongQuan.tongSoWishlist / thongKeTongQuan.soNguoiDungCoWishlist)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Top Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Top sản phẩm được yêu thích</h3>
        </div>

        {!topSanPhamYeuThich || topSanPhamYeuThich.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FiHeart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-sm text-gray-500">Chưa có sản phẩm nào được thêm vào wishlist</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt thích</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topSanPhamYeuThich.map((sp, index) => (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 text-center">{index + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{sp.Ten}</div>
                      <div className="text-xs text-gray-500">ID: {sp.id}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <img
                        src={sp.HinhAnh?.anhChinh || '/placeholder.jpg'}
                        alt={sp.Ten}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiHeart className="w-3 h-3 text-pink-500 mr-1" />
                        <span className="text-xs font-medium text-gray-900">{sp.soLuotYeuThich}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-pink-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, (sp.soLuotYeuThich / Math.max(...topSanPhamYeuThich.map(p => p.soLuotYeuThich))) * 100)}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round((sp.soLuotYeuThich / Math.max(...topSanPhamYeuThich.map(p => p.soLuotYeuThich))) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlists;
