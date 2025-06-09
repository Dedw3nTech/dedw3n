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
      throw new Error('reCAPTCHA site key not configured');
    }

    if (!window.grecaptcha || !window.grecaptcha.ready) {
      throw new Error('reCAPTCHA not loaded');
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          console.log(`[RECAPTCHA] Executing action: ${action}`);
          const token = await window.grecaptcha.execute(siteKey, { action });
          
          if (!token || typeof token !== 'string') {
            throw new Error('Invalid token received');
          }

          console.log(`[RECAPTCHA] Token generated successfully for action: ${action}`);
          resolve(token);
        } catch (error) {
          console.error('[RECAPTCHA] Execution failed:', error);
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