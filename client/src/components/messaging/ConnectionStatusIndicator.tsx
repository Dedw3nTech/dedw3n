import { useEffect, useState } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, Check, Clock, RefreshCw } from 'lucide-react';

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

export function ConnectionStatusIndicator() {
  const { connectionStatus, connectionDetails, connect } = useMessaging();
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  // Calculate time since last activity
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!connectionDetails.lastActivity) return '';
      
      const secondsAgo = Math.floor((Date.now() - connectionDetails.lastActivity) / 1000);
      
      if (secondsAgo < 10) return 'just now';
      if (secondsAgo < 60) return `${secondsAgo}s ago`;
      
      const minutesAgo = Math.floor(secondsAgo / 60);
      if (minutesAgo < 60) return `${minutesAgo}m ago`;
      
      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 24) return `${hoursAgo}h ago`;
      
      return 'over a day ago';
    };
    
    setTimeAgo(updateTimeAgo());
    
    // Update time ago every 10 seconds
    const timer = setInterval(() => {
      setTimeAgo(updateTimeAgo());
    }, 10000);
    
    return () => clearInterval(timer);
  }, [connectionDetails.lastActivity]);
  
  // Get appropriate icon and color based on connection status
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Disconnected',
          color: 'bg-destructive text-destructive-foreground',
          description: connectionDetails.disconnectReason || 'No connection to messaging service'
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          label: 'Connecting',
          color: 'bg-yellow-500 text-black',
          description: 'Establishing connection...'
        };
      case 'connected':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Connected',
          color: 'bg-orange-500 text-white',
          description: 'Connected but not authenticated'
        };
      case 'authenticated':
        return {
          icon: <Check className="h-4 w-4" />,
          label: 'Connected',
          color: 'bg-green-500 text-white',
          description: `Connected and authenticated${timeAgo ? ` (Last activity: ${timeAgo})` : ''}`
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Unknown',
          color: 'bg-slate-500',
          description: 'Connection status unknown'
        };
    }
  };
  
  const { icon, label, color, description } = getStatusDisplay();
  
  const handleManualReconnect = () => {
    if (connectionStatus === 'disconnected') {
      connect();
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center space-x-1 rounded px-2 py-1 cursor-pointer ${color}`}
            onClick={handleManualReconnect}
          >
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">{description}</p>
            
            {/* Connection metrics */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {/* Connection state */}
              {connectionDetails.reconnects !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reconnects:</span>
                  <span className={connectionDetails.reconnects > 3 ? "text-orange-500 font-medium" : ""}>
                    {connectionDetails.reconnects}
                  </span>
                </div>
              )}
              
              {connectionDetails.errorCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Errors:</span>
                  <span className={connectionDetails.errorCount > 0 ? "text-red-500 font-medium" : ""}>
                    {connectionDetails.errorCount}
                  </span>
                </div>
              )}
              
              {/* Ping stats */}
              {connectionDetails.pingLatency !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last ping:</span>
                  <span className={
                    connectionDetails.pingLatency < 100 ? "text-green-500" :
                    connectionDetails.pingLatency < 300 ? "text-yellow-500" : "text-red-500"
                  }>
                    {connectionDetails.pingLatency}ms
                  </span>
                </div>
              )}
              
              {connectionDetails.pingStats?.min !== undefined && connectionDetails.pingStats.min < Infinity && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Best ping:</span>
                  <span className="text-green-500">{connectionDetails.pingStats.min}ms</span>
                </div>
              )}
              
              {/* Connection uptime */}
              {connectionDetails.startTime && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span>
                    {formatUptime(Date.now() - connectionDetails.startTime)}
                  </span>
                </div>
              )}
              
              {/* Clock drift warning */}
              {connectionDetails.clockDrift && Math.abs(connectionDetails.clockDrift) > 5000 && (
                <div className="flex items-center justify-between col-span-2 text-yellow-500">
                  <span>Clock drift:</span>
                  <span>{Math.round(connectionDetails.clockDrift / 1000)}s</span>
                </div>
              )}
            </div>
            
            {connectionStatus === 'disconnected' && (
              <p className="text-xs italic pt-1">Click to attempt reconnection</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}