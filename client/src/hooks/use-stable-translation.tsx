// Stable Translation Hook - Prevents translation loss and ensures persistence
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PersistentTranslationCache from '@/lib/persistent-translation-cache';

interface TranslationRequest {
  text: string;
  priority: 'instant' | 'high' | 'normal';
  callbacks: ((translatedText: string) => void)[];
}

class StableTranslationManager {
  private static instance: StableTranslationManager;
  private cache: PersistentTranslationCache;
  private pendingRequests = new Map<string, TranslationRequest>();
  private batchQueue = new Map<string, Set<string>>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private isProcessing = new Map<string, boolean>();

  private constructor() {
    this.cache = PersistentTranslationCache.getInstance();
  }

  static getInstance(): StableTranslationManager {
    if (!StableTranslationManager.instance) {
      StableTranslationManager.instance = new StableTranslationManager();
    }
    return StableTranslationManager.instance;
  }

  async translateText(
    text: string,
    targetLanguage: string,
    priority: 'instant' | 'high' | 'normal' = 'normal'
  ): Promise<string> {
    // Skip translation for English or empty text
    if (!text || !targetLanguage || targetLanguage === 'EN') {
      return text;
    }

    // Wait for cache to load
    await this.cache.waitForLoad();

    // Check cache first for instant response
    const cached = this.cache.get(text, targetLanguage);
    if (cached !== null) {
      return cached;
    }

    // Return promise that resolves when translation is complete
    return new Promise((resolve) => {
      const key = `${text}|||${targetLanguage}`;
      
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, {
          text,
          priority,
          callbacks: []
        });
        
        // Add to batch queue
        this.addToBatch(text, targetLanguage, priority);
      }
      
      // Add callback to pending request
      this.pendingRequests.get(key)!.callbacks.push(resolve);
    });
  }

  private addToBatch(text: string, targetLanguage: string, priority: 'instant' | 'high' | 'normal'): void {
    if (!this.batchQueue.has(targetLanguage)) {
      this.batchQueue.set(targetLanguage, new Set());
    }
    
    this.batchQueue.get(targetLanguage)!.add(text);
    
    // Clear existing timer
    if (this.batchTimers.has(targetLanguage)) {
      clearTimeout(this.batchTimers.get(targetLanguage)!);
    }
    
    // Set delay based on priority
    const delay = priority === 'instant' ? 10 : priority === 'high' ? 50 : 100;
    
    this.batchTimers.set(targetLanguage, setTimeout(() => {
      this.processBatch(targetLanguage);
    }, delay));
  }

  private async processBatch(targetLanguage: string): Promise<void> {
    if (this.isProcessing.get(targetLanguage)) {
      return;
    }
    
    const textsSet = this.batchQueue.get(targetLanguage);
    if (!textsSet || textsSet.size === 0) {
      return;
    }
    
    this.isProcessing.set(targetLanguage, true);
    const texts = Array.from(textsSet);
    this.batchQueue.delete(targetLanguage);
    this.batchTimers.delete(targetLanguage);
    
    console.log(`[Stable Translation] Processing batch of ${texts.length} texts for ${targetLanguage}`);
    
    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          targetLanguage,
          priority: 'instant'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.translations && Array.isArray(data.translations)) {
          data.translations.forEach((translation: any, index: number) => {
            const originalText = texts[index];
            const translatedText = translation.translatedText || originalText;
            
            // Store in persistent cache
            this.cache.set(
              originalText,
              targetLanguage,
              translatedText,
              translation.detectedSourceLanguage || 'EN',
              'instant'
            );
            
            // Resolve all pending callbacks for this text
            const key = `${originalText}|||${targetLanguage}`;
            const pending = this.pendingRequests.get(key);
            if (pending) {
              pending.callbacks.forEach(callback => callback(translatedText));
              this.pendingRequests.delete(key);
            }
          });
        }
      } else {
        throw new Error(`Translation API failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[Stable Translation] Batch error:', error);
      
      // Fallback to original texts
      texts.forEach(text => {
        const key = `${text}|||${targetLanguage}`;
        const pending = this.pendingRequests.get(key);
        if (pending) {
          pending.callbacks.forEach(callback => callback(text));
          this.pendingRequests.delete(key);
        }
      });
    }
    
    this.isProcessing.set(targetLanguage, false);
    
    // Process any new requests that came in
    if (this.batchQueue.has(targetLanguage) && this.batchQueue.get(targetLanguage)!.size > 0) {
      setTimeout(() => this.processBatch(targetLanguage), 10);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

// Global translation manager
const translationManager = StableTranslationManager.getInstance();

// Main translation hook that prevents loss
export function useStableTranslation(
  text: string,
  priority: 'instant' | 'high' | 'normal' = 'instant'
): string {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const lastLanguageRef = useRef(currentLanguage);
  const lastTextRef = useRef(text);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Reset if text or language changed
    if (lastLanguageRef.current !== currentLanguage || lastTextRef.current !== text) {
      setTranslatedText(text);
      lastLanguageRef.current = currentLanguage;
      lastTextRef.current = text;
    }

    if (!text || currentLanguage === 'EN') {
      setTranslatedText(text);
      return;
    }

    // Get translation
    translationManager.translateText(text, currentLanguage, priority)
      .then(translated => {
        if (isMountedRef.current) {
          setTranslatedText(translated);
        }
      })
      .catch(error => {
        console.error('[Stable Translation] Error:', error);
        if (isMountedRef.current) {
          setTranslatedText(text);
        }
      });
  }, [text, currentLanguage, priority]);

  return translatedText;
}

// Batch translation hook for multiple texts
export function useStableBatchTranslation(
  texts: string[],
  priority: 'instant' | 'high' | 'normal' = 'instant'
): { translations: Record<string, string>; isLoading: boolean } {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const lastLanguageRef = useRef(currentLanguage);
  const lastTextsRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const textsChanged = JSON.stringify(texts) !== JSON.stringify(lastTextsRef.current);
    const languageChanged = lastLanguageRef.current !== currentLanguage;
    
    if (textsChanged || languageChanged) {
      setIsLoading(true);
      lastLanguageRef.current = currentLanguage;
      lastTextsRef.current = [...texts];
    }

    if (!texts.length || currentLanguage === 'EN') {
      const englishTranslations: Record<string, string> = {};
      texts.forEach(text => {
        englishTranslations[text] = text;
      });
      setTranslations(englishTranslations);
      setIsLoading(false);
      return;
    }

    let completedCount = 0;
    const newTranslations: Record<string, string> = {};

    const processTranslations = async () => {
      const promises = texts.map(async (text) => {
        try {
          const translated = await translationManager.translateText(text, currentLanguage, priority);
          newTranslations[text] = translated;
        } catch (error) {
          console.error('[Stable Translation] Error translating:', text, error);
          newTranslations[text] = text;
        }
        
        completedCount++;
        
        // Update state when all are complete
        if (completedCount === texts.length && isMountedRef.current) {
          setTranslations({ ...newTranslations });
          setIsLoading(false);
        }
      });

      await Promise.all(promises);
    };

    processTranslations();
  }, [texts, currentLanguage, priority]);

  return { translations, isLoading };
}

// Simple translation function for components
export const t = (text: string, priority: 'instant' | 'high' | 'normal' = 'instant'): string => {
  return useStableTranslation(text, priority);
};

// Cache management hook
export function useTranslationCacheManager() {
  return {
    clearCache: useCallback(() => {
      translationManager.clearCache();
    }, []),
    getCacheStats: useCallback(() => {
      return translationManager.getCacheStats();
    }, [])
  };
}