import { useState } from "react";
import { useOfflineStore, clearCache } from "@/lib/offline";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, RefreshCw, Database, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";

export default function OfflineSimulator() {
  const { isOnline, setOnlineStatus, queuedRequests, processAllQueuedRequests, clearQueuedRequests } = useOfflineStore();
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  return (
    <div className="fixed top-24 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg p-4 rounded-lg border border-gray-200 dark:border-gray-700 w-80">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-amber-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Offline Simulator</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0" 
          onClick={() => setIsOpen(!isOpen)}>
          <X size={14} />
        </Button>
      </div>
      
      {isOpen && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-900 p-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="offline-mode"
                  checked={isOnline}
                  onCheckedChange={(checked) => {
                    setOnlineStatus(checked);
                  }}
                />
                <Label htmlFor="offline-mode" className="text-sm font-medium cursor-pointer">
                  {isOnline ? 'Online' : 'Offline'}
                </Label>
              </div>
              
              <Badge variant={isOnline ? "default" : "outline"} className="ml-2">
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Pending Requests</span>
                <Badge variant={queuedRequests.length > 0 ? "default" : "outline"}>
                  {queuedRequests.length}
                </Badge>
              </div>
              
              {queuedRequests.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-md bg-gray-50 dark:bg-gray-900 p-2">
                  {queuedRequests.map((req) => (
                    <div key={req.id} className="text-xs mb-1 py-1 px-2 bg-white dark:bg-gray-800 rounded">
                      <span className="font-mono">{req.method}</span> {req.url.split('/').slice(-2).join('/')}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="flex flex-col space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => processAllQueuedRequests()}
                  disabled={queuedRequests.length === 0 || !isOnline}
                >
                  <RefreshCw size={12} className="mr-1" />
                  Sync Requests
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => clearQueuedRequests()}
                  disabled={queuedRequests.length === 0}
                >
                  <X size={12} className="mr-1" />
                  Clear Queue
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => {
                  clearCache();
                  queryClient.clear();
                }}
              >
                <Database size={12} className="mr-1" />
                Clear Cache & Refresh
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 italic">
              Use this panel to test the app's behavior in offline/online scenarios.
            </p>
          </div>
      )}
    </div>
  );
}