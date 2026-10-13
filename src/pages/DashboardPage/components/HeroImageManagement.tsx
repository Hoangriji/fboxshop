import React, { useEffect, useMemo, useState } from 'react';
import { useSiteConfig } from '../../../hooks/useSiteConfig';
import { useProducts } from '../../../hooks/useProducts';
import { SiteConfigService } from '../../../services/firebaseService';
import type { Product } from '../../../types';
import './HeroImageManagement.css';

const HERO_LIMIT = 5;

const HeroImageManagement: React.FC = () => {
  const { config, loading } = useSiteConfig();
  const { products, loading: productsLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (config?.site?.hero_product_ids && Array.isArray(config.site.hero_product_ids)) {
      setSelectedIds(config.site.hero_product_ids.map(String).slice(0, HERO_LIMIT));
    }
  }, [config?.site?.hero_product_ids]);

  // Tự động dọn dẹp các ID cũ/đã bị xóa khỏi DB để không chặn giới hạn 5 sản phẩm
  useEffect(() => {
    if (!productsLoading && products && products.length > 0 && selectedIds.length > 0) {
      const validIds = selectedIds.filter((id) =>
        products.some((p) => String(p.id) === String(id))
      );
      if (validIds.length !== selectedIds.length) {
        setSelectedIds(validIds);
      }
    }
  }, [products, productsLoading, selectedIds]);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => products.find((product) => String(product.id) === String(id)))
      .filter((product): product is Product => Boolean(product));
  }, [products, selectedIds]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => product.type !== 'digital')
      .filter((product) => {
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'usb') {
            return product.category === 'usb' || product.category === 'usb-storage';
          }
          return product.category === selectedCategory;
        }
        return true;
      })
      .filter((product) => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)
        );
      });
  }, [products, search, selectedCategory]);

  const toggleProduct = (productId: string | number) => {
    const strId = String(productId);
    if (selectedIds.includes(strId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== strId));
    } else {
      if (selectedIds.length >= HERO_LIMIT) {
        setStatus(`Đã chọn đủ ${HERO_LIMIT} sản phẩm Hero. Hãy bỏ bớt 1 sản phẩm trước khi thêm mới.`);
        return;
      }
      setSelectedIds((prev) => [...prev, strId]);
    }
  };

  const removeProduct = (productId: string | number) => {
    const strId = String(productId);
    setSelectedIds((prev) => prev.filter((id) => id !== strId));
  };

  const moveProduct = (productId: string | number, direction: 'up' | 'down') => {
    const strId = String(productId);
    setSelectedIds((prev) => {
      const index = prev.indexOf(strId);
      if (index < 0) return prev;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    setStatus('Đã xóa tất cả sản phẩm được chọn.');
  };

  const handleAutoFillFeatured = () => {
    const featured = products
      .filter((p) => p.featured && p.type !== 'digital')
      .slice(0, HERO_LIMIT)
      .map((p) => String(p.id));
    if (featured.length === 0) {
      setStatus('Chưa có sản phẩm nào được đánh dấu Nổi bật (Featured). Hãy đánh dấu sản phẩm nổi bật trước.');
      return;
    }
    setSelectedIds(featured);
    setStatus(`Đã chọn nhanh ${featured.length} sản phẩm Nổi bật cho Hero! Bấm "Lưu thay đổi" để áp dụng.`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await SiteConfigService.updateSiteConfig({
        site: {
          ...(config?.site || {}),
          hero_product_ids: selectedIds,
        },
      });
      setStatus('✓ Đã cập nhật và lưu danh sách sản phẩm Hero thành công!');
    } catch (error) {
      console.error('Hero update failed', error);
      setStatus('Có lỗi xảy ra khi lưu: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3500);
    }
  };

  if (loading) {
    return (
      <div className="hero-management">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-management">
      <div className="page-header">
        <h2>
          <i className="fas fa-images"></i> Quản lý Hero Carousel
        </h2>
        <p className="page-description">
          Chọn tối đa {HERO_LIMIT} sản phẩm để hiển thị trên Carousel nổi bật ở đầu Trang chủ (Hero banner).
        </p>
      </div>

      {status && (
        <div className="hero-status">
          <i className="fas fa-info-circle"></i> {status}
        </div>
      )}

      <div className="hero-management-grid">
        {/* Cột trái: Sản phẩm đã chọn */}
        <div className="hero-selected">
          <div className="section-header">
            <div>
              <h3>Sản phẩm đang hiển thị</h3>
              <small style={{ color: 'var(--theme-text-secondary)' }}>Thứ tự hiển thị từ trên xuống</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="hero-counter-badge">{selectedIds.length}/{HERO_LIMIT}</span>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-all"
                  onClick={handleClearAll}
                  title="Xóa tất cả sản phẩm đã chọn"
                >
                  <i className="fas fa-trash-alt"></i> Xóa hết
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn-autofill"
              onClick={handleAutoFillFeatured}
              title="Lấy 5 sản phẩm nổi bật đầu tiên gán vào đây"
            >
              <i className="fas fa-magic"></i> Lấy 5 sản phẩm từ Carousel Nổi bật
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="hero-empty">
              <i className="fas fa-layer-group" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5, display: 'block' }}></i>
              Chưa chọn sản phẩm nào cho Hero.<br />
              <small>Chọn từ danh sách bên phải hoặc bấm nút &quot;Lấy từ Carousel Nổi bật&quot; ở trên.</small>
            </div>
          ) : (
            <div className="hero-selected-list">
              {selectedProducts.map((product, index) => (
                <div key={product.id} className="hero-selected-item">
                  <div className="hero-rank-badge">#{index + 1}</div>
                  <img src={product.images?.[0] || 'https://via.placeholder.com/72'} alt={product.name} />
                  <div className="hero-selected-info">
                    <strong>{product.name}</strong>
                    <span>{product.category} • {product.price_vnd.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="hero-selected-actions">
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, 'up')}
                      disabled={index === 0}
                      title="Chuyển lên trước"
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, 'down')}
                      disabled={index === selectedProducts.length - 1}
                      title="Chuyển xuống sau"
                    >
                      <i className="fas fa-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => removeProduct(product.id)}
                      title="Bỏ sản phẩm này"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Thư viện sản phẩm */}
        <div className="hero-library">
          <div className="section-header">
            <h3>Thư viện sản phẩm ({filteredProducts.length})</h3>
            <input
              type="text"
              placeholder="Tìm theo tên, SKU, hãng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* Category filter pills */}
          <div className="hero-cat-filter-pills">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'monitor', label: 'Màn hình' },
              { id: 'keyboard', label: 'Bàn phím' },
              { id: 'mouse', label: 'Chuột' },
              { id: 'headset', label: 'Tai nghe' },
              { id: 'usb', label: 'USB & Phụ kiện' },
              { id: 'other', label: 'Khác' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`hero-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {productsLoading ? (
            <div className="hero-empty">Đang tải sản phẩm...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="hero-empty">Không tìm thấy sản phẩm phù hợp.</div>
          ) : (
            <div className="hero-library-list">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(String(product.id));

                return (
                  <div key={product.id} className={`hero-library-item ${isSelected ? 'is-selected' : ''}`}>
                    <img src={product.images?.[0] || 'https://via.placeholder.com/72'} alt={product.name} />
                    <div className="hero-library-info">
                      <strong>{product.name}</strong>
                      <span className="hero-item-meta">
                        <span className="hero-item-cat">{product.category}</span>
                        {product.brand && <span className="hero-item-brand">{product.brand}</span>}
                        <span className="hero-item-price">{product.price_vnd.toLocaleString('vi-VN')}₫</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`btn-hero-toggle ${isSelected ? 'selected' : 'add'}`}
                      onClick={() => toggleProduct(product.id)}
                      title={isSelected ? 'Bấm để bỏ chọn' : 'Bấm để thêm vào Hero'}
                    >
                      {isSelected ? (
                        <>
                          <i className="fas fa-check"></i> Đã chọn
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> Thêm
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="hero-actions-manager">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700 }}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Đang lưu...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Lưu thay đổi Hero
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default HeroImageManagement;