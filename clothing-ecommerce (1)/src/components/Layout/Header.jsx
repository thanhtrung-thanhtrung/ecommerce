"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import { toggleMobileMenu, closeMobileMenu } from "../../store/slices/uiSlice";
import {
  getSearchSuggestions,
  clearSearchSuggestions,
  setSearchQuery,
} from "../../store/slices/productSlice";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const { isMobileMenuOpen } = useSelector((state) => state.ui);
  const { searchSuggestions } = useSelector((state) => state.products);

  const [searchQuery, setLocalSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        // Format search query for backend API
        dispatch(getSearchSuggestions(searchQuery.trim()));
        setShowSuggestions(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      dispatch(clearSearchSuggestions());
      setShowSuggestions(false);
    }
  }, [searchQuery, dispatch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(setSearchQuery(searchQuery.trim()));
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setLocalSearchQuery("");
      setShowSuggestions(false);
      dispatch(clearSearchSuggestions());
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const query = suggestion.Ten || suggestion.query || suggestion;
    dispatch(setSearchQuery(query));
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setLocalSearchQuery("");
    setShowSuggestions(false);
    dispatch(clearSearchSuggestions());
  };

  const handleMobileMenuToggle = () => {
    dispatch(toggleMobileMenu());
  };

  const handleLinkClick = () => {
    dispatch(closeMobileMenu());
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="hidden md:flex justify-between items-center py-2 text-sm text-gray-600 border-b">
          <div className="flex space-x-4">
            <span>📞 Hotline: 1900-1234</span>
            <span>📧 Email: support@shoeshop.vn</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/about" className="hover:text-primary-600">
              Về chúng tôi
            </Link>
            <Link to="/contact" className="hover:text-primary-600">
              Liên hệ
            </Link>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">👟</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">ShoeShop</span>
          </Link>

          {/* Search bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchQuery.trim().length > 2 && setShowSuggestions(true)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600"
                >
                  🔍
                </button>
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span className="text-gray-400">🔍</span>
                    <span className="text-gray-700">
                      {suggestion.Ten || suggestion.query || suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/products"
              className="text-gray-700 hover:text-primary-600 font-medium"
            >
              Sản phẩm
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/wishlist"
                  className="text-gray-700 hover:text-primary-600"
                >
                  ❤️ Yêu thích
                </Link>
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-primary-600"
                >
                  🛒 Giỏ hàng
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                    <span>👤</span>
                    <span>{user?.HoTen || "Tài khoản"}</span>
                    <span>▼</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Thông tin cá nhân
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Danh sách yêu thích
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-primary-600"
                >
                  🛒 Giỏ hàng
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={handleMobileMenuToggle}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-4 relative">
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.trim().length > 2 && setShowSuggestions(true)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Mobile Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50"
            >
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span className="text-gray-400">🔍</span>
                  <span className="text-gray-700">
                    {suggestion.Ten || suggestion.query || suggestion}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/products"
              onClick={handleLinkClick}
              className="block text-gray-700 hover:text-primary-600 font-medium"
            >
              Sản phẩm
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  to="/orders"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Đơn hàng của tôi
                </Link>
                <Link
                  to="/wishlist"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Danh sách yêu thích
                </Link>
                <Link
                  to="/cart"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Giỏ hàng ({totalItems})
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    handleLinkClick();
                  }}
                  className="block w-full text-left text-gray-700 hover:text-primary-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/cart"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Giỏ hàng ({totalItems})
                </Link>
                <Link
                  to="/login"
                  onClick={handleLinkClick}
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={handleLinkClick}
                  className="block btn-primary text-center"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
