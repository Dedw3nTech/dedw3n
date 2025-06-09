import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

interface UnifiedRecaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  siteKey: string | undefined;
}

const UnifiedRecaptchaContext = createContext<UnifiedRecaptchaContextType>({
  executeRecaptcha: undefined,
  isReady: false,
  isLoading: false,
  error: null,
  siteKey: undefined
});

export const useUnifiedRecaptcha = () => {
  const context = useContext(UnifiedRecaptchaContext);
  if (!context) {
    throw new Error('useUnifiedRecaptcha must be used within a UnifiedRecaptchaProvider');
  }
  return context;
};

interface UnifiedRecaptchaProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    grecaptcha: any;
    onUnifiedRecaptchaLoad: () => void;
  }
}

export function UnifiedRecaptchaProvider({ children }: UnifiedRecaptchaProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteKey] = useState(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

  // Enhanced script loading with proper error handling
  useEffect(() => {
    if (!siteKey) {
      const errorMsg = 'reCAPTCHA site key not configured in environment variables';
      console.error('[UNIFIED-RECAPTCHA] ' + errorMsg);
      setError(errorMsg);
      return;
    }

    // Prevent duplicate script loading
    const existingScript = document.getElementById('unified-recaptcha-script');
    if (existingScript) {
      console.log('[UNIFIED-RECAPTCHA] Script already exists, checking readiness');
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
          setIsLoading(false);
          console.log('[UNIFIED-RECAPTCHA] Ready state achieved (existing script)');
        });
      }
      return;
    }

    // Check if grecaptcha is already loaded from another source
    if (window.grecaptcha && window.grecaptcha.ready) {
      console.log('[UNIFIED-RECAPTCHA] reCAPTCHA already loaded globally');
      window.grecaptcha.ready(() => {
        setIsReady(true);
        setIsLoading(false);
        console.log('[UNIFIED-RECAPTCHA] Ready callback executed (global)');
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    // Define global callback with comprehensive error handling
    window.onUnifiedRecaptchaLoad = () => {
      console.log('[UNIFIED-RECAPTCHA] Script loaded via callback');
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
          setIsLoading(false);
          setError(null);
          console.log('[UNIFIED-RECAPTCHA] Ready state achieved');
        });
      } else {
        const errorMsg = 'reCAPTCHA object not available after script load';
        console.error('[UNIFIED-RECAPTCHA] ' + errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    // Create and configure script
    const script = document.createElement('script');
    script.id = 'unified-recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&onload=onUnifiedRecaptchaLoad`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('[UNIFIED-RECAPTCHA] Script onload event triggered');
    };
    
    script.onerror = (scriptError) => {
      const errorMsg = 'Failed to load reCAPTCHA script';
      console.error('[UNIFIED-RECAPTCHA] ' + errorMsg, scriptError);
      setError(errorMsg);
      setIsLoading(false);
    };

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      if (!isReady) {
        const errorMsg = 'reCAPTCHA script loading timeout (30s)';
        console.error('[UNIFIED-RECAPTCHA] ' + errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      }
    }, 30000);

    document.head.appendChild(script);

    return () => {
      clearTimeout(timeoutId);
      const existingScript = document.getElementById('unified-recaptcha-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      delete window.onUnifiedRecaptchaLoad;
    };
  }, [siteKey]);

  // Enhanced token execution with comprehensive validation
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    console.log(`[UNIFIED-RECAPTCHA] Starting secure authentication verification...`);
    console.log(`[UNIFIED-RECAPTCHA] Executing for action: ${action}`);
    console.log(`[UNIFIED-RECAPTCHA] Site key: ${siteKey?.substring(0, 12)}...`);
    
    if (!siteKey) {
      const error = new Error('reCAPTCHA site key not configured');
      console.error('[UNIFIED-RECAPTCHA] Configuration error:', error);
      throw error;
    }

    if (!isReady || !window.grecaptcha) {
      const error = new Error('reCAPTCHA not ready - service unavailable');
      console.error('[UNIFIED-RECAPTCHA] Readiness error:', error);
      throw error;
    }

    try {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const timeoutError = new Error('reCAPTCHA execution timeout');
          console.error('[UNIFIED-RECAPTCHA] Timeout error:', timeoutError);
          reject(timeoutError);
        }, 15000);

        window.grecaptcha.ready(async () => {
          try {
            console.log('[UNIFIED-RECAPTCHA] Executing reCAPTCHA...');
            const token = await window.grecaptcha.execute(siteKey, { action });
            clearTimeout(timeoutId);
            
            if (!token || typeof token !== 'string' || token.length < 20) {
              throw new Error('Invalid token format received');
            }
            
            console.log(`[UNIFIED-RECAPTCHA] Token generated successfully, length: ${token.length}`);
            resolve(token);
          } catch (executionError) {
            clearTimeout(timeoutId);
            console.error('[UNIFIED-RECAPTCHA] Execution failed:', executionError);
            reject(new Error('Security verification failed'));
          }
        });
      });
    } catch (generalError) {
      console.error('[UNIFIED-RECAPTCHA] Security verification failed:', generalError);
      throw new Error('Authentication verification unavailable');
    }
  }, [siteKey, isReady]);

  const contextValue = {
    executeRecaptcha: isReady && siteKey && !error ? executeRecaptcha : undefined,
    isReady: isReady && !!siteKey && !error,
    isLoading,
    error,
    siteKey
  };

  return (
    <UnifiedRecaptchaContext.Provider value={contextValue}>
      {children}
    </UnifiedRecaptchaContext.Provider>
  );
}

// Legacy compatibility exports
export const useRecaptcha = useUnifiedRecaptcha;
export const RecaptchaProvider = UnifiedRecaptchaProvider;