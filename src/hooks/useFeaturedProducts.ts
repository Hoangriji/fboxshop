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

      // Load all featured products
      const allFeatured = await ProductsService.getFeaturedProducts();
      
      // Separate Physical (non-digital) featured products for carousel 1
      const physicalFeatured = allFeatured
        .filter(p => p.type !== 'digital')
        .slice(0, 8);
      
      // Separate Digital featured products for carousel 2
      const digitalFeatured = allFeatured
        .filter(p => p.type === 'digital')
        .slice(0, 8);

      // Update cache
      cachedFeaturedProducts = physicalFeatured;
      cachedFreeProducts = digitalFeatured;
      cacheTimestamp = Date.now();

      setFeaturedProducts(physicalFeatured);
      setFreeDigitalProducts(digitalFeatured);
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
