import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Global cache and batch management
const globalCache = new Map<string, string>();
const pendingBatches = new Map<string, {
  texts: Set<string>;
  callbacks: Map<string, (result: string) => void>;
  timer: NodeJS.Timeout | null;
}>();

const BATCH_DELAY = 100; // 100ms delay to collect texts
const MAX_BATCH_SIZE = 15; // Maximum texts per batch

// Process a batch of translations for a language
const processBatch = async (targetLanguage: string) => {
  const batchData = pendingBatches.get(targetLanguage);
  if (!batchData || batchData.texts.size === 0) return;

  // Clear timer and remove from pending
  if (batchData.timer) {
    clearTimeout(batchData.timer);
  }
  pendingBatches.delete(targetLanguage);

  const textsArray = Array.from(batchData.texts);
  const uncachedTexts: string[] = [];
  const results = new Map<string, string>();

  // Check cache first
  textsArray.forEach(text => {
    const cacheKey = `${text}:${targetLanguage}`;
    const cached = globalCache.get(cacheKey);
    if (cached) {
      results.set(text, cached);
    } else if (text && text.trim()) {
      uncachedTexts.push(text);
    } else {
      results.set(text, text);
    }
  });

  // Fetch uncached translations
  if (uncachedTexts.length > 0) {
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncachedTexts,
          targetLanguage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translations && Array.isArray(data.translations)) {
          data.translations.forEach((translation: any, index: number) => {
            const originalText = uncachedTexts[index];
            const translatedText = translation.translatedText || originalText;
            
            // Cache and store result
            const cacheKey = `${originalText}:${targetLanguage}`;
            globalCache.set(cacheKey, translatedText);
            results.set(originalText, translatedText);
          });
        }
      } else {
        // Fallback on API error
        uncachedTexts.forEach(text => {
          results.set(text, text);
        });
      }
    } catch (error) {
      console.error('Batch translation failed:', error);
      // Fallback on network error
      uncachedTexts.forEach(text => {
        results.set(text, text);
      });
    }
  }

  // Execute all callbacks
  batchData.callbacks.forEach((callback, text) => {
    const result = results.get(text) || text;
    callback(result);
  });
};

// Add text to batch queue
const queueTranslation = (text: string, targetLanguage: string, callback: (result: string) => void) => {
  // Skip for English
  if (targetLanguage === 'EN' || targetLanguage === 'en') {
    callback(text);
    return;
  }

  // Check cache immediately
  const cacheKey = `${text}:${targetLanguage}`;
  const cached = globalCache.get(cacheKey);
  if (cached) {
    callback(cached);
    return;
  }

  // Get or create batch
  let batchData = pendingBatches.get(targetLanguage);
  if (!batchData) {
    batchData = {
      texts: new Set(),
      callbacks: new Map(),
      timer: null
    };
    pendingBatches.set(targetLanguage, batchData);
  }

  // Add to batch
  batchData.texts.add(text);
  batchData.callbacks.set(text, callback);

  // Clear existing timer
  if (batchData.timer) {
    clearTimeout(batchData.timer);
  }

  // Process batch when full or after delay
  if (batchData.texts.size >= MAX_BATCH_SIZE) {
    processBatch(targetLanguage);
  } else {
    batchData.timer = setTimeout(() => {
      processBatch(targetLanguage);
    }, BATCH_DELAY);
  }
};

// Optimized hook for single text translation
export function useOptimizedTranslation(text: string): string {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const currentRequestRef = useRef<string>('');

  useEffect(() => {
    if (!text || !text.trim()) {
      setTranslatedText(text);
      return;
    }

    const requestId = `${text}:${selectedLanguage.code}:${Date.now()}`;
    currentRequestRef.current = requestId;

    queueTranslation(text, selectedLanguage.code, (result) => {
      // Only update if this is still the current request
      if (currentRequestRef.current === requestId) {
        setTranslatedText(result);
      }
    });
  }, [text, selectedLanguage.code]);

  return translatedText;
}

// Batch hook for multiple texts
export function useOptimizedTranslationBatch(texts: string[]): string[] {
  const { selectedLanguage } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const requestIdRef = useRef<string>('');

  useEffect(() => {
    if (!texts || texts.length === 0) {
      setTranslatedTexts(texts);
      return;
    }

    const requestId = `batch:${selectedLanguage.code}:${Date.now()}`;
    requestIdRef.current = requestId;

    const results: string[] = new Array(texts.length);
    let completed = 0;

    texts.forEach((text, index) => {
      queueTranslation(text, selectedLanguage.code, (result) => {
        if (requestIdRef.current === requestId) {
          results[index] = result;
          completed++;
          
          if (completed === texts.length) {
            setTranslatedTexts([...results]);
          }
        }
      });
    });
  }, [texts, selectedLanguage.code]);

  return translatedTexts;
}

// Hook with immediate cache lookup for better performance
export function useInstantTranslation(text: string): string {
  const { selectedLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(() => {
    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      return text;
    }
    const cacheKey = `${text}:${selectedLanguage.code}`;
    return globalCache.get(cacheKey) || text;
  });

  useEffect(() => {
    if (!text || !text.trim()) {
      setTranslatedText(text);
      return;
    }

    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${text}:${selectedLanguage.code}`;
    const cached = globalCache.get(cacheKey);
    
    if (cached) {
      setTranslatedText(cached);
    } else {
      queueTranslation(text, selectedLanguage.code, (result) => {
        setTranslatedText(result);
      });
    }
  }, [text, selectedLanguage.code]);

  return translatedText;
}

// Clear cache function (useful for memory management)
export const clearTranslationCache = () => {
  globalCache.clear();
  pendingBatches.forEach(batchData => {
    if (batchData.timer) {
      clearTimeout(batchData.timer);
    }
  });
  pendingBatches.clear();
};

// Get cache stats (useful for debugging)
export const getTranslationCacheStats = () => {
  return {
    cacheSize: globalCache.size,
    pendingBatches: pendingBatches.size,
    totalPendingTexts: Array.from(pendingBatches.values()).reduce(
      (total, batch) => total + batch.texts.size, 0
    )
  };
};