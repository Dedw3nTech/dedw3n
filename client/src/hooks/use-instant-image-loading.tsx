import { useState, useEffect, useRef, useCallback } from 'react';

// Intelligent image cache with performance optimization
const imageCache = new Map<string, HTMLImageElement>();
const preloadQueue = new Set<string>();
const loadingStates = new Map<string, 'loading' | 'loaded' | 'error'>();

// Critical images that should load instantly
const PRIORITY_IMAGES = new Set([
  'video-thumbnails',
  'hero-banners',
  'advertisements',
  'product-featured'
]);

interface ImageLoadingOptions {
  priority?: 'instant' | 'high' | 'normal' | 'low';
  preload?: boolean;
  lazy?: boolean;
  placeholder?: string;
  quality?: 'high' | 'medium' | 'low';
}

/**
 * Ultra-fast image loading hook with intelligent caching and preloading
 * Achieves instant loading without impacting website performance
 */
export function useInstantImageLoading(src: string, options: ImageLoadingOptions = {}) {
  const {
    priority = 'normal',
    preload = true,
    lazy = true,
    placeholder = '',
    quality = 'high'
  } = options;

  const [imageUrl, setImageUrl] = useState<string>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Optimize image URL based on quality setting
  const getOptimizedUrl = useCallback((url: string) => {
    if (!url) return url;
    
    // Add quality parameters for supported formats
    const urlObj = new URL(url, window.location.origin);
    
    switch (quality) {
      case 'low':
        urlObj.searchParams.set('q', '60');
        urlObj.searchParams.set('w', '400');
        break;
      case 'medium':
        urlObj.searchParams.set('q', '80');
        urlObj.searchParams.set('w', '800');
        break;
      case 'high':
      default:
        urlObj.searchParams.set('q', '95');
        break;
    }
    
    return urlObj.toString();
  }, [quality]);

  // Intelligent preloading with priority queue
  const preloadImage = useCallback(async (url: string, loadPriority: string) => {
    if (!url || imageCache.has(url) || preloadQueue.has(url)) {
      return imageCache.get(url);
    }

    preloadQueue.add(url);
    loadingStates.set(url, 'loading');

    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Set loading priority
      if (loadPriority === 'instant' || loadPriority === 'high') {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      }

      img.onload = () => {
        imageCache.set(url, img);
        loadingStates.set(url, 'loaded');
        preloadQueue.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        loadingStates.set(url, 'error');
        preloadQueue.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = getOptimizedUrl(url);
    });
  }, [getOptimizedUrl]);

  // Intersection observer for lazy loading
  const setupLazyLoading = useCallback((element: HTMLElement) => {
    if (!lazy || priority === 'instant') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(element);
  }, [lazy, priority]);

  // Main image loading function
  const loadImage = useCallback(async () => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check cache first for instant loading
      const cached = imageCache.get(src);
      if (cached) {
        setImageUrl(src);
        setIsLoading(false);
        return;
      }

      // Preload image with priority
      const img = await preloadImage(src, priority);
      setImageUrl(src);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setIsLoading(false);
      // Fallback to placeholder
      if (placeholder) {
        setImageUrl(placeholder);
      }
    }
  }, [src, priority, placeholder, preloadImage]);

  // Initialize loading based on priority
  useEffect(() => {
    if (priority === 'instant' || (preload && priority === 'high')) {
      loadImage();
    }
  }, [priority, preload, loadImage]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    imageUrl,
    isLoading,
    error,
    setupLazyLoading,
    loadImage,
    imgRef
  };
}

// Preload critical images for instant display
export function preloadCriticalImages(images: Array<{ src: string; priority: 'instant' | 'high' }>) {
  const preloadPromises = images.map(async ({ src, priority }) => {
    try {
      if (!imageCache.has(src)) {
        const img = new Image();
        img.loading = priority === 'instant' ? 'eager' : 'lazy';
        img.fetchPriority = priority === 'instant' ? 'high' : 'auto';
        
        return new Promise<void>((resolve) => {
          img.onload = () => {
            imageCache.set(src, img);
            resolve();
          };
          img.onerror = () => resolve(); // Don't fail the batch
          img.src = src;
        });
      }
    } catch (error) {
      console.warn('Failed to preload image:', src, error);
    }
  });

  return Promise.allSettled(preloadPromises);
}

// Performance monitoring for image loading
export function useImagePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    cachedImages: 0,
    loadTime: 0,
    cacheHitRate: 0
  });

  const updateMetrics = useCallback(() => {
    const total = imageCache.size + preloadQueue.size;
    const cached = imageCache.size;
    const hitRate = total > 0 ? (cached / total) * 100 : 0;

    setMetrics({
      totalImages: total,
      cachedImages: cached,
      loadTime: 0, // Could be enhanced with performance API
      cacheHitRate: Math.round(hitRate)
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return metrics;
}

// Clear image cache when needed (memory management)
export function clearImageCache(keepRecent: boolean = true) {
  if (keepRecent) {
    // Keep only recent images (last 50)
    if (imageCache.size > 50) {
      const entries = Array.from(imageCache.entries());
      const toKeep = entries.slice(-50);
      imageCache.clear();
      toKeep.forEach(([key, value]) => imageCache.set(key, value));
    }
  } else {
    imageCache.clear();
    loadingStates.clear();
  }
}