import express from "express";
import { cachePerformanceTracker } from "./cache-performance-tracker";
import { cacheMiddleware } from "./cache-middleware";
import { cacheInvalidator } from "./cache-invalidator";

const router = express.Router();

// Get current cache performance metrics
router.get('/api/cache/metrics', (req, res) => {
  try {
    const metrics = cachePerformanceTracker.getMetrics();
    const progress = cachePerformanceTracker.getProgressToTarget(95);
    
    res.json({
      ...metrics,
      progress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache metrics:', error);
    res.status(500).json({ error: 'Failed to get cache metrics' });
  }
});

// Get detailed cache performance report
router.get('/api/cache/report', (req, res) => {
  try {
    const detailedReport = cachePerformanceTracker.getDetailedReport();
    res.json({
      report: detailedReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache report:', error);
    res.status(500).json({ error: 'Failed to get cache report' });
  }
});

// Check if we've reached the 95% database load reduction target
router.get('/api/cache/target-status', (req, res) => {
  try {
    const hasReachedTarget = cachePerformanceTracker.hasReachedTarget(95);
    const progress = cachePerformanceTracker.getProgressToTarget(95);
    const metrics = cachePerformanceTracker.getMetrics();
    
    res.json({
      targetReached: hasReachedTarget,
      currentPerformance: progress.current,
      target: progress.target,
      progressPercentage: progress.progress,
      totalRequests: metrics.totalRequests,
      cacheHits: metrics.cacheHits,
      message: hasReachedTarget 
        ? '🎯 Target achieved! 95% database load reduction reached.'
        : `📊 Progress: ${progress.current.toFixed(1)}% of 95% target`
    });
  } catch (error) {
    console.error('Error checking target status:', error);
    res.status(500).json({ error: 'Failed to check target status' });
  }
});

// Reset cache performance metrics (admin only)
router.post('/api/cache/reset', (req, res) => {
  try {
    cachePerformanceTracker.reset();
    res.json({
      success: true,
      message: 'Cache performance metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting cache metrics:', error);
    res.status(500).json({ error: 'Failed to reset cache metrics' });
  }
});

// Get cache system health status
router.get('/api/cache/health', (req, res) => {
  try {
    const cacheStats = cacheMiddleware.getCacheStats();
    const invalidatorStats = cacheInvalidator.getStats();
    const performanceMetrics = cachePerformanceTracker.getMetrics();
    
    res.json({
      status: 'healthy',
      cache: {
        size: cacheStats.size,
        hitRate: performanceMetrics.hitRate,
        totalRequests: performanceMetrics.totalRequests
      },
      invalidations: {
        total: invalidatorStats.totalInvalidations,
        recent: invalidatorStats.recentInvalidations || 0
      },
      performance: {
        databaseLoadReduction: performanceMetrics.databaseLoadReduction,
        targetProgress: cachePerformanceTracker.getProgressToTarget(95).progress
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to get cache health status' 
    });
  }
});

export default router;