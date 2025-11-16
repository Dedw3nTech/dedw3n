const DB_NAME = 'app-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache-entries';

interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

class PersistentCache {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;
  private useLocalStorage = false;

  constructor() {
    this.dbReady = this.initDB();
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      this.useLocalStorage = true;
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn('IndexedDB initialization failed, falling back to localStorage');
          this.useLocalStorage = true;
          resolve();
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
      this.useLocalStorage = true;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.dbReady;

    if (this.useLocalStorage) {
      return this.getFromLocalStorage<T>(key);
    }

    if (!this.db) {
      return null;
    }

    try {
      const entry = await new Promise<CacheEntry<T> | null>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (!entry) {
        return null;
      }

      const now = Date.now();
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Error reading from IndexedDB:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 0): Promise<void> {
    await this.dbReady;

    if (this.useLocalStorage) {
      return this.setToLocalStorage(key, value, ttl);
    }

    if (!this.db) {
      return;
    }

    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
      };

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error writing to IndexedDB:', error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.dbReady;

    if (this.useLocalStorage) {
      return this.deleteFromLocalStorage(key);
    }

    if (!this.db) {
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting from IndexedDB:', error);
    }
  }

  async clear(): Promise<void> {
    await this.dbReady;

    if (this.useLocalStorage) {
      return this.clearLocalStorage();
    }

    if (!this.db) {
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.dbReady;

    if (this.useLocalStorage) {
      return this.invalidatePatternLocalStorage(pattern);
    }

    if (!this.db) {
      return;
    }

    try {
      const allKeys = await new Promise<string[]>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });

      const regex = new RegExp(pattern);
      const keysToDelete = allKeys.filter((key) => regex.test(key));

      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('Error invalidating pattern in IndexedDB:', error);
    }
  }

  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`cache:${key}`);
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private setToLocalStorage<T>(key: string, value: T, ttl: number): void {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old entries');
        this.clearOldLocalStorageEntries();
        try {
          const entry: CacheEntry<T> = {
            key,
            value,
            timestamp: Date.now(),
            ttl,
          };
          localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Failed to set localStorage even after clearing:', retryError);
        }
      } else {
        console.error('Error writing to localStorage:', error);
      }
    }
  }

  private deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }

  private clearLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  private invalidatePatternLocalStorage(pattern: string): void {
    try {
      const regex = new RegExp(pattern);
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          const cacheKey = key.substring(6);
          if (regex.test(cacheKey)) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error invalidating pattern in localStorage:', error);
    }
  }

  private clearOldLocalStorageEntries(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item);
              entries.push({ key, timestamp: entry.timestamp || 0 });
            } catch {
            }
          }
        }
      }

      entries.sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = Math.ceil(entries.length * 0.3);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch (error) {
      console.error('Error clearing old localStorage entries:', error);
    }
  }
}

export const persistentCache = new PersistentCache();

export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: (id: number) => `product:${id}`,
  CATEGORIES: 'categories',
  USER_PROFILE: (id: number) => `user:${id}`,
  CART: (userId: number) => `cart:${userId}`,
} as const;
