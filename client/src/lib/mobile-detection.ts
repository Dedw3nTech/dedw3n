/**
 * Mobile Device Detection and Redirection Utility
 * Detects mobile devices and provides redirection functionality
 */

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

/**
 * Comprehensive mobile device detection
 * Uses multiple detection methods for accuracy
 */
export function detectMobileDevice(): MobileDetectionResult {
  const userAgent = navigator.userAgent || '';
  
  // Mobile device patterns
  const mobilePatterns = [
    /Android/i,
    /iPhone/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i,
    /Mobile/i,
    /webOS/i,
    /Kindle/i,
    /Silk/i,
    /Mobile Safari/i
  ];

  // Tablet device patterns
  const tabletPatterns = [
    /iPad/i,
    /Android(?!.*Mobile)/i,
    /Tablet/i,
    /PlayBook/i,
    /Kindle Fire/i,
    /Surface/i
  ];

  // Check for tablet first (more specific)
  const isTablet = tabletPatterns.some(pattern => pattern.test(userAgent));
  
  // Check for mobile (excluding tablets)
  const isMobile = !isTablet && mobilePatterns.some(pattern => pattern.test(userAgent));
  
  // Screen size detection as fallback
  const screenWidth = window.screen?.width || window.innerWidth;
  const screenHeight = window.screen?.height || window.innerHeight;
  
  // Consider screen size if user agent detection is inconclusive
  const isSmallScreen = screenWidth <= 768;
  const isMediumScreen = screenWidth > 768 && screenWidth <= 1024;
  
  // Final determination
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  let finalIsMobile = isMobile;
  let finalIsTablet = isTablet;
  
  if (isMobile || (isSmallScreen && !isTablet)) {
    deviceType = 'mobile';
    finalIsMobile = true;
    finalIsTablet = false;
  } else if (isTablet || (isMediumScreen && !isMobile)) {
    deviceType = 'tablet';
    finalIsMobile = false;
    finalIsTablet = true;
  } else {
    deviceType = 'desktop';
    finalIsMobile = false;
    finalIsTablet = false;
  }

  return {
    isMobile: finalIsMobile,
    isTablet: finalIsTablet,
    isDesktop: deviceType === 'desktop',
    deviceType,
    userAgent
  };
}

/**
 * Check if user should be redirected to mobile version
 */
export function shouldRedirectToMobile(): boolean {
  const detection = detectMobileDevice();
  
  // Only redirect mobile devices, not tablets
  if (!detection.isMobile) {
    return false;
  }
  
  // Check if user has explicitly chosen desktop version
  const desktopPreference = localStorage.getItem('dedw3n_force_desktop');
  if (desktopPreference === 'true') {
    return false;
  }
  
  // Check if already on mobile subdomain
  if (window.location.hostname.includes('mobile.') || window.location.pathname.startsWith('/mobile')) {
    return false;
  }
  
  return true;
}

/**
 * Perform mobile redirection
 */
export function redirectToMobile(): void {
  const currentUrl = window.location.href;
  const currentDomain = window.location.hostname;
  
  try {
    // Option 1: Redirect to mobile subdomain if main domain
    if (currentDomain === 'dedw3n.com' || currentDomain.includes('dedw3n.com')) {
      const mobileUrl = currentUrl.replace(currentDomain, 'mobile.dedw3n.com');
      window.location.href = mobileUrl;
      return;
    }
    
    // Option 2: Redirect to /mobile path for development or other domains
    const pathOnly = window.location.pathname + window.location.search + window.location.hash;
    const mobileUrl = window.location.origin + '/mobile' + (pathOnly === '/' ? '' : pathOnly);
    window.location.href = mobileUrl;
    
  } catch (error) {
    console.error('Error redirecting to mobile version:', error);
    // Fallback: redirect to /mobile route
    window.location.href = '/mobile';
  }
}

/**
 * Set user preference to force desktop version
 */
export function setDesktopPreference(forceDesktop: boolean): void {
  if (forceDesktop) {
    localStorage.setItem('dedw3n_force_desktop', 'true');
    // Add timestamp for preference expiry (optional)
    localStorage.setItem('dedw3n_desktop_preference_time', Date.now().toString());
  } else {
    localStorage.removeItem('dedw3n_force_desktop');
    localStorage.removeItem('dedw3n_desktop_preference_time');
  }
}

/**
 * Check if desktop preference has expired (optional feature)
 * @param expiryHours Number of hours before preference expires (default: 24)
 */
export function isDesktopPreferenceExpired(expiryHours: number = 24): boolean {
  const preferenceTime = localStorage.getItem('dedw3n_desktop_preference_time');
  if (!preferenceTime) {
    return true;
  }
  
  const setTime = parseInt(preferenceTime);
  const now = Date.now();
  const hoursElapsed = (now - setTime) / (1000 * 60 * 60);
  
  return hoursElapsed > expiryHours;
}

/**
 * Initialize mobile detection and redirection
 * Call this early in app initialization
 */
export function initializeMobileRedirection(): void {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performMobileCheck);
  } else {
    performMobileCheck();
  }
}

function performMobileCheck(): void {
  // Add small delay to ensure proper page load
  setTimeout(() => {
    if (shouldRedirectToMobile()) {
      console.log('[MOBILE] Redirecting to mobile version');
      redirectToMobile();
    }
  }, 100);
}