/**
 * Optimized Products Hook - Progressive Loading with Smart Caching
 * 
 * Features:
 * - Loads only visible products (12-24 per page)
 * - Smart prefetching for smooth scroll
 * - Client-side filtering for instant feedback
 * - Minimal re-renders with proper memoization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../types';
import { ProductsService } from '../services/firebaseService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

const PRODUCTS_PER_PAGE = 12;

interface ProductFilters {
  category?: string;
  brands?: string[];
  priceRange?: { min: number; max: number | null };
  searchQuery?: string;
  // Add more filter types as needed
  connectionTypes?: string[];
  formFactors?: string[];
  ledTypes?: string[];
  // Extend as needed with specific types
}

interface UseProductsOptimizedOptions {
  initialPageSize?: number;
  enablePrefetch?: boolean;
}

interface UseProductsOptimizedResult {
  products: Product[];
  allProducts: Product[]; // All loaded products (for client-side filtering)
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  applyFilters: (filters: ProductFilters) => void;
  filters: ProductFilters;
}

export const useProductsOptimized = (
  options: UseProductsOptimizedOptions = {}
): UseProductsOptimizedResult => {
  const { 
    initialPageSize = PRODUCTS_PER_PAGE,
    enablePrefetch = true 
  } = options;

  // All products loaded from Firebase (cumulative)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Active filters
  const [filters, setFilters] = useState<ProductFilters>({});
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Firestore pagination cursor
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // Prefetched data (next page ready to display)
  const [prefetchedData, setPrefetchedData] = useState<{
    products: Product[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  } | null>(null);

  // Load initial batch of products
  const loadInitialProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { products, lastDoc: lastVisible } = 
        await ProductsService.getPaginatedProducts(initialPageSize);
      
      setAllProducts(products);
      setLastDoc(lastVisible);
      setHasMore(products.length === initialPageSize);

      // Prefetch next batch in background (non-blocking)
      if (enablePrefetch && products.length === initialPageSize && lastVisible) {
        setTimeout(async () => {
          try {
            const nextBatch = await ProductsService.getPaginatedProducts(
              PRODUCTS_PER_PAGE, 
              lastVisible
            );
            setPrefetchedData(nextBatch);
          } catch (err) {
            console.warn('Prefetch failed:', err);
          }
        }, 100);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading initial products:', err);
    } finally {
      setLoading(false);
    }
  }, [initialPageSize, enablePrefetch]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      // Use prefetched data if available
      if (prefetchedData) {
        setAllProducts(prev => [...prev, ...prefetchedData.products]);
        setLastDoc(prefetchedData.lastDoc);
        setHasMore(prefetchedData.products.length === PRODUCTS_PER_PAGE);
        setPrefetchedData(null);

        // Prefetch next batch
        if (enablePrefetch && prefetchedData.lastDoc) {
          setTimeout(async () => {
            try {
              const nextBatch = await ProductsService.getPaginatedProducts(
                PRODUCTS_PER_PAGE,
                prefetchedData.lastDoc!
              );
              setPrefetchedData(nextBatch);
            } catch (err) {
              console.warn('Prefetch failed:', err);
            }
          }, 100);
        }
      } else {
        // Load from server
        if (!lastDoc) {
          setHasMore(false);
          return;
        }

        const { products: moreProducts, lastDoc: nextLastDoc } = 
          await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE, lastDoc);
        
        setAllProducts(prev => [...prev, ...moreProducts]);
        setLastDoc(nextLastDoc);
        setHasMore(moreProducts.length === PRODUCTS_PER_PAGE);

        // Prefetch next batch
        if (enablePrefetch && moreProducts.length === PRODUCTS_PER_PAGE && nextLastDoc) {
          setTimeout(async () => {
            try {
              const nextBatch = await ProductsService.getPaginatedProducts(
                PRODUCTS_PER_PAGE,
                nextLastDoc
              );
              setPrefetchedData(nextBatch);
            } catch (err) {
              console.warn('Prefetch failed:', err);
            }
          }, 100);
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, prefetchedData, enablePrefetch]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setAllProducts([]);
    setLastDoc(null);
    setHasMore(true);
    setPrefetchedData(null);
    await loadInitialProducts();
  }, [loadInitialProducts]);

  // Apply filters to products (client-side for instant feedback)
  const applyFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
  }, []);

  // Filter products based on active filters (memoized)
  const products = useMemo(() => {
    let filtered = [...allProducts];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(p => 
        p.brand && filters.brands!.includes(p.brand)
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(p => {
        const price = p.price_vnd;
        return price >= min && (max === null || price <= max);
      });
    }

    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.subcategory.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allProducts, filters]);

  // Initial load
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  return {
    products,
    allProducts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    applyFilters,
    filters,
  };
};
