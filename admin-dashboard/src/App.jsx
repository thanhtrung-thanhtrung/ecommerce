import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Vouchers from "./pages/Vouchers";
import Analytics from "./pages/Analytics";
import Suppliers from "./pages/Suppliers";
import "./App.css";

// Placeholder components for routes not yet implemented


const Settings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Cài đặt</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">
        Trang cài đặt hệ thống sẽ được phát triển ở đây.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="text-sm"
      />
    </div>
  );
}

export default App;
