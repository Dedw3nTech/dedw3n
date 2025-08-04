import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  timestamp: number;
  products: any[];
  userProfile: any;
  conversations: any[];
  notifications: any[];
}

export function useOfflineMode() {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have offline data stored
    const storedOfflineData = localStorage.getItem('dedw3n-offline-data');
    const offlineMode = localStorage.getItem('dedw3n-offline-mode') === 'true';
    
    if (storedOfflineData) {
      setOfflineData(JSON.parse(storedOfflineData));
    }
    
    setIsOffline(offlineMode);

    // Listen for online/offline status changes
    const handleOnline = () => {
      if (isOffline && localStorage.getItem('dedw3n-offline-mode') === 'true') {
        toast({
          title: "Connection Restored",
          description: "You're back online! Offline mode is still active.",
          variant: "default"
        });
      }
    };

    const handleOffline = () => {
      if (!isOffline) {
        toast({
          title: "Connection Lost",
          description: "You've gone offline. Consider enabling offline mode for better experience.",
          variant: "destructive"
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, toast]);

  const cacheDataForOffline = async () => {
    try {
      // Cache essential data for offline use
      const dataToCache: OfflineData = {
        timestamp: Date.now(),
        products: [],
        userProfile: null,
        conversations: [],
        notifications: []
      };

      // Try to fetch and cache current data
      try {
        const [productsRes, userRes, conversationsRes, notificationsRes] = await Promise.allSettled([
          fetch('/api/products?limit=50'),
          fetch('/api/user'),
          fetch('/api/messages/conversations'),
          fetch('/api/notifications/unread/count')
        ]);

        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          dataToCache.products = await productsRes.value.json();
        }

        if (userRes.status === 'fulfilled' && userRes.value.ok) {
          dataToCache.userProfile = await userRes.value.json();
        }

        if (conversationsRes.status === 'fulfilled' && conversationsRes.value.ok) {
          dataToCache.conversations = await conversationsRes.value.json();
        }

        if (notificationsRes.status === 'fulfilled' && notificationsRes.value.ok) {
          dataToCache.notifications = await notificationsRes.value.json();
        }
      } catch (error) {
        console.warn('Some data could not be cached for offline use:', error);
      }

      localStorage.setItem('dedw3n-offline-data', JSON.stringify(dataToCache));
      setOfflineData(dataToCache);
      
      return true;
    } catch (error) {
      console.error('Failed to cache data for offline mode:', error);
      return false;
    }
  };

  const toggleOfflineMode = async () => {
    if (!isOffline) {
      // Enabling offline mode
      toast({
        title: "Preparing Offline Mode",
        description: "Caching data for offline use...",
        variant: "default"
      });

      const success = await cacheDataForOffline();
      
      if (success) {
        setIsOffline(true);
        localStorage.setItem('dedw3n-offline-mode', 'true');
        
        toast({
          title: "Offline Mode Enabled",
          description: "You can now use Dedw3n without an internet connection. Some features may be limited.",
          variant: "default"
        });

        // Reload the page to apply offline mode
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Offline Mode Failed",
          description: "Could not cache data. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // Disabling offline mode
      setIsOffline(false);
      localStorage.setItem('dedw3n-offline-mode', 'false');
      localStorage.removeItem('dedw3n-offline-data');
      setOfflineData(null);
      
      toast({
        title: "Offline Mode Disabled",
        description: "You're back to full online functionality.",
        variant: "default"
      });

      // Reload the page to apply online mode
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const clearOfflineData = () => {
    localStorage.removeItem('dedw3n-offline-data');
    localStorage.removeItem('dedw3n-offline-mode');
    setOfflineData(null);
    setIsOffline(false);
  };

  return {
    isOffline,
    offlineData,
    toggleOfflineMode,
    clearOfflineData,
    cacheDataForOffline
  };
}