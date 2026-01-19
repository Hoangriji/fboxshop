import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { ProductsService } from '../../../services/firebaseService';
import ProductFormModal from './ProductFormModal';
import type { Product } from '../../../types';

const ProductsManagement: React.FC = () => {
  const { products, loading, mutate } = useProducts();
  const { categories } = useCategories();
  const [searchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'name_asc' | 'name_desc'>('newest');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by featured status
    if (showFeaturedOnly) {
      filtered = filtered.filter(p => p.featured);
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_high':
          return b.price_vnd - a.price_vnd;
        case 'price_low':
          return a.price_vnd - b.price_vnd;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredProducts(sorted);
  }, [products, searchQuery, selectedCategory, sortBy, showFeaturedOnly]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    try {
      await ProductsService.deleteProduct(product.id);
      mutate(); // Refresh data
      alert('Xóa sản phẩm thành công!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      if (!product.featured) {
        // Kiểm tra giới hạn khi bật featured
        if (product.type === 'digital') {
          // Digital products
          const currentDigitalFeaturedCount = products.filter(p => 
            p.featured && p.type === 'digital'
          ).length;
          
          if (currentDigitalFeaturedCount >= 8) {
            setErrorModal({ show: true, message: 'Chỉ được chọn tối đa 8 sản phẩm Digital nổi bật cho carousel!' });
            return;
          }
        } else {
          // Physical products
          const currentPhysicalFeaturedCount = products.filter(p => 
            p.featured && p.type !== 'digital'
          ).length;
          
          if (currentPhysicalFeaturedCount >= 8) {
            setErrorModal({ show: true, message: 'Chỉ được chọn tối đa 8 sản phẩm vật lý nổi bật cho carousel!' });
            return;
          }
        }
      }
      
      await ProductsService.updateProduct(product.id, {
        featured: !product.featured
      });
      mutate(); // Refresh data
    } catch (error) {
      console.error('Error toggling featured:', error);
      setErrorModal({ show: true, message: 'Có lỗi xảy ra khi cập nhật trạng thái nổi bật' });
    }
  };

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    try {
      // Kiểm tra giới hạn sản phẩm digital free
      if (productData.type === 'digital' && productData.is_free) {
        const currentFreeDigitalCount = products.filter(
          p => p.type === 'digital' && p.is_free && p.id !== editingProduct?.id
        ).length;
        
        if (currentFreeDigitalCount >= 8) {
          setErrorModal({ show: true, message: 'Chỉ được chọn tối đa 8 sản phẩm Digital Miễn phí cho carousel!' });
          return;
        }
      }
      
      if (editingProduct) {
        // Update existing product
        await ProductsService.updateProduct(editingProduct.id, productData);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        // Create new product
        await ProductsService.createProduct(productData as Omit<Product, 'id'>);
        alert('Thêm sản phẩm mới thành công!');
      }
      mutate(); // Refresh data
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="products-management">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-management">
      <div className="page-header">
        <h2><i className="fas fa-box"></i> Quản lý sản phẩm</h2>
        <button className="btn-primary" onClick={handleAddProduct}>
          <i className="fas fa-plus"></i> <span>Thêm sản phẩm mới</span>
        </button>
      </div>
      
      <div className="products-filters">
        
        <div className="category-dropdown" ref={categoryDropdownRef}>
          <button
            className={`category-dropdown-btn ${categoryDropdownOpen ? 'open' : ''}`}
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
          >
            <i className="fas fa-filter"></i>
            <span>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Tất cả danh mục'}
            </span>
            <i className="fas fa-chevron-down"></i>
          </button>
          
          {categoryDropdownOpen && (
            <div className="category-dropdown-list">
              <div
                className={`category-option ${!selectedCategory ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory('');
                  setCategoryDropdownOpen(false);
                }}
              >
                <i className="fas fa-th"></i>
                <span>Tất cả danh mục</span>
              </div>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className={`category-option ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCategoryDropdownOpen(false);
                  }}
                >
                  <i className="fas fa-tag"></i>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="category-dropdown" ref={sortDropdownRef}>
          <button
            className={`category-dropdown-btn ${sortDropdownOpen ? 'open' : ''}`}
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <i className="fas fa-sort"></i>
            <span>
              {sortBy === 'newest' && 'Mới nhất'}
              {sortBy === 'oldest' && 'Cũ nhất'}
              {sortBy === 'price_high' && 'Giá cao đến thấp'}
              {sortBy === 'price_low' && 'Giá thấp đến cao'}
              {sortBy === 'name_asc' && 'Tên A-Z'}
              {sortBy === 'name_desc' && 'Tên Z-A'}
            </span>
            <i className="fas fa-chevron-down"></i>
          </button>
          
          {sortDropdownOpen && (
            <div className="category-dropdown-list">
              <div
                className={`category-option ${sortBy === 'newest' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('newest');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-clock"></i>
                <span>Mới nhất</span>
              </div>
              <div
                className={`category-option ${sortBy === 'oldest' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('oldest');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-history"></i>
                <span>Cũ nhất</span>
              </div>
              <div
                className={`category-option ${sortBy === 'price_high' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('price_high');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-arrow-down"></i>
                <span>Giá cao đến thấp</span>
              </div>
              <div
                className={`category-option ${sortBy === 'price_low' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('price_low');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-arrow-up"></i>
                <span>Giá thấp đến cao</span>
              </div>
              <div
                className={`category-option ${sortBy === 'name_asc' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('name_asc');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-sort-alpha-down"></i>
                <span>Tên A-Z</span>
              </div>
              <div
                className={`category-option ${sortBy === 'name_desc' ? 'selected' : ''}`}
                onClick={() => {
                  setSortBy('name_desc');
                  setSortDropdownOpen(false);
                }}
              >
                <i className="fas fa-sort-alpha-up"></i>
                <span>Tên Z-A</span>
              </div>
            </div>
          )}
        </div>

        {/* Featured Products Filter Checkbox */}
        <div className="featured-filter-checkbox">
          <label className="custom-checkbox">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
            />
            <span className="checkmark">
              <i className="fas fa-check"></i>
            </span>
            <span className="checkbox-label">
              Chỉ hiển thị sản phẩm nổi bật
            </span>
          </label>
        </div>
      </div>

      <div className="products-table-wrapper">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-box-open"></i>
            <p>Chưa có sản phẩm nào{searchQuery || selectedCategory ? ' phù hợp với bộ lọc' : ''}.</p>
            {showFeaturedOnly && (
              <small>Đánh dấu sản phẩm là <strong>"Nổi bật"</strong> bằng cách chỉnh sửa sản phẩm và bật tùy chọn Featured</small>
            )}
            {!searchQuery && !selectedCategory && !showFeaturedOnly && (
              <button className="btn-primary" onClick={handleAddProduct}>
                <i className="fas fa-plus"></i> <span>Thêm sản phẩm đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="products-list">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category);
              return (
                <div key={product.id} className="product-list-item">
                  <div className="product-image-small">
                    <img src={product.images[0]} alt={product.name} />
                  </div>
                  <div className="product-info-main">
                    <div className="product-name-section">
                      <h4>{product.name}</h4>
                      <span className="product-id">#{product.id}</span>
                    </div>
                    <div className="product-meta">
                      <span className="category-badge">
                        {category?.name || product.category}
                      </span>
                      <span className="product-price">
                        {product.price_vnd.toLocaleString('vi-VN')}₫
                      </span>
                      <span className={`status-badge ${product.stock_status}`}>
                        {product.stock_status === 'in_stock' ? 'Còn hàng' : 
                         product.stock_status === 'low_stock' ? 'Sắp hết' : 'Hết hàng'}
                      </span>
                    </div>
                  </div>
                  <div className="product-actions">
                    {product.featured ? (
                      <span className="featured-badge active" onClick={() => handleToggleFeatured(product)}>
                        <i className="fas fa-star"></i>
                      </span>
                    ) : (
                      <span className="not-featured" onClick={() => handleToggleFeatured(product)}>
                        <i className="far fa-star"></i>
                      </span>
                    )}
                    <button className="btn-action btn-edit" title="Chỉnh sửa" onClick={() => handleEditProduct(product)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-action btn-delete" title="Xóa" onClick={() => handleDeleteProduct(product)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="table-footer">
        <p>Hiển thị {filteredProducts.length} / {products.length} sản phẩm</p>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Error Modal */}
      {errorModal.show && (
        <div className="notification-modal-overlay" onClick={() => setErrorModal({ show: false, message: '' })}>
          <div className="notification-modal error" onClick={(e) => e.stopPropagation()}>
            <div className="notification-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3>Thông báo</h3>
            <p>{errorModal.message}</p>
            <button 
              className="btn-modal-close"
              onClick={() => setErrorModal({ show: false, message: '' })}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;