import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { ProductsService } from '../../../services/firebaseService';
import ProductFormModal from './ProductFormModal';
import type { Product } from '../../../types';

const FeaturedManagement: React.FC = () => {
  const { products, loading, mutate } = useProducts();
  const { categories } = useCategories();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [freeDigitalProducts, setFreeDigitalProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (products) {
      // Lấy 8 sản phẩm Physical featured đầu tiên
      const featured = products
        .filter(p => p.featured && p.type !== 'digital')
        .slice(0, 8);
      // Lấy 8 sản phẩm Digital featured đầu tiên (có thể free hoặc không free)
      const freeDigital = products
        .filter(p => p.type === 'digital' && p.featured)
        .slice(0, 8);
      
      setFeaturedProducts(featured);
      setFreeDigitalProducts(freeDigital);
    }
  }, [products]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await ProductsService.updateProduct(product.id, {
        featured: !product.featured
      });
      mutate();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

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

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    try {
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
        <p style={{ fontSize: '0.9rem', color: 'var(--theme-text-secondary)', marginTop: '0.5rem' }}>
          Quản lý 2 carousel hiển thị trên trang chủ - Featured Products và Digital Free
        </p>
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
            <span className="count-badge">{featuredProducts.length}/8 sản phẩm</span>
          </div>
          
          {featuredProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-star"></i>
              <p>Chưa có sản phẩm nổi bật nào</p>
              <small>Vào <strong>Quản lý sản phẩm</strong>, chọn sản phẩm và bật tùy chọn <strong>"Nổi bật"</strong> để hiển thị ở đây</small>
            </div>
          ) : (
            <div className="featured-products-grid">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="featured-product-card">
                  <div className="card-order-badge">#{index + 1}</div>
                  <div className="card-image">
                    <img src={product.images[0]} alt={product.name} />
                  </div>
                  <div className="card-content">
                    <h4 className="card-title">{product.name}</h4>
                    <div className="card-meta">
                      <span className="card-category">{product.category}</span>
                      <span className="card-price">
                        {product.price_vnd.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-card-action btn-edit" 
                        onClick={() => handleEditProduct(product)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-card-action btn-toggle-featured" 
                        onClick={() => handleToggleFeatured(product)}
                        title="Bỏ khỏi Featured"
                      >
                        <i className="fas fa-star"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Digital Free Carousel */}
        <div className="featured-section">
          <div className="section-header">
            <div>
              <h3><i className="fas fa-gift"></i> Carousel Sản phẩm Digital Miễn phí</h3>
              <p className="section-description">
                8 sản phẩm Digital (Featured) đầu tiên sẽ hiển thị trong carousel Homepage
              </p>
            </div>
            <span className="count-badge">{freeDigitalProducts.length}/8 sản phẩm</span>
          </div>
          
          {freeDigitalProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-download"></i>
              <p>Chưa có sản phẩm Digital nổi bật nào</p>
              <small>Vào <strong>Quản lý sản phẩm</strong>, chọn sản phẩm loại <strong>"Digital"</strong> và bật <strong>"Nổi bật"</strong></small>
            </div>
          ) : (
            <div className="featured-products-grid">
              {freeDigitalProducts.map((product, index) => (
                <div key={product.id} className="featured-product-card digital">
                  <div className="card-order-badge">#{index + 1}</div>
                  <div className="card-image">
                    <img src={product.images[0]} alt={product.name} />
                    <div className="free-badge">
                      <i className="fas fa-gift"></i> FREE
                    </div>
                  </div>
                  <div className="card-content">
                    <h4 className="card-title">{product.name}</h4>
                    <div className="card-meta">
                      <span className="card-category">{product.category}</span>
                      <span className="card-size">
                        <i className="fas fa-file"></i> {product.file_size || 'N/A'}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-card-action btn-edit" 
                        onClick={() => handleEditProduct(product)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-card-action btn-toggle-free" 
                        onClick={() => handleToggleFree(product)}
                        title="Bỏ khỏi Free"
                      >
                        <i className="fas fa-gift"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitProduct}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default FeaturedManagement;