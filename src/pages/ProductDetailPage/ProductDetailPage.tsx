import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetail } from '../../hooks/useProductDetail';
import { WishlistButton } from '../../components/WishlistButton';
import { RelatedProducts } from '../../components/RelatedProducts';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Spinner } from '../../components/Spinner';
import { openZaloImmediate } from '../../utils/zaloHelper';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, relatedProducts, loading, error } = useProductDetail(id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Calculate current price
  const currentPrice = product?.price_vnd || 0;

  // Calculate stock status
  const stockStatus = product?.stock_status || 'in_stock';

  // Original price
  const originalPrice = product?.original_price_vnd;

  // Handle contact for purchase - Copy info and show modal
  const handleZaloPurchase = async () => {
    if (!product) return;
    
    // Tạo message template với thông tin sản phẩm
    const productUrl = window.location.href;
    const messageTemplate = `Tôi muốn mua sản phẩm:
• Mã SP: ${product.id}
• Tên: ${product.name}
• Giá: ${currentPrice.toLocaleString('vi-VN')} VNĐ
• Link: ${productUrl}`;
    
    // Copy message template vào clipboard
    try {
      await navigator.clipboard.writeText(messageTemplate);
      
      // Hiển thị modal confirmation
      setShowModal(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Nếu không copy được, vẫn hiện modal để user có thể mở Zalo
      setShowModal(true);
    }
  };

  // Handle open Zalo immediately when user clicks button in modal
  const handleOpenZaloNow = () => {
    openZaloImmediate();
    setShowModal(false);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading-container">
          <Spinner size="md" aria-label="Loading product" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="product-detail-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Không thể tải thông tin sản phẩm. Vui lòng thử lại!</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            <i className="fas fa-redo"></i> Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="not-found-container">
          <i className="fas fa-box-open"></i>
          <h2>Không tìm thấy sản phẩm</h2>
          <p>Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <button onClick={() => navigate('/products')} className="back-to-products-button">
            <i className="fas fa-arrow-left"></i> Quay lại trang sản phẩm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-page-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
          Quay lại danh sách sản phẩm
        </button>

        <div className="product-detail-grid">
          {/* Product Images */}
          <div className="detail-images">
            <div className="detail-main-image">
              <img 
                src={product.images?.[selectedImageIndex] || product.images?.[0] || 'https://via.placeholder.com/800'} 
                alt={product.name}
              />
              {product.discount && (
                <div className="detail-discount-badge">
                  -{product.discount}%
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="detail-image-thumbnails">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`detail-thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="detail-info">
            <div className="detail-category">{product.category}</div>
            
            <h1 className="detail-name">{product.name}</h1>

            <div className="detail-price-section">
              <div className="detail-current-price">{currentPrice.toLocaleString()}đ</div>
              {originalPrice && (
                <div className="detail-original-price">{originalPrice.toLocaleString()}đ</div>
              )}
              {product.discount && originalPrice && (
                <div className="detail-savings">Tiết kiệm: {(originalPrice - currentPrice).toLocaleString()}đ</div>
              )}
            </div>

            <div className="detail-stock-status">
              {stockStatus === 'out_of_stock' ? (
                <span className="detail-out-of-stock">
                  <i className="fas fa-phone-alt"></i>
                  Liên hệ
                </span>
              ) : (
                <span className="detail-in-stock">
                  <i className="fas fa-check-circle"></i>
                  Còn hàng
                </span>
              )}
            </div>

            <div className="detail-description">
              <p>{product.description}</p>
            </div>

            {/* Product Actions */}
            <div className="detail-actions">
              <div className="detail-action-buttons">
                <div>
                  <button 
                    className="detail-messenger-btn"
                    onClick={handleZaloPurchase}
                  >
                    <i className="fas fa-comments"></i>
                    <span className="btn-label">
                      {stockStatus === 'out_of_stock' ? 'Liên hệ Zalo để đặt hàng' : 'Inbox Zalo để đặt hàng'}
                    </span>
                  </button>
                  
                </div>
                
                <WishlistButton 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: currentPrice,
                    image: product.images?.[0] || '',
                    category: product.category,
                    description: product.description,
                    inStock: stockStatus !== 'out_of_stock'
                  }} 
                  variant="full" 
                  size="md" 
                />
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="detail-features">
                <h3>Tính năng nổi bật</h3>
                <ul>
                  {product.features.map((feature, index) => (
                    <li key={index}>
                      <i className="fas fa-check"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="detail-specifications">
                <h3>Thông số kỹ thuật</h3>
                <div className="detail-specs-grid">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="detail-spec-item">
                      <strong>{key}:</strong>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div>
          <RelatedProducts
            products={relatedProducts}
            currentProductId={String(product.id)}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        title="✓ Đã lưu thông tin sản phẩm!"
        message="Thông tin đã được copy vào bộ nhớ tạm.
Nhấn nút bên dưới để mở Zalo, sau đó dán (Ctrl+V) thông tin vào tin nhắn và gửi cho shop để được hỗ trợ ngay!"
        icon="success"
        primaryButtonLabel="Mở Zalo ngay"
        secondaryButtonLabel="Đóng"
        onPrimaryAction={handleOpenZaloNow}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ProductDetailPage;