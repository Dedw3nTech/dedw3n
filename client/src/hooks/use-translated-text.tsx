import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Local cache for translated text to reduce API calls
const localCache = new Map<string, string>();

export function useTranslatedText(originalText: string): string {
  const { selectedLanguage, translateText } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);

  useEffect(() => {
    if (selectedLanguage.code === 'EN') {
      setTranslatedText(originalText);
      return;
    }

    // Check local cache first
    const cacheKey = `${originalText}:${selectedLanguage.code}`;
    if (localCache.has(cacheKey)) {
      setTranslatedText(localCache.get(cacheKey)!);
      return;
    }

    const performTranslation = async () => {
      try {
        const translated = await translateText(originalText);
        setTranslatedText(translated);
        // Cache the result
        localCache.set(cacheKey, translated);
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback to original text on error
        setTranslatedText(originalText);
        // Cache the fallback to prevent repeated failed requests
        localCache.set(cacheKey, originalText);
      }
    };

    performTranslation();
  }, [originalText, selectedLanguage.code, translateText]);

  return translatedText;
}

// Component wrapper for easy translation
interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ children, className }: TranslatedTextProps) {
  const translatedText = useTranslatedText(children);
  
  return <span className={className}>{translatedText}</span>;
}