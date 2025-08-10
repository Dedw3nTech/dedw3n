import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface CaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

const CaptchaContext = createContext<CaptchaContextType>({
  executeRecaptcha: undefined,
  isReady: false,
  isLoading: true,
  error: null
});

export const useUnifiedRecaptcha = () => {
  const context = useContext(CaptchaContext);
  if (!context) {
    throw new Error('useUnifiedRecaptcha must be used within a CaptchaProvider');
  }
  return context;
};

interface CaptchaProviderProps {
  children: ReactNode;
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ';

export function UnifiedRecaptchaProvider({ children }: CaptchaProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Google reCAPTCHA v3 script
  useEffect(() => {
    const loadRecaptchaScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="recaptcha"]')) {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
            setIsLoading(false);
            console.log('[RECAPTCHA] Google reCAPTCHA v3 ready');
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            setIsReady(true);
            setIsLoading(false);
            console.log('[RECAPTCHA] Google reCAPTCHA v3 loaded and ready');
          });
        } else {
          setError('Failed to initialize Google reCAPTCHA');
          setIsLoading(false);
        }
      };

      script.onerror = () => {
        setError('Failed to load Google reCAPTCHA script');
        setIsLoading(false);
        console.error('[RECAPTCHA] Failed to load script');
      };

      document.head.appendChild(script);
    };

    loadRecaptchaScript();
  }, []);

  // Execute reCAPTCHA for given action
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    // Check if site key is available
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('[RECAPTCHA] Site key not configured');
      if (import.meta.env.MODE === 'development') {
        return 'dev_bypass_token';
      }
      throw new Error('reCAPTCHA site key not configured');
    }

    if (!isReady || !window.grecaptcha) {
      console.log('[RECAPTCHA] Not ready, checking environment');
      if (import.meta.env.MODE === 'development') {
        console.log('[RECAPTCHA] Using development bypass token');
        return 'dev_bypass_token';
      }
      throw new Error('reCAPTCHA not ready');
    }

    try {
      console.log(`[RECAPTCHA] Executing for action: ${action}`);
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      console.log(`[RECAPTCHA] Token generated successfully for action: ${action} (length: ${token.length})`);
      
      // Validate token format
      if (!token || token.length < 20) {
        console.error('[RECAPTCHA] Invalid token format received');
        if (import.meta.env.MODE === 'development') {
          return 'dev_bypass_token';
        }
        throw new Error('Invalid reCAPTCHA token format');
      }
      
      return token;
    } catch (error) {
      console.error('[RECAPTCHA] Execution error:', error);
      if (import.meta.env.MODE === 'development') {
        console.log('[RECAPTCHA] Using development bypass due to error');
        return 'dev_bypass_token';
      }
      throw error;
    }
  }, [isReady]);

  const contextValue = {
    executeRecaptcha: isReady ? executeRecaptcha : undefined,
    isReady,
    isLoading,
    error
  };

  return (
    <CaptchaContext.Provider value={contextValue}>
      {children}
    </CaptchaContext.Provider>
  );
}

// Legacy compatibility exports
export const useRecaptcha = useUnifiedRecaptcha;
export const RecaptchaProvider = UnifiedRecaptchaProvider;