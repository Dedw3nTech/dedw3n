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
  alt = "Coming Soon - Dedw3n",
  src = "/attached_assets/coming soon_1756963751096.png",
  onLoad,
  onError
}: HeroBackgroundProps) {
  const defaultOnLoad = () => {
    console.log('Hero background image loaded successfully');
    onLoad?.();
  };

  const defaultOnError = () => {
    console.error('Failed to load hero background image');
    onError?.();
  };

  return (
    <div className={className}>
      {/* Unified Background using OptimizedImage */}
      <OptimizedImage 
        src={src}
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