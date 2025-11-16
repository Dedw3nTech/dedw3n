import { queryClient } from '@/lib/queryClient';

export interface CacheConfig {
  key: string;
  endpoint: string;
  ttl: number;
  version: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface CachedData {
  data: any;
  timestamp: number;
  version: number;
  expiresAt: number;
}

export interface CacheStatus {
  isWarming: boolean;
  lastWarmUp: number | null;
  cachedKeys: string[];
  totalSize: number;
  status: 'idle' | 'warming' | 'syncing' | 'complete' | 'error';
  error: string | null;
}

const CACHE_PREFIX = 'offline_cache:';
const CACHE_VERSION_KEY = 'offline_cache_version';
const CURRENT_CACHE_VERSION = 1;

const CACHE_CONFIGS: CacheConfig[] = [
  {
    key: 'user_profile',
    endpoint: '/api/user',
    ttl: 60 * 60 * 1000, // 1 hour
    version: CURRENT_CACHE_VERSION,
    priority: 'critical',
  },
  {
    key: 'unread_messages',
    endpoint: '/api/messages/unread/count',
    ttl: 15 * 60 * 1000, // 15 minutes
    version: CURRENT_CACHE_VERSION,
    priority: 'critical',
  },
  {
    key: 'unread_notifications',
    endpoint: '/api/notifications/unread/count',
    ttl: 15 * 60 * 1000, // 15 minutes
    version: CURRENT_CACHE_VERSION,
    priority: 'critical',
  },
  {
    key: 'calendar_notifications',
    endpoint: '/api/calendar/notifications/count',
    ttl: 30 * 60 * 1000, // 30 minutes
    version: CURRENT_CACHE_VERSION,
    priority: 'high',
  },
  {
    key: 'user_language',
    endpoint: '/api/user/language',
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    version: CURRENT_CACHE_VERSION,
    priority: 'high',
  },
  {
    key: 'subscription_status',
    endpoint: '/api/subscription/status',
    ttl: 60 * 60 * 1000, // 1 hour
    version: CURRENT_CACHE_VERSION,
    priority: 'normal',
  },
  {
    key: 'crypto_prices',
    endpoint: '/api/crypto/prices',
    ttl: 5 * 60 * 1000, // 5 minutes
    version: CURRENT_CACHE_VERSION,
    priority: 'normal',
  },
];

class OfflineCacheService {
  private static instance: OfflineCacheService;
  private status: CacheStatus = {
    isWarming: false,
    lastWarmUp: null,
    cachedKeys: [],
    totalSize: 0,
    status: 'idle',
    error: null,
  };
  private statusListeners: Array<(status: CacheStatus) => void> = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineCacheService {
    if (!OfflineCacheService.instance) {
      OfflineCacheService.instance = new OfflineCacheService();
    }
    return OfflineCacheService.instance;
  }

  private initialize(): void {
    this.checkCacheVersion();
    this.loadCachedKeys();
  }

  private checkCacheVersion(): void {
    try {
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (storedVersion && parseInt(storedVersion) !== CURRENT_CACHE_VERSION) {
        console.log('[OfflineCache] Cache version mismatch, clearing old caches');
        this.clearAll();
      }
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION.toString());
    } catch (error) {
      console.error('[OfflineCache] Error checking cache version:', error);
    }
  }

  private loadCachedKeys(): void {
    try {
      const keys: string[] = [];
      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          keys.push(key.replace(CACHE_PREFIX, ''));
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      this.status.cachedKeys = keys;
      this.status.totalSize = totalSize;
      this.notifyListeners();
    } catch (error) {
      console.error('[OfflineCache] Error loading cached keys:', error);
    }
  }

  public async warmUpCache(): Promise<void> {
    if (this.status.isWarming) {
      console.log('[OfflineCache] Cache warm-up already in progress');
      return;
    }

    this.updateStatus({
      isWarming: true,
      status: 'warming',
      error: null,
    });

    console.log('[OfflineCache] Starting cache warm-up');

    try {
      const criticalConfigs = CACHE_CONFIGS.filter(c => c.priority === 'critical');
      await this.cacheMultiple(criticalConfigs);

      const highConfigs = CACHE_CONFIGS.filter(c => c.priority === 'high');
      await this.cacheMultiple(highConfigs);

      const normalConfigs = CACHE_CONFIGS.filter(c => c.priority === 'normal');
      await this.cacheMultiple(normalConfigs);

      this.updateStatus({
        isWarming: false,
        lastWarmUp: Date.now(),
        status: 'complete',
      });

      console.log('[OfflineCache] Cache warm-up completed');
    } catch (error) {
      console.error('[OfflineCache] Cache warm-up failed:', error);
      this.updateStatus({
        isWarming: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async cacheMultiple(configs: CacheConfig[]): Promise<void> {
    const promises = configs.map(config => this.cacheData(config));
    await Promise.allSettled(promises);
  }

  private async cacheData(config: CacheConfig): Promise<void> {
    try {
      const response = await fetch(config.endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.setCache(config.key, data, config.ttl, config.version);
      
      console.log(`[OfflineCache] Cached ${config.key}`);
    } catch (error) {
      console.error(`[OfflineCache] Failed to cache ${config.key}:`, error);
    }
  }

  public setCache(key: string, data: any, ttl: number, version: number = CURRENT_CACHE_VERSION): void {
    try {
      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
        version,
        expiresAt: Date.now() + ttl,
      };

      const serialized = JSON.stringify(cachedData);
      localStorage.setItem(CACHE_PREFIX + key, serialized);

      if (!this.status.cachedKeys.includes(key)) {
        this.status.cachedKeys.push(key);
      }
      
      this.status.totalSize += serialized.length;
      this.notifyListeners();
    } catch (error) {
      console.error(`[OfflineCache] Error setting cache for ${key}:`, error);
      
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[OfflineCache] localStorage quota exceeded, clearing old entries');
        this.clearExpired();
      }
    }
  }

  public getCache(key: string): any | null {
    try {
      const serialized = localStorage.getItem(CACHE_PREFIX + key);
      if (!serialized) {
        return null;
      }

      const cached: CachedData = JSON.parse(serialized);

      if (cached.version !== CURRENT_CACHE_VERSION) {
        console.log(`[OfflineCache] Cache version mismatch for ${key}, removing`);
        this.removeCache(key);
        return null;
      }

      if (Date.now() > cached.expiresAt) {
        console.log(`[OfflineCache] Cache expired for ${key}`);
        this.removeCache(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error(`[OfflineCache] Error getting cache for ${key}:`, error);
      return null;
    }
  }

  public removeCache(key: string): void {
    try {
      const fullKey = CACHE_PREFIX + key;
      const value = localStorage.getItem(fullKey);
      
      if (value) {
        this.status.totalSize -= value.length;
      }
      
      localStorage.removeItem(fullKey);
      this.status.cachedKeys = this.status.cachedKeys.filter(k => k !== key);
      this.notifyListeners();
    } catch (error) {
      console.error(`[OfflineCache] Error removing cache for ${key}:`, error);
    }
  }

  public clearExpired(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      this.status.cachedKeys.forEach(key => {
        const serialized = localStorage.getItem(CACHE_PREFIX + key);
        if (serialized) {
          try {
            const cached: CachedData = JSON.parse(serialized);
            if (now > cached.expiresAt) {
              keysToRemove.push(key);
            }
          } catch (error) {
            keysToRemove.push(key);
          }
        }
      });

      keysToRemove.forEach(key => this.removeCache(key));
      
      if (keysToRemove.length > 0) {
        console.log(`[OfflineCache] Cleared ${keysToRemove.length} expired entries`);
      }
    } catch (error) {
      console.error('[OfflineCache] Error clearing expired caches:', error);
    }
  }

  public clearAll(): void {
    try {
      const keys = [...this.status.cachedKeys];
      keys.forEach(key => {
        localStorage.removeItem(CACHE_PREFIX + key);
      });

      this.status.cachedKeys = [];
      this.status.totalSize = 0;
      this.notifyListeners();
      
      console.log('[OfflineCache] All caches cleared');
    } catch (error) {
      console.error('[OfflineCache] Error clearing all caches:', error);
    }
  }

  public invalidateCache(key: string): void {
    this.removeCache(key);
    queryClient.invalidateQueries({ queryKey: [CACHE_CONFIGS.find(c => c.key === key)?.endpoint || key] });
  }

  public invalidateMultiple(keys: string[]): void {
    keys.forEach(key => this.invalidateCache(key));
  }

  public getStatus(): CacheStatus {
    return { ...this.status };
  }

  public onStatusChange(listener: (status: CacheStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private updateStatus(updates: Partial<CacheStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(this.getStatus());
      } catch (error) {
        console.error('[OfflineCache] Error in status listener:', error);
      }
    });
  }

  public getCacheSize(): { keys: number; sizeKB: number; sizeMB: number } {
    return {
      keys: this.status.cachedKeys.length,
      sizeKB: Math.round(this.status.totalSize / 1024),
      sizeMB: Math.round(this.status.totalSize / (1024 * 1024) * 100) / 100,
    };
  }
}

export const offlineCacheService = OfflineCacheService.getInstance();

export function getCachedData(key: string): any | null {
  return offlineCacheService.getCache(key);
}

export function setCachedData(key: string, data: any, ttl: number = 60 * 60 * 1000): void {
  offlineCacheService.setCache(key, data, ttl);
}

export function warmUpOfflineCache(): Promise<void> {
  return offlineCacheService.warmUpCache();
}

export function clearOfflineCache(): void {
  offlineCacheService.clearAll();
}

export function getCacheStatus(): CacheStatus {
  return offlineCacheService.getStatus();
}

function normalizeUrl(url: string): string {
  // Strip query string and hash
  const urlObj = new URL(url, window.location.origin);
  return urlObj.pathname;
}

export function getCacheKeyForUrl(url: string): string | null {
  try {
    const normalizedUrl = normalizeUrl(url);
    
    // Exact match first
    const exactMatch = CACHE_CONFIGS.find(c => c.endpoint === normalizedUrl);
    if (exactMatch) {
      return exactMatch.key;
    }
    
    // No match found
    return null;
  } catch (error) {
    console.error('[OfflineCache] Error normalizing URL:', url, error);
    return null;
  }
}

export function getCachedDataByUrl(url: string): any | null {
  const cacheKey = getCacheKeyForUrl(url);
  if (cacheKey) {
    return offlineCacheService.getCache(cacheKey);
  }
  return offlineCacheService.getCache(url);
}

export function setCachedDataByUrl(url: string, data: any, ttl?: number): void {
  const cacheKey = getCacheKeyForUrl(url);
  if (cacheKey) {
    const config = CACHE_CONFIGS.find(c => c.key === cacheKey);
    const cacheTtl = ttl || config?.ttl || 60 * 60 * 1000;
    offlineCacheService.setCache(cacheKey, data, cacheTtl);
  } else {
    const cacheTtl = ttl || 60 * 60 * 1000;
    offlineCacheService.setCache(url, data, cacheTtl);
  }
}
