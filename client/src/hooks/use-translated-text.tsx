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
        // Call the translation API directly
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: originalText,
            targetLanguage: selectedLanguage.code,
          }),
        });

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.status}`);
        }

        const data = await response.json();
        const translated = data.translatedText || originalText;
        
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
  }, [originalText, selectedLanguage.code]);

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