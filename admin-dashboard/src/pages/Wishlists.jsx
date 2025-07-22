import React, { useEffect, useState } from 'react';

const Wishlists = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/wishlists/statistics', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
          // Handle nested data structure - the actual data is in data.data
        setStats(data.data?.data || data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-2 text-center text-sm text-gray-600">Đang tải...</div>
    );
  }

  if (!stats) {
    return null;
  }

  // Add null check and default value for topSanPhamYeuThich
  const { topSanPhamYeuThich = [] } = stats;

  // Add additional check to ensure topSanPhamYeuThich is an array
  const validTopSanPhamYeuThich = Array.isArray(topSanPhamYeuThich) ? topSanPhamYeuThich : [];

  const filterSearch = validTopSanPhamYeuThich.filter(sp =>
    sp?.Ten?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Top sản phẩm được yêu thích</h3>
        </div>
        <input type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-blue-500"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ảnh</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lượt thích</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterSearch.length > 0 ? filterSearch.map((sp, index) => {
                // Parse HinhAnh if it's a string
                let imageData = sp.HinhAnh;
                if (typeof imageData === 'string') {
                  try {
                    imageData = JSON.parse(imageData);
                  } catch (e) {
                    imageData = {};
                  }
                }

                return (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs text-gray-500 text-center">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-900">{sp.Ten}</div>
                      <div className="text-xs text-gray-500">ID: {sp.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <img
                        src={imageData?.anhChinh || '/placeholder.jpg'}
                        alt={sp.Ten}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">{sp.soLuotYeuThich}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">
                    Không có dữ liệu sản phẩm yêu thích
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Wishlists;