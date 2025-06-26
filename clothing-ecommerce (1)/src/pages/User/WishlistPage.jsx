import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useShop } from "../../contexts/ShopContext"
import WishlistItem from "../../components/Wishlist/WishlistItem"
import LoadingSpinner from "../../components/Common/LoadingSpinner"

const WishlistPage = () => {
  const {
    wishlist,
    loading,
    removeFromWishlist,
    clearWishlist,
    addToCart,
    fetchWishlist
  } = useShop()

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId)
  }

  const handleAddToCart = (product) => {
    const cartItem = {
      id_SanPham: product.id,
      kichCo: product.kichCo?.[0] || "",
      mauSac: product.mauSac?.[0] || "",
      soLuong: 1,
    }
    addToCart(cartItem)
  }

  const handleClearWishlist = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?")) {
      clearWishlist()
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Danh sách yêu thích ({wishlist.length})
        </h1>
        {wishlist.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Xóa tất cả
          </button>
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <WishlistItem
              key={item.id}
              item={item}
              onRemove={handleRemoveFromWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage
