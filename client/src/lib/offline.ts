import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { warmUpOfflineCache, offlineCacheService, getCachedDataByUrl, setCachedDataByUrl } from './offline-cache-service';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
  attempts: number;
}

interface OfflineState {
  // State
  isOnline: boolean;
  isInitialized: boolean;
  queuedRequests: QueuedRequest[];
  lastSyncedAt: number | null;
  isWarmingCache: boolean;
  lastCacheWarmUp: number | null;
  
  // Actions
  setOnlineStatus: (status: boolean, warmCache?: boolean) => void;
  addQueuedRequest: (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'attempts'>) => void;
  removeQueuedRequest: (id: string) => void;
  clearQueuedRequests: () => void;
  processNextQueuedRequest: () => Promise<boolean>;
  processAllQueuedRequests: () => Promise<void>;
  setLastSyncedAt: (timestamp: number) => void;
  setInitialized: (initialized: boolean) => void;
  triggerCacheWarmUp: () => Promise<void>;
  setWarmingCache: (warming: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: navigator?.onLine ?? true,
      isInitialized: false,
      queuedRequests: [],
      lastSyncedAt: null,
      isWarmingCache: false,
      lastCacheWarmUp: null,

      // Actions
      setOnlineStatus: (status: boolean, warmCache: boolean = true) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: status });
        
        // If going offline manually, warm up the cache
        if (!status && warmCache && navigator.onLine) {
          console.log('[OfflineStore] User activated offline mode, warming cache');
          get().triggerCacheWarmUp();
        }
        
        // If coming back online, try to process the queue
        if (status && wasOffline) {
          console.log('[OfflineStore] Coming back online, processing queued requests');
          get().processAllQueuedRequests();
          
          // Invalidate stale caches after sync
          setTimeout(() => {
            offlineCacheService.clearExpired();
          }, 1000);
        }
      },

      triggerCacheWarmUp: async () => {
        if (get().isWarmingCache) {
          console.log('[OfflineStore] Cache warm-up already in progress');
          return;
        }

        set({ isWarmingCache: true });

        try {
          await warmUpOfflineCache();
          set({ 
            isWarmingCache: false,
            lastCacheWarmUp: Date.now() 
          });
          console.log('[OfflineStore] Cache warm-up completed successfully');
        } catch (error) {
          console.error('[OfflineStore] Cache warm-up failed:', error);
          set({ isWarmingCache: false });
        }
      },

      setWarmingCache: (warming: boolean) => {
        set({ isWarmingCache: warming });
      },

      addQueuedRequest: (request) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const queuedRequest: QueuedRequest = {
          ...request,
          id,
          timestamp: Date.now(),
          attempts: 0,
        };
        
        set((state) => ({
          queuedRequests: [...state.queuedRequests, queuedRequest],
        }));
        
        // If online, try to process immediately
        if (get().isOnline) {
          get().processNextQueuedRequest();
        }
      },

      removeQueuedRequest: (id: string) => {
        set((state) => ({
          queuedRequests: state.queuedRequests.filter((req) => req.id !== id),
        }));
      },

      clearQueuedRequests: () => {
        set({ queuedRequests: [] });
      },

      processNextQueuedRequest: async () => {
        const { queuedRequests } = get();
        if (queuedRequests.length === 0 || !get().isOnline) {
          return false;
        }

        const [request, ...rest] = queuedRequests;
        
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (response.ok) {
            // Success! Remove from queue
            set({ queuedRequests: rest });
            return true;
          } else {
            // Update attempts count and keep in queue if under max attempts
            const MAX_ATTEMPTS = 3;
            if (request.attempts < MAX_ATTEMPTS) {
              set({
                queuedRequests: [
                  { ...request, attempts: request.attempts + 1 },
                  ...rest,
                ],
              });
            } else {
              // Max attempts reached, remove from queue
              console.error(`Failed to process queued request after ${MAX_ATTEMPTS} attempts`, request);
              set({ queuedRequests: rest });
            }
            return false;
          }
        } catch (error) {
          console.error('Error processing queued request:', error);
          // Keep in queue for next attempt
          set({
            queuedRequests: [
              { ...request, attempts: request.attempts + 1 },
              ...rest,
            ],
          });
          return false;
        }
      },

      processAllQueuedRequests: async () => {
        if (!get().isOnline) return;
        
        let hasMore = true;
        while (hasMore && get().queuedRequests.length > 0) {
          hasMore = await get().processNextQueuedRequest();
        }

        // Update last synced timestamp
        set({ lastSyncedAt: Date.now() });
      },

      setLastSyncedAt: (timestamp: number) => {
        set({ lastSyncedAt: timestamp });
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },
    }),
    {
      name: 'offline-store',
      // Only persist these fields
      partialize: (state) => ({
        queuedRequests: state.queuedRequests,
        lastSyncedAt: state.lastSyncedAt,
        lastCacheWarmUp: state.lastCacheWarmUp,
      }),
    }
  )
);

// Initialize offline detection
export function initializeOfflineDetection() {
  if (typeof window !== 'undefined') {
    const { setOnlineStatus, setInitialized } = useOfflineStore.getState();
    
    // Set initial online status
    setOnlineStatus(navigator.onLine);
    
    // Create event handlers that can be properly removed
    const handleOnline = () => {
      setOnlineStatus(true);
    };
    
    const handleOffline = () => {
      setOnlineStatus(false);
    };
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Mark as initialized
    setInitialized(true);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  
  return () => {}; // Return empty cleanup for server-side
}

/**
 * Wraps a fetch request to handle offline mode
 * - If online, performs the fetch normally and caches the response
 * - If offline, queues write operations and returns cached data for read operations
 */
export async function offlineAwareFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const { isOnline, addQueuedRequest } = useOfflineStore.getState();
  
  // If we're online, just perform the fetch and cache successful responses
  if (isOnline) {
    try {
      const response = await fetch(url, options);
      
      // Cache successful GET requests
      if (response.ok && (options.method || 'GET') === 'GET') {
        try {
          const contentType = response.headers.get('Content-Type');
          
          // Only cache JSON responses
          if (contentType && contentType.includes('application/json')) {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            
            // Use the centralized cache setter that handles key mapping
            setCachedDataByUrl(url, data);
          }
        } catch (error) {
          console.error('[OfflineAwareFetch] Error caching response:', error);
        }
      }
      
      return response;
    } catch (error) {
      console.error('[OfflineAwareFetch] Fetch error:', error);
      throw error;
    }
  }
  
  // We're offline, handle according to request type
  const method = options.method || 'GET';
  
  if (method === 'GET') {
    // For GET requests, try to get from offline cache service using key mapping
    try {
      const cachedData = getCachedDataByUrl(url);
      if (cachedData) {
        console.log(`[OfflineAwareFetch] Serving from cache: ${url}`);
        // Return a mock Response object with the cached data
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      }
    } catch (error) {
      console.error('[OfflineAwareFetch] Error reading from cache:', error);
    }
  } else {
    // For non-GET requests, queue them to be processed when online
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    addQueuedRequest({
      url,
      method,
      body,
    });
    
    console.log(`[OfflineAwareFetch] Queued ${method} request: ${url}`);
    
    // Return a mock successful response
    return new Response(JSON.stringify({ queued: true }), {
      status: 202, // Accepted
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  }
  
  // If we got here, we're offline and couldn't get from cache
  console.warn(`[OfflineAwareFetch] No cache available for: ${url}`);
  return new Response(JSON.stringify({ error: 'Currently offline' }), {
    status: 503, // Service Unavailable
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
}

// Helper function to cache a successful GET response
export function cacheResponse(url: string, data: any) {
  try {
    localStorage.setItem(`cache:${url}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

// Helper to clear the cache for a specific URL or pattern
export function clearCache(urlPattern?: string) {
  try {
    if (!urlPattern) {
      // Clear all caches
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear caches that match the pattern
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('cache:') && key.includes(urlPattern)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}