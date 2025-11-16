import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { InstantImage, preloadCriticalImages, initializeImagePreloader } from '@/hooks/use-ultra-instant-image';

// Use server-served static asset paths for production compatibility
const luxuryMarketplaceAd = '/attached_assets/Dedw3n%20Marketplace%20(1).png';
const businessB2BAd = '/attached_assets/Dedw3n%20Business%20B2B.png';
const businessB2CAd = '/attached_assets/b2c-header-new.png';
const communityAd = '/attached_assets/Dedw3n%20comm%20Footer.png';
const marketplaceHeaderAd = '/attached_assets/marketplace-header-new.png';
const campaignAd = '/attached_assets/Copy%20of%20Copy%20of%20Pre%20Launch%20Campaign%20%20SELL%20(1).png';
const marketplaceFooterAd = '/attached_assets/Copy%20of%20Dedw3n%20Marketplace%20III.png';

// Critical advertisements to preload immediately
const CRITICAL_ADS = [
  luxuryMarketplaceAd,
  businessB2BAd,
  businessB2CAd,
  communityAd,
  marketplaceHeaderAd,
  campaignAd,
  marketplaceFooterAd
];

// Initialize preloader immediately when module loads
initializeImagePreloader(CRITICAL_ADS);

interface ZeroLoadingAdProps {
  adType?: 'marketplace' | 'business' | 'community' | 'header' | 'campaign' | 'footer';
  marketType?: 'b2c' | 'b2b' | 'c2c';
  position?: 'sidebar' | 'banner' | 'inline' | 'floating' | 'hero';
  autoHide?: boolean;
  clickable?: boolean;
  targetUrl?: string;
  className?: string;
  showCloseButton?: boolean;
}

export function ZeroLoadingAd({
  adType = 'marketplace',
  marketType = 'b2c',
  position = 'sidebar',
  autoHide = false,
  clickable = true,
  targetUrl = '#',
  className = '',
  showCloseButton = false
}: ZeroLoadingAdProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Select appropriate advertisement image
  const getAdImage = () => {
    switch (adType) {
      case 'business':
        return marketType === 'b2b' ? businessB2BAd : businessB2CAd;
      case 'community':
        return communityAd;
      case 'header':
        return marketplaceHeaderAd;
      case 'campaign':
        return campaignAd;
      case 'footer':
        return marketplaceFooterAd;
      case 'marketplace':
      default:
        return luxuryMarketplaceAd;
    }
  };

  const adImageSrc = getAdImage();

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && position === 'floating') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
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

  // Dynamic styling based on position
  const getPositionStyles = () => {
    const isB2C = adType === 'business' && marketType === 'b2c';
    const sizeMultiplier = isB2C ? 'scale-150' : '';
    
    switch (position) {
      case 'banner':
        return `w-full max-h-48 overflow-hidden ${sizeMultiplier}`;
      case 'floating':
        return `fixed bottom-4 right-4 z-50 max-w-sm shadow-xl ${sizeMultiplier}`;
      case 'inline':
        return `w-full max-w-lg mx-auto my-4 ${sizeMultiplier}`;
      case 'hero':
        return `w-full max-w-6xl mx-auto ${sizeMultiplier}`;
      case 'sidebar':
      default:
        return `w-full max-w-sm ${sizeMultiplier}`;
    }
  };

  const containerClass = `
    ${getPositionStyles()}
    ${className}
    transition-all duration-300 ease-in-out
    ${isHovered ? 'transform scale-105 shadow-xl' : 'shadow-md'}
  `.trim();

  return (
    <Card 
      className={containerClass}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        {/* Close button */}
        {(showCloseButton || position === 'floating') && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Zero-loading advertisement image */}
        <div 
          className={`relative overflow-hidden rounded-lg ${
            clickable ? 'cursor-pointer' : ''
          }`}
          onClick={clickable ? handleAdClick : undefined}
        >
          <InstantImage
            src={adImageSrc}
            alt="Advertisement"
            className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            priority="instant"
          />
        </div>
      </div>
    </Card>
  );
}

// Preload all advertisements on app initialization
export function preloadAllAdvertisements() {
  return preloadCriticalImages(CRITICAL_ADS);
}

// Export for use in other components
export { CRITICAL_ADS };