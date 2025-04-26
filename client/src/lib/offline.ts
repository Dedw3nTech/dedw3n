import { create } from 'zustand';

// Define the type for the offline store state
type OfflineState = {
  isOnline: boolean;
  queuedRequests: { 
    url: string; 
    method: string; 
    body?: any; 
    timestamp: number;
  }[];
  addQueuedRequest: (request: { url: string; method: string; body?: any }) => void;
  processQueuedRequests: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
};

// Create a store for offline state management
export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine, // Initialize with current online status
  queuedRequests: [],
  
  addQueuedRequest: (request) => {
    const { url, method, body } = request;
    set((state) => ({
      queuedRequests: [
        ...state.queuedRequests,
        { url, method, body, timestamp: Date.now() }
      ]
    }));
    
    // Save to localStorage for persistence across refreshes
    try {
      const currentQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      localStorage.setItem('offlineQueue', JSON.stringify([
        ...currentQueue,
        { url, method, body, timestamp: Date.now() }
      ]));
    } catch (error) {
      console.error('Failed to save request to offline queue:', error);
    }
  },
  
  processQueuedRequests: async () => {
    const { queuedRequests } = get();
    if (queuedRequests.length === 0) return;
    
    // Process each request that was queued while offline
    const failedRequests = [];
    
    for (const request of queuedRequests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
      } catch (error) {
        console.error('Failed to process queued request:', error);
        failedRequests.push(request);
      }
    }
    
    // Update the store with any failed requests
    set({ queuedRequests: failedRequests });
    
    // Update localStorage
    localStorage.setItem('offlineQueue', JSON.stringify(failedRequests));
  },
  
  setOnlineStatus: (status) => {
    set({ isOnline: status });
    if (status) {
      // If we're coming back online, try to process the queue
      get().processQueuedRequests();
    }
  },
}));

// Initialize offline detection
export function initializeOfflineDetection() {
  const { setOnlineStatus } = useOfflineStore.getState();
  
  // Load any queued requests from localStorage
  try {
    const savedQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (savedQueue.length > 0) {
      useOfflineStore.setState({ queuedRequests: savedQueue });
    }
  } catch (error) {
    console.error('Failed to load offline queue:', error);
  }
  
  // Set up event listeners for online/offline status
  window.addEventListener('online', () => {
    console.log('App is online');
    setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    setOnlineStatus(false);
  });
}

// Wrapper for fetch that handles offline scenarios
export async function offlineFetch(url: string, options: RequestInit = {}) {
  const { isOnline, addQueuedRequest } = useOfflineStore.getState();
  
  if (!isOnline) {
    // We're offline, queue the request for later
    console.log('Queuing request for when online:', url);
    
    // Only queue mutable requests (POST, PUT, PATCH, DELETE)
    const method = options.method || 'GET';
    if (method !== 'GET') {
      addQueuedRequest({
        url,
        method,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
    }
    
    // For GET requests or if we have cached data, return that
    const cachedData = localStorage.getItem(`cache:${url}`);
    if (cachedData) {
      return new Response(cachedData, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // If no cached data, return a 503 Service Unavailable
    return new Response(JSON.stringify({ error: 'Currently offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // We're online, proceed with the fetch
  try {
    const response = await fetch(url, options);
    
    // Cache GET responses for offline use
    if (options.method === 'GET' || !options.method) {
      const clonedResponse = response.clone();
      const responseData = await clonedResponse.text();
      localStorage.setItem(`cache:${url}`, responseData);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    
    // Handle fetch errors (might be offline)
    useOfflineStore.setState({ isOnline: false });
    
    // See if we have cached data
    const cachedData = localStorage.getItem(`cache:${url}`);
    if (cachedData) {
      return new Response(cachedData, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    throw error;
  }
}

// Function to clear all cached data
export function clearOfflineCache() {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Remove all cache entries
  keys.forEach(key => {
    if (key.startsWith('cache:')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear queued requests
  localStorage.removeItem('offlineQueue');
  useOfflineStore.setState({ queuedRequests: [] });
}