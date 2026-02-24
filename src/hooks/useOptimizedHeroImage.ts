import { useState, useEffect, useCallback } from 'react';
import { CloudinaryService } from '../services/cloudinaryService';

interface HeroImageCache {
  url: string;
  publicId: string;
  timestamp: number;
  optimizedUrl: string;
}

const CACHE_KEY = 'hero_image_cache';
const CACHE_VERSION_KEY = 'hero_image_version';
const CACHE_NAME = 'hero-images-v1';

/**
 * Simple image preload
 */
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Get cached image from Cache API
 */
const getCachedImageFromCacheAPI = async (url: string): Promise<string | null> => {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      // Cache hit! Return the URL (browser will use cached version)
      return url;
    }

    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

/**
 * Get cached image data from localStorage
 */
const getCachedImageData = (): HeroImageCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Error reading cache from localStorage:', error);
    return null;
  }
};

/**
 * Save cached image data to localStorage
 */
const saveCachedImageData = (data: HeroImageCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_VERSION_KEY, `${data.publicId}_${data.url}`);
  } catch (error) {
    console.error('Error saving cache to localStorage:', error);
  }
};

/**
 * Preload image and cache in Cache API
 */
const preloadAndCacheImage = async (url: string): Promise<void> => {
  if (!('caches' in window)) {
    // Cache API not supported, just preload
    return preloadImage(url);
  }

  try {
    // Fetch image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Cache the response
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, response.clone());

    // Also preload to browser
    await preloadImage(url);
  } catch (error) {
    console.error('Error caching image:', error);
    // Fallback to simple preload
    await preloadImage(url);
  }
};

/**
 * Hook to optimize hero image loading with multiple strategies:
 * 1. Browser Cache API for image binaries
 * 2. localStorage for metadata and version checking
 * 3. Cloudinary optimizations (auto-format, quality, responsive)
 * 4. Progressive loading with blur effect
 */
export const useOptimizedHeroImage = (
  heroImageUrl?: string,
  heroImagePublicId?: string
) => {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowBlur, setShouldShowBlur] = useState(true);

  const loadOptimizedImage = useCallback(async (url: string, publicId: string) => {
    try {
      setIsLoading(true);

      // Step 1: Check localStorage cache version
      const cachedData = getCachedImageData();

      // Step 2: If cache exists and version matches, try to use cached image
      if (cachedData && cachedData.publicId === publicId) {
        // Check if image is in Cache API
        const cachedImageUrl = await getCachedImageFromCacheAPI(cachedData.optimizedUrl);
        
        if (cachedImageUrl) {
          // Cache hit! Use cached image immediately
          setOptimizedUrl(cachedImageUrl);
          setShouldShowBlur(false);
          setIsLoading(false);
          return;
        }
      }

      // Step 3: Generate optimized Cloudinary URL
      const optimized = CloudinaryService.getOptimizedUrl(
        publicId,
        1920, // Width for hero section
        1080, // Height
        'auto' // Auto quality
      );

      // Step 4: Preload and cache the image
      await preloadAndCacheImage(optimized);

      // Step 5: Save to localStorage
      saveCachedImageData({
        url,
        publicId,
        timestamp: Date.now(),
        optimizedUrl: optimized,
      });

      // Step 6: Set optimized URL
      setOptimizedUrl(optimized);
      
      // Progressive loading effect
      setTimeout(() => {
        setShouldShowBlur(false);
      }, 300);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading optimized hero image:', error);
      // Fallback to original URL
      setOptimizedUrl(url);
      setShouldShowBlur(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!heroImageUrl || !heroImagePublicId) {
      setOptimizedUrl(null);
      setIsLoading(false);
      setShouldShowBlur(false);
      return;
    }

    loadOptimizedImage(heroImageUrl, heroImagePublicId);
  }, [heroImageUrl, heroImagePublicId, loadOptimizedImage]);

  /**
   * Clear cache (useful when admin uploads new hero image)
   */
  const clearCache = async (): Promise<void> => {
    try {
      // Clear localStorage
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);

      // Clear Cache API
      if ('caches' in window) {
        await caches.delete(CACHE_NAME);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return {
    optimizedUrl,
    isLoading,
    shouldShowBlur,
    clearCache,
  };
};
