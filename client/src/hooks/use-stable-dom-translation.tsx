import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StableTranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    isStable: boolean;
  };
}

class StableDOMTranslationManager {
  private cache: StableTranslationCache = {};
  private pendingRequests = new Map<string, Array<(text: string) => void>>();
  private processingQueue: Set<string> = new Set();
  private currentLanguage = 'EN';
  private batchTimer: NodeJS.Timeout | null = null;

  private getCacheKey(text: string, language: string): string {
    return `${text}:${language}`;
  }

  private async processBatch(): Promise<void> {
    if (this.processingQueue.size === 0) return;

    const textsToTranslate = Array.from(this.processingQueue);
    this.processingQueue.clear();

    // Skip if English or no language
    if (!this.currentLanguage || this.currentLanguage === 'EN') {
      textsToTranslate.forEach(text => {
        const callbacks = this.pendingRequests.get(text) || [];
        callbacks.forEach(callback => callback(text));
        this.pendingRequests.delete(text);
      });
      return;
    }

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage: this.currentLanguage,
        }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translations = data.translations || [];

      translations.forEach((translation: any, index: number) => {
        const originalText = textsToTranslate[index];
        const translatedText = translation.translatedText || originalText;
        const key = this.getCacheKey(originalText, this.currentLanguage);
        
        // Cache with stability flag
        this.cache[key] = {
          translatedText,
          timestamp: Date.now(),
          isStable: true
        };
        
        // Execute callbacks
        const callbacks = this.pendingRequests.get(originalText) || [];
        callbacks.forEach(callback => callback(translatedText));
        this.pendingRequests.delete(originalText);
      });

    } catch (error) {
      console.warn('Stable DOM translation error:', error);
      
      // Fallback to original texts
      textsToTranslate.forEach(text => {
        const callbacks = this.pendingRequests.get(text) || [];
        callbacks.forEach(callback => callback(text));
        this.pendingRequests.delete(text);
      });
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, 50); // Slightly longer for stability
  }

  public translateText(text: string, language: string, callback: (translatedText: string) => void): void {
    this.currentLanguage = language;
    
    // Check cache first
    const key = this.getCacheKey(text, language);
    const cached = this.cache[key];
    
    if (cached && cached.isStable) {
      callback(cached.translatedText);
      return;
    }

    // Skip translation for English
    if (!language || language === 'EN') {
      callback(text);
      return;
    }

    // Add to pending requests
    if (!this.pendingRequests.has(text)) {
      this.pendingRequests.set(text, []);
    }
    this.pendingRequests.get(text)!.push(callback);

    // Add to processing queue
    this.processingQueue.add(text);
    this.scheduleBatch();
  }

  public setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  public clearCache(): void {
    this.cache = {};
  }
}

const stableDOMTranslationManager = new StableDOMTranslationManager();

// Stable DOM Translation Hook - prevents text reversion during re-renders
export function useStableDOMTranslation(
  texts: string[]
): Record<string, string> {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const stableTextsRef = useRef<string[]>([]);
  const lastLanguageRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Initialize with original texts to prevent flickering
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialTranslations: Record<string, string> = {};
      texts.forEach(text => {
        initialTranslations[text] = text;
      });
      setTranslations(initialTranslations);
      isInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Only process if language changed or new texts added
    const languageChanged = lastLanguageRef.current !== currentLanguage;
    const textsChanged = JSON.stringify(stableTextsRef.current) !== JSON.stringify(texts);

    if (!languageChanged && !textsChanged) return;

    lastLanguageRef.current = currentLanguage;
    stableTextsRef.current = [...texts];

    // Update language in manager
    stableDOMTranslationManager.setLanguage(currentLanguage);

    // For English, return original texts immediately
    if (!currentLanguage || currentLanguage === 'EN') {
      const englishTranslations: Record<string, string> = {};
      texts.forEach(text => {
        englishTranslations[text] = text;
      });
      setTranslations(englishTranslations);
      return;
    }

    // Process translations without resetting existing ones
    const newTranslations: Record<string, string> = { ...translations };
    let pendingCount = 0;

    texts.forEach((text) => {
      pendingCount++;
      stableDOMTranslationManager.translateText(
        text,
        currentLanguage,
        (translatedText) => {
          newTranslations[text] = translatedText;
          pendingCount--;
          
          // Update state immediately for each translation
          setTranslations({ ...newTranslations });
        }
      );
    });

  }, [texts, currentLanguage]);

  return translations;
}

// Enhanced Batch Translation Hook with DOM Stability
export function useStableBatchTranslation(
  texts: string[]
): { translations: Record<string, string>; isLoading: boolean } {
  const stableTranslations = useStableDOMTranslation(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if all translations are complete (simplified logic)
    const hasTranslations = Object.keys(stableTranslations).length > 0;
    setIsLoading(!hasTranslations && texts.length > 0);
  }, [stableTranslations, texts]);

  return {
    translations: stableTranslations,
    isLoading
  };
}