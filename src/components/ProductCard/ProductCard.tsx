import React, { useState, useEffect, useRef } from 'react';
import { WishlistButton } from '../WishlistButton';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const specsContainerRef = useRef<HTMLDivElement>(null);

  // Ưu tiên cuộn nội dung specs bên trong card trước khi cuộn viewport
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl || !isFlipped) return;

    const handleWheel = (e: WheelEvent) => {
      const container = specsContainerRef.current;
      if (!container) return;

      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 1) {
        // Không có thanh cuộn hoặc nội dung không tràn, để viewport cuộn tự nhiên
        return;
      }

      const delta = e.deltaY;

      if (delta > 0) {
        // Đang lăn chuột xuống
        if (container.scrollTop < maxScroll - 1.5) {
          // Còn nội dung để cuộn xuống trong card -> chặn scroll của viewport và cuộn card
          e.preventDefault();
          e.stopPropagation();
          container.scrollBy({ top: delta, behavior: 'auto' });
        }
        // Đã chạm đáy card -> để event tiếp tục để viewport cuộn
      } else if (delta < 0) {
        // Đang lăn chuột lên
        if (container.scrollTop > 1.5) {
          // Còn nội dung để cuộn lên trong card -> chặn scroll của viewport và cuộn card
          e.preventDefault();
          e.stopPropagation();
          container.scrollBy({ top: delta, behavior: 'auto' });
        }
        // Đã chạm đỉnh card -> để event tiếp tục để viewport cuộn
      }
    };

    cardEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      cardEl.removeEventListener('wheel', handleWheel);
    };
  }, [isFlipped]);

  // Helper to get product name without parentheses and "Bàn phím" / "Bàn phím cơ" prefix
  const getDisplayName = (name: string) => {
    let displayName = name;
    const parenIndex = displayName.indexOf('(');
    if (parenIndex !== -1) {
      displayName = displayName.substring(0, parenIndex).trim();
    }
    // Remove "bàn phím cơ" or "bàn phím" prefix cleanly (case-insensitive)
    displayName = displayName.replace(/^bàn\s+phím(?:\s+cơ)?\s*/i, '').trim();
    return displayName;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Khi đang xem thông số ở mặt sau, click vào card không chuyển trang chi tiết
    if (isFlipped) {
      return;
    }
    if ((e.target as HTMLElement).closest('.wishlist-btn') || 
        (e.target as HTMLElement).closest('.quick-view-btn')) {
      return;
    }
    onViewDetails(product.id);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
    if (!isFlipped && specsContainerRef.current) {
      specsContainerRef.current.scrollTop = 0;
    }
  };

  const getStatusConfig = () => {
    if (product.stockStatus === 'out_of_stock') {
      return { text: 'Liên hệ', className: 'out-of-stock' };
    } else {
      return { text: 'Còn hàng', className: 'in-stock' };
    }
  };

  const statusConfig = getStatusConfig();

  // Lấy toàn bộ specs để hiển thị ở mặt sau và cho phép cuộn xem đầy đủ
  const displaySpecs = product.specs 
    ? Object.entries(product.specs) 
    : [];

  return (
    <div
      ref={cardRef}
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
              <h3 className="card-title">{getDisplayName(product.name)}</h3>
            </div>

            {/* <div className="card-description-container">
              <p className="card-description">{product.description}</p>
            </div> */}

            <div className="card-price">
              <span className="card-price-current">
                {(product.price || 0).toLocaleString("vi-VN")}đ
              </span>
              {typeof product.originalPrice === 'number' &&
              product.originalPrice > (product.price || 0) ? (
                <span className="card-price-original">
                  {product.originalPrice.toLocaleString("vi-VN")}đ
                </span>
              ) : null}
            </div>

            <button
              type="button"
              className="quick-view-btn"
              onClick={handleQuickViewClick}
              title="Xem thông số kỹ thuật"
            >
              <i className="fas fa-search"></i>
              <span>Xem nhanh thông số</span>
            </button>
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

          <div 
            className="product-card-specs-container"
            ref={specsContainerRef}
            tabIndex={0}
            aria-label="Danh sách thông số kỹ thuật"
          >
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
                      {product.features.map((feature, index) => (
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
