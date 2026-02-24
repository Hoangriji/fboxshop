import React from 'react';
import { ProductCard } from '../ProductCard/ProductCard';
import type { Product as DatabaseProduct } from '../../types';

interface SimpleProduct {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  discount?: number;
}

interface SimpleProductCardProps {
  product: DatabaseProduct;
  onViewDetails: (productId: number | string) => void;
}

export const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ 
  product: databaseProduct, 
  onViewDetails 
}) => {
  // Convert database Product format to ProductCard format
  const product: SimpleProduct = {
    id: databaseProduct.id, // Keep as string from database
    name: databaseProduct.name,
    price: databaseProduct.price_vnd,
    originalPrice: databaseProduct.original_price_vnd,
    image: databaseProduct.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image',
    category: databaseProduct.category,
    description: databaseProduct.description,
    inStock: databaseProduct.stock_status !== 'out_of_stock',
  };

  return (
    <ProductCard 
      product={{
        ...product,
        stockStatus: databaseProduct.stock_status,
        specs: databaseProduct.specs,
        features: databaseProduct.features,
        brand: databaseProduct.brand
      }} 
      onViewDetails={onViewDetails}
    />
  );
};