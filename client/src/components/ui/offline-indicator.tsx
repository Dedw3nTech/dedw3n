import { useEffect, useState } from "react";
import { useOfflineStore } from "@/lib/offline";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, queuedRequests } = useOfflineStore();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation();

  // Show the banner when offline, or when there are queued requests
  useEffect(() => {
    if (!isOnline || queuedRequests.length > 0) {
      setShowBanner(true);
    } else {
      // Only auto-hide the banner if it wasn't dismissed manually
      if (!isDismissed) {
        // Add a small delay before hiding to provide visual feedback when connection is restored
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, queuedRequests.length, isDismissed]);

  // Reset the dismissed state when going offline again
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 flex items-center justify-between ${
        isOnline ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-amber-500"}`}></div>
        <div>
          {!isOnline ? (
            <p className="font-medium text-sm">
              {t('offline.status', 'You are currently offline')}
              {queuedRequests.length > 0 && (
                <span className="ml-1">
                  {t('offline.pending', '({{count}} pending actions)', {count: queuedRequests.length})}
                </span>
              )}
            </p>
          ) : queuedRequests.length > 0 ? (
            <p className="font-medium text-sm">
              {t('offline.syncing', 'Syncing {{count}} pending actions...', {count: queuedRequests.length})}
            </p>
          ) : (
            <p className="font-medium text-sm">
              {t('offline.back_online', 'You are back online')}
            </p>
          )}
        </div>
      </div>
      <button 
        onClick={() => {
          setIsDismissed(true);
          setShowBanner(false);
        }}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}