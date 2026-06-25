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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (config?.site?.hero_product_ids) {
      setSelectedIds(config.site.hero_product_ids.slice(0, HERO_LIMIT));
    }
  }, [config?.site?.hero_product_ids]);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, [products, selectedIds]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => product.type !== 'digital')
      .filter((product) => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)
        );
      })
      .slice(0, 60);
  }, [products, search]);

  const addProduct = (productId: string) => {
    if (selectedIds.includes(productId)) return;
    if (selectedIds.length >= HERO_LIMIT) return;
    setSelectedIds((prev) => [...prev, productId]);
  };

  const removeProduct = (productId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
  };

  const moveProduct = (productId: string, direction: 'up' | 'down') => {
    setSelectedIds((prev) => {
      const index = prev.indexOf(productId);
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

  const handleSave = async () => {
    if (!config?.site) return;
    try {
      setSaving(true);
      setStatus(null);
      await SiteConfigService.updateSiteConfig({
        site: {
          ...config.site,
          hero_product_ids: selectedIds,
        },
      });
      setStatus('Đã cập nhật danh sách sản phẩm Hero.');
    } catch (error) {
      console.error('Hero update failed', error);
      setStatus('Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className="hero-management">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải...</p>
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
          Chọn tối đa {HERO_LIMIT} sản phẩm để hiển thị ở Hero trang chủ.
        </p>
      </div>

      {status && <div className="hero-status">{status}</div>}

      <div className="hero-management-grid">
        <div className="hero-selected">
          <div className="section-header">
            <h3>Sản phẩm đang hiển thị</h3>
            <span>{selectedIds.length}/{HERO_LIMIT}</span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="hero-empty">Chưa chọn sản phẩm nào.</div>
          ) : (
            <div className="hero-selected-list">
              {selectedProducts.map((product, index) => (
                <div key={product.id} className="hero-selected-item">
                  <img src={product.images?.[0]} alt={product.name} />
                  <div className="hero-selected-info">
                    <strong>{product.name}</strong>
                    <span>{product.price_vnd.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="hero-selected-actions">
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, 'up')}
                      disabled={index === 0}
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, 'down')}
                      disabled={index === selectedProducts.length - 1}
                    >
                      <i className="fas fa-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hero-library">
          <div className="section-header">
            <h3>Thư viện sản phẩm</h3>
            <input
              type="text"
              placeholder="Tìm theo tên, SKU, danh mục..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {productsLoading ? (
            <div className="hero-empty">Đang tải sản phẩm...</div>
          ) : (
            <div className="hero-library-list">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const isDisabled = !isSelected && selectedIds.length >= HERO_LIMIT;

                return (
                  <div key={product.id} className="hero-library-item">
                    <img src={product.images?.[0]} alt={product.name} />
                    <div className="hero-library-info">
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                      <span>{product.price_vnd.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => addProduct(product.id)}
                    >
                      {isSelected ? 'Đã chọn' : 'Thêm'}
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
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default HeroImageManagement;