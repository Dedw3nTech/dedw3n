import { useState, useEffect, useRef } from 'react';

// Simple image cache
const imageCache = new Map<string, boolean>();

interface ImageLoadingOptions {
  priority?: 'instant' | 'high' | 'normal' | 'low';
  preload?: boolean;
  lazy?: boolean;
  placeholder?: string;
  quality?: 'high' | 'medium' | 'low';
}

/**
 * Simplified instant image loading hook
 * Prevents infinite re-renders and maximum update depth errors
 */
export function useInstantImageLoading(src: string, options: ImageLoadingOptions = {}) {
  const {
    priority = 'normal',
    placeholder = ''
  } = options;

  const [imageUrl, setImageUrl] = useState<string>(src || '');
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!src) {
      setImageUrl('');
      setIsLoading(false);
      return;
    }

    // Prevent multiple loads of the same image
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Check cache
    if (imageCache.has(src)) {
      setImageUrl(src);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Load image
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(src, true);
      setImageUrl(src);
      setIsLoading(false);
      setError(null);
    };

    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
      if (placeholder) {
        setImageUrl(placeholder);
      }
    };

    img.src = src;

    // Reset loaded flag when src changes
    return () => {
      loadedRef.current = false;
    };
  }, [src, placeholder]);

  return {
    imageUrl,
    isLoading,
    error,
    setupLazyLoading: () => {},
    loadImage: () => {},
    imgRef: { current: null }
  };
}

// Utility functions for compatibility
export function preloadCriticalImages(images: Array<{ src: string; priority: 'instant' | 'high' }>) {
  images.forEach(({ src }) => {
    if (!imageCache.has(src)) {
      const img = new Image();
      img.onload = () => imageCache.set(src, true);
      img.src = src;
    }
  });
}

export function useImagePerformanceMonitor() {
  return {
    metrics: {
      totalImages: imageCache.size,
      loadTimes: [],
      cacheHitRate: 0,
      errorRate: 0
    },
    clearMetrics: () => {}
  };
}

export function clearImageCache(keepRecent: boolean = true) {
  if (!keepRecent) {
    imageCache.clear();
  }
}