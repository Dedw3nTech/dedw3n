import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UnifiedTranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    priority: 'instant' | 'high' | 'normal';
  };
}

interface TranslationRequest {
  text: string;
  priority: 'instant' | 'high' | 'normal';
  callback: (translatedText: string) => void;
}

class UnifiedTranslationManager {
  private cache: UnifiedTranslationCache = {};
  private pendingRequests = new Map<string, TranslationRequest[]>();
  private batchQueue: Set<string> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  private currentLanguage = 'EN';
  private isProcessing = false;

  // Cache durations based on priority
  private CACHE_DURATIONS = {
    instant: 60 * 60 * 1000, // 1 hour for critical UI elements
    high: 30 * 60 * 1000,    // 30 minutes for important content
    normal: 15 * 60 * 1000   // 15 minutes for general content
  };

  private getCacheKey(text: string, language: string): string {
    return `${text}:${language}`;
  }

  private getCachedTranslation(text: string, language: string): string | null {
    const key = this.getCacheKey(text, language);
    const cached = this.cache[key];
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    const maxAge = this.CACHE_DURATIONS[cached.priority];
    
    if (age > maxAge) {
      delete this.cache[key];
      return null;
    }
    
    return cached.translatedText;
  }

  private setCachedTranslation(
    text: string, 
    language: string, 
    translatedText: string, 
    priority: 'instant' | 'high' | 'normal'
  ): void {
    const key = this.getCacheKey(text, language);
    this.cache[key] = {
      translatedText,
      timestamp: Date.now(),
      priority
    };
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.batchQueue.size === 0) return;

    this.isProcessing = true;
    const textsToTranslate = Array.from(this.batchQueue);
    this.batchQueue.clear();

    console.log(`[Unified Translation] Processing batch of ${textsToTranslate.length} texts for ${this.currentLanguage}`);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage: this.currentLanguage,
          priority: 'instant'
        })
      });

      if (!response.ok) {
        throw new Error(`Batch translation failed: ${response.status}`);
      }

      const data = await response.json();
      const totalTime = Date.now() - startTime;

      // Process results and call callbacks
      data.translations.forEach((translation: any, index: number) => {
        const originalText = textsToTranslate[index];
        const translatedText = translation.translatedText || originalText;
        const key = this.getCacheKey(originalText, this.currentLanguage);
        
        // Cache the result
        const requests = this.pendingRequests.get(originalText) || [];
        const priority = requests.length > 0 ? requests[0].priority : 'normal';
        this.setCachedTranslation(originalText, this.currentLanguage, translatedText, priority);
        
        // Call all pending callbacks for this text
        requests.forEach(req => req.callback(translatedText));
        this.pendingRequests.delete(originalText);
      });

      console.log(`[Unified Translation] Batch completed in ${totalTime}ms - ${textsToTranslate.length} texts translated instantly`);
    } catch (error) {
      console.warn('Unified translation batch error:', error);
      
      // Fallback to original texts for failed requests
      textsToTranslate.forEach(text => {
        const requests = this.pendingRequests.get(text) || [];
        requests.forEach(req => req.callback(text));
        this.pendingRequests.delete(text);
      });
    }

    this.isProcessing = false;

    // Process any new requests that came in while we were processing
    if (this.batchQueue.size > 0) {
      this.scheduleBatch();
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Extremely fast batching for instant performance
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, 10); // Only 10ms delay for instant batching
  }

  public translateText(
    text: string, 
    language: string, 
    priority: 'instant' | 'high' | 'normal' = 'normal',
    callback: (translatedText: string) => void
  ): void {
    if (language === 'EN') {
      callback(text);
      return;
    }

    this.currentLanguage = language;

    // Check cache first for instant response
    const cached = this.getCachedTranslation(text, language);
    if (cached) {
      callback(cached);
      return;
    }

    // Add to pending requests
    if (!this.pendingRequests.has(text)) {
      this.pendingRequests.set(text, []);
    }
    this.pendingRequests.get(text)!.push({ text, priority, callback });

    // Add to batch queue
    this.batchQueue.add(text);

    // Schedule batch processing
    this.scheduleBatch();
  }

  public clearCache(): void {
    this.cache = {};
  }

  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: Object.keys(this.cache).length,
      hitRate: 0 // Will be calculated based on usage
    };
  }
}

// Global translation manager instance
const translationManager = new UnifiedTranslationManager();

export function useUnifiedTranslation(
  text: string, 
  priority: 'instant' | 'high' | 'normal' = 'normal'
): string {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const lastLanguageRef = useRef(currentLanguage);
  const lastTextRef = useRef(text);

  useEffect(() => {
    // Reset to original text if language or text changed
    if (lastLanguageRef.current !== currentLanguage || lastTextRef.current !== text) {
      setTranslatedText(text);
      lastLanguageRef.current = currentLanguage;
      lastTextRef.current = text;
    }

    translationManager.translateText(
      text,
      currentLanguage,
      priority,
      (translated) => {
        setTranslatedText(translated);
      }
    );
  }, [text, currentLanguage, priority]);

  return translatedText;
}

// Simplified batch translation hook that returns translations and loading state
export function useUnifiedBatchTranslation(
  texts: string[], 
  priority: 'instant' | 'high' | 'normal' = 'instant'
): { translations: Record<string, string>; isLoading: boolean } {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const lastLanguageRef = useRef(currentLanguage);

  useEffect(() => {
    // Skip translation if language is English or not set
    if (!currentLanguage || currentLanguage === 'EN') {
      const englishTranslations: Record<string, string> = {};
      texts.forEach(text => {
        englishTranslations[text] = text;
      });
      setTranslations(englishTranslations);
      setIsLoading(false);
      return;
    }

    // Reset if language changed
    if (lastLanguageRef.current !== currentLanguage) {
      setTranslations({});
      setIsLoading(true);
      lastLanguageRef.current = currentLanguage;
    }

    let completedCount = 0;
    const newTranslations: Record<string, string> = {};

    texts.forEach((text) => {
      translationManager.translateText(
        text,
        currentLanguage,
        priority,
        (translated) => {
          newTranslations[text] = translated;
          completedCount++;
          
          // Update state when all translations are complete
          if (completedCount === texts.length) {
            setTranslations({ ...newTranslations });
            setIsLoading(false);
          }
        }
      );
    });
  }, [texts, currentLanguage, priority]);

  return { translations, isLoading };
}

// Hook for clearing cache when needed
export function useTranslationCache() {
  return {
    clearCache: useCallback(() => {
      translationManager.clearCache();
    }, []),
    getCacheStats: useCallback(() => {
      return translationManager.getCacheStats();
    }, [])
  };
}