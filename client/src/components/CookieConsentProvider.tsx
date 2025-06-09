import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  CookieConsentState, 
  CookieConsent, 
  initializeCookieConsent,
  storeConsent,
  markAsVisited,
  acceptAllCookies,
  acceptNecessaryOnly
} from '@/lib/cookie-consent';
import { useGPC } from './GPCProvider';

interface CookieConsentContextType extends CookieConsentState {
  acceptAll: () => void;
  acceptNecessary: () => void;
  saveCustomPreferences: (preferences: Omit<CookieConsent, 'timestamp' | 'version'>) => void;
  hideBanner: () => void;
  refreshConsentState: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  hasConsented: false,
  consent: null,
  isFirstVisit: true,
  showBanner: true,
  acceptAll: () => {},
  acceptNecessary: () => {},
  saveCustomPreferences: () => {},
  hideBanner: () => {},
  refreshConsentState: () => {}
});

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consentState, setConsentState] = useState<CookieConsentState>({
    hasConsented: false,
    consent: null,
    isFirstVisit: true,
    showBanner: true
  });

  const { hasOptedOut: gpcOptedOut } = useGPC();

  const refreshConsentState = () => {
    const newState = initializeCookieConsent();
    setConsentState(newState);
    console.log('[Cookie Consent Provider] State refreshed:', newState);
  };

  const acceptAll = () => {
    acceptAllCookies();
    refreshConsentState();
    console.log('[Cookie Consent Provider] Accepted all cookies');
  };

  const acceptNecessary = () => {
    acceptNecessaryOnly();
    refreshConsentState();
    console.log('[Cookie Consent Provider] Accepted necessary cookies only');
  };

  const saveCustomPreferences = (preferences: Omit<CookieConsent, 'timestamp' | 'version'>) => {
    storeConsent(preferences);
    markAsVisited();
    refreshConsentState();
    console.log('[Cookie Consent Provider] Saved custom preferences:', preferences);
  };

  const hideBanner = () => {
    setConsentState(prev => ({ ...prev, showBanner: false }));
    markAsVisited();
    console.log('[Cookie Consent Provider] Banner hidden');
  };

  useEffect(() => {
    // Initialize consent state on mount
    refreshConsentState();

    // Listen for GPC changes that might affect cookie consent
    const handleGPCChange = () => {
      console.log('[Cookie Consent Provider] GPC status changed, checking consent compatibility');
      refreshConsentState();
    };

    window.addEventListener('gpc-optout', handleGPCChange);
    
    // Listen for external consent changes
    const handleConsentChange = (event: CustomEvent) => {
      console.log('[Cookie Consent Provider] External consent change detected:', event.detail);
      refreshConsentState();
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('gpc-optout', handleGPCChange);
      window.removeEventListener('cookie-consent-changed', handleConsentChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // If GPC is detected and user has opted out, automatically apply minimal consent
    if (gpcOptedOut && !consentState.hasConsented) {
      console.log('[Cookie Consent Provider] GPC opt-out detected, applying minimal consent');
      acceptNecessary();
    }
  }, [gpcOptedOut, consentState.hasConsented]);

  return (
    <CookieConsentContext.Provider value={{
      ...consentState,
      acceptAll,
      acceptNecessary,
      saveCustomPreferences,
      hideBanner,
      refreshConsentState
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
}