import { useState } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { 
  Activity, RefreshCw, Wifi, Clock, AlertTriangle, 
  Zap, BarChart2, History, ArrowDown, ArrowUp
} from 'lucide-react';

// Format milliseconds into a human-readable uptime string
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
}

export function ConnectionDiagnostics() {
  const { 
    connectionStatus, 
    connectionDetails, 
    connect, 
    disconnect 
  } = useMessaging();
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Create ping history data for chart
  const pingData = connectionDetails.pingStats?.recent?.map((latency, index) => ({
    id: index,
    latency
  })) || [];
  
  // Calculate average ping from recent pings
  const averagePing = pingData.length > 0 
    ? Math.round(pingData.reduce((sum, data) => sum + data.latency, 0) / pingData.length) 
    : null;
  
  // Connection health score calculation (basic algorithm)
  const calculateHealthScore = (): { score: number, label: string } => {
    let score = 100;
    
    // Deduct for reconnections
    if (connectionDetails.reconnects) {
      score -= Math.min(connectionDetails.reconnects * 5, 30);
    }
    
    // Deduct for errors
    if (connectionDetails.errorCount) {
      score -= Math.min(connectionDetails.errorCount * 10, 50);
    }
    
    // Deduct for high latency
    if (connectionDetails.pingLatency) {
      if (connectionDetails.pingLatency > 500) score -= 20;
      else if (connectionDetails.pingLatency > 300) score -= 10;
      else if (connectionDetails.pingLatency > 150) score -= 5;
    }
    
    // Add bonuses for consecutive successful pings
    if (connectionDetails.consecutiveSuccessfulPings && connectionDetails.consecutiveSuccessfulPings > 10) {
      score += Math.min(5, connectionDetails.consecutiveSuccessfulPings / 10);
    }
    
    // Determine label based on score
    let label = 'Excellent';
    if (score < 50) label = 'Poor';
    else if (score < 70) label = 'Fair';
    else if (score < 85) label = 'Good';
    else if (score < 95) label = 'Very Good';
    
    return { score: Math.max(0, Math.min(100, score)), label };
  };
  
  const healthScore = calculateHealthScore();
  
  if (!showDiagnostics) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center space-x-1"
        onClick={() => setShowDiagnostics(true)}
      >
        <Activity className="h-4 w-4" />
        <span>Connection Diagnostics</span>
      </Button>
    );
  }
  
  return (
    <Card className="max-w-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">WebSocket Connection Diagnostics</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowDiagnostics(false)}>
            Close
          </Button>
        </div>
        <CardDescription>
          Detailed metrics and diagnostics for the WebSocket connection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current status section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="border rounded p-3 space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Wifi className="h-3 w-3 mr-1" />
              <span>Status</span>
            </div>
            <div className={`text-lg font-medium ${
              connectionStatus === 'authenticated' ? 'text-green-500' :
              connectionStatus === 'connected' ? 'text-orange-500' :
              connectionStatus === 'connecting' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </div>
          </div>
          
          <div className="border rounded p-3 space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Uptime</span>
            </div>
            <div className="text-lg font-medium">
              {connectionDetails.startTime 
                ? formatUptime(Date.now() - connectionDetails.startTime)
                : 'N/A'}
            </div>
          </div>
          
          <div className="border rounded p-3 space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mr-1" />
              <span>Connection Health</span>
            </div>
            <div className={`text-lg font-medium ${
              healthScore.score > 85 ? 'text-green-500' :
              healthScore.score > 70 ? 'text-emerald-500' :
              healthScore.score > 50 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {healthScore.label} ({healthScore.score}%)
            </div>
          </div>
        </div>
        
        {/* Ping metrics */}
        <div className="border rounded p-4 space-y-3">
          <h3 className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-1" />
            Ping Performance
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className={`text-lg font-medium ${
                (connectionDetails.pingLatency || 999) < 100 ? 'text-green-500' :
                (connectionDetails.pingLatency || 999) < 300 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {connectionDetails.pingLatency || '-'} ms
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Best</div>
              <div className="text-lg font-medium text-green-500">
                {(connectionDetails.pingStats && 
                  connectionDetails.pingStats.min !== undefined &&
                  typeof connectionDetails.pingStats.min === 'number' && 
                  connectionDetails.pingStats.min < Infinity) 
                    ? `${connectionDetails.pingStats.min} ms` 
                    : '-'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Average</div>
              <div className={`text-lg font-medium ${
                (averagePing || 999) < 100 ? 'text-green-500' :
                (averagePing || 999) < 300 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {averagePing ? `${averagePing} ms` : '-'}
              </div>
            </div>
          </div>
          
          {pingData.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pingData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" tick={false} label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} ms`, 'Latency']} />
                  <Line type="monotone" dataKey="latency" stroke="#3b82f6" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Connection issues */}
        <div className="border rounded p-4 space-y-3">
          <h3 className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Connection Issues
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Reconnects</div>
              <div className={`text-lg font-medium ${connectionDetails.reconnects ? 'text-yellow-500' : ''}`}>
                {connectionDetails.reconnects || 0}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Errors</div>
              <div className={`text-lg font-medium ${connectionDetails.errorCount ? 'text-red-500' : ''}`}>
                {connectionDetails.errorCount || 0}
              </div>
            </div>
          </div>
          
          {connectionDetails.lastError && (
            <div className="text-sm bg-red-50 p-2 rounded text-red-700">
              <div className="font-medium">Last Error:</div>
              <div className="text-xs">
                {new Date(connectionDetails.lastError.time).toLocaleString()} -
                {connectionDetails.lastError.type} ({connectionDetails.lastError.url})
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-1"
            onClick={() => {
              disconnect();
              setTimeout(() => connect(), 1000);
            }}
            disabled={connectionStatus === 'connecting'}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Connection</span>
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center space-x-1 ml-auto"
            onClick={() => disconnect()}
            disabled={connectionStatus === 'disconnected'}
          >
            <Wifi className="h-4 w-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}