import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Master Translation System - Single Source of Truth
// Consolidates all translation systems into one unified architecture

interface TranslationCacheEntry {
  text: string;
  translatedText: string;
  timestamp: number;
  priority: TranslationPriority;
  language: string;
  hits: number;
  componentId?: string;
}

interface PendingRequest {
  text: string;
  language: string;
  priority: TranslationPriority;
  componentId: string;
  callback: (translated: string) => void;
}

interface BatchRequest {
  texts: string[];
  language: string;
  priority: TranslationPriority;
  componentIds: string[];
  callbacks: ((translations: Record<string, string>) => void)[];
}

type TranslationPriority = 'instant' | 'high' | 'normal' | 'low';

class MasterTranslationManager {
  private static instance: MasterTranslationManager;
  private cache = new Map<string, TranslationCacheEntry>();
  private pendingRequests = new Map<string, PendingRequest[]>();
  private batchQueue = new Map<string, BatchRequest>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private activeComponents = new Set<string>();
  private isProcessing = new Map<string, boolean>();
  
  // Cache configuration
  private readonly CACHE_DURATIONS = {
    instant: 4 * 60 * 60 * 1000, // 4 hours for critical UI
    high: 2 * 60 * 60 * 1000,    // 2 hours for important content
    normal: 60 * 60 * 1000,      // 1 hour for regular content
    low: 30 * 60 * 1000          // 30 minutes for non-critical
  };

  private readonly BATCH_DELAYS = {
    instant: 50,   // 50ms for instant translations
    high: 100,     // 100ms for high priority
    normal: 200,   // 200ms for normal priority
    low: 500       // 500ms for low priority
  };

  private readonly BATCH_SIZES = {
    instant: 10,   // Smaller batches for instant processing
    high: 15,      // Medium batches for balance
    normal: 20,    // Larger batches for efficiency
    low: 25        // Largest batches for low priority
  };

  private constructor() {
    this.loadFromStorage();
    this.setupCleanupInterval();
    this.setupStoragePersistence();
  }

  static getInstance(): MasterTranslationManager {
    if (!MasterTranslationManager.instance) {
      MasterTranslationManager.instance = new MasterTranslationManager();
    }
    return MasterTranslationManager.instance;
  }

  // Component registration for lifecycle management
  registerComponent(componentId: string): void {
    this.activeComponents.add(componentId);
  }

  unregisterComponent(componentId: string): void {
    this.activeComponents.delete(componentId);
    this.cleanupComponentCache(componentId);
  }

  // Main translation method - unified interface
  async translateText(
    text: string,
    targetLanguage: string,
    priority: TranslationPriority = 'normal',
    componentId: string,
    callback: (translated: string) => void
  ): Promise<void> {
    if (!text?.trim()) {
      callback(text);
      return;
    }

    // Return original text for English, but don't block processing for other languages
    if (targetLanguage === 'EN') {
      callback(text);
      return;
    }

    const cacheKey = this.getCacheKey(text, targetLanguage);
    const cached = this.getCachedTranslation(cacheKey);
    
    if (cached) {
      this.updateCacheStats(cacheKey);
      callback(cached.translatedText);
      return;
    }

    // Add to pending requests
    this.addToPendingQueue(text, targetLanguage, priority, componentId, callback);
  }

  // Batch translation for multiple texts
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    priority: TranslationPriority = 'normal',
    componentId: string,
    callback: (translations: Record<string, string>) => void
  ): Promise<void> {
    if (targetLanguage === 'EN') {
      const englishTranslations: Record<string, string> = {};
      texts.forEach(text => englishTranslations[text] = text);
      callback(englishTranslations);
      return;
    }

    const translations: Record<string, string> = {};
    const needTranslation: string[] = [];
    
    // Check cache for all texts
    texts.forEach(text => {
      if (!text?.trim()) {
        translations[text] = text;
        return;
      }
      
      const cacheKey = this.getCacheKey(text, targetLanguage);
      const cached = this.getCachedTranslation(cacheKey);
      
      if (cached) {
        this.updateCacheStats(cacheKey);
        translations[text] = cached.translatedText;
      } else {
        needTranslation.push(text);
      }
    });

    // If all cached, return immediately
    if (needTranslation.length === 0) {
      callback(translations);
      return;
    }

    // Add to batch queue
    this.addToBatchQueue(needTranslation, targetLanguage, priority, componentId, (batchTranslations) => {
      callback({ ...translations, ...batchTranslations });
    });
  }

  private getCacheKey(text: string, language: string): string {
    return `${text}:${language}`;
  }

  private getCachedTranslation(cacheKey: string): TranslationCacheEntry | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const maxAge = this.CACHE_DURATIONS[cached.priority];
    
    if (now - cached.timestamp > maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private updateCacheStats(cacheKey: string): void {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.hits++;
      this.cache.set(cacheKey, cached);
    }
  }

  private addToPendingQueue(
    text: string,
    language: string,
    priority: TranslationPriority,
    componentId: string,
    callback: (translated: string) => void
  ): void {
    const queueKey = `${language}:${priority}`;
    
    if (!this.pendingRequests.has(queueKey)) {
      this.pendingRequests.set(queueKey, []);
    }

    this.pendingRequests.get(queueKey)!.push({
      text,
      language,
      priority,
      componentId,
      callback
    });

    this.processPendingQueue(queueKey, priority);
  }

  private addToBatchQueue(
    texts: string[],
    language: string,
    priority: TranslationPriority,
    componentId: string,
    callback: (translations: Record<string, string>) => void
  ): void {
    const queueKey = `batch:${language}:${priority}`;
    
    if (!this.batchQueue.has(queueKey)) {
      this.batchQueue.set(queueKey, {
        texts: [],
        language,
        priority,
        componentIds: [],
        callbacks: []
      });
    }

    const batch = this.batchQueue.get(queueKey)!;
    batch.texts.push(...texts);
    batch.componentIds.push(componentId);
    batch.callbacks.push(callback);

    this.scheduleBatchProcessing(queueKey, priority);
  }

  private processPendingQueue(queueKey: string, priority: TranslationPriority): void {
    if (this.isProcessing.get(queueKey)) return;

    const delay = this.BATCH_DELAYS[priority];
    setTimeout(() => {
      this.processPendingBatch(queueKey);
    }, delay);
  }

  private scheduleBatchProcessing(queueKey: string, priority: TranslationPriority): void {
    // Clear existing timer
    const existingTimer = this.batchTimers.get(queueKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const delay = this.BATCH_DELAYS[priority];
    const timer = setTimeout(() => {
      this.processBatch(queueKey);
    }, delay);

    this.batchTimers.set(queueKey, timer);
  }

  private async processPendingBatch(queueKey: string): Promise<void> {
    const requests = this.pendingRequests.get(queueKey);
    if (!requests || requests.length === 0) return;

    this.isProcessing.set(queueKey, true);
    
    try {
      const texts = requests.map(req => req.text);
      const language = requests[0].language;
      const priority = requests[0].priority;

      const translations = await this.performBatchTranslation(texts, language, priority);
      
      // Update cache and notify callbacks
      requests.forEach(request => {
        const translated = translations[request.text] || request.text;
        
        this.updateCache(request.text, translated, language, priority, request.componentId);
        request.callback(translated);
      });

      this.pendingRequests.delete(queueKey);
    } catch (error) {
      console.error('[Master Translation] Batch processing failed:', error);
      
      // Fallback to original text
      requests.forEach(request => {
        request.callback(request.text);
      });
    } finally {
      this.isProcessing.set(queueKey, false);
    }
  }

  private async processBatch(queueKey: string): Promise<void> {
    const batch = this.batchQueue.get(queueKey);
    if (!batch || batch.texts.length === 0) return;

    try {
      const uniqueTexts = Array.from(new Set(batch.texts));
      const translations = await this.performBatchTranslation(uniqueTexts, batch.language, batch.priority);
      
      // Update cache
      uniqueTexts.forEach(text => {
        const translated = translations[text] || text;
        this.updateCache(text, translated, batch.language, batch.priority);
      });

      // Notify all callbacks
      batch.callbacks.forEach(callback => {
        const batchTranslations: Record<string, string> = {};
        batch.texts.forEach(text => {
          batchTranslations[text] = translations[text] || text;
        });
        callback(batchTranslations);
      });

      this.batchQueue.delete(queueKey);
      this.batchTimers.delete(queueKey);
    } catch (error) {
      console.error('[Master Translation] Batch processing failed:', error);
      
      // Fallback to original texts
      batch.callbacks.forEach(callback => {
        const fallbackTranslations: Record<string, string> = {};
        batch.texts.forEach(text => {
          fallbackTranslations[text] = text;
        });
        callback(fallbackTranslations);
      });
    }
  }

  private async performBatchTranslation(
    texts: string[],
    targetLanguage: string,
    priority: TranslationPriority
  ): Promise<Record<string, string>> {
    const batchSize = this.BATCH_SIZES[priority];
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const results: Record<string, string> = {};
    
    // Process batches in parallel for better performance
    await Promise.all(
      batches.map(async batch => {
        try {
          const response = await fetch('/api/translate/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: batch,
              targetLanguage,
              priority
            })
          });

          if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
          }

          const data = await response.json();
          data.translations?.forEach((translation: any) => {
            results[translation.originalText] = translation.translatedText;
          });
        } catch (error) {
          console.error('[Master Translation] API call failed:', error);
          // Fallback to original text
          batch.forEach(text => {
            results[text] = text;
          });
        }
      })
    );

    return results;
  }

  private updateCache(
    originalText: string,
    translatedText: string,
    language: string,
    priority: TranslationPriority,
    componentId?: string
  ): void {
    const cacheKey = this.getCacheKey(originalText, language);
    
    this.cache.set(cacheKey, {
      text: originalText,
      translatedText,
      timestamp: Date.now(),
      priority,
      language,
      hits: 1,
      componentId
    });

    this.scheduleStorageSave();
  }

  private cleanupComponentCache(componentId: string): void {
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.componentId === componentId) {
        this.cache.delete(key);
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('masterTranslationCache');
      if (stored) {
        const data = JSON.parse(stored);
        const entries = data.entries || [];
        
        entries.forEach(([key, entry]: [string, TranslationCacheEntry]) => {
          this.cache.set(key, entry);
        });
        
        console.log(`[Master Translation] Loaded ${this.cache.size} cached translations`);
      }
    } catch (error) {
      console.warn('[Master Translation] Failed to load cache from storage:', error);
    }
  }

  private saveTimer: NodeJS.Timeout | null = null;

  private scheduleStorageSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, 2000); // Save after 2 seconds of inactivity
  }

  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem('masterTranslationCache', JSON.stringify(data));
    } catch (error) {
      console.warn('[Master Translation] Failed to save cache to storage:', error);
    }
  }

  private setupStoragePersistence(): void {
    // Save cache periodically
    setInterval(() => {
      this.saveToStorage();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.performCleanup();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private performCleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      const maxAge = this.CACHE_DURATIONS[entry.priority];
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[Master Translation] Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Analytics and monitoring
  getCacheStats(): {
    totalEntries: number;
    hitsByPriority: Record<TranslationPriority, number>;
    languages: string[];
    oldestEntry: number;
    newestEntry: number;
  } {
    const stats = {
      totalEntries: this.cache.size,
      hitsByPriority: { instant: 0, high: 0, normal: 0, low: 0 } as Record<TranslationPriority, number>,
      languages: new Set<string>(),
      oldestEntry: Date.now(),
      newestEntry: 0
    };

    Array.from(this.cache.values()).forEach(entry => {
      stats.hitsByPriority[entry.priority as TranslationPriority] += entry.hits;
      stats.languages.add(entry.language);
      stats.oldestEntry = Math.min(stats.oldestEntry, entry.timestamp);
      stats.newestEntry = Math.max(stats.newestEntry, entry.timestamp);
    });

    return {
      ...stats,
      languages: Array.from(stats.languages)
    };
  }

  // Clear language-specific cache when language changes
  clearLanguageCache(language: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.language === language) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Master Translation] Cleared ${keysToDelete.length} cache entries for language ${language}`);
      this.saveToStorage();
    }
  }

  // Clear all caches - useful for debugging
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('masterTranslationCache');
    console.log('[Master Translation] Cache cleared');
  }
}

// Singleton instance
const masterTranslationManager = MasterTranslationManager.getInstance();

// Main hook for single text translation
export function useMasterTranslation(
  text: string,
  priority: TranslationPriority = 'normal'
): { translatedText: string; isLoading: boolean } {
  const { currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const componentIdRef = useRef(`single_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const componentId = componentIdRef.current;
    masterTranslationManager.registerComponent(componentId);

    return () => {
      masterTranslationManager.unregisterComponent(componentId);
    };
  }, []);

  useEffect(() => {
    if (!currentLanguage || currentLanguage === 'EN') {
      setTranslatedText(text);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    masterTranslationManager.translateText(
      text,
      currentLanguage,
      priority,
      componentIdRef.current,
      (translated) => {
        setTranslatedText(translated);
        setIsLoading(false);
      }
    );
  }, [text, currentLanguage, priority]);

  return { translatedText, isLoading };
}

// Main hook for batch translation - replaces all other batch translation hooks
export function useMasterBatchTranslation(
  texts: string[],
  priority: TranslationPriority = 'normal'
): { translations: string[]; isLoading: boolean } {
  const { currentLanguage } = useLanguage();
  const [translations, setTranslations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const componentIdRef = useRef(`batch_${Math.random().toString(36).substr(2, 9)}`);
  const stableTexts = useMemo(() => texts, [texts.join('|')]);

  useEffect(() => {
    const componentId = componentIdRef.current;
    masterTranslationManager.registerComponent(componentId);

    return () => {
      masterTranslationManager.unregisterComponent(componentId);
    };
  }, []);

  useEffect(() => {
    console.log(`[MasterBatchTranslation] Language changed to: ${currentLanguage}, component: ${componentIdRef.current}`);
    
    // Always reset translations when language changes to force refresh
    setTranslations(stableTexts);
    
    if (!currentLanguage || currentLanguage === 'EN') {
      console.log(`[MasterBatchTranslation] Using English text for component: ${componentIdRef.current}`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(`[MasterBatchTranslation] Starting translation for ${stableTexts.length} texts to ${currentLanguage}`);
    
    // Clear any cached translations for this component when language changes
    const componentId = componentIdRef.current;
    
    masterTranslationManager.translateBatch(
      stableTexts,
      currentLanguage,
      priority,
      componentId,
      (batchTranslations) => {
        // Convert object to ordered array matching input texts
        const orderedTranslations = stableTexts.map(text => 
          batchTranslations[text] || text
        );
        console.log(`[MasterBatchTranslation] Received translations for component: ${componentId}`, orderedTranslations.slice(0, 3));
        setTranslations(orderedTranslations);
        setIsLoading(false);
      }
    );
  }, [stableTexts, currentLanguage, priority]);

  return { translations, isLoading };
}

// Utility hooks for specific use cases
export function useInstantTranslation(texts: string[]) {
  return useMasterBatchTranslation(texts, 'instant');
}

export function useHighPriorityTranslation(texts: string[]) {
  return useMasterBatchTranslation(texts, 'high');
}

export function useNormalTranslation(texts: string[]) {
  return useMasterBatchTranslation(texts, 'normal');
}

export function useLowPriorityTranslation(texts: string[]) {
  return useMasterBatchTranslation(texts, 'low');
}

// Analytics hook for monitoring
export function useTranslationStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(masterTranslationManager.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Debug utilities
export function clearTranslationCache() {
  masterTranslationManager.clearCache();
}

export { type TranslationPriority };