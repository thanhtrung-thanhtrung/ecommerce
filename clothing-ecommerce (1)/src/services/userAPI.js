import api from "./api"

const userAPI = {
  // Lấy thông tin profile
  getProfile: () => {
    return api.get("/users/profile")
  },

  // Cập nhật profile
  updateProfile: (userData) => {
    return api.put("/users/profile", userData)
  },

  // Đổi mật khẩu
  changePassword: (passwordData) => {
    return api.put("/users/change-password", passwordData)
  },

  // Upload avatar
  uploadAvatar: (formData) => {
    return api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  // Lấy địa chỉ giao hàng
  getAddresses: () => {
    return api.get("/users/addresses")
  },

  // Thêm địa chỉ giao hàng
  addAddress: (addressData) => {
    return api.post("/users/addresses", addressData)
  },

  // Cập nhật địa chỉ
  updateAddress: (id, addressData) => {
    return api.put(`/users/addresses/${id}`, addressData)
  },

  // Xóa địa chỉ
  deleteAddress: (id) => {
    return api.delete(`/users/addresses/${id}`)
  },

  // Đặt địa chỉ mặc định
  setDefaultAddress: (id) => {
    return api.put(`/users/addresses/${id}/default`)
  },

  // Lấy thống kê user
  getUserStats: () => {
    return api.get("/users/stats")
  },
}

export default userAPI
