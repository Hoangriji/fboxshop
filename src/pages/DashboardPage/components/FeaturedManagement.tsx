import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import type { Product } from '../../../types';

const FeaturedManagement: React.FC = () => {
  const { products, loading } = useProducts();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [freeDigitalProducts, setFreeDigitalProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products) {
      // Lấy 8 sản phẩm featured đầu tiên
      const featured = products.filter(p => p.featured).slice(0, 8);
      // Lấy 8 sản phẩm digital free đầu tiên
      const freeDigital = products
        .filter(p => p.type === 'digital' && p.is_free)
        .slice(0, 8);
      
      setFeaturedProducts(featured);
      setFreeDigitalProducts(freeDigital);
    }
  }, [products]);

  if (loading) {
    return (
      <div className="featured-management">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="featured-management">
      <div className="page-header">
        <h2><i className="fas fa-star"></i> Sản phẩm hiển thị trong Carousel Homepage</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--theme-text-secondary)', marginTop: '0.5rem' }}>
          Carousel tự động lấy 8 sản phẩm đầu tiên từ danh sách Featured và Digital Free
        </p>
      </div>
      
      <div className="featured-sections">
        <div className="featured-section">
          <div className="section-header">
            <div>
              <h3><i className="fas fa-fire"></i> Carousel Sản phẩm Nổi bật</h3>
              <p className="section-description">
                8 sản phẩm Featured đầu tiên sẽ hiển thị trong carousel Homepage
              </p>
            </div>
            <span className="count-badge">{featuredProducts.length}/8 sản phẩm</span>
          </div>
          
          <div className="featured-grid">
            {featuredProducts.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-star"></i>
                <p>Chưa có sản phẩm Featured nào</p>
                <small>Vào <strong>Quản lý sản phẩm</strong> để đánh dấu sản phẩm Featured</small>
              </div>
            ) : (
              <div className="featured-list">
                {featuredProducts.map((product, index) => (
                  <div key={product.id} className="product-list-item">
                    <div className="product-image-small">
                      <span className="carousel-order">#{index + 1}</span>
                      <img src={product.images[0]} alt={product.name} />
                    </div>
                    <div className="product-info-main">
                      <div className="product-name-section">
                        <h4>{product.name}</h4>
                        <span className="product-id">#{product.id}</span>
                      </div>
                      <div className="product-meta">
                        <span className="product-category">{product.category}</span>
                        <span className="product-price">
                          {product.price_vnd.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="featured-section">
          <div className="section-header">
            <div>
              <h3><i className="fas fa-gift"></i> Carousel Sản phẩm Digital Miễn phí</h3>
              <p className="section-description">
                8 sản phẩm Digital Free đầu tiên sẽ hiển thị trong carousel Homepage
              </p>
            </div>
            <span className="count-badge">{freeDigitalProducts.length}/8 sản phẩm</span>
          </div>
          
          <div className="digital-grid">
            {freeDigitalProducts.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-download"></i>
                <p>Chưa có sản phẩm Digital Free nào</p>
                <small>Tạo sản phẩm Digital với is_free = true trong <strong>Quản lý sản phẩm</strong></small>
              </div>
            ) : (
              <div className="digital-list">
                {freeDigitalProducts.map((product, index) => (
                  <div key={product.id} className="product-list-item">
                    <div className="product-image-small">
                      <span className="carousel-order">#{index + 1}</span>
                      <img src={product.images[0]} alt={product.name} />
                    </div>
                    <div className="product-info-main">
                      <div className="product-name-section">
                        <h4>{product.name}</h4>
                        <span className="product-id">#{product.id}</span>
                      </div>
                      <div className="product-meta">
                        <span className="product-category">{product.category}</span>
                        <span className="product-size">
                          <i className="fas fa-file"></i> {product.file_size || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedManagement;