import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface RecaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
  isReady: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  executeRecaptcha: undefined,
  isReady: false
});

export const useRecaptcha = () => {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
};

interface RecaptchaProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [siteKey] = useState(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

  useEffect(() => {
    if (!siteKey) {
      console.error('[RECAPTCHA] VITE_RECAPTCHA_SITE_KEY not found in environment variables');
      return;
    }

    // In development mode, skip reCAPTCHA loading to prevent popup
    if (import.meta.env.DEV) {
      console.log('[RECAPTCHA] Development mode detected - using bypass mode');
      setIsReady(true);
      return;
    }

    // Check if script is already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      console.log('[RECAPTCHA] Script already loaded');
      window.grecaptcha.ready(() => {
        setIsReady(true);
        console.log('[RECAPTCHA] Ready callback executed');
      });
      return;
    }

    // Load reCAPTCHA script manually
    const scriptId = 'recaptcha-script';
    if (document.getElementById(scriptId)) {
      return; // Script already exists
    }

    console.log('[RECAPTCHA] Loading script manually...');
    
    // Define global callback
    window.onRecaptchaLoad = () => {
      console.log('[RECAPTCHA] Script loaded via callback');
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
          console.log('[RECAPTCHA] Ready state achieved');
        });
      }
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&onload=onRecaptchaLoad`;
    script.async = true;
    script.defer = false;
    
    script.onload = () => {
      console.log('[RECAPTCHA] Script onload event');
    };
    
    script.onerror = (error) => {
      console.error('[RECAPTCHA] Script failed to load:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      delete window.onRecaptchaLoad;
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string): Promise<string> => {
    if (!siteKey) {
      console.error('[RECAPTCHA] Site key not configured');
      throw new Error('reCAPTCHA site key not configured');
    }

    // In development mode, return a development token
    if (import.meta.env.DEV) {
      console.log(`[RECAPTCHA] Development mode - returning bypass token for action: ${action}`);
      return 'development-bypass-token';
    }

    if (!window.grecaptcha) {
      console.error('[RECAPTCHA] grecaptcha object not found');
      throw new Error('reCAPTCHA not loaded');
    }

    if (!window.grecaptcha.ready) {
      console.error('[RECAPTCHA] grecaptcha.ready not available');
      throw new Error('reCAPTCHA ready function not available');
    }

    if (!window.grecaptcha.execute) {
      console.error('[RECAPTCHA] grecaptcha.execute not available');
      throw new Error('reCAPTCHA execute function not available');
    }

    console.log(`[RECAPTCHA] Starting execution for action: ${action}`);
    console.log(`[RECAPTCHA] Site key: ${siteKey.substring(0, 10)}...`);
    console.log(`[RECAPTCHA] grecaptcha object:`, typeof window.grecaptcha);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[RECAPTCHA] Execution timeout after 15 seconds');
        reject(new Error('reCAPTCHA execution timeout'));
      }, 15000);

      window.grecaptcha.ready(async () => {
        try {
          console.log(`[RECAPTCHA] Ready callback executed, now calling execute`);
          console.log(`[RECAPTCHA] Calling grecaptcha.execute with:`, { siteKey: siteKey.substring(0, 10) + '...', action });
          
          const token = await window.grecaptcha.execute(siteKey, { action });
          clearTimeout(timeout);
          
          console.log(`[RECAPTCHA] Raw token received:`, typeof token, token ? token.length : 'null');
          
          if (!token) {
            console.error('[RECAPTCHA] No token received from grecaptcha.execute');
            throw new Error('No token received from reCAPTCHA');
          }
          
          if (typeof token !== 'string') {
            console.error('[RECAPTCHA] Invalid token type:', typeof token);
            throw new Error('Invalid token type received from reCAPTCHA');
          }
          
          if (token.length < 20) {
            console.error('[RECAPTCHA] Token too short:', token.length);
            throw new Error('Invalid token length received from reCAPTCHA');
          }

          console.log(`[RECAPTCHA] Token generated successfully for action: ${action}, length: ${token.length}`);
          resolve(token);
        } catch (error) {
          clearTimeout(timeout);
          console.error('[RECAPTCHA] Execution failed with error:', error);
          console.error('[RECAPTCHA] Error type:', typeof error);
          console.error('[RECAPTCHA] Error message:', error instanceof Error ? error.message : 'Unknown error');
          console.error('[RECAPTCHA] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          reject(error);
        }
      });
    });
  };

  const contextValue = {
    executeRecaptcha: isReady && siteKey ? executeRecaptcha : undefined,
    isReady: isReady && !!siteKey
  };

  return (
    <RecaptchaContext.Provider value={contextValue}>
      {children}
    </RecaptchaContext.Provider>
  );
}