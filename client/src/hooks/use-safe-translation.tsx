import { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Safe translation hook that prevents component crashes
export function useSafeTranslation(text: string): string {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Return original text for English
    if (currentLanguage === 'EN') {
      setTranslatedText(text);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Use batch translation for better performance
    fetch('/api/translate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        texts: [text], 
        targetLanguage: currentLanguage,
        priority: 'normal'
      }),
      signal
    })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!signal.aborted && data.translations && data.translations.length > 0) {
        setTranslatedText(data.translations[0].translatedText);
      }
    })
    .catch(() => {
      // Keep original text on error - no logging to prevent spam
      if (!signal.aborted) {
        setTranslatedText(text);
      }
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [text, currentLanguage]);

  return translatedText;
}

// Safe batch translation hook with error boundaries
export function useSafeBatchTranslation(
  texts: string[]
): Record<string, string> {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Memoize texts to prevent unnecessary re-renders
  const stableTexts = useMemo(() => texts, [JSON.stringify(texts)]);

  useEffect(() => {
    // Initialize with original texts
    const initialTranslations: Record<string, string> = {};
    stableTexts.forEach(text => {
      initialTranslations[text] = text;
    });
    setTranslations(initialTranslations);

    // Return original texts for English
    if (currentLanguage === 'EN') {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Batch translate with error boundary
    fetch('/api/translate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        texts: stableTexts, 
        targetLanguage: currentLanguage,
        priority: 'normal'
      }),
      signal
    })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!signal.aborted && data.translations) {
        const newTranslations: Record<string, string> = {};
        data.translations.forEach((item: any) => {
          if (item.originalText && item.translatedText) {
            newTranslations[item.originalText] = item.translatedText;
          }
        });
        setTranslations(prev => ({ ...prev, ...newTranslations }));
      }
    })
    .catch(() => {
      // Keep original texts on error - no logging to prevent spam
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stableTexts, currentLanguage]);

  return translations;
}