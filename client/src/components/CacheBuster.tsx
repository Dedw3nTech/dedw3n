import { useEffect, useRef } from 'react';

/**
 * CacheBuster Component
 * Detects version changes and automatically reloads the page to get fresh content
 * This prevents users from seeing stale cached content after deployments
 */
export function CacheBuster({ children }: { children: React.ReactNode }) {
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isCheckingRef = useRef(false);
  
  useEffect(() => {
    const STORAGE_KEY = 'app-build-id';
    const CHECK_INTERVAL = 60000; // Check every minute
    const MIN_CHECK_INTERVAL = 30000; // Don't check more often than 30 seconds
    
    async function checkVersion() {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      
      try {
        // Fetch version with cache-busting timestamp
        const response = await fetch(`/version.json?t=${Date.now()}`);
        
        if (!response.ok) {
          // Version file might not exist in development
          console.log('[CacheBuster] Version file not found, skipping check');
          return;
        }
        
        const versionData = await response.json();
        const newBuildId = versionData.buildId || versionData.gitHash || versionData.buildTimestamp;
        
        if (!newBuildId) {
          console.log('[CacheBuster] No build ID found in version data');
          return;
        }
        
        const currentBuildId = localStorage.getItem(STORAGE_KEY);
        
        // First visit or cleared storage
        if (!currentBuildId) {
          localStorage.setItem(STORAGE_KEY, newBuildId);
          console.log('[CacheBuster] Initial build ID set:', newBuildId);
          return;
        }
        
        // Check if version has changed
        if (currentBuildId !== newBuildId) {
          console.log('[CacheBuster] Version change detected!');
          console.log('[CacheBuster] Current:', currentBuildId);
          console.log('[CacheBuster] New:', newBuildId);
          
          // Update stored version
          localStorage.setItem(STORAGE_KEY, newBuildId);
          
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('[CacheBuster] Cleared service worker caches');
          }
          
          // Show notification before reload
          const shouldReload = window.confirm(
            'A new version is available! Click OK to refresh and get the latest updates.'
          );
          
          if (shouldReload) {
            // Force hard reload to bypass cache
            window.location.reload();
          }
        } else {
          console.log('[CacheBuster] Version unchanged:', currentBuildId);
        }
      } catch (error) {
        console.error('[CacheBuster] Version check failed:', error);
      } finally {
        isCheckingRef.current = false;
      }
    }
    
    // Initial check after a short delay
    const initialTimeout = setTimeout(() => {
      checkVersion();
    }, 5000);
    
    // Set up periodic checking (but not too frequently)
    checkIntervalRef.current = setInterval(() => {
      checkVersion();
    }, Math.max(CHECK_INTERVAL, MIN_CHECK_INTERVAL));
    
    // Also check when page becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce to avoid too frequent checks
        setTimeout(checkVersion, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return <>{children}</>;
}

/**
 * Silent CacheBuster - Auto-reloads without user prompt
 * Use this for critical updates where you want to force refresh
 */
export function SilentCacheBuster({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const STORAGE_KEY = 'app-build-id-silent';
    
    async function checkAndReload() {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;
        
        const versionData = await response.json();
        const newBuildId = versionData.buildId || versionData.gitHash || versionData.buildTimestamp;
        
        if (!newBuildId) return;
        
        const currentBuildId = sessionStorage.getItem(STORAGE_KEY);
        
        if (!currentBuildId) {
          sessionStorage.setItem(STORAGE_KEY, newBuildId);
          return;
        }
        
        if (currentBuildId !== newBuildId) {
          console.log('[SilentCacheBuster] Auto-reloading for new version');
          sessionStorage.setItem(STORAGE_KEY, newBuildId);
          
          // Clear caches and reload immediately
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          window.location.reload();
        }
      } catch (error) {
        console.error('[SilentCacheBuster] Check failed:', error);
      }
    }
    
    // Check on mount and when page becomes visible
    checkAndReload();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndReload();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return <>{children}</>;
}