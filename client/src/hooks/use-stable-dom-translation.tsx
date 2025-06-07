import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StableDOMTranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
    componentId: string;
    priority: 'instant' | 'high' | 'normal';
  };
}

interface DOMTranslationRequest {
  text: string;
  componentId: string;
  priority: 'instant' | 'high' | 'normal';
  callback: (translatedText: string) => void;
}

class StableDOMTranslationManager {
  private static instance: StableDOMTranslationManager;
  private cache: StableDOMTranslationCache = {};
  private pendingRequests = new Map<string, DOMTranslationRequest[]>();
  private batchQueue = new Map<string, Set<string>>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private isProcessing = new Map<string, boolean>();
  private componentStates = new Map<string, any>();

  // Cache durations based on priority
  private CACHE_DURATIONS = {
    instant: 2 * 60 * 60 * 1000, // 2 hours for critical UI elements
    high: 60 * 60 * 1000,        // 1 hour for important content
    normal: 30 * 60 * 1000       // 30 minutes for general content
  };

  private constructor() {
    this.loadFromStorage();
    this.setupPeriodicCleanup();
  }

  static getInstance(): StableDOMTranslationManager {
    if (!StableDOMTranslationManager.instance) {
      StableDOMTranslationManager.instance = new StableDOMTranslationManager();
    }
    return StableDOMTranslationManager.instance;
  }

  private getCacheKey(text: string, targetLanguage: string, componentId: string): string {
    return `${componentId}:${text}:${targetLanguage}`;
  }

  public getCachedTranslation(text: string, targetLanguage: string, componentId: string): string | null {
    // First try exact component match
    const exactKey = this.getCacheKey(text, targetLanguage, componentId);
    const exactMatch = this.cache[exactKey];
    
    if (exactMatch && this.isCacheValid(exactMatch, exactKey)) {
      return exactMatch.translatedText;
    }
    
    // Fallback: search for any cached translation of this text in the target language
    const fallbackKey = Object.keys(this.cache).find(key => {
      const entry = this.cache[key];
      return key.includes(`:${text}:${targetLanguage}`) && this.isCacheValid(entry, key);
    });
    
    if (fallbackKey) {
      return this.cache[fallbackKey].translatedText;
    }
    
    return null;
  }

  private isCacheValid(cached: any, cacheKey?: string): boolean {
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    const maxAge = this.CACHE_DURATIONS[cached.priority as keyof typeof this.CACHE_DURATIONS] || this.CACHE_DURATIONS.normal;
    
    if (age > maxAge) {
      if (cacheKey && this.cache[cacheKey]) {
        delete this.cache[cacheKey];
      }
      return false;
    }
    
    return true;
  }

  private setCachedTranslation(
    text: string,
    targetLanguage: string,
    componentId: string,
    translatedText: string,
    priority: 'instant' | 'high' | 'normal'
  ): void {
    const key = this.getCacheKey(text, targetLanguage, componentId);
    this.cache[key] = {
      translatedText,
      timestamp: Date.now(),
      componentId,
      priority
    };
    this.scheduleSave();
  }

  private async processBatch(targetLanguage: string): Promise<void> {
    const queue = this.batchQueue.get(targetLanguage);
    if (!queue || queue.size === 0 || this.isProcessing.get(targetLanguage)) {
      return;
    }

    this.isProcessing.set(targetLanguage, true);
    
    const textsToTranslate = Array.from(queue);
    queue.clear();

    const timer = this.batchTimers.get(targetLanguage);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(targetLanguage);
    }

    try {
      console.log(`[DOM Translation] Processing ${textsToTranslate.length} texts for ${targetLanguage}`);

      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage,
          priority: 'instant'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      data.translations.forEach((translation: any, index: number) => {
        const originalText = textsToTranslate[index];
        const translatedText = translation.translatedText || originalText;
        
        // Find all pending requests for this text
        const requests = this.pendingRequests.get(originalText) || [];
        
        requests.forEach(req => {
          // Cache the result with component-specific key
          this.setCachedTranslation(
            originalText,
            targetLanguage,
            req.componentId,
            translatedText,
            req.priority
          );
          
          // Call the callback
          req.callback(translatedText);
        });
        
        this.pendingRequests.delete(originalText);
      });

    } catch (error) {
      console.warn('[DOM Translation] Batch error:', error);
      
      // Fallback to original texts for failed requests
      textsToTranslate.forEach(text => {
        const requests = this.pendingRequests.get(text) || [];
        requests.forEach(req => req.callback(text));
        this.pendingRequests.delete(text);
      });
    }

    this.isProcessing.set(targetLanguage, false);

    // Process any new requests that came in while we were processing
    const newQueue = this.batchQueue.get(targetLanguage);
    if (newQueue && newQueue.size > 0) {
      this.scheduleBatch(targetLanguage);
    }
  }

  private scheduleBatch(targetLanguage: string): void {
    const existingTimer = this.batchTimers.get(targetLanguage);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.processBatch(targetLanguage);
    }, 50); // Stable delay to prevent DOM conflicts

    this.batchTimers.set(targetLanguage, timer);
  }

  public translateText(
    text: string,
    targetLanguage: string,
    componentId: string,
    priority: 'instant' | 'high' | 'normal' = 'instant',
    callback: (translatedText: string) => void
  ): void {
    if (targetLanguage === 'EN') {
      callback(text);
      return;
    }

    // Check cache first for instant response
    const cached = this.getCachedTranslation(text, targetLanguage, componentId);
    if (cached) {
      callback(cached);
      return;
    }

    // Add to pending requests
    if (!this.pendingRequests.has(text)) {
      this.pendingRequests.set(text, []);
    }
    this.pendingRequests.get(text)!.push({ text, componentId, priority, callback });

    // Add to batch queue for the specific language
    if (!this.batchQueue.has(targetLanguage)) {
      this.batchQueue.set(targetLanguage, new Set());
    }
    this.batchQueue.get(targetLanguage)!.add(text);

    // Schedule batch processing
    this.scheduleBatch(targetLanguage);
  }

  public registerComponent(componentId: string, state: any): void {
    this.componentStates.set(componentId, state);
  }

  public unregisterComponent(componentId: string): void {
    this.componentStates.delete(componentId);
    
    // Clean up cache entries for this component
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].componentId === componentId) {
        delete this.cache[key];
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('domTranslationCache');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = parsed.cache || {};
      }
    } catch (error) {
      console.warn('[DOM Translation] Failed to load from storage:', error);
    }
  }

  private saveTimer: NodeJS.Timeout | null = null;

  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, 1000);
  }

  private saveToStorage(): void {
    try {
      const toSave = {
        cache: this.cache,
        timestamp: Date.now()
      };
      localStorage.setItem('domTranslationCache', JSON.stringify(toSave));
    } catch (error) {
      console.warn('[DOM Translation] Failed to save to storage:', error);
    }
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private performCleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    Object.keys(this.cache).forEach(key => {
      const entry = this.cache[key];
      const age = now - entry.timestamp;
      const maxAge = this.CACHE_DURATIONS[entry.priority];

      if (age > maxAge) {
        delete this.cache[key];
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[DOM Translation] Cleaned ${cleaned} expired cache entries`);
      this.scheduleSave();
    }
  }

  public clearCache(): void {
    this.cache = {};
    this.scheduleSave();
  }

  public getCacheStats(): { size: number; componentCount: number } {
    return {
      size: Object.keys(this.cache).length,
      componentCount: this.componentStates.size
    };
  }
}

// Hook for stable DOM-safe translation that preserves component integrity
export function useStableDOMTranslation(
  text: string,
  priority: 'instant' | 'high' | 'normal' = 'instant'
): string {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const componentIdRef = useRef(`dom_${Math.random().toString(36).substr(2, 9)}`);
  const managerRef = useRef(StableDOMTranslationManager.getInstance());
  const lastLanguageRef = useRef(currentLanguage);
  const lastTextRef = useRef(text);

  // Register component on mount
  useEffect(() => {
    const componentId = componentIdRef.current;
    managerRef.current.registerComponent(componentId, { text, priority });

    return () => {
      managerRef.current.unregisterComponent(componentId);
    };
  }, []);

  // Stable translation effect that prevents DOM conflicts
  useEffect(() => {
    // Reset to original text if language or text changed
    if (lastLanguageRef.current !== currentLanguage || lastTextRef.current !== text) {
      setTranslatedText(text);
      lastLanguageRef.current = currentLanguage;
      lastTextRef.current = text;
    }

    const componentId = componentIdRef.current;
    
    managerRef.current.translateText(
      text,
      currentLanguage,
      componentId,
      priority,
      (translated) => {
        // Use functional update to prevent race conditions
        setTranslatedText(prev => {
          if (prev !== translated) {
            return translated;
          }
          return prev;
        });
      }
    );
  }, [text, currentLanguage, priority]);

  return translatedText;
}

// Hook for batch translation that preserves component links and interactivity
export function useStableDOMBatchTranslation(
  texts: string[],
  priority: 'instant' | 'high' | 'normal' = 'instant'
): { translations: Record<string, string>; isLoading: boolean } {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const componentIdRef = useRef(`batch_${Math.random().toString(36).substr(2, 9)}`);
  const managerRef = useRef(StableDOMTranslationManager.getInstance());
  const lastLanguageRef = useRef(currentLanguage);
  const textsRef = useRef(texts);

  // Memoize texts array to prevent unnecessary re-renders
  const stableTexts = useMemo(() => texts, [texts.join(',')]);

  // Register component on mount
  useEffect(() => {
    const componentId = componentIdRef.current;
    managerRef.current.registerComponent(componentId, { texts: stableTexts, priority });

    return () => {
      managerRef.current.unregisterComponent(componentId);
    };
  }, []);

  useEffect(() => {
    // Skip translation if language is English or not set
    if (!currentLanguage || currentLanguage === 'EN') {
      const englishTranslations: Record<string, string> = {};
      stableTexts.forEach(text => {
        englishTranslations[text] = text;
      });
      setTranslations(englishTranslations);
      setIsLoading(false);
      return;
    }

    // Reset if language changed, but provide immediate fallbacks for critical UI elements
    if (lastLanguageRef.current !== currentLanguage) {
      // Initialize with cached translations or original texts as immediate fallbacks
      const fallbackTranslations: Record<string, string> = {};
      const componentId = componentIdRef.current;
      
      stableTexts.forEach(text => {
        // Check for cached translation first
        const cached = managerRef.current.getCachedTranslation(text, currentLanguage, componentId);
        fallbackTranslations[text] = cached || text;
      });
      
      setTranslations(fallbackTranslations);
      setIsLoading(true);
      lastLanguageRef.current = currentLanguage;
    }

    let completedCount = 0;
    const newTranslations: Record<string, string> = {};
    const componentId = componentIdRef.current;

    stableTexts.forEach((text) => {
      managerRef.current.translateText(
        text,
        currentLanguage,
        componentId,
        priority,
        (translated) => {
          newTranslations[text] = translated;
          completedCount++;
          
          // Update state when all translations are complete
          if (completedCount === stableTexts.length) {
            setTranslations(prevTranslations => {
              // Only update if there are actual changes
              const hasChanges = Object.keys(newTranslations).some(
                key => prevTranslations[key] !== newTranslations[key]
              );
              
              if (hasChanges) {
                return { ...newTranslations };
              }
              return prevTranslations;
            });
            setIsLoading(false);
          }
        }
      );
    });
  }, [stableTexts, currentLanguage, priority]);

  return { translations, isLoading };
}

// Hook for managing DOM translation cache
export function useStableDOMTranslationCache() {
  const managerRef = useRef(StableDOMTranslationManager.getInstance());

  return {
    clearCache: useCallback(() => {
      managerRef.current.clearCache();
    }, []),
    getCacheStats: useCallback(() => {
      return managerRef.current.getCacheStats();
    }, [])
  };
}