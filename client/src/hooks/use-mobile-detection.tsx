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

    const shouldPerformRedirect = shouldRedirectToMobile();
    setShouldRedirect(shouldPerformRedirect);

    // Log detection results for debugging
    console.log('[MOBILE-DETECTION]', {
      deviceType: detectionResult.deviceType,
      isMobile: detectionResult.isMobile,
      isTablet: detectionResult.isTablet,
      shouldRedirect: shouldPerformRedirect,
      userAgent: detectionResult.userAgent.substring(0, 50) + '...'
    });
  }, []);

  const performRedirect = () => {
    if (!isRedirecting && shouldRedirect) {
      setIsRedirecting(true);
      console.log('[MOBILE-DETECTION] Performing redirect to mobile version');
      redirectToMobile();
    }
  };

  const forceDesktop = () => {
    console.log('[MOBILE-DETECTION] User chose desktop version');
    setDesktopPreference(true);
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