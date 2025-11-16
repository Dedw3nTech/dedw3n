// Translation Performance Monitor
// Admin-only component to monitor translation speed and cache efficiency

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Database, Clock, TrendingUp, RefreshCw } from 'lucide-react';

interface TranslationStats {
  totalEntries: number;
  hitsByPriority: {
    instant: number;
    high: number;
    normal: number;
    low: number;
  };
  languages: string[];
  oldestEntry: number;
  newestEntry: number;
}

interface PerformanceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  sub1SecondRequests: number;
  cacheHitRate: number;
  sub1SecondRate: number;
  cacheSize: number;
  priorityCacheSize: number;
}

export function TranslationPerformanceMonitor() {
  const [clientStats, setClientStats] = useState<TranslationStats | null>(null);
  const [serverStats, setServerStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch server-side stats
      const response = await fetch('/api/translate/performance');
      if (response.ok) {
        const data = await response.json();
        setServerStats(data.performance);
        setLastUpdate(new Date());
      } else {
        console.warn('Translation performance endpoint returned:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch translation stats:', error);
      // Show a fallback message to user if endpoint is not available
      setServerStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCacheHitRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (time: number) => {
    if (time <= 100) return 'text-green-600';
    if (time <= 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!serverStats && !isLoading && lastUpdate === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Translation Performance Monitor
          </CardTitle>
          <CardDescription>Unable to load translation statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium mb-2">
                  Performance API Unavailable
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  The translation performance endpoint is not responding. This could be due to:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 text-left max-w-md">
                  <li>• Server is still starting up</li>
                  <li>• Performance endpoint is not configured</li>
                  <li>• Network connectivity issues</li>
                </ul>
                <Button
                  onClick={fetchStats}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  data-testid="button-retry-stats"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!serverStats && isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Translation Performance Monitor
          </CardTitle>
          <CardDescription>Loading translation statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // TypeScript guard: serverStats should be non-null here
  if (!serverStats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Translation Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time translation speed and cache efficiency metrics
                {lastUpdate && (
                  <span className="ml-2 text-xs">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              onClick={fetchStats}
              disabled={isLoading}
              variant="outline"
              size="sm"
              data-testid="button-refresh-stats"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cache Performance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Cache Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                <div className={`text-3xl font-bold ${getCacheHitRateColor(serverStats.cacheHitRate)}`}>
                  {serverStats.cacheHitRate.toFixed(1)}%
                </div>
                <Progress value={serverStats.cacheHitRate} className="h-2" />
                {serverStats.cacheHitRate >= 90 ? (
                  <Badge variant="default" className="bg-green-600">Excellent</Badge>
                ) : serverStats.cacheHitRate >= 70 ? (
                  <Badge variant="default" className="bg-yellow-600">Good</Badge>
                ) : (
                  <Badge variant="destructive">Needs Optimization</Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Cache Size</div>
                <div className="text-3xl font-bold">{serverStats.cacheSize.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Priority: {serverStats.priorityCacheSize.toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-3xl font-bold">{serverStats.totalRequests.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Hits: {serverStats.cacheHits.toLocaleString()} | 
                  Misses: {serverStats.cacheMisses.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Speed Performance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold">Speed Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className={`text-3xl font-bold ${getResponseTimeColor(serverStats.averageResponseTime)}`}>
                  {serverStats.averageResponseTime.toFixed(0)}ms
                </div>
                {serverStats.averageResponseTime <= 100 ? (
                  <Badge variant="default" className="bg-green-600">
                    <Zap className="w-3 h-3 mr-1" />
                    Instant
                  </Badge>
                ) : serverStats.averageResponseTime <= 300 ? (
                  <Badge variant="default" className="bg-yellow-600">Fast</Badge>
                ) : (
                  <Badge variant="destructive">Slow</Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Sub-100ms Rate</div>
                <div className="text-3xl font-bold text-green-600">
                  {serverStats.sub1SecondRate.toFixed(1)}%
                </div>
                <Progress value={serverStats.sub1SecondRate} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Fast Requests</div>
                <div className="text-3xl font-bold">{serverStats.sub1SecondRequests.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Sub-100ms responses
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Performance Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {serverStats.cacheHitRate >= 90 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-600" />
                  <div className="text-sm">
                    <div className="font-medium text-green-900 dark:text-green-100">Excellent Cache Performance</div>
                    <div className="text-green-700 dark:text-green-300">
                      {serverStats.cacheHitRate.toFixed(1)}% of translations served from cache
                    </div>
                  </div>
                </div>
              )}

              {serverStats.averageResponseTime <= 100 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 dark:text-blue-100">Lightning Fast Responses</div>
                    <div className="text-blue-700 dark:text-blue-300">
                      Average response time: {serverStats.averageResponseTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
              )}

              {serverStats.cacheHitRate < 70 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-600" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-900 dark:text-yellow-100">Cache Optimization Needed</div>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      Consider preloading common translations to improve hit rate
                    </div>
                  </div>
                </div>
              )}

              {serverStats.averageResponseTime > 300 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-600" />
                  <div className="text-sm">
                    <div className="font-medium text-red-900 dark:text-red-100">Slow Response Times</div>
                    <div className="text-red-700 dark:text-red-300">
                      Check network latency and DeepL API performance
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Gauge */}
          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Translation System Status</span>
              </div>
              <div className="text-2xl font-bold">
                {serverStats.cacheHitRate >= 90 && serverStats.averageResponseTime <= 100 ? (
                  <span className="text-green-600">🚀 Optimal Performance</span>
                ) : serverStats.cacheHitRate >= 70 && serverStats.averageResponseTime <= 300 ? (
                  <span className="text-yellow-600">⚡ Good Performance</span>
                ) : (
                  <span className="text-red-600">⚠️ Needs Optimization</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
