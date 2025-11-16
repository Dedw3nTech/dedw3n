import { useEffect, useState } from "react";
import { useOfflineStore } from "@/lib/offline";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { X, Wifi, WifiOff, Cloud, ArrowUpFromLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const { isOnline, queuedRequests } = useOfflineStore();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { translateText } = useMasterTranslation();

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
          className="fixed bottom-0 left-0 right-0 z-50 p-4 flex items-center justify-between shadow-lg bg-black text-white"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full">
              {!isOnline ? (
                <WifiOff size={18} className="text-white" />
              ) : queuedRequests.length > 0 ? (
                <ArrowUpFromLine size={18} className="text-white" />
              ) : (
                <Wifi size={18} className="text-white" />
              )}
            </div>
            <div>
              {!isOnline ? (
                <p className="font-medium text-sm text-white">
                  {translateText('You are offline')}{queuedRequests.length > 0 && ` (${queuedRequests.length})`}
                </p>
              ) : queuedRequests.length > 0 ? (
                <p className="font-medium text-sm text-white">
                  {translateText('Syncing offline changes...')} ({queuedRequests.length})
                </p>
              ) : (
                <p className="font-medium text-sm text-white">
                  {translateText('Back online')}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              setIsDismissed(true);
              setShowBanner(false);
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}