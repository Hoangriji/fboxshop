import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types';
import logo from '../../assets/logo.png';
import './Header.css';

interface HeaderProps {
  currentPage: string;
  wishlistCount: number;
}

const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  wishlistCount = 0
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isClickingSuggestion, setIsClickingSuggestion] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  
  const { products } = useProducts();

  // Set a CSS variable with the header height so pages can offset content accordingly
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    // Sử dụng ResizeObserver để lắng nghe mọi thay đổi kích thước thực tế của Header
    const resizeObserver = new ResizeObserver((entries) => {
      const height = entries[0].target.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    });

    resizeObserver.observe(headerEl);

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const navigationItems = [
    { id: 'home', label: 'Trang Chủ', icon: 'fas fa-home', path: '/' },
    { id: 'products', label: 'Sản Phẩm', icon: 'fas fa-th-large', path: '/products' },
    { id: 'contact', label: 'Liên Hệ', icon: 'fas fa-envelope', path: '/contact' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
      desktopInputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClickingSuggestion(false);
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchOpen(false);
    navigate(`/product/${product.id}`);
  };

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const filtered = products
        .filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 4); // Limit to 4 suggestions
      setFilteredProducts(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  // Helper to get product name without parentheses and "Bàn phím" prefix (for search suggestions only)
  const getDisplayName = (name: string) => {
    let displayName = name;
    const parenIndex = displayName.indexOf('(');
    if (parenIndex !== -1) {
      displayName = displayName.substring(0, parenIndex).trim();
    }
    if (displayName.toLowerCase().startsWith('bàn phím')) {
      displayName = displayName.substring('bàn phím'.length).trim();
    }
    return displayName;
  };

  // Close suggestions on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <div className="header-shell">
        <div className="header-container">
          {/* Main Navigation */}
          <nav className="main-nav">
            <ul className="nav-menu">
              {navigationItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                  >
                    <i className={item.icon}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logo Section */}
          <Link to="/" className="logo-section">
            <div className="logo">
              <img src={logo} alt="Fbox Shop" className="logo-image" />
            </div>
            <div>
              <h1 className="logo-text">Fbox Shop</h1>
              {/* ẩn digital */}
              {/* <p className="logo-subtitle">Gaming & Digital Store</p> */}
            </div>
          </Link>

          {/* Header Actions */}
          <div className="header-actions">
          {/* Desktop Search Bar - Visible on >= 1000px */}
          <form className="desktop-search-form" onSubmit={handleDesktopSearch}>
            <div className="desktop-search-wrapper" ref={suggestionsRef}>
              <i className="fas fa-search desktop-search-icon"></i>
              <input
                ref={desktopInputRef}
                type="text"
                className="desktop-search-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                onBlur={() => {
                  if (!isClickingSuggestion) {
                    setShowSuggestions(false);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="desktop-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  title="Xóa"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              
              {/* Desktop Search Suggestions */}
              {showSuggestions && filteredProducts.length > 0 && (
                <div className="search-suggestions desktop-suggestions">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="suggestion-item"
                      onMouseDown={() => setIsClickingSuggestion(true)}
                      onClick={(e) => handleSuggestionClick(e, product)}
                    >
                      <div className="suggestion-image">
                        <img src={product.images[0]} alt={product.name} />
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-name">{getDisplayName(product.name)}</div>
                        <div className="suggestion-category">{product.category}</div>
                      </div>
                      <div className="suggestion-price">
                        {product.price_vnd.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Mobile Search Button - Visible on < 1000px */}
          <form className={`search-container mobile-search-container ${searchOpen ? 'open' : ''}`} onSubmit={handleSearch}>
            <button
              type="button"
              className="search-button"
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              <i className="fas fa-search"></i>
            </button>
            <div className="mobile-search-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setSearchOpen(true);
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // khi blurred, ẩn suggestions ngay
                  setShowSuggestions(false);
                  // giữ thanh search mở nếu có text, đóng nếu trống
                  setTimeout(() => {
                    if (inputRef.current?.value.trim() === '') {
                      setSearchOpen(false);
                    }
                  }, 100);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  title="Xóa"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}

              {/* Mobile Search Suggestions */}
              {showSuggestions && filteredProducts.length > 0 && searchOpen && (
                <div className="search-suggestions mobile-suggestions">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="suggestion-item"
                      onMouseDown={() => setIsClickingSuggestion(true)}
                      onClick={(e) => handleSuggestionClick(e, product)}
                    >
                      <div className="suggestion-image">
                        <img src={product.images[0]} alt={product.name} />
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-name">{getDisplayName(product.name)}</div>
                        <div className="suggestion-category">{product.category}</div>
                      </div>
                      <div className="suggestion-price">
                        {product.price_vnd.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Wishlist */}
          <button 
            className="action-button" 
            title="Yêu thích"
            onClick={() => navigate('/wishlist')}
          >
            <i className="fas fa-heart"></i>
            {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
          </button>

          {/* Mobile Menu Button */}
          <button
            className={`mobile-menu-button ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h2>Menu</h2>
          <button
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="mobile-menu-nav">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className={item.icon}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;