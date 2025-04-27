import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineAwareFetch, useOfflineStore, cacheResponse, clearCache } from "./offline";

async function throwIfResNotOk(res: Response) {
  // Special handling for offline mode
  if (res.status === 503 && !useOfflineStore.getState().isOnline) {
    // This is an expected status when offline, don't throw
    return;
  }
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData?: boolean,
): Promise<Response> {
  // Set up request options
  const options: RequestInit = {
    method,
    credentials: "include",
  };

  // Handle body and headers based on whether this is FormData or not
  if (data) {
    if (isFormData) {
      // For FormData, let the browser set the Content-Type with boundary
      options.body = data as FormData;
      // Don't set Content-Type for FormData
    } else {
      // For JSON data, set Content-Type and stringify
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }
  }

  // Use our offline-aware fetch implementation
  const res = await offlineAwareFetch(url, options);

  await throwIfResNotOk(res);
  
  // If this was a successful mutation (non-GET request), invalidate related caches
  // This ensures we don't show stale data after mutations
  if (method !== 'GET' && res.ok && useOfflineStore.getState().isOnline) {
    // Extract the base path to invalidate related queries
    const basePath = url.split('?')[0].split('/').slice(0, -1).join('/');
    if (basePath) {
      // Clear cache for this endpoint pattern
      clearCache(basePath);
      
      // Invalidate related queries in React Query cache
      queryClient.invalidateQueries({ queryKey: [basePath] });
    }
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use our offline-aware fetch implementation
    const res = await offlineAwareFetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // If we're offline and have a 503 status, try to return cached data
    if (res.status === 503 && !useOfflineStore.getState().isOnline) {
      try {
        const data = await res.json() as { error?: string };
        if (data.error === 'Currently offline') {
          // Return appropriate empty data structure based on the endpoint
          const endpoint = Array.isArray(queryKey) && queryKey.length > 0 
            ? String(queryKey[0]) 
            : '';
          
          if (endpoint.includes('/api/products')) {
            return [];
          } else if (endpoint.includes('/api/categories')) {
            return [];
          } else if (endpoint.includes('/api/cart')) {
            return { count: 0 };
          } else if (endpoint.includes('/api/messages')) {
            return { count: 0 };
          }
          return null;
        }
      } catch (e) {
        console.error('Error parsing offline response:', e);
      }
    }

    await throwIfResNotOk(res);
    
    // Cache successful GET responses for offline use
    if (useOfflineStore.getState().isOnline && 
        typeof queryKey[0] === 'string' && 
        res.status === 200) {
      const data = await res.clone().json();
      cacheResponse(queryKey[0] as string, data);
      return data;
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
