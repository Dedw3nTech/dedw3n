import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Global batch management
const globalBatchQueue = new Map<string, {
  texts: string[];
  callbacks: Array<(translations: { [key: string]: string }) => void>;
  timer: NodeJS.Timeout | null;
}>();

const translationCache = new Map<string, string>();
const BATCH_DELAY = 50; // 50ms delay before sending batch
const BATCH_SIZE = 20; // Process 20 texts per batch

// Process a batch for a specific language
const processBatch = async (targetLanguage: string) => {
  const batchData = globalBatchQueue.get(targetLanguage);
  if (!batchData || batchData.texts.length === 0) return;

  // Clear the timer
  if (batchData.timer) {
    clearTimeout(batchData.timer);
  }

  // Remove from queue
  globalBatchQueue.delete(targetLanguage);

  // Filter out already cached texts
  const uncachedTexts: string[] = [];
  const results: { [key: string]: string } = {};

  batchData.texts.forEach(text => {
    const cacheKey = `${text}:${targetLanguage}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      results[text] = cached;
    } else if (text && text.trim() && !uncachedTexts.includes(text)) {
      uncachedTexts.push(text);
    } else {
      results[text] = text; // Empty or already included
    }
  });

  // If we have uncached texts, make batch API call
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
            results[originalText] = translatedText;
            
            // Cache the result
            const cacheKey = `${originalText}:${targetLanguage}`;
            translationCache.set(cacheKey, translatedText);
          });
        }
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      // Fallback to original texts
      uncachedTexts.forEach(text => {
        results[text] = text;
      });
    }
  }

  // Call all callbacks with results
  batchData.callbacks.forEach(callback => {
    callback(results);
  });
};

// Add text to batch queue
const addToBatch = (text: string, targetLanguage: string, callback: (translations: { [key: string]: string }) => void) => {
  if (targetLanguage === 'EN' || targetLanguage === 'en') {
    callback({ [text]: text });
    return;
  }

  // Check cache first
  const cacheKey = `${text}:${targetLanguage}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    callback({ [text]: cached });
    return;
  }

  // Get or create batch for this language
  let batchData = globalBatchQueue.get(targetLanguage);
  if (!batchData) {
    batchData = {
      texts: [],
      callbacks: [],
      timer: null
    };
    globalBatchQueue.set(targetLanguage, batchData);
  }

  // Add text and callback
  if (!batchData.texts.includes(text)) {
    batchData.texts.push(text);
  }
  batchData.callbacks.push(callback);

  // Clear existing timer and set new one
  if (batchData.timer) {
    clearTimeout(batchData.timer);
  }

  // Process batch after delay or when batch is full
  if (batchData.texts.length >= BATCH_SIZE) {
    // Process immediately when batch is full
    processBatch(targetLanguage);
  } else {
    // Set timer for delayed processing
    batchData.timer = setTimeout(() => {
      processBatch(targetLanguage);
    }, BATCH_DELAY);
  }
};

export function useBatchTranslation(texts: string[]): string[] {
  const { selectedLanguage } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    // For English, return original texts immediately
    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      setTranslatedTexts(texts);
      processingRef.current = false;
      return;
    }

    // Filter unique non-empty texts
    const uniqueTexts = [...new Set(texts.filter(text => text && text.trim()))];
    
    if (uniqueTexts.length === 0) {
      setTranslatedTexts(texts);
      processingRef.current = false;
      return;
    }

    // Check cache for all texts first
    const cacheResults: { [key: string]: string } = {};
    const needTranslation: string[] = [];

    uniqueTexts.forEach(text => {
      const cacheKey = `${text}:${selectedLanguage.code}`;
      const cached = translationCache.get(cacheKey);
      if (cached) {
        cacheResults[text] = cached;
      } else {
        needTranslation.push(text);
      }
    });

    // If all texts are cached, update immediately
    if (needTranslation.length === 0) {
      const newTranslatedTexts = texts.map(text => cacheResults[text] || text);
      setTranslatedTexts(newTranslatedTexts);
      processingRef.current = false;
      return;
    }

    // Add to batch queue
    addToBatch(needTranslation.join('|||BATCH_SEPARATOR|||'), selectedLanguage.code, (results) => {
      // Split batch results back to individual texts
      const batchResult = Object.keys(results)[0];
      const batchTranslation = results[batchResult];
      const individualTranslations = batchTranslation.split('|||BATCH_SEPARATOR|||');
      
      needTranslation.forEach((text, index) => {
        cacheResults[text] = individualTranslations[index] || text;
      });

      // Map all texts to their translations
      const newTranslatedTexts = texts.map(text => cacheResults[text] || text);
      setTranslatedTexts(newTranslatedTexts);
      processingRef.current = false;
    });

  }, [texts, selectedLanguage.code]);

  return translatedTexts;
}

// Hook for single text translation (backward compatibility)
export function useBatchTranslationSingle(text: string): string {
  const result = useBatchTranslation([text]);
  return result[0] || text;
}

// Hook for marketplace page with optimized batching
export function useMarketplaceTranslation() {
  const { selectedLanguage } = useLanguage();
  const [translations, setTranslations] = useState<{ [key: string]: string }>({});

  const translateTexts = (textsToTranslate: string[]) => {
    if (selectedLanguage.code === 'EN' || selectedLanguage.code === 'en') {
      const englishResults: { [key: string]: string } = {};
      textsToTranslate.forEach(text => {
        englishResults[text] = text;
      });
      setTranslations(prev => ({ ...prev, ...englishResults }));
      return;
    }

    // Use single batch call for all marketplace texts
    addToBatch(textsToTranslate.join('|||SEPARATOR|||'), selectedLanguage.code, (results) => {
      const batchKey = Object.keys(results)[0];
      const batchTranslation = results[batchKey];
      const individualResults = batchTranslation.split('|||SEPARATOR|||');
      
      const newTranslations: { [key: string]: string } = {};
      textsToTranslate.forEach((text, index) => {
        newTranslations[text] = individualResults[index] || text;
      });
      
      setTranslations(prev => ({ ...prev, ...newTranslations }));
    });
  };

  const getTranslation = (text: string): string => {
    return translations[text] || text;
  };

  return { translateTexts, getTranslation, translations };
}