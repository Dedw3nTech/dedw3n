import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

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

function RecaptchaInner({ children }: RecaptchaProviderProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkReadiness = () => {
      if (typeof window.grecaptcha !== 'undefined' && executeRecaptcha) {
        console.log('[RECAPTCHA] Service is ready');
        setIsReady(true);
      } else {
        console.log('[RECAPTCHA] Waiting for service to be ready...');
        setTimeout(checkReadiness, 100);
      }
    };

    checkReadiness();
  }, [executeRecaptcha]);

  // Wrapper function with enhanced error handling
  const enhancedExecuteRecaptcha = async (action: string): Promise<string> => {
    if (!executeRecaptcha) {
      throw new Error('reCAPTCHA service not available');
    }

    if (typeof window.grecaptcha === 'undefined') {
      throw new Error('reCAPTCHA script not loaded');
    }

    try {
      console.log(`[RECAPTCHA] Executing action: ${action}`);
      const token = await executeRecaptcha(action);
      
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from reCAPTCHA');
      }

      console.log(`[RECAPTCHA] Token generated successfully for action: ${action}`);
      return token;
    } catch (error) {
      console.error('[RECAPTCHA] Execution failed:', error);
      throw error;
    }
  };

  return (
    <RecaptchaContext.Provider value={{ 
      executeRecaptcha: executeRecaptcha ? enhancedExecuteRecaptcha : undefined,
      isReady 
    }}>
      {children}
    </RecaptchaContext.Provider>
  );
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (!siteKey) {
    console.error('[RECAPTCHA] VITE_RECAPTCHA_SITE_KEY not found in environment variables');
    // Provide fallback context without reCAPTCHA
    return (
      <RecaptchaContext.Provider value={{ executeRecaptcha: undefined, isReady: false }}>
        {children}
      </RecaptchaContext.Provider>
    );
  }

  // Add global callback for reCAPTCHA load
  if (typeof window !== 'undefined') {
    (window as any).onRecaptchaLoad = () => {
      console.log('[RECAPTCHA] Script loaded via global callback');
    };
  }

  console.log('[RECAPTCHA] Initializing with site key:', siteKey.substring(0, 10) + '...');

  return (
    <GoogleReCaptchaProvider 
      reCaptchaKey={siteKey}
      useRecaptchaNet={true}
      scriptProps={{
        async: true,
        defer: false,
        appendTo: 'head',
        onLoadCallbackName: 'onRecaptchaLoad'
      }}
    >
      <RecaptchaInner>{children}</RecaptchaInner>
    </GoogleReCaptchaProvider>
  );
}