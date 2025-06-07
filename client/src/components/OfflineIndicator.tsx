import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 md:bottom-4 md:left-auto md:right-4 md:w-auto">
      <div className="flex items-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">{t('offline.message')}</span>
      </div>
    </div>
  );
}