import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAdmin } from "./contexts/AdminContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Vouchers from "./pages/Vouchers";
import Analytics from "./pages/Analytics";
import Suppliers from "./pages/Suppliers.jsx";
import Payments from "./pages/Payments";
import Shippings from "./pages/Shippings";
import Wishlists from "./pages/Wishlists";
import Inventorys from "./pages/Inventorys";
import ImportReceipts from "./pages/ImportReceipts";
import Settings from "./pages/Settings";
import "./App.css";



// Layout component cho các trang đã xác thực
const AuthenticatedLayout = ({ children }) => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden lg:ml-40">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-3">
        {children}
      </main>
    </div>
  </div>
);

function App() {
  const { isAuthenticated } = useAdmin();

  return (
    <>
      <Routes>
        {/* Route đăng nhập - chỉ hiển thị khi chưa đăng nhập */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/products" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Products />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Orders />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/categories" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Categories />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/brands" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Brands />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/vouchers" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Vouchers />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/suppliers" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Suppliers />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Analytics />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Payments />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/shippings" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Shippings />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/wishlists" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Wishlists />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/inventorys" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Inventorys />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/import-receipts" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ImportReceipts />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
}

export default App;
