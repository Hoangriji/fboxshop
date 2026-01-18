/**
 * Optimized Featured Products Hook for HomePage
 * 
 * Features:
 * - Loads only featured/free products (not entire collection)
 * - Progressive rendering (hero first, then carousels)
 * - Background loading without blocking UI
 */

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { ProductsService } from '../services/firebaseService';

interface UseFeaturedProductsResult {
  featuredProducts: Product[];
  freeDigitalProducts: Product[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Cache for featured products
let cachedFeaturedProducts: Product[] | null = null;
let cachedFreeProducts: Product[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useFeaturedProducts = (): UseFeaturedProductsResult => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [freeDigitalProducts, setFreeDigitalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache
      if (
        cachedFeaturedProducts &&
        cachedFreeProducts &&
        Date.now() - cacheTimestamp < CACHE_DURATION
      ) {
        setFeaturedProducts(cachedFeaturedProducts);
        setFreeDigitalProducts(cachedFreeProducts);
        setLoading(false);
        return;
      }

      // Load featured products (only those marked as featured)
      const featured = await ProductsService.getFeaturedProducts();
      
      // Load free digital products
      const allProducts = await ProductsService.getPaginatedProducts(50);
      const freeDigital = allProducts.products.filter(
        p => p.category === 'digital' && p.is_free === true
      );

      // Update cache
      cachedFeaturedProducts = featured;
      cachedFreeProducts = freeDigital;
      cacheTimestamp = Date.now();

      setFeaturedProducts(featured);
      setFreeDigitalProducts(freeDigital);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading featured products:', err);
      
      // Set empty arrays on error to avoid blocking UI
      setFeaturedProducts([]);
      setFreeDigitalProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Clear cache
    cachedFeaturedProducts = null;
    cachedFreeProducts = null;
    cacheTimestamp = 0;
    
    await loadFeaturedProducts();
  }, [loadFeaturedProducts]);

  useEffect(() => {
    loadFeaturedProducts();
  }, [loadFeaturedProducts]);

  return {
    featuredProducts,
    freeDigitalProducts,
    loading,
    error,
    refresh,
  };
};

// Clear cache when needed
export const clearFeaturedCache = () => {
  cachedFeaturedProducts = null;
  cachedFreeProducts = null;
  cacheTimestamp = 0;
};
