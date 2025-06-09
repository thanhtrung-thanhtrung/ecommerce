import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/";
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 5000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Cho phép gửi và nhận cookies để duy trì session
});

// Hàm để tạo sessionId ngẫu nhiên nếu cần
const generateSessionId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Kiểm tra và trích xuất sessionId từ cookie
const getSessionIdFromCookie = () => {
  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("sessionId=")
  );

  if (sessionCookie) {
    return sessionCookie.trim().substring("sessionId=".length);
  }
  return null;
};

// Lưu sessionId vào localStorage từ response
const saveSessionIdFromResponse = (response) => {
  // Kiểm tra nếu có sessionId trong cookie
  const sessionIdFromCookie = getSessionIdFromCookie();

  if (sessionIdFromCookie) {
    localStorage.setItem("guestSessionId", sessionIdFromCookie);
    return;
  }

  // Nếu không có trong cookie, thử tìm trong response header
  if (response.headers && response.headers["set-cookie"]) {
    const setCookieHeader = response.headers["set-cookie"];
    const sessionIdMatch = setCookieHeader
      .toString()
      .match(/sessionId=([^;]+)/);
    if (sessionIdMatch && sessionIdMatch[1]) {
      localStorage.setItem("guestSessionId", sessionIdMatch[1]);
      return;
    }
  }

  // Nếu không tìm thấy sessionId trong response, kiểm tra trong localStorage
  if (!localStorage.getItem("guestSessionId")) {
    // Nếu không có trong localStorage, tạo mới
    const newSessionId = generateSessionId();
    localStorage.setItem("guestSessionId", newSessionId);
  }
};

// Đảm bảo rằng sessionId luôn có sẵn để sử dụng
const ensureSessionId = () => {
  // Kiểm tra trong cookie trước
  const sessionIdFromCookie = getSessionIdFromCookie();
  if (sessionIdFromCookie) {
    localStorage.setItem("guestSessionId", sessionIdFromCookie);
    return sessionIdFromCookie;
  }

  // Nếu không có trong cookie, kiểm tra localStorage
  let sessionId = localStorage.getItem("guestSessionId");
  if (!sessionId) {
    // Tạo mới nếu không tìm thấy
    sessionId = generateSessionId();
    localStorage.setItem("guestSessionId", sessionId);
  }

  return sessionId;
};

// Request interceptor to add auth token and session ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Nếu không đăng nhập, đảm bảo có sessionId
      const sessionId = ensureSessionId();
      config.headers["X-Session-ID"] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Lưu sessionId từ response nếu có
    saveSessionIdFromResponse(response);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            }
          );

          const { token } = response.data;
          localStorage.setItem("token", token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error("Lỗi server. Vui lòng thử lại sau.");
    } else if (error.response?.status === 404) {
      // Không hiện toast cho lỗi 404 khi gọi API giỏ hàng vì có thể chưa có giỏ hàng
      if (!error.config.url.includes("/cart")) {
        toast.error("Không tìm thấy tài nguyên.");
      }
    } else if (error.code === "ECONNABORTED") {
      toast.error("Kết nối timeout. Vui lòng thử lại.");
    } else if (!error.response) {
      toast.error("Lỗi kết nối. Vui lòng kiểm tra internet.");
    }

    return Promise.reject(error);
  }
);

export default api;
