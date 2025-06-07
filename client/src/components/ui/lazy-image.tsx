import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string | (() => Promise<{ default: string }>);
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ src, alt, className, placeholder, onLoad, onError }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        let imageUrl: string;
        
        if (typeof src === 'function') {
          const module = await src();
          imageUrl = module.default;
        } else {
          imageUrl = src;
        }

        // Preload the image
        const img = new Image();
        img.onload = () => {
          setImageSrc(imageUrl);
          setIsLoading(false);
          onLoad?.();
        };
        img.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        };
        img.src = imageUrl;
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    loadImage();
  }, [isInView, src, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      loading="lazy"
      decoding="async"
    />
  );
}