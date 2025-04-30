import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineAwareFetch, useOfflineStore, cacheResponse, clearCache } from "./offline";

// Auth token management
const AUTH_TOKEN_KEY = 'dedwen_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Error storing auth token:', e);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Error clearing auth token:', e);
  }
}

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
    headers: {}
  };

  // Add authorization header if token exists
  const authToken = getStoredAuthToken();
  if (authToken) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    };
  }

  // Handle body and headers based on whether this is FormData or not
  if (data) {
    if (isFormData) {
      // For FormData, let the browser set the Content-Type with boundary
      options.body = data as FormData;
      // Don't set Content-Type for FormData
    } else {
      // For JSON data, set Content-Type and stringify
      options.headers = { 
        ...options.headers,
        "Content-Type": "application/json"
      };
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
    let url = queryKey[0] as string;
    
    // Handle query parameters if present in queryKey
    if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          params.append(key, queryParams[key].toString());
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    console.log('Fetching URL:', url);
    
    // Set up request options
    const options: RequestInit = {
      credentials: "include",
      headers: {}
    };

    // Add authorization header if token exists
    const authToken = getStoredAuthToken();
    if (authToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      };
    }

    // Use our offline-aware fetch implementation
    const res = await offlineAwareFetch(url, options);

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
        res.status === 200) {
      const data = await res.clone().json();
      cacheResponse(url, data);
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

/**
 * Safely handle blob URLs to prevent DOMException errors
 * when a blob URL is no longer valid
 * @param url The URL to sanitize
 * @param fallback Optional fallback URL to use if the input is a blob URL
 * @returns A safe URL that won't cause DOMException errors
 */
export function sanitizeImageUrl(url: string | null | undefined, fallback?: string): string {
  // If no URL or empty string, return fallback or placeholder
  if (!url) {
    return fallback || '/assets/default-avatar.png';
  }
  
  // Check if it's a blob URL (which can cause DOMException if not valid)
  if (url.startsWith('blob:')) {
    try {
      // Test if the blob URL is still valid
      const blobUrlExistence = fetch(url, { method: 'HEAD' })
        .then(() => true)
        .catch(() => false);
        
      // If it fails, we'll use the fallback
      if (!blobUrlExistence) {
        console.warn('Detected invalid blob URL, using fallback');
        return fallback || '/assets/default-avatar.png';
      }
    } catch (e) {
      // If any error occurs when dealing with the blob URL, use fallback
      console.warn('Error with blob URL, using fallback', e);
      return fallback || '/assets/default-avatar.png';
    }
  }
  
  return url;
}
