"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Search, X, TrendingUp, Clock, Star } from "lucide-react";
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
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(history.slice(0, 5)); // Limit to 5 recent searches
  }, []);

  // Popular search terms (could be fetched from API)
  const popularSearches = [
    "Nike Air Force 1",
    "Adidas Stan Smith",
    "Converse Chuck Taylor",
    "Vans Old Skool",
    "Puma Suede",
  ];

  // Debounce search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        dispatch(getSearchSuggestions(searchQuery.trim()));
        setShowSuggestions(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      dispatch(clearSearchSuggestions());
      if (isSearchFocused) {
        setShowSuggestions(true); // Show history and popular searches when focused
      }
    }
  }, [searchQuery, dispatch, isSearchFocused]);

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
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveToSearchHistory = (query) => {
    if (!query.trim()) return;

    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    const updatedHistory = [
      query,
      ...history.filter((item) => item !== query),
    ].slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    setSearchHistory(updatedHistory);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const handleSearch = (e, query = null) => {
    e?.preventDefault();
    const searchTerm = query || searchQuery.trim();

    if (searchTerm) {
      saveToSearchHistory(searchTerm);
      dispatch(setSearchQuery(searchTerm));
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setLocalSearchQuery("");
      setShowSuggestions(false);
      setIsSearchFocused(false);
      dispatch(clearSearchSuggestions());
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const query = suggestion.Ten || suggestion.query || suggestion;
    handleSearch(null, query);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSuggestions(true);
  };

  const clearSearch = () => {
    setLocalSearchQuery("");
    setShowSuggestions(false);
    setIsSearchFocused(false);
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

          {/* Enhanced Search bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative" ref={searchRef}>
                <div
                  className={`relative rounded-lg border-2 transition-all duration-200 ${
                    isSearchFocused
                      ? "border-primary-500 shadow-lg"
                      : "border-gray-300"
                  }`}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                    value={searchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Enhanced Search Suggestions */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-96 overflow-hidden z-50"
              >
                {/* Search Results */}
                {searchQuery.trim().length > 2 &&
                  searchSuggestions.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Kết quả tìm kiếm
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                          >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700 flex-1">
                              {suggestion.Ten || suggestion.query || suggestion}
                            </span>
                            <Star className="h-3 w-3 text-yellow-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Search History */}
                {searchQuery.trim().length <= 2 && searchHistory.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tìm kiếm gần đây
                      </span>
                      <button
                        onClick={clearSearchHistory}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    {searchHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(null, item)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 flex-1">{item}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                {searchQuery.trim().length <= 2 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tìm kiếm phổ biến
                    </div>
                    {popularSearches.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(null, item)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 text-red-400" />
                        <span className="text-gray-700 flex-1">{item}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {searchQuery.trim().length > 2 &&
                  searchSuggestions.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Không tìm thấy kết quả nào</p>
                      <p className="text-xs mt-1">
                        Thử tìm kiếm với từ khóa khác
                      </p>
                    </div>
                  )}
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

        {/* Enhanced Mobile search */}
        <div className="md:hidden pb-4 relative">
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchRef}>
              <div
                className={`relative rounded-lg border-2 transition-all duration-200 ${
                  isSearchFocused
                    ? "border-primary-500 shadow-lg"
                    : "border-gray-300"
                }`}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-white bg-primary-600 rounded-md"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Mobile Search Suggestions */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-80 overflow-hidden z-50"
            >
              {/* Mobile suggestions similar to desktop but more compact */}
              {searchQuery.trim().length > 2 &&
                searchSuggestions.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 text-sm">
                          {suggestion.Ten || suggestion.query || suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

              {searchQuery.trim().length <= 2 && (
                <div className="max-h-64 overflow-y-auto">
                  {searchHistory.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                        Tìm kiếm gần đây
                      </div>
                      {searchHistory.slice(0, 3).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(null, item)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </button>
                      ))}
                    </>
                  )}

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                    Phổ biến
                  </div>
                  {popularSearches.slice(0, 3).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(null, item)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <TrendingUp className="h-4 w-4 text-red-400" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </button>
                  ))}
                </div>
              )}
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
