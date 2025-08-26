import { useState, useEffect } from 'react';
import { detectMobileDevice, shouldRedirectToMobile, redirectToMobile, setDesktopPreference, MobileDetectionResult } from '@/lib/mobile-detection';

export interface UseMobileDetectionResult extends MobileDetectionResult {
  shouldRedirect: boolean;
  performRedirect: () => void;
  forceDesktop: () => void;
  isRedirecting: boolean;
}

export function useMobileDetection(): UseMobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    userAgent: ''
  });
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const detectionResult = detectMobileDevice();
    setDetection(detectionResult);

    // Mobile redirect functionality disabled - always set shouldRedirect to false
    setShouldRedirect(false);

    // Log detection results for debugging (redirect disabled)
    console.log('[MOBILE-DETECTION]', {
      deviceType: detectionResult.deviceType,
      isMobile: detectionResult.isMobile,
      isTablet: detectionResult.isTablet,
      shouldRedirect: false, // Always false - redirect disabled
      userAgent: detectionResult.userAgent.substring(0, 50) + '...',
      redirectDisabled: true
    });
  }, []);

  const performRedirect = () => {
    // Redirect functionality disabled - no action taken
    console.log('[MOBILE-DETECTION] Redirect attempted but disabled by system');
  };

  const forceDesktop = () => {
    // Force desktop functionality disabled - redirect already disabled system-wide
    console.log('[MOBILE-DETECTION] Desktop preference set (redirect already disabled)');
    setShouldRedirect(false);
    setIsRedirecting(false);
  };

  return {
    ...detection,
    shouldRedirect,
    performRedirect,
    forceDesktop,
    isRedirecting
  };
}