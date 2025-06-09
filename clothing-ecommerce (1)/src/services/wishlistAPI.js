import api from "./api"

const wishlistAPI = {
  // Lấy danh sách wishlist
  getWishlist: () => {
    return api.get("/users/wishlist")
  },

  // Thêm sản phẩm vào wishlist
  addToWishlist: (productId) => {
    return api.post("/users/wishlist", { id_SanPham: productId })
  },

  // Xóa sản phẩm khỏi wishlist
  removeFromWishlist: (productId) => {
    return api.delete(`/users/wishlist/${productId}`)
  },

  // Kiểm tra sản phẩm có trong wishlist không
  checkInWishlist: (productId) => {
    return api.get(`/users/wishlist/check/${productId}`)
  },

  // Xóa toàn bộ wishlist
  clearWishlist: () => {
    return api.delete("/users/wishlist")
  },
}

export default wishlistAPI
