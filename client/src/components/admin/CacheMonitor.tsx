import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CacheMonitor() {
  const { getCacheStats } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadStats = () => {
    const cacheStats = getCacheStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadStats, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Translation Cache Statistics</span>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-auto-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              data-testid="button-refresh-stats"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Cached Translations</div>
            <div className="text-2xl font-bold" data-testid="text-cache-size">
              {stats.size.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Languages</div>
            <div className="text-2xl font-bold" data-testid="text-languages-count">
              {stats.languages.length}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Hit Rate</div>
            <div className="text-2xl font-bold text-green-600" data-testid="text-hit-rate">
              {stats.hitRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Cache Age</div>
            <div className="text-2xl font-bold" data-testid="text-cache-age">
              {stats.size > 0 ? Math.floor((Date.now() - stats.oldestEntry) / (1000 * 60)) : 0}m
            </div>
          </div>
        </div>

        {stats.languages.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Active Languages:</div>
            <div className="flex flex-wrap gap-2">
              {stats.languages.map((lang: string) => (
                <span
                  key={lang}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  data-testid={`lang-badge-${lang}`}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Translations persist across page reloads using localStorage</p>
          <p>• HTTP caching reduces API calls by 5 minutes with ETag support</p>
          <p>• Language preferences cached locally with automatic backend sync</p>
        </div>
      </CardContent>
    </Card>
  );
}
