import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { deepLTranslationService } from './DeepLMachineTranslator';

// Enhanced DeepL Translation Provider with real-time capabilities
interface DeepLTranslationContextType {
  translateText: (text: string) => Promise<string>;
  translateTexts: (texts: string[]) => Promise<Map<string, string>>;
  isDeepLEnabled: boolean;
  currentLanguage: string;
}

const DeepLTranslationContext = createContext<DeepLTranslationContextType | null>(null);

export function DeepLTranslationProvider({ children }: { children: React.ReactNode }) {
  const { currentLanguage } = useLanguage();
  const serviceRef = useRef(deepLTranslationService);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
    if (apiKey && currentLanguage !== 'EN') {
      console.log(`[DeepL Provider] API key configured, DeepL translation active for ${currentLanguage}`);
    } else if (!apiKey) {
      console.log('[DeepL Provider] No API key found, using fallback translation service');
    }
  }, [currentLanguage]);

  const translateText = async (text: string): Promise<string> => {
    if (!text.trim() || currentLanguage === 'EN') {
      return text;
    }
    
    try {
      const result = await serviceRef.current.translate(text, currentLanguage);
      return result;
    } catch (error) {
      console.error('[DeepL Provider] Translation failed:', error);
      return text;
    }
  };

  const translateTexts = async (texts: string[]): Promise<Map<string, string>> => {
    if (currentLanguage === 'EN') {
      const results = new Map<string, string>();
      texts.forEach(text => results.set(text, text));
      return results;
    }

    try {
      return await serviceRef.current.translateBatch(texts, currentLanguage);
    } catch (error) {
      console.error('[DeepL Provider] Batch translation failed:', error);
      const fallbackResults = new Map<string, string>();
      texts.forEach(text => fallbackResults.set(text, text));
      return fallbackResults;
    }
  };

  const contextValue: DeepLTranslationContextType = {
    translateText,
    translateTexts,
    isDeepLEnabled: !!import.meta.env.VITE_DEEPL_API_KEY && currentLanguage !== 'EN',
    currentLanguage
  };

  return (
    <DeepLTranslationContext.Provider value={contextValue}>
      {children}
    </DeepLTranslationContext.Provider>
  );
}

export function useDeepLTranslation() {
  const context = useContext(DeepLTranslationContext);
  if (!context) {
    throw new Error('useDeepLTranslation must be used within DeepLTranslationProvider');
  }
  return context;
}

// Translation helper component for easy text translation
interface TranslatedTextProps {
  text: string;
  fallback?: string;
  className?: string;
}

export function TranslatedText({ text, fallback, className }: TranslatedTextProps) {
  const { translateText, currentLanguage } = useDeepLTranslation();
  const [translatedText, setTranslatedText] = React.useState(text);

  useEffect(() => {
    if (currentLanguage === 'EN') {
      setTranslatedText(text);
      return;
    }

    const translate = async () => {
      try {
        const result = await translateText(text);
        setTranslatedText(result);
      } catch (error) {
        console.error('[TranslatedText] Translation failed:', error);
        setTranslatedText(fallback || text);
      }
    };

    translate();
  }, [text, currentLanguage, translateText, fallback]);

  return <span className={className}>{translatedText}</span>;
}

export default DeepLTranslationProvider;