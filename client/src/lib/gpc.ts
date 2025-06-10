// Global Privacy Control (GPC) Detection and Handling
// https://globalprivacycontrol.org/

export interface GPCSignal {
  detected: boolean;
  value: boolean | undefined;
  source: 'header' | 'javascript' | 'none';
  timestamp: Date;
}

/**
 * Detects Global Privacy Control (GPC) signal from the browser
 * GPC can be detected via:
 * 1. JavaScript Navigator API: navigator.globalPrivacyControl
 * 2. HTTP Header: Sec-GPC (handled server-side)
 */
export function detectGPCSignal(): GPCSignal {
  const timestamp = new Date();
  
  // Check if GPC is available in the browser
  if (typeof navigator !== 'undefined' && 'globalPrivacyControl' in navigator) {
    const gpcValue = (navigator as any).globalPrivacyControl;
    
    console.log('[GPC] Global Privacy Control detected:', gpcValue);
    
    return {
      detected: true,
      value: Boolean(gpcValue),
      source: 'javascript',
      timestamp
    };
  }
  
  return {
    detected: false,
    value: undefined,
    source: 'none',
    timestamp
  };
}

/**
 * Store GPC preference in localStorage for consistency
 */
export function storeGPCPreference(gpcSignal: GPCSignal): void {
  try {
    localStorage.setItem('gpc_signal', JSON.stringify({
      detected: gpcSignal.detected,
      value: gpcSignal.value,
      source: gpcSignal.source,
      timestamp: gpcSignal.timestamp.toISOString()
    }));
    
    console.log('[GPC] Stored GPC preference:', gpcSignal);
  } catch (error) {
    console.warn('[GPC] Failed to store GPC preference:', error);
  }
}

/**
 * Retrieve stored GPC preference
 */
export function getStoredGPCPreference(): GPCSignal | null {
  try {
    const stored = localStorage.getItem('gpc_signal');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return {
      detected: parsed.detected,
      value: parsed.value,
      source: parsed.source,
      timestamp: new Date(parsed.timestamp)
    };
  } catch (error) {
    console.warn('[GPC] Failed to retrieve GPC preference:', error);
    return null;
  }
}

/**
 * Check if user has opted out of data selling/sharing via GPC
 */
export function hasGPCOptOut(): boolean {
  const gpcSignal = detectGPCSignal();
  
  // If GPC is detected and set to true, user has opted out
  if (gpcSignal.detected && gpcSignal.value === true) {
    return true;
  }
  
  // Check stored preference as fallback
  const stored = getStoredGPCPreference();
  if (stored && stored.detected && stored.value === true) {
    return true;
  }
  
  return false;
}

/**
 * Apply GPC preferences to data collection and analytics
 */
export function applyGPCPreferences(): void {
  const hasOptOut = hasGPCOptOut();
  
  if (hasOptOut) {
    console.log('[GPC] User has opted out via GPC - applying privacy preferences');
    
    // Disable analytics tracking
    if (typeof window !== 'undefined') {
      // Disable Google Analytics
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = true;
      
      // Set GPC flag for server-side processing
      document.documentElement.setAttribute('data-gpc-optout', 'true');
      
      // Emit custom event for other privacy-related scripts
      window.dispatchEvent(new CustomEvent('gpc-optout', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }
}

/**
 * Initialize GPC detection and handling
 */
export function initializeGPC(): GPCSignal {
  const gpcSignal = detectGPCSignal();
  
  // Store the detected signal
  storeGPCPreference(gpcSignal);
  
  // Apply preferences
  applyGPCPreferences();
  
  return gpcSignal;
}