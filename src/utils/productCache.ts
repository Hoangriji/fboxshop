import type { Product } from '../types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface CacheEntry {
  products: Product[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  timestamp: number;
  totalFetched: number;
}

interface CategoryCache {
  [category: string]: CacheEntry;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for products
const COUNTS_CACHE_TTL = 1 * 60 * 1000; // 1 minute for category counts (more frequent refresh)
const STORAGE_KEY = 'uside_products_cache';
const MAX_CACHE_SIZE = 500; // Max products in memory

class ProductCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private categoryCounts: Record<string, number> = {};
  private countsTimestamp: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  // Load cache from localStorage to memory
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored) as CategoryCache;
        
        Object.entries(parsed).forEach(([key, value]) => {
          // Only load if not expired
          if (Date.now() - value.timestamp < CACHE_TTL) {
            this.memoryCache.set(key, {
              ...value,
              lastDoc: null // Can't serialize Firestore docs
            });
          }
        });
      }
    } catch (err) {
      console.error('Error loading cache from storage:', err);
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const toStore: CategoryCache = {};
      let totalProducts = 0;

      this.memoryCache.forEach((value, key) => {
        if (totalProducts < MAX_CACHE_SIZE) {
          toStore[key] = {
            products: value.products.slice(0, 50), // Limit per category
            lastDoc: null,
            timestamp: value.timestamp,
            totalFetched: value.totalFetched
          };
          totalProducts += value.products.length;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.error('Error saving cache to storage:', err);
      // If quota exceeded, clear old cache
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        this.clearOldest();
      }
    }
  }

  // Get cached products for category
  get(category: string, offset: number = 0, limit: number = 12): CacheEntry | null {
    const cached = this.memoryCache.get(category);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.memoryCache.delete(category);
      return null;
    }

    // Return cache even if we don't have full page
    // Let caller decide what to do
    const availableProducts = cached.products.slice(offset, offset + limit);
    
    if (availableProducts.length === 0) {
      return null;
    }

    return {
      products: availableProducts,
      lastDoc: cached.lastDoc,
      timestamp: cached.timestamp,
      totalFetched: cached.totalFetched
    };
  }

  // Check if cache is fresh (recently loaded)
  isFresh(category: string, freshnessThreshold: number = 2 * 60 * 1000): boolean {
    const cached = this.memoryCache.get(category);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < freshnessThreshold; // Fresh if < 2 minutes
  }

  // Set cached products for category
  set(
    category: string, 
    products: Product[], 
    lastDoc: QueryDocumentSnapshot<DocumentData> | null,
    append: boolean = false
  ): void {
    const existing = this.memoryCache.get(category);
    
    if (append && existing) {
      // Append new products to existing cache
      const combined = [...existing.products, ...products];
      this.memoryCache.set(category, {
        products: combined,
        lastDoc,
        timestamp: Date.now(),
        totalFetched: combined.length
      });
    } else {
      // Replace cache
      this.memoryCache.set(category, {
        products,
        lastDoc,
        timestamp: Date.now(),
        totalFetched: products.length
      });
    }

    this.saveToStorage();
  }

  // Get all cached products for category (for filtering)
  getAll(category: string): Product[] | null {
    const cached = this.memoryCache.get(category);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.memoryCache.delete(category);
      return null;
    }

    return cached.products;
  }

  // Cache category counts
  setCategoryCounts(counts: Record<string, number>, total: number): void {
    this.categoryCounts = counts;
    this.countsTimestamp = Date.now();
    
    try {
      localStorage.setItem('uside_category_counts', JSON.stringify({
        counts,
        total,
        timestamp: this.countsTimestamp
      }));
    } catch (err) {
      console.error('Error saving category counts:', err);
    }
  }

  // Get cached category counts
  getCategoryCounts(): { counts: Record<string, number>; total: number } | null {
    // Check memory first
    if (this.categoryCounts && Object.keys(this.categoryCounts).length > 0) {
      const age = Date.now() - this.countsTimestamp;
      if (age < COUNTS_CACHE_TTL) {
        const total = Object.values(this.categoryCounts).reduce((sum, count) => sum + count, 0);
        return { counts: this.categoryCounts, total };
      }
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem('uside_category_counts');
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        if (age < COUNTS_CACHE_TTL) {
          this.categoryCounts = parsed.counts;
          this.countsTimestamp = parsed.timestamp;
          return { counts: parsed.counts, total: parsed.total };
        }
      }
    } catch (err) {
      console.error('Error loading category counts:', err);
    }

    return null;
  }

  // Clear cache for specific category
  clear(category?: string): void {
    if (category) {
      this.memoryCache.delete(category);
    } else {
      this.memoryCache.clear();
      this.categoryCounts = {};
      this.countsTimestamp = 0;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('uside_category_counts');
    }
    this.saveToStorage();
  }

  // Clear oldest cache entries to free space
  private clearOldest(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 30%
    const toRemove = Math.ceil(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
    
    this.saveToStorage();
  }

  // Get cache stats
  getStats() {
    const categories = Array.from(this.memoryCache.keys());
    const totalProducts = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.products.length, 0);
    
    return {
      categories,
      totalProducts,
      cacheSize: this.memoryCache.size,
      countsCache: Object.keys(this.categoryCounts).length > 0
    };
  }
}

// Singleton instance
export const productCache = new ProductCache();
