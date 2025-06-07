import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Lightweight translation cache
const lazyTranslationCache = new Map<string, string>();

// Priority levels for translation
export type TranslationPriority = 'critical' | 'high' | 'normal' | 'low';

// Critical UI elements that need immediate translation
const CRITICAL_TEXTS = [
  'Home', 'Marketplace', 'Community', 'Dating', 'Contact',
  'Login', 'Logout', 'Profile', 'Settings', 'Cart', 'Search',
  'Filter', 'Add to Cart', 'Buy Now', 'Back', 'Next', 'Save',
  'Cancel', 'Submit', 'Close', 'Menu', 'Loading'
];

interface LazyTranslationOptions {
  priority?: TranslationPriority;
  fallback?: string;
  enabled?: boolean;
}

/**
 * Lightweight translation hook that loads translations on-demand
 * Critical UI elements are translated immediately, others are lazy-loaded
 */
export function useLazyTranslation(
  text: string, 
  options: LazyTranslationOptions = {}
) {
  const { currentLanguage, translateText } = useLanguage();
  const { priority = 'normal', fallback, enabled = true } = options;
  
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  const getCacheKey = useCallback((text: string, language: string) => {
    return `${text}:${language}`;
  }, []);

  const shouldTranslateImmediately = useCallback((text: string) => {
    return CRITICAL_TEXTS.some(criticalText => 
      text.toLowerCase().includes(criticalText.toLowerCase())
    ) || priority === 'critical';
  }, [priority]);

  const performTranslation = useCallback(async (textToTranslate: string) => {
    if (!enabled || currentLanguage === 'EN') {
      setTranslatedText(textToTranslate);
      return;
    }

    const cacheKey = getCacheKey(textToTranslate, currentLanguage);
    
    // Check cache first
    if (lazyTranslationCache.has(cacheKey)) {
      setTranslatedText(lazyTranslationCache.get(cacheKey)!);
      return;
    }

    // For non-critical translations, add a small delay to batch requests
    if (!shouldTranslateImmediately(textToTranslate)) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    setIsLoading(true);
    
    try {
      const translated = await translateText(textToTranslate, currentLanguage);
      lazyTranslationCache.set(cacheKey, translated);
      setTranslatedText(translated);
    } catch (error) {
      console.warn(`Translation failed for "${textToTranslate}":`, error);
      setTranslatedText(fallback || textToTranslate);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, translateText, enabled, getCacheKey, shouldTranslateImmediately, fallback]);

  useEffect(() => {
    const cacheKey = getCacheKey(text, currentLanguage);
    
    // Return original text for English
    if (currentLanguage === 'EN') {
      setTranslatedText(text);
      return;
    }

    // Check cache first
    if (lazyTranslationCache.has(cacheKey)) {
      setTranslatedText(lazyTranslationCache.get(cacheKey)!);
      return;
    }

    // For critical UI elements, translate immediately
    if (shouldTranslateImmediately(text)) {
      performTranslation(text);
    } else {
      // For non-critical elements, use a intersection observer or delay
      const timer = setTimeout(() => {
        performTranslation(text);
      }, 500); // Delay non-critical translations

      return () => clearTimeout(timer);
    }
  }, [text, currentLanguage, performTranslation, getCacheKey, shouldTranslateImmediately]);

  return {
    translatedText,
    isLoading,
    isTranslated: translatedText !== text || currentLanguage === 'EN'
  };
}

/**
 * Hook for translating multiple texts with priority-based loading
 */
export function useLazyBatchTranslation(
  texts: string[], 
  priority: TranslationPriority = 'normal'
) {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentLanguage === 'EN') {
      setTranslations(texts);
      return;
    }

    const translateBatch = async () => {
      setIsLoading(true);
      
      try {
        const results = await Promise.all(
          texts.map(async (text, index) => {
            const cacheKey = `${text}:${currentLanguage}`;
            
            if (lazyTranslationCache.has(cacheKey)) {
              return lazyTranslationCache.get(cacheKey)!;
            }

            // Add staggered delay for non-critical batches
            if (priority !== 'critical') {
              await new Promise(resolve => setTimeout(resolve, index * 50));
            }

            try {
              const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text,
                  targetLanguage: currentLanguage
                })
              });

              if (response.ok) {
                const data = await response.json();
                lazyTranslationCache.set(cacheKey, data.translatedText);
                return data.translatedText;
              }
            } catch (error) {
              console.warn(`Batch translation failed for "${text}":`, error);
            }

            return text; // Fallback to original text
          })
        );

        setTranslations(results);
      } catch (error) {
        console.error('Batch translation error:', error);
        setTranslations(texts); // Fallback to original texts
      } finally {
        setIsLoading(false);
      }
    };

    translateBatch();
  }, [texts, currentLanguage, priority]);

  return {
    translations,
    isLoading
  };
}

/**
 * Clear translation cache (useful for language changes)
 */
export function clearLazyTranslationCache() {
  lazyTranslationCache.clear();
}