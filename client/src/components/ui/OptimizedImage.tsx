import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  sizes = '100vw',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate responsive image sources
  const generateSrcSet = (baseSrc: string) => {
    // Extract file extension and base path
    const extension = baseSrc.split('.').pop()?.toLowerCase();
    const basePath = baseSrc.replace(/\.[^/.]+$/, '');
    
    // For attached assets, try to generate multiple resolutions
    if (baseSrc.includes('/attached_assets/')) {
      const resolutions = [480, 768, 1024, 1440, 1920];
      return resolutions.map(width => `${basePath}_${width}w.${extension} ${width}w`).join(', ');
    }
    
    return baseSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        ref={placeholderRef}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={placeholderRef}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          loading={loading}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            aspectRatio: 'auto',
          }}
          {...(priority && { fetchPriority: 'high' as any })}
        />
      )}
    </div>
  );
}

// Higher-order component for automatic optimization
export function withImageOptimization<T extends { src?: string; alt?: string }>(
  Component: React.ComponentType<T>
) {
  return function OptimizedComponent(props: T) {
    if (props.src) {
      const { src, alt, ...otherProps } = props;
      return (
        <Component
          {...(otherProps as T)}
          src={undefined}
          alt={alt}
        >
          <OptimizedImage src={src} alt={alt || ''} className="w-full h-full" />
        </Component>
      );
    }
    return <Component {...props} />;
  };
}