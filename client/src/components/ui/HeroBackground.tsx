import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface HeroBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  alt?: string;
  src?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function HeroBackground({
  children,
  className = "min-h-screen w-full relative flex flex-col",
  alt = "Dedw3n Marketplace",
  src,
  onLoad,
  onError
}: HeroBackgroundProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const defaultSrc = isMobile 
    ? "/attached_assets/hero-image-mobile.png" 
    : "/attached_assets/hero-background-main.png";

  const imageSrc = src || defaultSrc;

  const defaultOnLoad = () => {
    onLoad?.();
  };

  const defaultOnError = () => {
    onError?.();
  };

  return (
    <div className={className}>
      {/* Unified Background using OptimizedImage */}
      <OptimizedImage 
        src={imageSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        priority={true}
        loading="eager"
        onError={defaultOnError}
        onLoad={defaultOnLoad}
      />
      
      {/* Content overlay */}
      {children && (
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}