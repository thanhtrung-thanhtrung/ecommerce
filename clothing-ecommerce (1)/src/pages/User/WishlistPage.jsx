import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../contexts/ShopContext";
import { } from "../../contexts/CartContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

// WishlistItem inline component
const WishlistItem = ({ item, onRemove }) => {
  let imageUrl = "/placeholder.svg?height=60&width=60";
  try {
    if (item.HinhAnh) {
      const imgObj = typeof item.HinhAnh === "string" ? JSON.parse(item.HinhAnh) : item.HinhAnh;
      if (imgObj.anhChinh) imageUrl = imgObj.anhChinh;
    }
  } catch { }
  const handleAddToCart = () => {
    window.location.href = `/products/${item.id_SanPham || item.id}`;
  };

  return (
    <li style={{
      display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: 8, background: '#fff',
      marginBottom: 2
    }}>
      <img
        src={imageUrl}
        alt={item.tenSanPham}
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, marginRight: 10, border: '1px solid #eee' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tenSanPham}</div>
        <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{Number(item.Gia).toLocaleString()}₫</div>
      </div>
      <button
        onClick={handleAddToCart}
        style={{
          marginRight: 6,
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '5px 12px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500
        }}
      >
        Chọn mua
      </button>
      <button
        onClick={() => onRemove(item.id_SanPham)}
        style={{
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '5px 12px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500
        }}
      >
        Xóa
      </button>
    </li>
  );
};

const WishlistPage = () => {
  const {
    wishlist,
    loading,
    removeFromWishlist,
    clearWishlist,
    addToCart,
    fetchWishlist
  } = useShop();

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line
  }, [fetchWishlist]);

  // Xóa 1 sản phẩm khỏi wishlist (truyền id_SanPham)
  const handleRemoveFromWishlist = async (id_SanPham) => {
    await removeFromWishlist(id_SanPham);
    await fetchWishlist();
  };

  const handleClearWishlist = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?")) {
      await clearWishlist();
      await fetchWishlist();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Danh sách yêu thích ({wishlist.length})
        </h1>
        {/* Nút xóa tất cả đã bị ẩn vì chưa có API */}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            {/* Heart icon */}
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Danh sách yêu thích trống
          </h3>
          <p className="text-gray-500 mb-8">
            Hãy thêm những sản phẩm bạn yêu thích vào danh sách này
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <ul style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: 0 }}>
          {wishlist.map(item => (
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