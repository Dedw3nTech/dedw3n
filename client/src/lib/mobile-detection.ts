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
 * DISABLED: Mobile auto-redirect functionality has been disabled system-wide
 */
export function shouldRedirectToMobile(): boolean {
  // Mobile auto-redirect functionality disabled - always return false
  console.log('[MOBILE-DETECTION] shouldRedirectToMobile called but redirect functionality is disabled');
  return false;
}

/**
 * Perform mobile redirection
 * DISABLED: Mobile auto-redirect functionality has been disabled system-wide
 */
export function redirectToMobile(): void {
  // Mobile redirect functionality disabled - no action taken
  console.log('[MOBILE-DETECTION] redirectToMobile called but redirect functionality is disabled');
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
 * DISABLED: Mobile auto-redirect functionality has been disabled system-wide
 */
export function initializeMobileRedirection(): void {
  // Mobile redirect initialization disabled - only detection remains active
  console.log('[MOBILE-DETECTION] Mobile redirect initialization disabled - detection only mode');
}

function performMobileCheck(): void {
  // Mobile check disabled - redirect functionality removed
  console.log('[MOBILE-DETECTION] Mobile check called but redirect functionality is disabled');
}