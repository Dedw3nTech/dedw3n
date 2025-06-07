import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Stable translation cache to prevent re-renders
const translationCache = new Map<string, string>();

// Hook to prevent infinite re-renders in translation system
export function useOptimizedTranslation(text: string): string {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLanguageRef = useRef(currentLanguage);
  const lastTextRef = useRef(text);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized cache key to prevent unnecessary computations
  const cacheKey = useMemo(() => 
    `${text}:${currentLanguage}`, 
    [text, currentLanguage]
  );

  useEffect(() => {
    // Only update if text or language actually changed
    if (lastLanguageRef.current === currentLanguage && lastTextRef.current === text) {
      return;
    }

    lastLanguageRef.current = currentLanguage;
    lastTextRef.current = text;

    // Return original text for English
    if (currentLanguage === 'EN') {
      setTranslatedText(text);
      return;
    }

    // Check cache first
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey)!);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Translate with error handling
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        targetLanguage: currentLanguage,
        priority: 'normal'
      }),
      signal
    })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!signal.aborted && data.translatedText && isMountedRef.current) {
        const translated = data.translatedText;
        translationCache.set(cacheKey, translated);
        setTranslatedText(translated);
      }
    })
    .catch(() => {
      // Keep original text on error
      if (!signal.aborted && isMountedRef.current) {
        setTranslatedText(text);
      }
    });
  }, [text, currentLanguage, cacheKey]);

  return translatedText;
}

// Optimized batch translation hook
export function useOptimizedBatchTranslation(texts: string[]): Record<string, string> {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLanguageRef = useRef(currentLanguage);
  const isMountedRef = useRef(true);

  // Stable text array to prevent re-renders
  const stableTexts = useMemo(() => {
    return texts.filter(Boolean); // Remove empty strings
  }, [texts.length, texts.join('|')]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize with original texts
    const initialTranslations: Record<string, string> = {};
    stableTexts.forEach(text => {
      initialTranslations[text] = text;
    });
    setTranslations(initialTranslations);

    // Return early for English
    if (currentLanguage === 'EN') {
      return;
    }

    lastLanguageRef.current = currentLanguage;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache for existing translations
    const cachedTranslations: Record<string, string> = {};
    const textsToTranslate: string[] = [];

    stableTexts.forEach(text => {
      const cacheKey = `${text}:${currentLanguage}`;
      if (translationCache.has(cacheKey)) {
        cachedTranslations[text] = translationCache.get(cacheKey)!;
      } else {
        textsToTranslate.push(text);
      }
    });

    // Update with cached translations immediately
    if (Object.keys(cachedTranslations).length > 0) {
      setTranslations(prev => ({ ...prev, ...cachedTranslations }));
    }

    // Translate remaining texts
    if (textsToTranslate.length === 0) return;

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    fetch('/api/translate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        texts: textsToTranslate, 
        targetLanguage: currentLanguage,
        priority: 'normal'
      }),
      signal
    })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!signal.aborted && data.translations && isMountedRef.current) {
        const newTranslations: Record<string, string> = {};
        
        data.translations.forEach((item: any) => {
          if (item.originalText && item.translatedText) {
            const cacheKey = `${item.originalText}:${currentLanguage}`;
            translationCache.set(cacheKey, item.translatedText);
            newTranslations[item.originalText] = item.translatedText;
          }
        });

        setTranslations(prev => ({ ...prev, ...newTranslations }));
      }
    })
    .catch(() => {
      // Keep original texts on error - no state update needed as we already initialized
    });
  }, [stableTexts, currentLanguage]);

  return translations;
}

// Clear translation cache function
export function clearTranslationCache(): void {
  translationCache.clear();
}

// Get cache statistics
export function getTranslationCacheStats(): { size: number } {
  return { size: translationCache.size };
}