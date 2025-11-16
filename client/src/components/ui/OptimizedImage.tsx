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
  avifSrc?: string;
  webpSrc?: string;
  srcSet?: string;
  responsive?: boolean;
  aspectRatio?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  sizes = '100vw',
  onLoad,
  onError,
  avifSrc,
  webpSrc,
  srcSet,
  responsive = false,
  aspectRatio
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

  // Generate responsive image sources for modern formats
  const generateResponsiveSrcSet = (baseSrc: string, format?: 'avif' | 'webp'): string | undefined => {
    if (!responsive) return undefined;
    
    // Skip responsive generation for attached_assets to prevent 404s
    if (baseSrc.includes('/attached_assets/')) return undefined;
    
    // Extract original extension or use specified format
    const originalExt = baseSrc.match(/\.(jpg|jpeg|png|webp|avif)$/i)?.[0] || '';
    const targetExt = format ? `.${format}` : originalExt;
    const baseWithoutExt = baseSrc.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    
    // Generate common responsive sizes for luxury e-commerce (Nike, Hermes, Gucci standards)
    const widths = [640, 768, 1024, 1280, 1536, 1920];
    return widths.map(w => `${baseWithoutExt}-${w}w${targetExt} ${w}w`).join(', ');
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

  const hasModernFormats = avifSrc || webpSrc;

  return (
    <div className={`relative overflow-hidden ${className}`} ref={placeholderRef}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
      
      {/* Modern format support using picture element */}
      {isInView && hasModernFormats && (
        <picture>
          {/* AVIF - modern format with best compression */}
          {avifSrc && (
            <source
              type="image/avif"
              srcSet={responsive ? generateResponsiveSrcSet(avifSrc, 'avif') || avifSrc : avifSrc}
              sizes={sizes}
            />
          )}
          
          {/* WebP - modern format with wide browser support */}
          {webpSrc && (
            <source
              type="image/webp"
              srcSet={responsive ? generateResponsiveSrcSet(webpSrc, 'webp') || webpSrc : webpSrc}
              sizes={sizes}
            />
          )}
          
          {/* Fallback to original format */}
          <img
            ref={imgRef}
            src={src}
            srcSet={srcSet || (responsive ? generateResponsiveSrcSet(src) : undefined)}
            sizes={sizes}
            alt={alt}
            loading={loading}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              aspectRatio: aspectRatio || 'auto',
            }}
            {...(priority && { 'data-priority': 'high' })}
          />
        </picture>
      )}
      
      {/* Standard image without modern formats */}
      {isInView && !hasModernFormats && (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet || (responsive ? generateResponsiveSrcSet(src) : undefined)}
          sizes={sizes}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            aspectRatio: aspectRatio || 'auto',
          }}
          {...(priority && { 'data-priority': 'high' })}
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