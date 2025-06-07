import { useState, useEffect, useRef, useCallback } from 'react';

// Global image cache with immediate storage
const globalImageCache = new Map<string, string>();
const preloadedImages = new Set<string>();

interface UltraInstantImageOptions {
  priority?: 'instant' | 'critical' | 'high';
  fallbackSrc?: string;
  skipCache?: boolean;
}

export function useUltraInstantImage(src: string, options: UltraInstantImageOptions = {}) {
  const { priority = 'instant', fallbackSrc, skipCache = false } = options;
  
  const [imageState, setImageState] = useState({
    src: src || fallbackSrc || '',
    isReady: false,
    hasError: false
  });
  
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isLoadingRef = useRef(false);

  // Immediate image preparation without loading states
  const prepareImage = useCallback(async (imageSrc: string) => {
    if (!imageSrc) return;
    
    // Check global cache first
    if (!skipCache && globalImageCache.has(imageSrc)) {
      setImageState({
        src: imageSrc,
        isReady: true,
        hasError: false
      });
      return;
    }

    // If already preloaded, use immediately
    if (preloadedImages.has(imageSrc)) {
      setImageState({
        src: imageSrc,
        isReady: true,
        hasError: false
      });
      globalImageCache.set(imageSrc, imageSrc);
      return;
    }

    // Load image silently in background
    if (!isLoadingRef.current) {
      isLoadingRef.current = true;
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            globalImageCache.set(imageSrc, imageSrc);
            preloadedImages.add(imageSrc);
            resolve();
          };
          
          img.onerror = () => {
            if (fallbackSrc && fallbackSrc !== imageSrc) {
              // Try fallback
              prepareImage(fallbackSrc);
            } else {
              setImageState(prev => ({ ...prev, hasError: true }));
            }
            reject(new Error('Image load failed'));
          };
          
          img.src = imageSrc;
        });
        
        setImageState({
          src: imageSrc,
          isReady: true,
          hasError: false
        });
        
      } catch (error) {
        console.warn('Background image load failed:', error);
      } finally {
        isLoadingRef.current = false;
      }
    }
  }, [fallbackSrc, skipCache]);

  useEffect(() => {
    if (src) {
      prepareImage(src);
    }
  }, [src, prepareImage]);

  return {
    src: imageState.src,
    isReady: imageState.isReady,
    hasError: imageState.hasError,
    imgRef
  };
}

// Batch preload critical images immediately
export function preloadCriticalImages(imageSrcs: string[]) {
  const preloadPromises = imageSrcs.map(src => {
    if (preloadedImages.has(src)) return Promise.resolve();
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      
      img.onload = () => {
        globalImageCache.set(src, src);
        preloadedImages.add(src);
        resolve();
      };
      
      img.onerror = () => {
        console.warn('Failed to preload image:', src);
        resolve(); // Continue with other images
      };
      
      img.src = src;
    });
  });
  
  return Promise.all(preloadPromises);
}

// Initialize image preloading on module load
export function initializeImagePreloader(criticalImages: string[]) {
  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadCriticalImages(criticalImages);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadCriticalImages(criticalImages);
    }, 100);
  }
}

// Instant image component with zero loading state
export function InstantImage({ 
  src, 
  alt, 
  className = '',
  fallbackSrc,
  priority = 'instant',
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: 'instant' | 'critical' | 'high';
  [key: string]: any;
}) {
  const { src: readySrc, isReady, hasError } = useUltraInstantImage(src, { 
    fallbackSrc, 
    priority 
  });

  // Never show loading state - either show image or invisible placeholder
  if (!isReady || hasError) {
    return (
      <div 
        className={`${className} invisible`}
        style={{ 
          width: '100%', 
          height: 'auto',
          aspectRatio: '16/9' 
        }}
        {...props}
      />
    );
  }

  return (
    <img
      src={readySrc}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '300px 200px'
      }}
      {...props}
    />
  );
}