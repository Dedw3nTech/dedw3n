// Cookie Consent Management
export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: Date;
  version: string;
}

export interface CookieConsentState {
  hasConsented: boolean;
  consent: CookieConsent | null;
  isFirstVisit: boolean;
  showBanner: boolean;
}

const CONSENT_VERSION = '1.0.0';
const CONSENT_STORAGE_KEY = 'dedwen_cookie_consent';
const FIRST_VISIT_KEY = 'dedwen_first_visit';

/**
 * Check if this is the user's first visit to the website
 */
export function isFirstVisit(): boolean {
  try {
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    return hasVisited === null;
  } catch (error) {
    console.warn('[Cookie Consent] Error checking first visit:', error);
    return true; // Default to showing banner if storage unavailable
  }
}

/**
 * Mark that the user has visited the website
 */
export function markAsVisited(): void {
  try {
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
    console.log('[Cookie Consent] Marked user as visited');
  } catch (error) {
    console.warn('[Cookie Consent] Error marking as visited:', error);
  }
}

/**
 * Get stored cookie consent preferences
 */
export function getStoredConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Validate consent version
    if (parsed.version !== CONSENT_VERSION) {
      console.log('[Cookie Consent] Version mismatch, requiring new consent');
      return null;
    }

    return {
      necessary: parsed.necessary || true, // Necessary cookies always enabled
      analytics: parsed.analytics || false,
      marketing: parsed.marketing || false,
      preferences: parsed.preferences || false,
      timestamp: new Date(parsed.timestamp),
      version: parsed.version
    };
  } catch (error) {
    console.warn('[Cookie Consent] Error retrieving stored consent:', error);
    return null;
  }
}

/**
 * Store cookie consent preferences
 */
export function storeConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>): void {
  try {
    const consentData: CookieConsent = {
      ...consent,
      necessary: true, // Always true for necessary cookies
      timestamp: new Date(),
      version: CONSENT_VERSION
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    console.log('[Cookie Consent] Stored consent preferences:', consentData);
    
    // Apply consent preferences immediately
    applyCookieConsent(consentData);
  } catch (error) {
    console.error('[Cookie Consent] Error storing consent:', error);
  }
}

/**
 * Get current consent state including first visit detection
 */
export function getConsentState(): CookieConsentState {
  const storedConsent = getStoredConsent();
  const firstVisit = isFirstVisit();
  
  return {
    hasConsented: storedConsent !== null,
    consent: storedConsent,
    isFirstVisit: firstVisit,
    showBanner: firstVisit || storedConsent === null
  };
}

/**
 * Apply cookie consent preferences to the application
 */
export function applyCookieConsent(consent: CookieConsent): void {
  console.log('[Cookie Consent] Applying consent preferences:', consent);

  // Apply analytics consent
  if (!consent.analytics) {
    // Disable Google Analytics
    if (typeof window !== 'undefined') {
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = true;
      
      // Clear existing analytics cookies
      clearAnalyticsCookies();
    }
  }

  // Apply marketing consent
  if (!consent.marketing) {
    // Disable marketing trackers and clear marketing cookies
    clearMarketingCookies();
  }

  // Emit consent change event for other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', {
      detail: consent
    }));
  }
}

/**
 * Clear analytics cookies when consent is withdrawn
 */
function clearAnalyticsCookies(): void {
  const analyticsCookies = [
    '_ga', '_gat', '_gid', '_gtag_GA_', '_gcl_au'
  ];

  analyticsCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  console.log('[Cookie Consent] Cleared analytics cookies');
}

/**
 * Clear marketing cookies when consent is withdrawn
 */
function clearMarketingCookies(): void {
  const marketingCookies = [
    '_fbp', '_fbc', '_hjid', '_hjFirstSeen', 'IDE', 'test_cookie'
  ];

  marketingCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  console.log('[Cookie Consent] Cleared marketing cookies');
}

/**
 * Accept all cookies (convenience function)
 */
export function acceptAllCookies(): void {
  storeConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true
  });
  markAsVisited();
}

/**
 * Accept only necessary cookies
 */
export function acceptNecessaryOnly(): void {
  storeConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  markAsVisited();
}

/**
 * Reject all non-necessary cookies
 */
export function rejectAllCookies(): void {
  acceptNecessaryOnly();
}

/**
 * Initialize cookie consent on page load
 */
export function initializeCookieConsent(): CookieConsentState {
  const state = getConsentState();
  
  // Apply existing consent if available
  if (state.consent) {
    applyCookieConsent(state.consent);
  }
  
  console.log('[Cookie Consent] Initialized with state:', state);
  return state;
}