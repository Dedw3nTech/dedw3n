import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { useInstantImageLoading, preloadCriticalImages } from '@/hooks/use-instant-image-loading';

// Advertisement image paths for production compatibility
const luxuryMarketplaceAd = '/attached_assets/Dedw3n Marketplace (1).png';
const businessB2BAd = '/attached_assets/Dedw3n Business B2B.png';
const businessB2CAd = '/attached_assets/Copy of Dedw3n Business B2C Header.png';
const communityAd = '/attached_assets/Dedw3n comm Footer.png';
const marketplaceHeaderAd = '/attached_assets/Copy of Dedw3n Marketplace II.png';

interface InstantImageAdProps {
  adType?: 'marketplace' | 'business' | 'community' | 'header';
  marketType?: 'b2c' | 'b2b' | 'c2c';
  position?: 'sidebar' | 'banner' | 'inline' | 'floating';
  autoHide?: boolean;
  clickable?: boolean;
  targetUrl?: string;
  priority?: 'instant' | 'high' | 'normal';
}

export function InstantImageAd({
  adType = 'marketplace',
  marketType = 'b2c',
  position = 'sidebar',
  autoHide = true,
  clickable = true,
  targetUrl = '#',
  priority = 'instant'
}: InstantImageAdProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // Select appropriate advertisement image
  const getAdImage = () => {
    switch (adType) {
      case 'business':
        return marketType === 'b2b' ? businessB2BAd : businessB2CAd;
      case 'community':
        return communityAd;
      case 'header':
        return marketplaceHeaderAd;
      case 'marketplace':
      default:
        return luxuryMarketplaceAd;
    }
  };

  const adImageSrc = getAdImage();

  // Ultra-fast image loading with instant display
  const { imageUrl, isLoading, error, setupLazyLoading } = useInstantImageLoading(
    adImageSrc,
    {
      priority,
      preload: priority === 'instant',
      lazy: priority === 'normal',
      quality: 'high'
    }
  );

  // Preload critical advertisement images on component mount
  useEffect(() => {
    const criticalAds = [
      { src: luxuryMarketplaceAd, priority: 'instant' as const },
      { src: businessB2BAd, priority: 'high' as const },
      { src: businessB2CAd, priority: 'high' as const },
      { src: communityAd, priority: 'high' as const }
    ];
    preloadCriticalImages(criticalAds);
  }, []);

  // Setup lazy loading for normal priority ads
  useEffect(() => {
    if (priority === 'normal' && adRef.current) {
      setupLazyLoading();
    }
  }, [priority, setupLazyLoading]);

  // Auto-hide functionality for non-intrusive experience
  useEffect(() => {
    if (autoHide && position === 'floating') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000); // Auto-hide after 8 seconds

      return () => clearTimeout(timer);
    }
  }, [autoHide, position]);

  const handleAdClick = () => {
    if (clickable && targetUrl && targetUrl !== '#') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  // Dynamic styling based on position and state
  const getAdStyles = () => {
    const baseStyles = "transition-all duration-300 ease-in-out";
    
    switch (position) {
      case 'banner':
        return `${baseStyles} w-full max-h-32 overflow-hidden`;
      case 'floating':
        return `${baseStyles} fixed bottom-4 right-4 z-50 max-w-sm shadow-lg`;
      case 'inline':
        return `${baseStyles} w-full max-w-md mx-auto my-4`;
      case 'sidebar':
      default:
        return `${baseStyles} w-full max-w-xs`;
    }
  };

  const containerStyles = `${getAdStyles()} ${
    isHovered ? 'transform scale-105 shadow-xl' : 'shadow-md'
  }`;

  return (
    <Card 
      ref={adRef}
      className={containerStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        {/* Close button for floating ads */}
        {position === 'floating' && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Advertisement image with instant loading */}
        <div 
          className={`relative overflow-hidden rounded-lg ${
            clickable ? 'cursor-pointer' : ''
          }`}
          onClick={clickable ? handleAdClick : undefined}
        >
          {/* Loading placeholder - minimal visual indication */}
          {isLoading && (
            <div className="w-full h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
          )}

          {/* Error state */}
          {error && (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-gray-500 text-sm text-center">
                <div>Advertisement</div>
                <div className="text-xs">Unable to load</div>
              </div>
            </div>
          )}

          {/* Advertisement image */}
          {imageUrl && !isLoading && !error && (
            <img
              src={imageUrl}
              alt="Dedw3n Advertisement"
              className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '300px 200px'
              }}
              loading={priority === 'instant' ? 'eager' : 'lazy'}
              decoding="async"
            />
          )}


        </div>


      </div>
    </Card>
  );
}

// Preload advertisement images for instant display
export function preloadAdvertisementImages() {
  const adImages = [
    { src: luxuryMarketplaceAd, priority: 'instant' as const },
    { src: businessB2BAd, priority: 'high' as const },
    { src: businessB2CAd, priority: 'high' as const },
    { src: communityAd, priority: 'high' as const },
    { src: marketplaceHeaderAd, priority: 'high' as const }
  ];
  
  return preloadCriticalImages(adImages);
}