import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  
  // Actions
  setOnlineStatus: (status: boolean) => void;
  addQueuedRequest: (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'attempts'>) => void;
  removeQueuedRequest: (id: string) => void;
  clearQueuedRequests: () => void;
  processNextQueuedRequest: () => Promise<boolean>;
  processAllQueuedRequests: () => Promise<void>;
  setLastSyncedAt: (timestamp: number) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: navigator?.onLine ?? true,
      isInitialized: false,
      queuedRequests: [],
      lastSyncedAt: null,

      // Actions
      setOnlineStatus: (status: boolean) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: status });
        
        // If coming back online, try to process the queue
        if (status && wasOffline) {
          get().processAllQueuedRequests();
        }
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
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      setOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
      setOnlineStatus(false);
    });
    
    // Mark as initialized
    setInitialized(true);
  }
}

/**
 * Wraps a fetch request to handle offline mode
 * - If online, performs the fetch normally
 * - If offline, queues write operations and returns cached data for read operations
 */
export async function offlineAwareFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const { isOnline, addQueuedRequest } = useOfflineStore.getState();
  
  // If we're online, just perform the fetch
  if (isOnline) {
    try {
      return fetch(url, options);
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
  // We're offline, handle according to request type
  const method = options.method || 'GET';
  
  if (method === 'GET') {
    // For GET requests, try to get from cache
    try {
      const cachedData = localStorage.getItem(`cache:${url}`);
      if (cachedData) {
        // Return a mock Response object with the cached data
        return new Response(cachedData, {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
  } else {
    // For non-GET requests, queue them to be processed when online
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    addQueuedRequest({
      url,
      method,
      body,
    });
    
    // Return a mock successful response
    return new Response(JSON.stringify({ queued: true }), {
      status: 202, // Accepted
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  }
  
  // If we got here, we're offline and couldn't get from cache
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