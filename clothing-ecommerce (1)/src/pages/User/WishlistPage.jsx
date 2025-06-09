
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchWishlist, removeFromWishlist, clearWishlist } from "../../store/slices/wishlistSlice"
import { addToCart } from "../../store/slices/cartSlice"
import WishlistItem from "../../components/Wishlist/WishlistItem"

const WishlistPage = () => {
  const dispatch = useDispatch()
  const { items, isLoading, totalItems } = useSelector((state) => state.wishlist)

  useEffect(() => {
    dispatch(fetchWishlist())
  }, [dispatch])

  const handleRemoveFromWishlist = (productId) => {
    dispatch(removeFromWishlist(productId))
  }

  const handleAddToCart = (product) => {
    const cartItem = {
      id_SanPham: product.id,
      kichCo: product.kichCo?.[0] || "",
      mauSac: product.mauSac?.[0] || "",
      soLuong: 1,
    }
    dispatch(addToCart(cartItem))
  }

  const handleClearWishlist = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?")) {
      dispatch(clearWishlist())
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Danh sách yêu thích</h1>
        {totalItems > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{totalItems} sản phẩm</span>
            <button onClick={handleClearWishlist} className="text-red-600 hover:text-red-700 text-sm">
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <WishlistItem key={item.id} item={item} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">💝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Danh sách yêu thích trống</h3>
          <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm yêu thích nào. Hãy thêm những sản phẩm bạn thích!</p>
          <Link to="/products" className="btn-primary">
            Khám phá sản phẩm
          </Link>
        </div>
      )}
    </div>
  )
}

export default WishlistPage
