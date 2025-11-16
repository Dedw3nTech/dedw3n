import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  CookieConsentState, 
  CookieConsent, 
  initializeCookieConsent,
  getConsentStateWithAuth,
  storeConsent,
  markAsVisited,
  acceptAllCookies,
  acceptNecessaryOnly
} from '@/lib/cookie-consent';
import { useGPC } from './GPCProvider';
import { useAuth } from '@/hooks/use-auth';

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
  const [consentState, setConsentState] = useState<CookieConsentState>(() => {
    const initialState = initializeCookieConsent();
    console.log('[Cookie Consent Provider] Initial state loaded synchronously:', initialState);
    return initialState;
  });

  const { hasOptedOut: gpcOptedOut } = useGPC();
  
  // Safely access auth context - it might not be available during initial render
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not available yet, use fallback values
    authContext = { user: null, isLoading: true };
  }
  
  const { user, isLoading } = authContext;

  const refreshConsentState = () => {
    // Use authentication-aware consent state if auth loading is complete
    if (!isLoading) {
      const isAuthenticated = !!user;
      const newState = getConsentStateWithAuth(isAuthenticated);
      setConsentState(newState);
      console.log('[Cookie Consent Provider] State refreshed with auth awareness:', {
        ...newState,
        isAuthenticated,
        userId: user?.id || 'none'
      });
    } else {
      // Fallback to standard initialization while auth is loading
      const newState = initializeCookieConsent();
      setConsentState(newState);
      console.log('[Cookie Consent Provider] State refreshed (auth loading):', newState);
    }
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

  // Refresh consent state when authentication status changes
  useEffect(() => {
    if (!isLoading) {
      refreshConsentState();
    }
  }, [user, isLoading]);

  useEffect(() => {
    // If GPC is detected and user has opted out, automatically apply minimal consent
    // But only after a short delay to allow the banner to show first
    if (gpcOptedOut && !consentState.hasConsented) {
      console.log('[Cookie Consent Provider] GPC opt-out detected, applying minimal consent after brief delay');
      
      // Allow banner to show for 2 seconds, then automatically apply minimal consent
      const timeout = setTimeout(() => {
        console.log('[Cookie Consent Provider] Auto-applying minimal consent for GPC user');
        acceptNecessary();
      }, 2000);
      
      return () => clearTimeout(timeout);
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