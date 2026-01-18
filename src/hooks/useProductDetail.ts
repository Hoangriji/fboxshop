/**
 * Optimized Product Detail Hook
 * 
 * Loads individual product by ID without loading entire products array
 * Features:
 * - Direct Firebase fetch by ID
 * - Caching to avoid redundant requests
 * - Related products loading
 */

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { ProductsService } from '../services/firebaseService';

interface UseProductDetailResult {
  product: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  loadingRelated: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Simple in-memory cache for product details
const productCache = new Map<string, { product: Product; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductDetail = (productId?: string): UseProductDetailResult => {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadProduct = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = productCache.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setProduct(cached.product);
        setLoading(false);
        return cached.product;
      }

      // Fetch from Firebase
      const fetchedProduct = await ProductsService.getProductById(id);
      
      if (fetchedProduct) {
        // Update cache
        productCache.set(id, {
          product: fetchedProduct,
          timestamp: Date.now()
        });
        setProduct(fetchedProduct);
        return fetchedProduct;
      } else {
        setProduct(null);
        return null;
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading product:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRelatedProducts = useCallback(async (currentProduct: Product) => {
    try {
      setLoadingRelated(true);
      
      // Get products from same category (limit 8)
      const related = await ProductsService.getProductsByCategoryOptimized(
        currentProduct.category,
        12
      );
      
      // Filter out current product and limit to 8
      const filtered = related
        .filter(p => p.id !== currentProduct.id)
        .slice(0, 8);
      
      setRelatedProducts(filtered);
    } catch (err) {
      console.error('Error loading related products:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!productId) return;
    
    // Clear cache for this product
    productCache.delete(productId);
    
    const loadedProduct = await loadProduct(productId);
    if (loadedProduct) {
      await loadRelatedProducts(loadedProduct);
    }
  }, [productId, loadProduct, loadRelatedProducts]);

  // Load product when ID changes
  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      return;
    }

    (async () => {
      const loadedProduct = await loadProduct(productId);
      
      // Load related products in background (non-blocking)
      if (loadedProduct) {
        loadRelatedProducts(loadedProduct);
      }
    })();
  }, [productId, loadProduct, loadRelatedProducts]);

  return {
    product,
    relatedProducts,
    loading,
    loadingRelated,
    error,
    refresh,
  };
};

// Clear all cached products (useful when user logs out or data changes)
export const clearProductCache = () => {
  productCache.clear();
};
