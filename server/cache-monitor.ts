import { cacheService } from './cache-service';
import { getQueryCacheStats } from './query-cache';

export interface CacheMonitorStats {
  serverCache: {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
    evictions: number;
  };
  queryCache: {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
  };
  httpCache: {
    cachedRoutes: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    notModifiedResponses: number;
  };
  memory: {
    estimatedUsage: string;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: string;
}

let httpCacheStats = {
  cachedRoutes: 0,
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  notModifiedResponses: 0,
};

export function trackHttpCacheHit() {
  httpCacheStats.totalRequests++;
  httpCacheStats.cacheHits++;
}

export function trackHttpCacheMiss() {
  httpCacheStats.totalRequests++;
  httpCacheStats.cacheMisses++;
}

export function trackNotModifiedResponse() {
  httpCacheStats.notModifiedResponses++;
}

export function incrementCachedRoutes() {
  httpCacheStats.cachedRoutes++;
}

export function getCacheStats(): CacheMonitorStats {
  const serverCacheStats = cacheService.getStats();
  const queryCacheStatsData = getQueryCacheStats();
  const memUsage = process.memoryUsage();

  const estimatedCacheSize = 
    serverCacheStats.size * 1024 +
    queryCacheStatsData.size * 2048;

  return {
    serverCache: {
      size: serverCacheStats.size,
      hitRate: serverCacheStats.hitRate,
      hits: serverCacheStats.hits,
      misses: serverCacheStats.misses,
      evictions: serverCacheStats.evictions,
    },
    queryCache: {
      size: queryCacheStatsData.size,
      hitRate: queryCacheStatsData.hitRate,
      hits: queryCacheStatsData.hits,
      misses: queryCacheStatsData.misses,
    },
    httpCache: {
      ...httpCacheStats,
    },
    memory: {
      estimatedUsage: `${(estimatedCacheSize / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    },
    timestamp: new Date().toISOString(),
  };
}

export function resetCacheStats() {
  cacheService.clear();
  httpCacheStats = {
    cachedRoutes: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    notModifiedResponses: 0,
  };
}
