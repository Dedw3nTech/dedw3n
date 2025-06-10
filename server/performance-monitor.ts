/**
 * Performance Monitor
 * Tracks memory usage, database performance, and prevents crashes
 */

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private memoryThreshold = 500 * 1024 * 1024; // 500MB
  private queryTimeThreshold = 1000; // 1 second
  private metrics = {
    memoryUsage: [] as number[],
    queryTimes: [] as number[],
    activeConnections: 0,
    errors: 0,
    lastHealthCheck: new Date()
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.startMonitoring();
  }

  startMonitoring() {
    // Memory monitoring every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 3600000);

    console.log('[Performance Monitor] Started monitoring system performance');
  }

  private checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;
    
    this.metrics.memoryUsage.push(heapUsed);
    
    if (heapUsed > this.memoryThreshold) {
      console.warn(`[Performance Monitor] High memory usage detected: ${Math.round(heapUsed / 1024 / 1024)}MB`);
      this.triggerGarbageCollection();
    }

    // Keep only last 100 measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
  }

  private triggerGarbageCollection() {
    if (global.gc) {
      try {
        global.gc();
        console.log('[Performance Monitor] Manual garbage collection triggered');
      } catch (error) {
        console.error('[Performance Monitor] Failed to trigger garbage collection:', error);
      }
    }
  }

  private performHealthCheck() {
    const usage = process.memoryUsage();
    const uptime = process.uptime();
    
    const health = {
      memory: {
        used: Math.round(usage.heapUsed / 1024 / 1024),
        total: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
      },
      uptime: Math.round(uptime / 60), // minutes
      activeConnections: this.metrics.activeConnections,
      errors: this.metrics.errors,
      avgQueryTime: this.getAverageQueryTime()
    };

    console.log('[Performance Monitor] Health check:', health);
    this.metrics.lastHealthCheck = new Date();
  }

  private cleanupMetrics() {
    // Reset error count
    this.metrics.errors = 0;
    
    // Keep only recent query times
    this.metrics.queryTimes = this.metrics.queryTimes.slice(-500);
    
    console.log('[Performance Monitor] Metrics cleanup completed');
  }

  trackQuery(duration: number) {
    this.metrics.queryTimes.push(duration);
    
    if (duration > this.queryTimeThreshold) {
      console.warn(`[Performance Monitor] Slow query detected: ${duration}ms`);
    }
  }

  trackConnection(increment: boolean = true) {
    if (increment) {
      this.metrics.activeConnections++;
    } else {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    }
  }

  trackError() {
    this.metrics.errors++;
  }

  private getAverageQueryTime(): number {
    if (this.metrics.queryTimes.length === 0) return 0;
    const sum = this.metrics.queryTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.queryTimes.length);
  }

  getMetrics() {
    const usage = process.memoryUsage();
    return {
      memory: {
        current: Math.round(usage.heapUsed / 1024 / 1024),
        peak: Math.max(...this.metrics.memoryUsage.map(m => Math.round(m / 1024 / 1024))),
        threshold: Math.round(this.memoryThreshold / 1024 / 1024)
      },
      queries: {
        average: this.getAverageQueryTime(),
        slow: this.metrics.queryTimes.filter(t => t > this.queryTimeThreshold).length,
        total: this.metrics.queryTimes.length
      },
      connections: this.metrics.activeConnections,
      errors: this.metrics.errors,
      uptime: Math.round(process.uptime() / 60),
      lastHealthCheck: this.metrics.lastHealthCheck
    };
  }

  // Wrapper for async operations with error handling
  async safeAsyncOperation<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    const start = Date.now();
    try {
      const result = await operation();
      this.trackQuery(Date.now() - start);
      return result;
    } catch (error) {
      this.trackError();
      this.trackQuery(Date.now() - start);
      console.error(`[Performance Monitor] ${context} failed:`, error);
      return null;
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();