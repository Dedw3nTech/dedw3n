import { useOfflineStore } from "@/lib/offline";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export default function OfflineSimulator() {
  const { isOnline, setOnlineStatus, queuedRequests } = useOfflineStore();
  const { t } = useTranslation();

  return (
    <div className="fixed top-24 right-4 z-50 bg-white dark:bg-gray-800 shadow-md p-4 rounded-lg border border-gray-200 dark:border-gray-700 w-72">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Offline Simulator</h3>
        
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
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Current status: <span className={isOnline ? 'text-green-500' : 'text-amber-500'}>
            {isOnline ? 'Online' : 'Offline'}
          </span></p>
          {queuedRequests.length > 0 && (
            <p className="mt-1">
              Pending requests: <span className="font-medium">{queuedRequests.length}</span>
            </p>
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          Toggle to simulate offline/online behavior
        </p>
      </div>
    </div>
  );
}