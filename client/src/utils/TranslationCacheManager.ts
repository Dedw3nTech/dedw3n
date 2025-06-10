interface TranslationResult {
  translatedText: string;
  sourceText: string;
  targetLanguage: string;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  promise: Promise<string>;
  timestamp: number;
}

class TranslationCacheManager {
  private static instance: TranslationCacheManager;
  private memoryCache = new Map<string, TranslationResult>();
  private pendingRequests = new Map<string, PendingRequest>();
  private dbName = 'TranslationCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_MEMORY_CACHE = 500; // Max items in memory
  private readonly DEBOUNCE_TIME = 300; // ms

  private constructor() {
    this.initIndexedDB();
  }

  static getInstance(): TranslationCacheManager {
    if (!TranslationCacheManager.instance) {
      TranslationCacheManager.instance = new TranslationCacheManager();
    }
    return TranslationCacheManager.instance;
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('translations')) {
          const store = db.createObjectStore('translations', { keyPath: 'cacheKey' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('targetLanguage', 'targetLanguage', { unique: false });
        }
      };
    });
  }

  private generateCacheKey(text: string, targetLanguage: string): string {
    return `${text.toLowerCase().trim()}:${targetLanguage}`;
  }

  private isExpired(result: TranslationResult): boolean {
    return Date.now() - result.timestamp > result.ttl;
  }

  private async getFromIndexedDB(cacheKey: string): Promise<TranslationResult | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        const result = request.result;
        if (result && !this.isExpired(result)) {
          resolve(result);
        } else {
          if (result) {
            this.removeFromIndexedDB(cacheKey);
          }
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private async saveToIndexedDB(cacheKey: string, result: TranslationResult): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const data = { ...result, cacheKey };
      
      store.put(data);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }

  private async removeFromIndexedDB(cacheKey: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      
      store.delete(cacheKey);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }

  private manageMemeoryCache(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.MAX_MEMORY_CACHE * 0.2));
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  async getTranslation(text: string, targetLanguage: string): Promise<string> {
    const cacheKey = this.generateCacheKey(text, targetLanguage);

    // L1 Cache: Memory
    const memoryResult = this.memoryCache.get(cacheKey);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.translatedText;
    }

    // L2 Cache: IndexedDB
    const dbResult = await this.getFromIndexedDB(cacheKey);
    if (dbResult) {
      this.memoryCache.set(cacheKey, dbResult);
      this.manageMemeoryCache();
      return dbResult.translatedText;
    }

    // Check for pending requests
    const pending = this.pendingRequests.get(cacheKey);
    if (pending && Date.now() - pending.timestamp < 10000) {
      return pending.promise;
    }

    // Network request with batching
    const promise = this.requestTranslation(text, targetLanguage, cacheKey);
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  private async requestTranslation(text: string, targetLanguage: string, cacheKey: string): Promise<string> {
    try {
      await new Promise(resolve => setTimeout(resolve, this.DEBOUNCE_TIME));

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage: 'auto'
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const delay = Math.min(1000 * Math.pow(2, Math.random() * 3), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
          throw new Error('Rate limited - retry needed');
        }
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.translatedText || text;

      const result: TranslationResult = {
        translatedText,
        sourceText: text,
        targetLanguage,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      };

      this.memoryCache.set(cacheKey, result);
      this.manageMemeoryCache();
      await this.saveToIndexedDB(cacheKey, result);

      return translatedText;
    } catch (error) {
      console.warn('Translation request failed:', error);
      return text;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async clearExpiredCache(): Promise<void> {
    const expiredKeys: string[] = [];
    this.memoryCache.forEach((result, key) => {
      if (this.isExpired(result)) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.memoryCache.delete(key));

    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const index = store.index('timestamp');
      
      const cutoffTime = Date.now() - this.CACHE_TTL;
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      index.openCursor(range).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }
}

export default TranslationCacheManager;