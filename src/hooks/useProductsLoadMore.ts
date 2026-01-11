import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { ProductsService } from '../services/firebaseService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

const PRODUCTS_PER_PAGE = 12;

interface UseProductsLoadMoreResult {
  displayedProducts: Product[];
  prefetchedProducts: Product[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

export const useProductsLoadMore = (): UseProductsLoadMoreResult => {
  // Displayed products (rendered on screen)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  
  // Prefetched products (loaded but not yet displayed)
  const [prefetchedProducts, setPrefetchedProducts] = useState<Product[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Firestore pagination cursor
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // Load initial 12 products + prefetch next 12
  const loadInitialProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load first batch (12 products)
      const { products: initialProducts, lastDoc: lastVisible } = 
        await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE);
      
      setDisplayedProducts(initialProducts);
      setLastDoc(lastVisible);
      
      // If we got full batch, prefetch next batch
      if (initialProducts.length === PRODUCTS_PER_PAGE && lastVisible) {
        // Prefetch next 12 in background (don't block render)
        setTimeout(async () => {
          try {
            const { products: nextProducts, lastDoc: nextLastDoc } = 
              await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE, lastVisible);
            
            setPrefetchedProducts(nextProducts);
            setLastDoc(nextLastDoc);
            setHasMore(nextProducts.length > 0);
          } catch (err) {
            console.error('Error prefetching products:', err);
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading initial products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

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
            const { products: nextProducts, lastDoc: nextLastDoc } = 
              await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE, lastDoc);
            
            setPrefetchedProducts(nextProducts);
            setLastDoc(nextLastDoc);
            setHasMore(nextProducts.length > 0);
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
        
        const { products: moreProducts, lastDoc: nextLastDoc } = 
          await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE, lastDoc);
        
        setDisplayedProducts(prev => [...prev, ...moreProducts]);
        setLastDoc(nextLastDoc);
        
        // Prefetch next batch if we got full batch
        if (moreProducts.length === PRODUCTS_PER_PAGE && nextLastDoc) {
          setTimeout(async () => {
            try {
              const { products: nextProducts, lastDoc: futureLastDoc } = 
                await ProductsService.getPaginatedProducts(PRODUCTS_PER_PAGE, nextLastDoc);
              
              setPrefetchedProducts(nextProducts);
              setLastDoc(futureLastDoc);
              setHasMore(nextProducts.length > 0);
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
  }, [hasMore, loadingMore, prefetchedProducts, lastDoc]);

  // Reset and reload
  const refresh = useCallback(async () => {
    setDisplayedProducts([]);
    setPrefetchedProducts([]);
    setLastDoc(null);
    setHasMore(true);
    await loadInitialProducts();
  }, [loadInitialProducts]);

  return {
    displayedProducts,
    prefetchedProducts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
};
