import { useEffect, useState } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, Check, Clock, RefreshCw } from 'lucide-react';

export function ConnectionStatusIndicator() {
  const { connectionStatus, connectionDetails, connect } = useMessaging();
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
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{description}</p>
            {connectionDetails.reconnects !== undefined && connectionDetails.reconnects > 0 && (
              <p className="text-xs text-muted-foreground">
                Reconnection attempts: {connectionDetails.reconnects}
              </p>
            )}
            {connectionDetails.errorCount ? (
              <p className="text-xs text-muted-foreground">
                Connection errors: {connectionDetails.errorCount}
              </p>
            ) : null}
            {connectionStatus === 'disconnected' && (
              <p className="text-xs italic">Click to attempt reconnection</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}