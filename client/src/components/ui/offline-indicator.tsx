import { useEffect, useState } from "react";
import { useOfflineStore } from "@/lib/offline";
import { useTranslation } from "react-i18next";
import { X, Wifi, WifiOff, Cloud, ArrowUpFromLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <AnimatePresence>
      {showBanner && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-0 left-0 right-0 z-50 p-4 flex items-center justify-between shadow-lg ${
            isOnline ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : 
                       "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-full">
              {!isOnline ? (
                <WifiOff size={18} className="text-amber-500" />
              ) : queuedRequests.length > 0 ? (
                <ArrowUpFromLine size={18} className="text-green-500" />
              ) : (
                <Wifi size={18} className="text-green-500" />
              )}
            </div>
            <div>
              {!isOnline ? (
                <p className="font-medium text-sm">
                  {t('offline.status')}
                  {queuedRequests.length > 0 && (
                    <span className="ml-1">
                      {t('offline.pending', {count: queuedRequests.length})}
                    </span>
                  )}
                </p>
              ) : queuedRequests.length > 0 ? (
                <p className="font-medium text-sm">
                  {t('offline.syncing', {count: queuedRequests.length})}
                </p>
              ) : (
                <p className="font-medium text-sm">
                  {t('offline.back_online')}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              setIsDismissed(true);
              setShowBanner(false);
            }}
            className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}