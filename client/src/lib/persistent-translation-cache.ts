// Persistent Translation Cache System
// Ensures translations are never lost and provides instant zero-delay performance

interface CachedTranslation {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  priority: 'instant' | 'high' | 'normal';
  accessCount: number;
  lastAccessed: number;
}

interface PersistentCacheConfig {
  maxSize: number;
  ttl: number;
  persistToStorage: boolean;
  storageKey: string;
}

class PersistentTranslationCache {
  private static instance: PersistentTranslationCache;
  private cache = new Map<string, CachedTranslation>();
  private config: PersistentCacheConfig;
  private saveTimer: NodeJS.Timeout | null = null;
  private isLoaded = false;

  private constructor() {
    this.config = {
      maxSize: 10000,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      persistToStorage: true,
      storageKey: 'dedw3n-translation-cache-v2'
    };
    
    this.loadFromStorage();
    this.setupPeriodicCleanup();
  }

  static getInstance(): PersistentTranslationCache {
    if (!PersistentTranslationCache.instance) {
      PersistentTranslationCache.instance = new PersistentTranslationCache();
    }
    return PersistentTranslationCache.instance;
  }

  private getCacheKey(text: string, targetLanguage: string): string {
    return `${text}|||${targetLanguage}`;
  }

  get(text: string, targetLanguage: string): string | null {
    if (!text || !targetLanguage || targetLanguage === 'EN') {
      return text;
    }

    const key = this.getCacheKey(text, targetLanguage);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.scheduleSave();
      return null;
    }

    // Update access info
    cached.accessCount++;
    cached.lastAccessed = Date.now();

    return cached.translatedText;
  }

  set(
    text: string,
    targetLanguage: string,
    translatedText: string,
    sourceLanguage: string = 'EN',
    priority: 'instant' | 'high' | 'normal' = 'normal'
  ): void {
    if (!text || !targetLanguage || !translatedText) {
      return;
    }

    const key = this.getCacheKey(text, targetLanguage);
    const now = Date.now();

    this.cache.set(key, {
      translatedText,
      sourceLanguage,
      targetLanguage,
      timestamp: now,
      priority,
      accessCount: 1,
      lastAccessed: now
    });

    // Cleanup if cache is getting too large
    if (this.cache.size > this.config.maxSize) {
      this.performCleanup();
    }

    this.scheduleSave();
  }

  has(text: string, targetLanguage: string): boolean {
    return this.get(text, targetLanguage) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.scheduleSave();
  }

  // Clear only for specific language
  clearLanguage(targetLanguage: string): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.targetLanguage === targetLanguage) {
        this.cache.delete(key);
      }
    }
    this.scheduleSave();
  }

  getStats(): {
    size: number;
    languages: string[];
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const languages = new Set<string>();
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    let totalAccess = 0;
    let totalHits = 0;

    for (const cached of this.cache.values()) {
      languages.add(cached.targetLanguage);
      oldestTimestamp = Math.min(oldestTimestamp, cached.timestamp);
      newestTimestamp = Math.max(newestTimestamp, cached.timestamp);
      totalAccess += cached.accessCount;
      // Count actual cache hits: accessCount - 1 (first access is miss, rest are hits)
      if (cached.accessCount > 1) {
        totalHits += (cached.accessCount - 1);
      }
    }

    return {
      size: this.cache.size,
      languages: Array.from(languages),
      hitRate: totalAccess > 0 ? (totalHits / totalAccess) * 100 : 0,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }

  private loadFromStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      this.isLoaded = true;
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();

        // Load only non-expired entries
        for (const [key, cached] of Object.entries(data)) {
          const entry = cached as CachedTranslation;
          if (now - entry.timestamp < this.config.ttl) {
            this.cache.set(key, entry);
          }
        }

        console.log(`[Persistent Cache] Loaded ${this.cache.size} translations from storage`);
      }
    } catch (error) {
      console.warn('[Persistent Cache] Failed to load from storage:', error);
    }

    this.isLoaded = true;
  }

  private scheduleSave(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Debounce saves to avoid excessive localStorage writes
    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, 1000);
  }

  private saveToStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[Persistent Cache] Failed to save to storage:', error);
      
      // If storage is full, clear old entries and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.performCleanup(true);
        try {
          const data = Object.fromEntries(this.cache.entries());
          localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch (retryError) {
          console.error('[Persistent Cache] Failed to save after cleanup:', retryError);
        }
      }
    }
  }

  private performCleanup(aggressive = false): void {
    const targetSize = aggressive ? this.config.maxSize * 0.5 : this.config.maxSize * 0.8;
    
    if (this.cache.size <= targetSize) {
      return;
    }

    // Sort by priority and access patterns
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;

      // Priority order: instant > high > normal
      const priorityOrder = { instant: 3, high: 2, normal: 1 };
      const priorityDiff = priorityOrder[entryB.priority] - priorityOrder[entryA.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by access count
      const accessDiff = entryB.accessCount - entryA.accessCount;
      if (accessDiff !== 0) return accessDiff;

      // Finally by last accessed time
      return entryB.lastAccessed - entryA.lastAccessed;
    });

    // Keep the most important entries
    const toKeep = entries.slice(0, targetSize);
    const toRemove = entries.slice(targetSize);

    // Clear and rebuild cache
    this.cache.clear();
    for (const [key, cached] of toKeep) {
      this.cache.set(key, cached);
    }

    console.log(`[Persistent Cache] Cleanup: removed ${toRemove.length} entries, kept ${toKeep.length}`);
  }

  private setupPeriodicCleanup(): void {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.config.ttl) {
          this.cache.delete(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`[Persistent Cache] Periodic cleanup: removed ${removedCount} expired entries`);
        this.scheduleSave();
      }
    }, 5 * 60 * 1000);
  }

  waitForLoad(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkLoad = () => {
        if (this.isLoaded) {
          resolve();
        } else {
          setTimeout(checkLoad, 10);
        }
      };
      checkLoad();
    });
  }
}

export default PersistentTranslationCache;