import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineAwareFetch, useOfflineStore, cacheResponse, clearCache } from "./offline";

// API Base URL Configuration
// Automatically determines the correct API base URL based on environment
function getApiBaseUrl(): string {
  // In development, always use current origin to avoid CORS issues
  // This handles both desktop and mobile Replit previews
  const isDevelopment = import.meta.env.DEV || 
                        import.meta.env.MODE === 'development' ||
                        (typeof window !== 'undefined' && 
                         (window.location.hostname === 'localhost' ||
                          window.location.hostname.includes('replit.dev') ||
                          window.location.hostname.includes('repl.co')));
  
  if (isDevelopment && typeof window !== 'undefined') {
    // Use current origin in development to ensure API calls work
    return window.location.origin;
  }
  
  // In production builds, check environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to relative URLs (SSR case or unset production)
  return '';
}

const API_BASE_URL = getApiBaseUrl();

// In-flight request cache to deduplicate concurrent identical requests
// Stores the original response that can be cloned for each consumer
interface InflightEntry {
  promise: Promise<Response>;
  response?: Response;
}
const inflightRequests = new Map<string, InflightEntry>();
const INFLIGHT_TTL = 1000; // 1 second TTL for in-flight cache

function getInflightKey(url: string, method: string, body?: string): string {
  return `${method}:${url}:${body || ''}`;
}

// Helper function to construct full API URLs
function getApiUrl(path: string): string {
  // If path already starts with http:// or https://, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If no base URL is configured, use relative path (development)
  if (!API_BASE_URL) {
    return path;
  }
  
  // Construct full URL with base URL (production)
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

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

export interface ApiRequestOptions extends RequestInit {
  isFormData?: boolean;
}

// Overloaded function for both single URL parameter (GET) and full parameters
export async function apiRequest(url: string): Promise<any>;
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions,
): Promise<Response>;
export async function apiRequest(
  urlOrMethod: string,
  url?: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions,
): Promise<any> {
  // Handle single parameter case (GET request)
  if (url === undefined) {
    const getUrl = urlOrMethod;
    const response = await apiRequestFull('GET', getUrl, undefined, options);
    
    // Validate content-type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, received: ${contentType || 'unknown'}`);
    }
    
    return response.json();
  }
  
  // Handle full parameter case
  return apiRequestFull(urlOrMethod, url, data, options);
}

async function apiRequestFull(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions,
): Promise<Response> {
  // Extract isFormData from options
  const isFormData = options?.isFormData;
  
  // Check for logout state from unified system
  let userLoggedOut = false;
  try {
    userLoggedOut = localStorage.getItem('unified_logout_state') === 'true';
  } catch (e) {
    // Continue with userLoggedOut = false
  }
  
  // Set up request options with enhanced authentication headers
  const requestOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      // Always include these session-related headers for improved auth reliability
      'X-Use-Session': 'true',
      'X-Client-Auth': 'true',
      'X-Request-Time': new Date().toISOString(),
      // Auto-login disabled for security
      'X-Auto-Login': 'false',
      // Add logout header if user has logged out
      ...(userLoggedOut ? { 'X-Auth-Logged-Out': 'true' } : {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // userId temporarily disabled
      // ...(userId && !userLoggedOut ? { 
      //   'X-Client-User-ID': userId.toString(), 
      //   'X-Test-User-ID': userId.toString() 
      // } : {})
    } as HeadersInit,
    ...(typeof options === 'object' && options !== null ? options : {})
  };

  // Removed auto-login functionality for security compliance

  // Auto-login completely removed for security

  // Special handling for login/register routes to ensure we can login even when logged out flag is set
  if (url === '/api/login' || url === '/api/register' || url === '/api/auth/login' || url === '/api/auth/register') {
    // Clear the logged out flag for login/register attempts
    try {
      localStorage.removeItem('unified_logout_state');
    } catch (e) {
      // Continue silently
    }
    // Remove logout headers for login attempts
    if (requestOptions.headers && typeof requestOptions.headers === 'object') {
      const headers = requestOptions.headers as Record<string, string>;
      delete headers['X-User-Logged-Out'];
      delete headers['X-Auth-Logged-Out'];
    }
  } 
  // Add logout headers if user has logged out
  else if (userLoggedOut) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-User-Logged-Out': 'true',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  // Add authorization header if token exists with enhanced auth reliability
  const authToken = getStoredAuthToken();
  if (authToken) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'Authorization': `Bearer ${authToken}`,
      'X-Auth-Token-Present': 'true',
      'X-Auth-Token-Type': 'jwt'
    };
  } else {
    // Mark that we don't have a token but still want session auth to work
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-Auth-Token-Present': 'false',
      'X-Auth-Method': 'session'
    };
  }

  // Handle body and headers based on content type
  if (data) {
    // Check if the request is specifically for post creation
    const isPostCreation = url.includes('/api/posts') && (method === 'POST' || method === 'PUT');
    
    if (isFormData) {
      // For FormData, let the browser set the Content-Type with boundary
      requestOptions.body = data as FormData;
      // Don't set Content-Type for FormData
    } else if (isPostCreation) {
      // For post creation, use x-www-form-urlencoded format instead of multipart form-data
      // This is to avoid the 500 error with Rails multipart parser
      requestOptions.headers = { 
        ...requestOptions.headers,
        "Content-Type": "application/x-www-form-urlencoded"
      };
      
      // Convert data object to URLSearchParams
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data as Record<string, any>)) {
        if (typeof value === 'object' && value !== null) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
      requestOptions.body = params;
    } else {
      // For JSON data, set Content-Type and stringify
      requestOptions.headers = { 
        ...requestOptions.headers,
        "Content-Type": "application/json"
      };
      requestOptions.body = JSON.stringify(data);
    }
  }

  try {
    // Construct full URL with API base URL
    const fullUrl = getApiUrl(url);
    
    // Check for in-flight requests with same key (for GET requests)
    const inflightKey = getInflightKey(fullUrl, method, method === 'GET' ? undefined : requestOptions.body as string);
    
    if (method === 'GET') {
      const existing = inflightRequests.get(inflightKey);
      if (existing) {
        try {
          // Wait for the in-flight request to complete
          await existing.promise;
          // Return a fresh clone for this consumer
          if (existing.response) {
            const clone = existing.response.clone();
            // Validate response status before returning
            await throwIfResNotOk(clone);
            // Return a new clone since throwIfResNotOk may have consumed the body
            return existing.response.clone();
          }
        } catch (error) {
          // If the shared request failed, remove it so retry can happen
          inflightRequests.delete(inflightKey);
          throw error;
        }
      }
      
      // Create new request promise
      const requestPromise = offlineAwareFetch(fullUrl, requestOptions);
      const entry: InflightEntry = { promise: requestPromise };
      inflightRequests.set(inflightKey, entry);
      
      // Use finally to ensure cleanup happens on both success and failure
      requestPromise.finally(() => {
        setTimeout(() => {
          inflightRequests.delete(inflightKey);
        }, INFLIGHT_TTL);
      });
      
      try {
        // Wait for response and store it for cloning
        const response = await requestPromise;
        
        // Validate response status before storing
        await throwIfResNotOk(response.clone());
        
        // Store a clone for future consumers
        entry.response = response.clone();
        
        // Return the original response
        return response;
      } catch (error) {
        // Clean up immediately on error so retries can happen faster
        inflightRequests.delete(inflightKey);
        throw error;
      }
    }
    
    // For non-GET requests, just make the request directly
    const res = await offlineAwareFetch(fullUrl, requestOptions);

    // Clear logout state on successful authentication
    if (res.ok && (url.includes('/auth/login') || url.includes('/auth/register'))) {
      console.log('Successful authentication - clearing logout state');
      try {
        localStorage.removeItem('unified_logout_state');
      } catch (e) {
        // Continue silently
      }
    }

    // Handle authentication errors properly - dispatch event for auth context
    if (res.status === 401 || res.status === 403) {
      console.log('[AUTH-ERROR] Authentication error detected:', res.status);
      window.dispatchEvent(new CustomEvent('auth-error', { 
        detail: { status: res.status, url } 
      }));
    }

    await throwIfResNotOk(res);
    
    // If this was a successful mutation (non-GET request), invalidate related caches
    // This ensures we don't show stale data after mutations
    if (method !== 'GET' && res.ok && useOfflineStore.getState().isOnline) {
      // Extract the exact path and base path for proper invalidation
      const exactPath = url.split('?')[0];
      const basePath = exactPath.split('/').slice(0, -1).join('/');
      
      // Clear cache for both exact and base paths
      clearCache(exactPath);
      if (basePath) {
        clearCache(basePath);
      }
      
      // Invalidate queries with partial matching to refresh list queries
      // Use refetchType:'inactive' to avoid cascading unnecessary refetches
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey === exactPath || queryKey === basePath || queryKey.startsWith(basePath + '/');
        },
        refetchType: 'inactive'
      });
      
      // Special case for posts - also invalidate feed endpoints
      if (url.includes('/api/posts')) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/feed/personal'],
          refetchType: 'inactive'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/feed/communities'],
          refetchType: 'inactive'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/feed/recommended'],
          refetchType: 'inactive'
        });
      }
    }
    
    return res;
  } catch (error) {
    // Handle AbortError separately so we can provide a clearer message
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn(`Request to ${url} was aborted (timeout or cancelled)`);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Determines a safe default return value based on the API endpoint URL
 * This prevents "Cannot read properties of null" errors when queries return null
 */
function getSafeDefaultForEndpoint(url: string): any {
  // List endpoints typically return arrays
  const arrayEndpoints = [
    '/products', '/users', '/orders', '/categories', '/vendors',
    '/messages', '/notifications', '/reviews', '/conversations',
    '/posts', '/comments', '/communities', '/feed',
    '/cart', '/liked-products', '/saved-posts'
  ];
  
  // Check if this URL is for a list endpoint
  const isArrayEndpoint = arrayEndpoints.some(endpoint => url.includes(endpoint));
  
  // Return empty array for list endpoints, null for others
  return isArrayEndpoint ? [] : null;
}

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
    
    // Construct full URL with API base URL
    const fullUrl = getApiUrl(url);
    console.log('Full API URL:', fullUrl);
    
    // Set up request options
    const options: RequestInit = {
      credentials: "include",
      headers: {
        // Always include these session-related headers for improved auth reliability
        'X-Use-Session': 'true',
        'X-Client-Auth': 'true',
        'X-Auto-Login': 'false',
        'X-Request-Time': new Date().toISOString()
      }
    };

    // Check if user is logged out via unified logout system
    let userLoggedOut = false;
    try {
      userLoggedOut = localStorage.getItem('unified_logout_state') === 'true';
    } catch (e) {
      // Continue with userLoggedOut = false
    }

    // Add logout headers if user has logged out
    if (userLoggedOut) {
      options.headers = {
        ...options.headers,
        'X-User-Logged-Out': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
    }

    // Add authorization header if token exists
    const authToken = getStoredAuthToken();
    if (authToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`,
        'X-Auth-Token-Present': 'true'
      };
    } else {
      options.headers = {
        ...options.headers,
        'X-Auth-Token-Present': 'false',
        'X-Auth-Method': 'session'
      };
    }

    // Add user ID to headers if available (temporarily disabled)
    // if (userId) {
    //   options.headers = {
    //     ...options.headers,
    //     'X-Client-User-ID': userId.toString()
    //   };
    // }

    try {
      const res = await offlineAwareFetch(fullUrl, options);

      // Clear logout state on successful authentication
      if (res.ok && (url.includes('/auth/login') || url.includes('/auth/register'))) {
        console.log('Successful authentication - clearing logout state');
        try {
          localStorage.removeItem('unified_logout_state');
        } catch (e) {
          // Continue silently
        }
      }

      // Handle authentication errors properly - dispatch event for auth context
      if (res.status === 401 || res.status === 403) {
        console.log('[AUTH-ERROR] Authentication error detected in query:', res.status);
        window.dispatchEvent(new CustomEvent('auth-error', { 
          detail: { status: res.status, url } 
        }));
        
        if (unauthorizedBehavior === "returnNull") {
          // Return a safe default value instead of null to prevent "Cannot read properties of null" errors
          return getSafeDefaultForEndpoint(url);
        } else {
          throw new Error("Unauthorized");
        }
      }

      await throwIfResNotOk(res);

      // Cache successful responses for offline access
      if (res.ok && useOfflineStore.getState().isOnline) {
        cacheResponse(url, res.clone());
      }

      try {
        const data = await res.json();
        
        // Additional safety: if data is null/undefined for array endpoints, return empty array
        if (data === null || data === undefined) {
          return getSafeDefaultForEndpoint(url);
        }
        
        return data;
      } catch (jsonError) {
        // If JSON parsing fails, log the error and return a safe default
        console.error('JSON parsing error for', url, jsonError);
        return getSafeDefaultForEndpoint(url);
      }
    } catch (error) {
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export const sanitizeImageUrl = (url: string, fallback: string = "/assets/default-avatar.png"): string => {
  if (!url || url.trim() === '') {
    return fallback;
  }
  
  // If URL contains a full domain (http:// or https://), extract the path only
  // This ensures avatars work across all domains (production, staging, dev)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      // Return only the pathname (e.g., /public-objects/avatars/image.png)
      return urlObj.pathname;
    } catch (e) {
      console.warn('[sanitizeImageUrl] Invalid URL, using fallback:', url);
      return fallback;
    }
  }
  
  // If it's already a relative path starting with /, return it
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it's a relative path without /, prepend with a slash
  return `/${url}`;
};