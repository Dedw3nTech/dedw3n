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

    // Check if mobile redirect should happen instantly
    const shouldPerformRedirect = shouldRedirectToMobile();
    setShouldRedirect(shouldPerformRedirect);

    // Instant redirect for mobile devices - no delays or modals
    if (shouldPerformRedirect && detectionResult.isMobile) {
      console.log('[MOBILE-DETECTION] Instant mobile redirect triggered');
      redirectToMobile();
      setIsRedirecting(true);
    }

    // Log detection results for debugging
    console.log('[MOBILE-DETECTION]', {
      deviceType: detectionResult.deviceType,
      isMobile: detectionResult.isMobile,
      isTablet: detectionResult.isTablet,
      shouldRedirect: shouldPerformRedirect,
      userAgent: detectionResult.userAgent.substring(0, 50) + '...',
      instantRedirect: shouldPerformRedirect && detectionResult.isMobile
    });
  }, []);

  const performRedirect = () => {
    if (!isRedirecting && shouldRedirect) {
      setIsRedirecting(true);
      console.log('[MOBILE-DETECTION] Performing instant mobile redirect');
      redirectToMobile();
    }
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