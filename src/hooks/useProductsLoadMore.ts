import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { ProductsService } from '../services/firebaseService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { productCache } from '../utils/productCache';

const PRODUCTS_PER_PAGE = 12;

interface UseProductsLoadMoreOptions {
  category?: string; // 'all' or specific category
}

interface UseProductsLoadMoreResult {
  displayedProducts: Product[];
  prefetchedProducts: Product[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  categoryCounts: Record<string, number>;
  totalCount: number;
  loadMore: () => void;
  refresh: () => Promise<void>;
  setCategory: (category: string) => void;
}

export const useProductsLoadMore = (
  options: UseProductsLoadMoreOptions = {}
): UseProductsLoadMoreResult => {
  const { category: initialCategory = 'all' } = options;
  
  // Displayed products (rendered on screen)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  
  // Prefetched products (loaded but not yet displayed)
  const [prefetchedProducts, setPrefetchedProducts] = useState<Product[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Category tracking
  const [currentCategory, setCurrentCategory] = useState<string>(initialCategory);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  
  // Firestore pagination cursor
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // Load category counts with REAL-TIME updates
  useEffect(() => {
    console.log('Setting up real-time category counts listener...');
    
    // Subscribe to real-time updates
    const unsubscribe = ProductsService.subscribeToProductCounts((counts, total) => {
      console.log('REAL-TIME: Category counts updated!', counts);
      
      // Update state
      setCategoryCounts(counts);
      setTotalCount(total);
      
      // Update cache
      productCache.setCategoryCounts(counts, total);
    });
    
    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up category counts listener');
      unsubscribe();
    };
  }, []);

  // Load products with REAL-TIME sync
  useEffect(() => {
    console.log(`Setting up real-time listener for category: ${currentCategory}`);
    
    let productsUnsubscribe: (() => void) | null = null;
    
    const setupRealtimeSync = () => {
      setLoading(true);
      setError(null);
      
      // Check cache first for instant display
      const cached = productCache.get(currentCategory, 0, PRODUCTS_PER_PAGE);
      if (cached) {
        console.log(`Showing ${cached.products.length} cached products instantly`);
        setDisplayedProducts(cached.products);
        setLoading(false);
      }
      
      // Setup real-time listener
      productsUnsubscribe = ProductsService.subscribeToProductsByCategory(
        currentCategory,
        (allProducts) => {
          console.log(`REAL-TIME UPDATE: ${allProducts.length} products for ${currentCategory}`);
          
          // Update cache with ALL products from Firebase
          productCache.set(currentCategory, allProducts, null);
          
          // Show first page
          const firstPage = allProducts.slice(0, PRODUCTS_PER_PAGE);
          setDisplayedProducts(firstPage);
          
          // Cache next page for prefetch
          const secondPage = allProducts.slice(PRODUCTS_PER_PAGE, PRODUCTS_PER_PAGE * 2);
          if (secondPage.length > 0) {
            setPrefetchedProducts(secondPage);
            setHasMore(allProducts.length > PRODUCTS_PER_PAGE * 2);
          } else {
            setPrefetchedProducts([]);
            setHasMore(false);
          }
          
          setLoading(false);
        },
        100 // Load up to 100 products for caching
      );
    };
    
    setupRealtimeSync();
    
    // Cleanup listener when category changes
    return () => {
      if (productsUnsubscribe) {
        console.log(`Cleaning up listener for ${currentCategory}`);
        productsUnsubscribe();
      }
    };
  }, [currentCategory]);

  // Load more: show prefetched products and prefetch next batch
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    // If we have prefetched products, show them immediately
    if (prefetchedProducts.length > 0) {
      setDisplayedProducts(prev => [...prev, ...prefetchedProducts]);
      
      const oldPrefetched = prefetchedProducts;
      setPrefetchedProducts([]);
      
      // After rendering, prefetch next batch in background
      if (lastDoc && oldPrefetched.length === PRODUCTS_PER_PAGE) {
        setTimeout(async () => {
          try {
            setLoadingMore(true);
            
            let nextResult;
            if (currentCategory === 'all') {
              nextResult = await ProductsService.getPaginatedProducts(
                PRODUCTS_PER_PAGE,
                lastDoc
              );
            } else {
              nextResult = await ProductsService.getPaginatedProductsByCategory(
                currentCategory,
                PRODUCTS_PER_PAGE,
                lastDoc
              );
            }
            
            setPrefetchedProducts(nextResult.products);
            setLastDoc(nextResult.lastDoc);
            setHasMore(nextResult.products.length > 0);
            
            // Cache the new batch
            productCache.set(currentCategory, nextResult.products, nextResult.lastDoc, true);
          } catch (err) {
            setError(err as Error);
            console.error('Error prefetching more products:', err);
          } finally {
            setLoadingMore(false);
          }
        }, 100);
      } else {
        setHasMore(false);
      }
    } else {
      // No prefetched data, need to load from server
      if (!lastDoc) {
        setHasMore(false);
        return;
      }
      
      try {
        setLoadingMore(true);
        setError(null);
        
        let result;
        if (currentCategory === 'all') {
          result = await ProductsService.getPaginatedProducts(
            PRODUCTS_PER_PAGE,
            lastDoc
          );
        } else {
          result = await ProductsService.getPaginatedProductsByCategory(
            currentCategory,
            PRODUCTS_PER_PAGE,
            lastDoc
          );
        }
        
        const { products: moreProducts, lastDoc: nextLastDoc } = result;
        
        setDisplayedProducts(prev => [...prev, ...moreProducts]);
        setLastDoc(nextLastDoc);
        
        // Cache the loaded products
        productCache.set(currentCategory, moreProducts, nextLastDoc, true);
        
        // Prefetch next batch if we got full batch
        if (moreProducts.length === PRODUCTS_PER_PAGE && nextLastDoc) {
          setTimeout(async () => {
            try {
              let nextResult;
              if (currentCategory === 'all') {
                nextResult = await ProductsService.getPaginatedProducts(
                  PRODUCTS_PER_PAGE,
                  nextLastDoc
                );
              } else {
                nextResult = await ProductsService.getPaginatedProductsByCategory(
                  currentCategory,
                  PRODUCTS_PER_PAGE,
                  nextLastDoc
                );
              }
              
              setPrefetchedProducts(nextResult.products);
              setLastDoc(nextResult.lastDoc);
              setHasMore(nextResult.products.length > 0);
              
              // Cache prefetched batch
              productCache.set(currentCategory, nextResult.products, nextResult.lastDoc, true);
            } catch (err) {
              console.error('Error prefetching products:', err);
            }
          }, 0);
        } else {
          setHasMore(moreProducts.length === PRODUCTS_PER_PAGE);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error loading more products:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loadingMore, prefetchedProducts, lastDoc, currentCategory]);

  // Set category (triggers reload)
  const setCategory = useCallback((category: string) => {
    if (category !== currentCategory) {
      setCurrentCategory(category);
    }
  }, [currentCategory]);

  // Reset and reload
  const refresh = useCallback(async () => {
    // Clear cache for current category
    productCache.clear(currentCategory);
    
    // Trigger reload by resetting category to itself (will trigger useEffect)
    const cat = currentCategory;
    setCurrentCategory(''); // Reset first
    setTimeout(() => setCurrentCategory(cat), 0); // Then set back
  }, [currentCategory]);

  return {
    displayedProducts,
    prefetchedProducts,
    loading,
    loadingMore,
    hasMore,
    error,
    categoryCounts,
    totalCount,
    loadMore,
    refresh,
    setCategory,
  };
};
