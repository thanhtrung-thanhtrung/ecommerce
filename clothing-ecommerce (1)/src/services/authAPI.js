import api from "./api"

const authAPI = {
  // Đăng ký
  register: (userData) => {
    return api.post("/auth/register", userData)
  },

  // Đăng nhập
  login: (credentials) => {
    return api.post("/auth/login", credentials)
  },

  // Đăng xuất
  logout: () => {
    const refreshToken = localStorage.getItem("refreshToken")
    return api.post("/auth/logout", { refreshToken })
  },

  // Quên mật khẩu
  forgotPassword: (email) => {
    return api.post("/auth/forgot-password", { email })
  },

  // Đặt lại mật khẩu
  resetPassword: (token, password) => {
    return api.post(`/auth/reset-password/${token}`, {
      matKhau: password,
      xacNhanMatKhau: password,
    })
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return api.post("/auth/refresh-token", { refreshToken })
  },

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
}

export default authAPI
