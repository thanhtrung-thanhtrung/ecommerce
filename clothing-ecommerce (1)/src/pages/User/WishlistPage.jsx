// WishlistPage.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../../contexts/ShopContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

// Helper: Lấy ảnh chính từ item.HinhAnh
const getImageUrl = (HinhAnh) => {
  try {
    const img = typeof HinhAnh === "string" ? JSON.parse(HinhAnh) : HinhAnh;
    return img?.anhChinh || "/placeholder.svg";
  } catch {
    return "/placeholder.svg";
  }
};

const WishlistItem = ({ item, onRemove }) => {
  const navigate = useNavigate();
  const imageUrl = getImageUrl(item.HinhAnh);

  return (
    <li className="flex items-center justify-between border-b px-4 py-3">
      <img
        src={imageUrl}
        alt={item.tenSanPham}
        className="w-12 h-12 object-cover rounded border"
      />
      <div className="flex-1 min-w-0 mx-3">
        <h4 className="text-sm font-medium truncate">{item.tenSanPham}</h4>
        <p className="text-xs text-gray-500">{Number(item.Gia).toLocaleString()}₫</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/products/${item.id_SanPham || item.id}`)}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Mua
        </button>
        <button
          onClick={() => onRemove(item.id_SanPham)}
          className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Xóa
        </button>
      </div>
    </li>
  );
};

const WishlistPage = () => {
  const {
    wishlist,
    loading,
    removeFromWishlist,
    clearWishlist,
    fetchWishlist,
  } = useShop();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemoveFromWishlist = async (id_SanPham) => {
    await removeFromWishlist(id_SanPham);
    fetchWishlist();
  };

  const handleClearWishlist = async () => {
    if (window.confirm("Xóa tất cả sản phẩm yêu thích?")) {
      await clearWishlist();
      fetchWishlist();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Danh sách yêu thích ({wishlist.length})
        </h1>
        {wishlist.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="text-sm text-red-600 hover:underline"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28...z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Danh sách yêu thích trống</h2>
          <p className="text-gray-500 mb-4">Hãy thêm sản phẩm bạn yêu thích</p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <ul className="bg-white rounded shadow max-w-xl mx-auto divide-y">
          {wishlist.map((item) => (
            <WishlistItem
              key={item.id}
              item={item}
              onRemove={handleRemoveFromWishlist}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishlistPage;
