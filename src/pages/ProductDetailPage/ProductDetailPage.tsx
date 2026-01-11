import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
// import { useSiteConfig } from '../../hooks/useSiteConfig';
import { WishlistButton } from '../../components/WishlistButton';
import { RelatedProducts } from '../../components/RelatedProducts';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { openZaloImmediate } from '../../utils/zaloHelper';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  // const { config } = useSiteConfig();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Tìm product trực tiếp từ database
  const product = products.find(p => p.id === id);

  // Handle contact for purchase - Copy info and show modal
  const handleZaloPurchase = async () => {
    if (!product) return;
    
    // Tạo message template với thông tin sản phẩm
    const productUrl = window.location.href;
    const messageTemplate = `Tôi muốn mua sản phẩm:
• Mã SP: ${product.id}
• Tên: ${product.name}
• Giá: ${product.price_vnd.toLocaleString('vi-VN')} VNĐ
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

  // TEMPORARILY DISABLED - Discord/Coin payment
  // const handleDiscordPurchase = () => {
  //   if (!product || !config) return;
  //   
  //   const discordUrl = config.site?.contact?.discord || 'https://discord.gg/uside-shop';
  //   window.open(discordUrl, '_blank');
  // };

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  const stockStatus = product.stock_status;

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
              <div className="detail-current-price">{product.price_vnd.toLocaleString()}đ</div>
              {product.original_price_vnd && (
                <div className="detail-original-price">{product.original_price_vnd.toLocaleString()}đ</div>
              )}
              {product.discount && product.original_price_vnd && (
                <div className="detail-savings">Tiết kiệm: {(product.original_price_vnd - product.price_vnd).toLocaleString()}đ</div>
              )}
            </div>

            <div className="detail-stock-status">
              {stockStatus === 'in_stock' ? (
                <span className="detail-in-stock">
                  <i className="fas fa-check-circle"></i>
                  Còn hàng
                </span>
              ) : stockStatus === 'low_stock' ? (
                <span className="detail-low-stock">
                  <i className="fas fa-exclamation-circle"></i>
                  Sắp hết
                </span>
              ) : (
                <span className="detail-out-of-stock">
                  <i className="fas fa-times-circle"></i>
                  Hết hàng
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
                    disabled={stockStatus === 'out_of_stock'}
                  >
                    <i className="fas fa-comments"></i>
                    <span className="btn-label">Inbox Zalo để đặt hàng</span>
                  </button>
                  
                  {/* TEMPORARILY DISABLED - Discord/Coin payment */}
                  {/* <button 
                    className="detail-discord-btn"
                    onClick={handleDiscordPurchase}
                    disabled={stockStatus === 'out_of_stock'}
                  >
                    <i className="fab fa-discord"></i>
                    <div className="btn-content">
                      <span className="btn-label">Mua bằng Coin</span>
                      <span className="btn-price">{product.price_virtual.toLocaleString('vi-VN')} UC</span>
                    </div>
                  </button> */}
                </div>
                
                <WishlistButton 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price_vnd,
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
      {product && products.length > 0 && (
        <div>
          <RelatedProducts
            products={(() => {
              const MIN_CARDS = 6;
              const MAX_CARDS = 8;
              
              // 1. Lấy products cùng category/subcategory (ưu tiên cao nhất)
              const sameCategoryProducts = products.filter(p => 
                p.id !== product.id && 
                (p.category === product.category || p.subcategory === product.subcategory)
              );
              
              // Nếu đã đủ 6+ products cùng category → Chỉ hiển thị tối đa 8 products đó
              if (sameCategoryProducts.length >= MIN_CARDS) {
                return sameCategoryProducts.slice(0, MAX_CARDS);
              }
              
              // 2. Nếu chưa đủ 6, thêm products có specific tags (không phải generic tags)
              const genericTags = ['gaming', 'wireless', 'premium', 'pro', 'rgb'];
              const productSpecificTags = product.tags.filter(tag => !genericTags.includes(tag));
              
              const relatedByTags = products.filter(p => {
                if (p.id === product.id) return false;
                if (sameCategoryProducts.some(sp => sp.id === p.id)) return false; // Đã có trong sameCategoryProducts
                
                return p.tags?.some(tag => 
                  productSpecificTags.includes(tag) && !genericTags.includes(tag)
                );
              });
              
              const combined = [...sameCategoryProducts, ...relatedByTags];
              
              // Nếu vẫn chưa đủ 6, lấy thêm products bất kỳ (có chung generic tags)
              if (combined.length < MIN_CARDS) {
                const remaining = products.filter(p => 
                  p.id !== product.id && 
                  !combined.some(cp => cp.id === p.id)
                );
                
                return [...combined, ...remaining].slice(0, Math.max(MIN_CARDS, MAX_CARDS));
              }
              
              // Giới hạn tối đa 8 cards
              return combined.slice(0, MAX_CARDS);
            })()}
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