import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

// Advanced performance cache with intelligent preloading
const performanceCache = new Map<string, any>();
const preloadQueue = new Set<string>();

// Critical data that should be preloaded immediately
const CRITICAL_QUERIES = [
  '/api/products',
  '/api/categories',
  '/api/user',
  '/api/cart'
];

// Translation batching for instant UI rendering
const translationBatch = new Map<string, Promise<string>>();

interface PerformanceOptions {
  preloadCritical?: boolean;
  batchTranslations?: boolean;
  cacheStrategy?: 'aggressive' | 'normal' | 'conservative';
}

/**
 * Ultra-high performance hook for instant marketplace loading
 * Implements intelligent caching, preloading, and request batching
 */
export function useInstantPerformance(options: PerformanceOptions = {}) {
  const queryClient = useQueryClient();
  const { currentLanguage, translateText } = useLanguage();
  const {
    preloadCritical = true,
    batchTranslations = true,
    cacheStrategy = 'aggressive'
  } = options;

  const batchRef = useRef<Map<string, string>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intelligent cache with TTL
  const getCachedData = useCallback((key: string) => {
    const cached = performanceCache.get(key);
    if (cached && Date.now() - cached.timestamp < getCacheTTL(key)) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    performanceCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const getCacheTTL = useCallback((key: string) => {
    if (key.includes('products')) return 5 * 60 * 1000; // 5 minutes
    if (key.includes('categories')) return 30 * 60 * 1000; // 30 minutes
    if (key.includes('translate')) return 60 * 60 * 1000; // 1 hour
    return 10 * 60 * 1000; // 10 minutes default
  }, []);

  // Batch translation requests for instant UI updates
  const batchTranslation = useCallback(async (texts: string[]) => {
    if (!batchTranslations || currentLanguage === 'EN') return texts;

    const uncachedTexts: string[] = [];
    const results: string[] = [];

    texts.forEach((text, index) => {
      const cacheKey = `translate:${text}:${currentLanguage}`;
      const cached = getCachedData(cacheKey);
      
      if (cached) {
        results[index] = cached;
      } else {
        uncachedTexts.push(text);
        results[index] = text; // Fallback to original text
      }
    });

    if (uncachedTexts.length > 0) {
      try {
        const response = await fetch('/api/translate/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: uncachedTexts,
            targetLanguage: currentLanguage
          })
        });

        if (response.ok) {
          const { translations } = await response.json();
          translations.forEach((translation: any, index: number) => {
            const cacheKey = `translate:${translation.originalText}:${currentLanguage}`;
            setCachedData(cacheKey, translation.translatedText);
            
            const originalIndex = texts.indexOf(translation.originalText);
            if (originalIndex !== -1) {
              results[originalIndex] = translation.translatedText;
            }
          });
        }
      } catch (error) {
        console.error('Batch translation failed:', error);
      }
    }

    return results;
  }, [currentLanguage, batchTranslations, getCachedData, setCachedData]);

  // Preload critical data for instant rendering
  const preloadCriticalData = useCallback(async () => {
    if (!preloadCritical) return;

    const preloadPromises = CRITICAL_QUERIES.map(async (endpoint) => {
      const cacheKey = `api:${endpoint}`;
      const cached = getCachedData(cacheKey);
      
      if (!cached && !preloadQueue.has(endpoint)) {
        preloadQueue.add(endpoint);
        
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            setCachedData(cacheKey, data);
            
            // Prefill React Query cache
            queryClient.setQueryData([endpoint], data);
          }
        } catch (error) {
          console.error(`Failed to preload ${endpoint}:`, error);
        } finally {
          preloadQueue.delete(endpoint);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
  }, [preloadCritical, queryClient, getCachedData, setCachedData]);

  // Intelligent prefetch based on user behavior
  const smartPrefetch = useCallback((route: string) => {
    const prefetchKey = `prefetch:${route}`;
    
    if (!preloadQueue.has(prefetchKey)) {
      preloadQueue.add(prefetchKey);
      
      setTimeout(async () => {
        try {
          if (route.includes('product')) {
            // Prefetch product details
            await queryClient.prefetchQuery({
              queryKey: ['/api/products', route.split('/').pop()],
              queryFn: () => fetch(`/api/products/${route.split('/').pop()}`).then(r => r.json())
            });
          }
        } catch (error) {
          console.error('Smart prefetch failed:', error);
        } finally {
          preloadQueue.delete(prefetchKey);
        }
      }, 100);
    }
  }, [queryClient]);

  // Optimize images for instant loading
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { threshold: 0.1 });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, []);

  // Initialize performance optimizations
  useEffect(() => {
    preloadCriticalData();
    const cleanupImages = optimizeImages();

    return cleanupImages;
  }, [preloadCriticalData, optimizeImages]);

  // Clean up cache periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      const entries = Array.from(performanceCache.entries());
      for (const [key, value] of entries) {
        if (now - value.timestamp > getCacheTTL(key)) {
          performanceCache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [getCacheTTL]);

  return {
    batchTranslation,
    smartPrefetch,
    getCachedData,
    setCachedData,
    cacheSize: performanceCache.size
  };
}

// Performance monitoring utility
export function usePerformanceMonitor() {
  const metricsRef = useRef({
    pageLoadTime: 0,
    translationTime: 0,
    apiCallCount: 0,
    cacheHitRate: 0
  });

  const startTimer = useCallback((name: string) => {
    return {
      end: () => {
        const endTime = performance.now();
        return endTime;
      }
    };
  }, []);

  const logMetric = useCallback((name: string, value: number) => {
    if (name in metricsRef.current) {
      (metricsRef.current as any)[name] = value;
    }
  }, []);

  return {
    startTimer,
    logMetric,
    metrics: metricsRef.current
  };
}