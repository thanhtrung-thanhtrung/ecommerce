// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH_TOKEN: "/auth/refresh-token",
  },
  // Users
  USERS: {
    PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    WISHLIST: "/users/wishlist",
    ADDRESSES: "/users/addresses",
    REVIEWS: "/users/reviews",
    STATS: "/users/stats",
  },
  // Products
  PRODUCTS: {
    LIST: "/products",
    DETAIL: "/products/:id",
    SEARCH: "/products/search",
    REVIEW: "/products/:id/review",
    REVIEWS: "/products/:id/reviews",
  },
  // Cart
  CART: {
    LIST: "/cart",
    ADD: "/cart",
    UPDATE: "/cart/:id",
    REMOVE: "/cart/:id",
    CLEAR: "/cart",
  },
  // Orders
  ORDERS: {
    LIST: "/orders",
    CREATE: "/orders",
    DETAIL: "/orders/:id",
    CANCEL: "/orders/:id/cancel",
    TRACK: "/orders/:id/track",
    HISTORY: "/orders/history",
  },
  // Payments
  PAYMENTS: {
    CREATE: "/payments/create",
    CONFIRM: "/payments/:id/confirm",
    DETAIL: "/payments/:id",
    METHODS: "/payments/methods",
    CALLBACK: "/payments/callback",
    REFUND: "/payments/:id/refund",
  },
}

// Order Status
export const ORDER_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  SHIPPING: 3,
  DELIVERED: 4,
  CANCELLED: 5,
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Chờ xác nhận",
  [ORDER_STATUS.CONFIRMED]: "Đã xác nhận",
  [ORDER_STATUS.SHIPPING]: "Đang giao",
  [ORDER_STATUS.DELIVERED]: "Đã giao",
  [ORDER_STATUS.CANCELLED]: "Đã hủy",
}

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 0,
  COMPLETED: 1,
  FAILED: 2,
  REFUNDED: 3,
}

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: "Chờ thanh toán",
  [PAYMENT_STATUS.COMPLETED]: "Đã thanh toán",
  [PAYMENT_STATUS.FAILED]: "Thanh toán thất bại",
  [PAYMENT_STATUS.REFUNDED]: "Đã hoàn tiền",
}

// Product Sort Options
export const SORT_OPTIONS = {
  NEWEST: "newest",
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  POPULAR: "popular",
  RATING: "rating",
}

export const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: "Mới nhất",
  [SORT_OPTIONS.PRICE_ASC]: "Giá thấp đến cao",
  [SORT_OPTIONS.PRICE_DESC]: "Giá cao đến thấp",
  [SORT_OPTIONS.POPULAR]: "Phổ biến",
  [SORT_OPTIONS.RATING]: "Đánh giá cao",
}

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10,11}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  ADDRESS_MIN_LENGTH: 10,
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  CART: "cart",
  WISHLIST: "wishlist",
  THEME: "theme",
  LANGUAGE: "language",
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng thử lại.",
  SERVER_ERROR: "Lỗi server. Vui lòng thử lại sau.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này.",
  NOT_FOUND: "Không tìm thấy tài nguyên.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
  TIMEOUT_ERROR: "Kết nối timeout. Vui lòng thử lại.",
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Đăng nhập thành công!",
  REGISTER_SUCCESS: "Đăng ký thành công!",
  LOGOUT_SUCCESS: "Đăng xuất thành công!",
  UPDATE_SUCCESS: "Cập nhật thành công!",
  DELETE_SUCCESS: "Xóa thành công!",
  ADD_TO_CART: "Đã thêm vào giỏ hàng!",
  ADD_TO_WISHLIST: "Đã thêm vào danh sách yêu thích!",
  ORDER_SUCCESS: "Đặt hàng thành công!",
  PAYMENT_SUCCESS: "Thanh toán thành công!",
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
}

// Image Placeholders
export const PLACEHOLDERS = {
  PRODUCT_IMAGE: "/placeholder.svg?height=300&width=300",
  USER_AVATAR: "/placeholder.svg?height=100&width=100",
  BRAND_LOGO: "/placeholder.svg?height=80&width=120",
  CATEGORY_IMAGE: "/placeholder.svg?height=200&width=300",
}
