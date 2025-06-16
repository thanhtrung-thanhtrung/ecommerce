import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

// Context
import { CartProvider } from "./contexts/CartContext";

// Layout Components
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ProfilePage from "./pages/User/ProfilePage";
import OrdersPage from "./pages/User/OrdersPage";
import WishlistPage from "./pages/User/WishlistPage";

// Protected Route Component
import ProtectedRoute from "./components/Common/ProtectedRoute";

function App() {
  const { isLoading } = useSelector((state) => state.ui);

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-success/:orderId"
              element={<OrderSuccessPage />}
            />
            <Route path="/track-order" element={<TrackOrderPage />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Footer />

        {/* Global Loading Spinner */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="spinner"></div>
          </div>
        )}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              theme: {
                primary: "green",
                secondary: "black",
              },
            },
          }}
        />
      </div>
    </CartProvider>
  );
}

export default App;
