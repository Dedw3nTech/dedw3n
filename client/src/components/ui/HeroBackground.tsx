import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface HeroBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  alt?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function HeroBackground({
  children,
  className = "min-h-screen w-full relative flex flex-col",
  alt = "Spend more time enjoying life - Dedw3n",
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
        src="/attached_assets/spend more time enjoying life (395 x 932 px) (1)_1756533935746.png"
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