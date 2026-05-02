import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsQuery } from '../../hooks/useProductsQuery';
import { getWishlistProducts } from '../../utils/wishlist';
import { SimpleProductCard } from '../../components/SimpleProductCard/SimpleProductCard';
import { Spinner } from '../../components/Spinner';
import type { Product } from '../../types';
import './WishlistPage.css';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, isError } = useProductsQuery();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  useEffect(() => {
    if (isLoading || isError) return;

    // Load wishlist items
    const loadWishlist = () => {
      const items = getWishlistProducts(products);
      setWishlistItems(items);
    };

    loadWishlist();

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [products, isLoading, isError]);

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page-container">
          <div className="page-header">
            <h1>Danh Sách Yêu Thích</h1>
          </div>
          <div className="loading-container">
            <Spinner size="md" aria-label="Loading wishlist" />
            <p>Đang tải danh sách yêu thích...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page-container">
          <div className="page-header">
            <h1>Danh Sách Yêu Thích</h1>
          </div>
          <div className="empty-wishlist">
            <i className="fas fa-exclamation-circle"></i>
            <p>Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleViewDetails = (productId: number | string) => {
    navigate(`/product/${productId}`);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page-container">
          <div className="page-header">
            <h1>Danh Sách Yêu Thích</h1>
            <p>Bạn chưa có sản phẩm nào trong danh sách yêu thích</p>
          </div>
          <div className="empty-wishlist">
            <i className="fas fa-heart-broken"></i>
            <p>Hãy thêm sản phẩm yêu thích để xem chúng ở đây!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page-container">
        <div className="page-header">
          <h1>Danh Sách Yêu Thích</h1>
          <p>Bạn có {wishlistItems.length} sản phẩm trong danh sách yêu thích</p>
        </div>

        <div className="wishlist-grid">
          {wishlistItems.map((product) => (
            <SimpleProductCard
              key={product.id}
              product={product}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;