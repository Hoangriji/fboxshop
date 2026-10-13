import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsService } from '../../../services/firebaseService';
import type { Product } from '../../../types';

const CATEGORY_LABELS: Record<string, string> = {
  keyboard: 'Bàn phím',
  mouse: 'Chuột',
  headset: 'Tai nghe',
  monitor: 'Màn hình',
  'usb-storage': 'USB/Thẻ nhớ',
  'digital-products': 'Sản phẩm số',
  other: 'Khác',
};

const STOCK_CONFIG: Record<string, { label: string; cls: string }> = {
  in_stock:    { label: 'Còn hàng', cls: 'ds-stock-ok'  },
  low_stock:   { label: 'Còn hàng', cls: 'ds-stock-ok'  },
  out_of_stock:{ label: 'Liên hệ',  cls: 'ds-stock-out' },
};

function matchesQuery(p: Product, q: string): boolean {
  const lq = q.toLowerCase();
  return (
    p.id.toLowerCase().includes(lq) ||
    p.name.toLowerCase().includes(lq) ||
    (p.sku ?? '').toLowerCase().includes(lq) ||
    (p.brand ?? '').toLowerCase().includes(lq) ||
    (p.category ?? '').toLowerCase().includes(lq) ||
    (p.tags ?? []).some(t => t.toLowerCase().includes(lq))
  );
}

const DashboardSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);

  // Load all products once (cached for the session)
  const ensureProducts = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const { products } = await ProductsService.getPaginatedProducts(500);
      setAllProducts(products);
    } catch {
      fetchedRef.current = false; // allow retry
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter on query change
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }
    const filtered = allProducts.filter(p => matchesQuery(p, trimmed)).slice(0, 8);
    setResults(filtered);
    setActiveIdx(-1);
  }, [query, allProducts]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Handle mobile search open/close
  const handleOpenMobile = () => {
    ensureProducts();
    setMobileOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleFocus = () => {
    ensureProducts();
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    if (mobileOpen) {
      mobileInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleGoToProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/products?search=${encodeURIComponent(product.name)}`);
    setOpen(false);
    setMobileOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && !mobileOpen) return;
    if (e.key === 'Escape') {
      setOpen(false);
      setMobileOpen(false);
      inputRef.current?.blur();
      mobileInputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      const p = results[activeIdx];
      navigate(`/dashboard/products?search=${encodeURIComponent(p.name)}`);
      setOpen(false);
      setMobileOpen(false);
      setQuery('');
    }
  };

  const hasResults = results.length > 0;
  const showDropdown = open && (loading || query.trim().length > 0);

  return (
    <>
      {/* DESKTOP SEARCH BAR (visible on >= 992px) */}
      <div className="ds-container ds-desktop-container" ref={containerRef}>
        <div className={`ds-input-wrap ${open ? 'ds-focused' : ''}`}>
          <i className="fas fa-search ds-icon-search"></i>
          <input
            ref={inputRef}
            type="text"
            className="ds-input"
            placeholder="Tìm sản phẩm theo tên, mã SP, SKU, thương hiệu..."
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="ds-clear-btn" onClick={handleClear} tabIndex={-1} aria-label="Xoá">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="ds-dropdown">
            {loading && !hasResults && (
              <div className="ds-empty">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Đang tải sản phẩm...</span>
              </div>
            )}

            {!loading && query.trim().length > 0 && !hasResults && (
              <div className="ds-empty">
                <i className="fas fa-box-open"></i>
                <span>Không tìm thấy sản phẩm nào phù hợp</span>
              </div>
            )}

            {hasResults && (
              <>
                <div className="ds-results-header">
                  <span><i className="fas fa-list"></i> {results.length} kết quả</span>
                  <span className="ds-hint">↑↓ điều hướng · Enter chọn · Esc đóng</span>
                </div>
                <ul className="ds-list">
                  {results.map((p, idx) => {
                    const stockCfg = STOCK_CONFIG[p.stock_status ?? 'in_stock'];
                    const catLabel = CATEGORY_LABELS[p.category] ?? p.category;
                    return (
                      <li
                        key={p.id}
                        className={`ds-item ${idx === activeIdx ? 'ds-item-active' : ''}`}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={(e) => handleGoToProduct(p, e)}
                      >
                        <div className="ds-thumb">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} />
                            : <i className="fas fa-image"></i>
                          }
                        </div>

                        <div className="ds-info">
                          <div className="ds-name">{p.name}</div>
                          <div className="ds-meta">
                            <span className="ds-cat">{catLabel}</span>
                            {p.brand && <span className="ds-brand">{p.brand}</span>}
                            {p.sku && <span className="ds-sku">SKU: {p.sku}</span>}
                          </div>
                          <div className="ds-meta ds-meta-2">
                            <span className="ds-price">{(p.price_vnd ?? 0).toLocaleString('vi-VN')}đ</span>
                            <span className={`ds-stock ${stockCfg.cls}`}>{stockCfg.label}</span>
                          </div>
                        </div>

                        <div className="ds-actions">
                          <button
                            className={`ds-copy-btn ${copiedId === p.id ? 'ds-copied' : ''}`}
                            onClick={(e) => handleCopyId(p.id, e)}
                            title="Copy mã SP"
                          >
                            <i className={`fas ${copiedId === p.id ? 'fa-check' : 'fa-copy'}`}></i>
                            <span>{copiedId === p.id ? 'Đã copy' : 'ID'}</span>
                          </button>
                          <button
                            className="ds-open-btn"
                            onClick={(e) => handleGoToProduct(p, e)}
                            title="Mở trong quản lý SP"
                          >
                            <i className="fas fa-external-link-alt"></i>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* MOBILE SEARCH TRIGGER (visible on < 992px) */}
      <div className="ds-mobile-trigger-wrapper">
        <button
          type="button"
          className="ds-mobile-trigger-btn"
          onClick={handleOpenMobile}
          aria-label="Tìm kiếm sản phẩm"
          title="Tìm kiếm sản phẩm"
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* MOBILE FULL-WIDTH FLOATING SEARCH OVERLAY */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div className="ds-mobile-backdrop" onClick={handleCloseMobile}></div>

          {/* Floating Search Bar & Results */}
          <div className="ds-mobile-overlay-box">
            <div className="ds-mobile-search-row">
              <div className="ds-mobile-input-box">
                <i className="fas fa-search ds-mobile-search-icon"></i>
                <input
                  ref={mobileInputRef}
                  type="text"
                  className="ds-mobile-input"
                  placeholder="Tìm tên, SKU, mã SP, thương hiệu..."
                  value={query}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    className="ds-mobile-clear-btn"
                    onClick={handleClear}
                    aria-label="Xoá tìm kiếm"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <button
                type="button"
                className="ds-mobile-close-btn"
                onClick={handleCloseMobile}
                aria-label="Đóng tìm kiếm"
              >
                <span>Hủy</span>
              </button>
            </div>

            {/* Mobile Search Suggestions Dropdown */}
            {(loading || query.trim().length > 0) && (
              <div className="ds-mobile-dropdown">
                {loading && !hasResults && (
                  <div className="ds-empty">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Đang tải sản phẩm...</span>
                  </div>
                )}

                {!loading && query.trim().length > 0 && !hasResults && (
                  <div className="ds-empty">
                    <i className="fas fa-box-open"></i>
                    <span>Không tìm thấy sản phẩm phù hợp</span>
                  </div>
                )}

                {hasResults && (
                  <>
                    <div className="ds-results-header">
                      <span><i className="fas fa-list"></i> {results.length} kết quả</span>
                      <span className="ds-hint">Chạm để mở quản lý</span>
                    </div>
                    <ul className="ds-list">
                      {results.map((p) => {
                        const stockCfg = STOCK_CONFIG[p.stock_status ?? 'in_stock'];
                        const catLabel = CATEGORY_LABELS[p.category] ?? p.category;
                        return (
                          <li
                            key={p.id}
                            className="ds-item"
                            onClick={(e) => handleGoToProduct(p, e)}
                          >
                            <div className="ds-thumb">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} />
                              ) : (
                                <i className="fas fa-image"></i>
                              )}
                            </div>

                            <div className="ds-info">
                              <div className="ds-name">{p.name}</div>
                              <div className="ds-meta">
                                <span className="ds-cat">{catLabel}</span>
                                {p.brand && <span className="ds-brand">{p.brand}</span>}
                              </div>
                              <div className="ds-meta ds-meta-2">
                                <span className="ds-price">
                                  {(p.price_vnd ?? 0).toLocaleString('vi-VN')}đ
                                </span>
                                <span className={`ds-stock ${stockCfg.cls}`}>
                                  {stockCfg.label}
                                </span>
                              </div>
                            </div>

                            <div className="ds-actions">
                              <button
                                className="ds-open-btn"
                                onClick={(e) => handleGoToProduct(p, e)}
                                title="Xem sản phẩm"
                              >
                                <i className="fas fa-arrow-right"></i>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default DashboardSearch;
