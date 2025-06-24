import React, { useEffect, useState } from 'react';

const WishlistsStatistics = () => {
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
    return <div className="p-6 text-gray-600">Đang tải thống kê...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-red-500">Không thể tải dữ liệu thống kê.</div>;
  }


  return (
    <div className="p-6 space-y-6">
      {/* Tổng quan */}


      {/* Top sản phẩm yêu thích */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-6 py-3  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
              <th className="px-6 py-3  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
              <th className="px-6 py-3  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượt yêu thích</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topSanPhamYeuThich.map((sp, index) => (
              <tr key={sp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sp.Ten}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={sp.HinhAnh.anhChinh}
                    alt={sp.Ten}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sp.soLuotYeuThich}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



    </div>
  );
};

export default WishlistsStatistics;
