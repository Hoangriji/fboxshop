import React, { useState } from 'react';
import { WishlistButton } from '../WishlistButton';
import { TechButton } from '../TechButton';
import './ProductCard.css';

interface Product {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_free?: boolean;
  file_size?: string;
  specs?: Record<string, string>;
  brand?: string;
  features?: string[];
}

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: number | string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.wishlist-btn') || 
        (e.target as HTMLElement).closest('.quick-view-btn')) {
      return;
    }
    onViewDetails(product.id);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const getStatusConfig = () => {
    if (product.stockStatus === 'out_of_stock') {
      return { text: 'Liên hệ', className: 'out-of-stock' };
    } else {
      return { text: 'Còn hàng', className: 'in-stock' };
    }
  };

  const statusConfig = getStatusConfig();

  // Lấy specs để hiển thị ở mặt sau
  const displaySpecs = product.specs 
    ? Object.entries(product.specs).slice(0, 5) 
    : [];

  return (
    <div
      className={`product-card-container ${isFlipped ? "flipped" : ""}`}
      onClick={handleCardClick}
    >
      <div className="product-card-flipper">
        {/* Mặt trước */}
        <div className="product-card product-card-front">
          <div className="top-card">
            <div className={`product-card-tag-status ${statusConfig.className}`}>
              <span className="tag">{statusConfig.text}</span>
            </div>
            <WishlistButton product={product} variant="icon" size="sm" />
          </div>

          <img
            src={product.image}
            alt={product.name}
            className="card-image"
            loading="lazy"
            decoding="async"
          />

          <div className="card-content">
            <div className="product-card-tag-product">
              <span className="tag">{product.category}</span>
            </div>

            <div className="card-title-container">
              <h3 className="card-title">{product.name}</h3>
            </div>

            <div className="card-description-container">
              <p className="card-description">{product.description}</p>
            </div>

            <div className="card-price">
              {product.originalPrice &&
                product.originalPrice > (product.price || 0) && (
                  <span className="card-price-original">
                    {product.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              <span className="card-price-current">
                {(product.price || 0).toLocaleString("vi-VN")}đ
              </span>
            </div>

            <TechButton
              variant="primary"
              className="quick-view-btn"
              onClick={handleQuickViewClick}
              icon={<i className="fas fa-info-circle" style={{ fontSize: '16px', color: 'var(--theme-bg-primary)' }}></i>}
            >
              Xem nhanh thông số
            </TechButton>
          </div>
        </div>

        {/* Mặt sau - Thông số kỹ thuật */}
        <div className="product-card product-card-back">
          <div className="product-card-back-header">
            <button className="card-back-btn" onClick={handleQuickViewClick}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h3 className="product-card-back-title">Thông số kỹ thuật</h3>
          </div>

          <div className="product-card-specs-container">
            {displaySpecs.length > 0 ? (
              <ul className="specs-list">
                {displaySpecs.map(([key, value]) => (
                  <li key={key} className="spec-item">
                    <span className="spec-label">{key}:</span>
                    <span className="spec-value">{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-specs">
                <p>Chưa có thông số kỹ thuật</p>
                {product.features && product.features.length > 0 && (
                  <div className="features-list">
                    <h4>Tính năng:</h4>
                    <ul>
                      {product.features.slice(0, 4).map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
