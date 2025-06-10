import { cacheMiddleware } from './cache-middleware';
import { cacheInvalidator } from './cache-invalidator';

interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  databaseLoadReduction: number;
  operationStats: {
    [operation: string]: {
      hits: number;
      misses: number;
      hitRate: number;
    };
  };
}

class CachePerformanceTracker {
  private static instance: CachePerformanceTracker;
  private metrics: CacheMetrics;
  private operationCounters: Map<string, { hits: number; misses: number }>;
  private lastResetTime: Date;

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      databaseLoadReduction: 0,
      operationStats: {}
    };
    this.operationCounters = new Map();
    this.lastResetTime = new Date();
  }

  static getInstance(): CachePerformanceTracker {
    if (!CachePerformanceTracker.instance) {
      CachePerformanceTracker.instance = new CachePerformanceTracker();
    }
    return CachePerformanceTracker.instance;
  }

  trackCacheHit(operation: string) {
    this.metrics.totalRequests++;
    this.metrics.cacheHits++;
    
    const opStats = this.operationCounters.get(operation) || { hits: 0, misses: 0 };
    opStats.hits++;
    this.operationCounters.set(operation, opStats);
    
    this.updateMetrics();
  }

  trackCacheMiss(operation: string) {
    this.metrics.totalRequests++;
    this.metrics.cacheMisses++;
    
    const opStats = this.operationCounters.get(operation) || { hits: 0, misses: 0 };
    opStats.misses++;
    this.operationCounters.set(operation, opStats);
    
    this.updateMetrics();
  }

  private updateMetrics() {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.cacheHits / this.metrics.totalRequests) * 100;
      this.metrics.databaseLoadReduction = this.metrics.hitRate;
    }

    // Update operation-specific stats
    this.metrics.operationStats = {};
    this.operationCounters.forEach((stats, operation) => {
      const total = stats.hits + stats.misses;
      this.metrics.operationStats[operation] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: total > 0 ? (stats.hits / total) * 100 : 0
      };
    });
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getDetailedReport(): string {
    const report = [
      '=== CACHE PERFORMANCE REPORT ===',
      `Total Requests: ${this.metrics.totalRequests}`,
      `Cache Hits: ${this.metrics.cacheHits}`,
      `Cache Misses: ${this.metrics.cacheMisses}`,
      `Hit Rate: ${this.metrics.hitRate.toFixed(2)}%`,
      `Database Load Reduction: ${this.metrics.databaseLoadReduction.toFixed(2)}%`,
      '',
      '=== OPERATION BREAKDOWN ===',
    ];

    Object.entries(this.metrics.operationStats).forEach(([operation, stats]) => {
      report.push(
        `${operation}:`,
        `  Hits: ${stats.hits}`,
        `  Misses: ${stats.misses}`,
        `  Hit Rate: ${stats.hitRate.toFixed(2)}%`,
        ''
      );
    });

    const cacheStats = cacheMiddleware.getCacheStats();
    const invalidatorStats = cacheInvalidator.getStats();

    report.push(
      '=== CACHE SYSTEM STATS ===',
      `Cache Size: ${cacheStats.size}`,
      `Invalidations: ${invalidatorStats.totalInvalidations}`,
      `Last Reset: ${this.lastResetTime.toISOString()}`,
      ''
    );

    return report.join('\n');
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      databaseLoadReduction: 0,
      operationStats: {}
    };
    this.operationCounters.clear();
    this.lastResetTime = new Date();
  }

  // Track specific high-impact operations
  trackUserDataCacheHit() {
    this.trackCacheHit('user_data');
  }

  trackUserDataCacheMiss() {
    this.trackCacheMiss('user_data');
  }

  trackNotificationCacheHit() {
    this.trackCacheHit('notifications');
  }

  trackNotificationCacheMiss() {
    this.trackCacheMiss('notifications');
  }

  trackProductCacheHit() {
    this.trackCacheHit('products');
  }

  trackProductCacheMiss() {
    this.trackCacheMiss('products');
  }

  trackMessageCacheHit() {
    this.trackCacheHit('messages');
  }

  trackMessageCacheMiss() {
    this.trackCacheMiss('messages');
  }

  // Performance milestone tracking
  hasReachedTarget(targetPercentage: number = 95): boolean {
    return this.metrics.databaseLoadReduction >= targetPercentage;
  }

  getProgressToTarget(targetPercentage: number = 75): {
    current: number;
    target: number;
    progress: number;
    remaining: number;
  } {
    return {
      current: this.metrics.databaseLoadReduction,
      target: targetPercentage,
      progress: (this.metrics.databaseLoadReduction / targetPercentage) * 100,
      remaining: Math.max(0, targetPercentage - this.metrics.databaseLoadReduction)
    };
  }
}

export const cachePerformanceTracker = CachePerformanceTracker.getInstance();