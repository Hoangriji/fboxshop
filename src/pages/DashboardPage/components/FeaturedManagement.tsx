import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { ProductsService } from '../../../services/firebaseService';
import ProductFormModal from './ProductFormModal';
import type { Product } from '../../../types';
import type { PlaceholderProduct } from '../../../hooks/useFeaturedProducts';

const FeaturedManagement: React.FC = () => {
  const { products, loading, mutate } = useProducts();
  const { categories } = useCategories();
  const [featuredProducts, setFeaturedProducts] = useState<(Product | PlaceholderProduct)[]>([]);
  // const [freeDigitalProducts, setFreeDigitalProducts] = useState<(Product | PlaceholderProduct)[]>([]); // ẩn digital
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('all');

  useEffect(() => {
    if (products) {
      // Lấy các sản phẩm Physical featured
      const physicalFeatured = products.filter(p => p.featured && p.type !== 'digital');
      
      if (physicalFeatured.length <= 8) {
        // Fill thiếu với Coming Soon placeholders
        const featuredWithPlaceholders: (Product | PlaceholderProduct)[] = [...physicalFeatured];
        while (featuredWithPlaceholders.length < 8) {
          featuredWithPlaceholders.push({
            id: `placeholder-${featuredWithPlaceholders.length}`,
            isPlaceholder: true,
          } as PlaceholderProduct);
        }
        setFeaturedProducts(featuredWithPlaceholders);
      } else {
        // Nếu hiện tại đang có nhiều hơn 8 sản phẩm do trước đó bị thêm vượt quá giới hạn,
        // hiển thị tất cả để người dùng thấy và bỏ chọn sản phẩm dư thừa
        setFeaturedProducts(physicalFeatured);
      }
    }
  }, [products]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const currentPhysicalFeaturedCount = products 
    ? products.filter(p => p.featured && p.type !== 'digital').length 
    : 0;

  const handleToggleFeatured = async (product: Product) => {
    const isCurrentlyFeatured = Boolean(product.featured);

    if (!isCurrentlyFeatured && currentPhysicalFeaturedCount >= 8) {
      alert('Đã đủ 8/8 sản phẩm nổi bật! Vui lòng bỏ nổi bật một sản phẩm khác trước khi chọn thêm.');
      return;
    }

    try {
      await ProductsService.updateProduct(product.id, {
        featured: !isCurrentlyFeatured
      });
      mutate();
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái nổi bật');
    }
  };

  /* ẩn digital
  const handleToggleFree = async (product: Product) => {
    try {
      await ProductsService.updateProduct(product.id, {
        is_free: !product.is_free
      });
      mutate();
    } catch (error) {
      console.error('Error toggling free:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái miễn phí');
    }
  };
  */

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.featured && (!editingProduct || !editingProduct.featured)) {
        const count = products.filter(
          p => p.featured && p.type !== 'digital' && p.id !== editingProduct?.id
        ).length;
        if (count >= 8) {
          alert('Đã đủ 8/8 sản phẩm nổi bật! Vui lòng bỏ nổi bật sản phẩm khác trước.');
          return;
        }
      }
      if (editingProduct) {
        await ProductsService.updateProduct(editingProduct.id, productData);
        alert('Cập nhật sản phẩm thành công!');
      }
      mutate();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

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
        <h2><i className="fas fa-star"></i> Quản lý Sản phẩm Nổi bật</h2>
        {/* ẩn digital */}
        {/*
        <p style={{ fontSize: '0.9rem', color: 'var(--theme-text-secondary)', marginTop: '0.5rem' }}>
          Quản lý 2 carousel hiển thị trên trang chủ - Featured Products và Digital Free
        </p>
        */}
      </div>
      
      <div className="featured-sections">
        {/* Featured Products Carousel */}
        <div className="featured-section">
          <div className="section-header">
            <div>
              <h3><i className="fas fa-fire"></i> Carousel Sản phẩm Nổi bật</h3>
              <p className="section-description">
                8 sản phẩm Vật lý (Featured) đầu tiên sẽ hiển thị trong carousel Homepage
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span 
                className="count-badge"
                style={
                  currentPhysicalFeaturedCount > 8 
                    ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }
                    : currentPhysicalFeaturedCount === 8
                    ? { borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }
                    : undefined
                }
              >
                {currentPhysicalFeaturedCount}/8 sản phẩm{currentPhysicalFeaturedCount === 8 ? ' (Đã đủ)' : currentPhysicalFeaturedCount > 8 ? ' (Vượt mức)' : ''}
              </span>
              <button 
                type="button" 
                className={currentPhysicalFeaturedCount >= 8 ? "btn-secondary" : "btn-primary"}
                onClick={() => setIsPickerOpen(true)}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                title={currentPhysicalFeaturedCount >= 8 ? "Mở danh sách để quản lý hoặc đổi sản phẩm nổi bật" : "Chọn thêm sản phẩm nổi bật"}
              >
                <i className={currentPhysicalFeaturedCount >= 8 ? "fas fa-list-check" : "fas fa-plus"}></i> {currentPhysicalFeaturedCount >= 8 ? "Quản lý / Đổi SP" : "Chọn thêm"}
              </button>
            </div>
          </div>

          {currentPhysicalFeaturedCount > 8 && (
            <div style={{
              margin: '0.5rem 0 1rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.1rem' }}></i>
                <span>
                  <strong>Cảnh báo:</strong> Đang có <strong>{currentPhysicalFeaturedCount}</strong> sản phẩm nổi bật (vượt mức tối đa 8). Vui lòng bấm biểu tượng sao vàng trên thẻ sản phẩm để bỏ bớt {currentPhysicalFeaturedCount - 8} sản phẩm.
                </span>
              </div>
            </div>
          )}
          
          {featuredProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-star"></i>
              <p>Chưa có sản phẩm nổi bật nào</p>
              <small>Vào <strong>Quản lý sản phẩm</strong>, chọn sản phẩm và bật tùy chọn <strong>"Nổi bật"</strong> để hiển thị ở đây</small>
            </div>
          ) : (
            <div className="featured-products-grid">
              {featuredProducts.map((product) => {
                if ('isPlaceholder' in product && product.isPlaceholder) {
                  return (
                    <div 
                      key={product.id} 
                      className="featured-product-card coming-soon"
                      onClick={() => setIsPickerOpen(true)}
                      style={{ cursor: 'pointer' }}
                      title="Bấm để chọn sản phẩm thêm vào Carousel nổi bật"
                    >
                      <div className="card-image">
                        <div className="coming-soon-content">
                          <i className="fas fa-plus-circle"></i>
                          <span>+ Thêm sản phẩm</span>
                        </div>
                      </div>
                      <div className="card-content">
                        <h4 className="card-title">Vị trí còn trống</h4>
                        <div className="card-meta">
                          <span className="card-category">Bấm để chọn</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Type guard: ensure this is a real Product
                const realProduct = product as Product;
                
                return (
                  <div key={realProduct.id} className="featured-product-card">
                    <div className="card-image">
                      <img src={realProduct.images[0]} alt={realProduct.name} />
                    </div>
                    <div className="card-content">
                      <h4 className="card-title">{realProduct.name}</h4>
                      <div className="card-meta">
                        <span className="card-category">{realProduct.category}</span>
                        <span className="card-price">
                          {realProduct.price_vnd.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="btn-card-action btn-edit" 
                          onClick={() => handleEditProduct(realProduct)}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-card-action btn-toggle-featured" 
                          onClick={() => handleToggleFeatured(realProduct)}
                          title="Bỏ khỏi Featured"
                        >
                          <i className="fas fa-star"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ẩn digital */}
        {/*
        <div className="featured-section">
          <div className="section-header">
            <div>
              <h3><i className="fas fa-gift"></i> Carousel Sản phẩm Digital Miễn phí</h3>
              <p className="section-description">
                8 sản phẩm Digital (Featured) đầu tiên sẽ hiển thị trong carousel Homepage
              </p>
            </div>
            <span className="count-badge">{freeDigitalProducts.filter((p): p is Product => 'isPlaceholder' in p && !p.isPlaceholder).length}/8 sản phẩm</span>
          </div>
          
          {freeDigitalProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-download"></i>
              <p>Chưa có sản phẩm Digital nổi bật nào</p>
              <small>Vào <strong>Quản lý sản phẩm</strong>, chọn sản phẩm loại <strong>"Digital"</strong> và bật <strong>"Nổi bật"</strong></small>
            </div>
          ) : (
            <div className="featured-products-grid">
              {freeDigitalProducts.map((product) => {
                if ('isPlaceholder' in product && product.isPlaceholder) {
                  return (
                    <div key={product.id} className="featured-product-card digital coming-soon">
                      <div className="card-image">
                        <div className="coming-soon-content">
                          <i className="fas fa-clock"></i>
                          <span>Coming Soon</span>
                        </div>
                      </div>
                      <div className="card-content">
                        <h4 className="card-title">Digital sắp ra mắt</h4>
                        <div className="card-meta">
                          <span className="card-category">Đang cập nhật</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Type guard: ensure this is a real Product
                const realProduct = product as Product;
                
                return (
                  <div key={realProduct.id} className="featured-product-card digital">
                    <div className="card-image">
                      <img src={realProduct.images[0]} alt={realProduct.name} />
                      <div className="free-badge">
                        <i className="fas fa-gift"></i> FREE
                      </div>
                    </div>
                    <div className="card-content">
                      <h4 className="card-title">{realProduct.name}</h4>
                      <div className="card-meta">
                        <span className="card-category">{realProduct.category}</span>
                        <span className="card-size">
                          <i className="fas fa-file"></i> {realProduct.file_size || 'N/A'}
                        </span>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="btn-card-action btn-edit" 
                          onClick={() => handleEditProduct(realProduct)}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-card-action btn-toggle-free" 
                          onClick={() => handleToggleFree(realProduct)}
                          title="Bỏ khỏi Free"
                        >
                          <i className="fas fa-gift"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        */}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Modal Chọn sản phẩm nổi bật */}
      {isPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsPickerOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h2>
                <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                Chọn sản phẩm vào Carousel Nổi bật
              </h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setIsPickerOpen(false)}
                title="Đóng"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--theme-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentPhysicalFeaturedCount >= 8 && (
                <div style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '8px',
                  background: currentPhysicalFeaturedCount > 8 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: currentPhysicalFeaturedCount > 8 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  color: currentPhysicalFeaturedCount > 8 ? '#ef4444' : '#f59e0b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-info-circle"></i>
                  <span>
                    {currentPhysicalFeaturedCount > 8 
                      ? `Đang có ${currentPhysicalFeaturedCount}/8 sản phẩm nổi bật (vượt mức). Hãy bấm "Bỏ nổi bật" để giảm về 8 sản phẩm.`
                      : 'Đã đạt giới hạn tối đa 8/8 sản phẩm nổi bật. Để chọn sản phẩm mới, bạn cần bấm "Bỏ nổi bật" một sản phẩm hiện có.'
                    }
                  </span>
                </div>
              )}

              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên, danh mục, thương hiệu..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--theme-border)',
                  background: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-primary)'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'featured_only', label: `★ Đang nổi bật (${currentPhysicalFeaturedCount})` },
                  { id: 'monitor', label: 'Màn hình' },
                  { id: 'keyboard', label: 'Bàn phím' },
                  { id: 'mouse', label: 'Chuột' },
                  { id: 'headset', label: 'Tai nghe' },
                  { id: 'usb', label: 'USB & Phụ kiện' },
                  { id: 'other', label: 'Khác' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPickerCategory(cat.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid var(--theme-border)',
                      background: pickerCategory === cat.id ? 'var(--accent-primary)' : 'var(--theme-bg-tertiary)',
                      color: pickerCategory === cat.id ? '#ffffff' : 'var(--theme-text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {products
                .filter(p => p.type !== 'digital')
                .filter(p => {
                  if (pickerCategory === 'featured_only') {
                    return Boolean(p.featured);
                  }
                  if (pickerCategory !== 'all') {
                    if (pickerCategory === 'usb') return p.category === 'usb' || p.category === 'usb-storage';
                    return p.category === pickerCategory;
                  }
                  return true;
                })
                .filter(p => {
                  if (!pickerSearch.trim()) return true;
                  const q = pickerSearch.trim().toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    p.brand?.toLowerCase().includes(q)
                  );
                })
                .map(product => {
                  const isFeatured = Boolean(product.featured);
                  const isMaxReached = currentPhysicalFeaturedCount >= 8;
                  const canAdd = isFeatured || !isMaxReached;

                  return (
                    <div 
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '12px',
                        border: '1px solid var(--theme-border)',
                        background: isFeatured ? 'rgba(245, 158, 11, 0.08)' : 'var(--theme-bg-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                          src={product.images?.[0] || 'https://via.placeholder.com/60'} 
                          alt={product.name}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--theme-text-primary)' }}>
                            {product.name}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--theme-text-secondary)' }}>
                            {product.category} • {product.price_vnd.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(product)}
                        disabled={!canAdd}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          border: isFeatured 
                            ? '1px solid #f59e0b' 
                            : !canAdd
                            ? '1px solid var(--theme-border)'
                            : '1px solid var(--theme-border)',
                          background: isFeatured 
                            ? '#f59e0b' 
                            : !canAdd 
                            ? 'var(--theme-bg-tertiary)' 
                            : 'var(--theme-bg-tertiary)',
                          color: isFeatured 
                            ? '#ffffff' 
                            : !canAdd 
                            ? 'var(--theme-text-muted, #777)' 
                            : 'var(--theme-text-primary)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: !canAdd ? 'not-allowed' : 'pointer',
                          opacity: !canAdd ? 0.45 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title={
                          isFeatured 
                            ? 'Bấm để bỏ khỏi nổi bật' 
                            : !canAdd 
                            ? 'Đã đủ 8/8 sản phẩm nổi bật. Hãy bỏ nổi bật sản phẩm khác trước khi chọn.' 
                            : 'Chọn sản phẩm này vào danh sách nổi bật'
                        }
                      >
                        <i className={`fas ${isFeatured ? 'fa-star' : !canAdd ? 'fa-lock' : 'fa-plus'}`}></i>
                        {isFeatured ? 'Bỏ nổi bật' : !canAdd ? 'Đã đủ 8/8' : 'Chọn nổi bật'}
                      </button>
                    </div>
                  );
                })}
            </div>
            
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--theme-border)', margin: 0 }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsPickerOpen(false)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setIsPickerOpen(false)}
              >
                <i className="fas fa-check"></i> Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedManagement;