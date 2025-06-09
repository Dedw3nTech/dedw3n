import { createContext, useContext, ReactNode } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface RecaptchaContextType {
  executeRecaptcha: ((action: string) => Promise<string>) | undefined;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  executeRecaptcha: undefined
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

  return (
    <RecaptchaContext.Provider value={{ executeRecaptcha }}>
      {children}
    </RecaptchaContext.Provider>
  );
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  // Use environment variable for reCAPTCHA site key
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (!siteKey) {
    console.warn('VITE_RECAPTCHA_SITE_KEY not found in environment variables');
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider 
      reCaptchaKey={siteKey}
      useRecaptchaNet={true}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <RecaptchaInner>{children}</RecaptchaInner>
    </GoogleReCaptchaProvider>
  );
}