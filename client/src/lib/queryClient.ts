import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineAwareFetch, useOfflineStore, cacheResponse, clearCache } from "./offline";

// Auth token management
const AUTH_TOKEN_KEY = 'dedwen_auth_token';
const LOGGED_OUT_FLAG_KEY = 'dedwen_logged_out';

// Check if user is logged out
export function isUserLoggedOut(): boolean {
  try {
    return localStorage.getItem(LOGGED_OUT_FLAG_KEY) === 'true';
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return false;
  }
}

// Set the logged out flag
export function setLoggedOutFlag(isLoggedOut: boolean): void {
  try {
    if (isLoggedOut) {
      localStorage.setItem(LOGGED_OUT_FLAG_KEY, 'true');
      sessionStorage.setItem(LOGGED_OUT_FLAG_KEY, 'true');
      // Also clear any user data to ensure clean logout
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userData');
      console.log('Logout flag set - user officially logged out');
    } else {
      localStorage.removeItem(LOGGED_OUT_FLAG_KEY);
      sessionStorage.removeItem(LOGGED_OUT_FLAG_KEY);
    }
  } catch (e) {
    console.error('Error setting logged out flag:', e);
  }
}

export function getStoredAuthToken(): string | null {
  try {
    // If user explicitly logged out, don't return token
    if (isUserLoggedOut()) {
      return null;
    }
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    // When setting a token, clear the logged out flag
    setLoggedOutFlag(false);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Error storing auth token:', e);
  }
}

export function clearAuthToken(): void {
  try {
    // When clearing token, set the logged out flag
    setLoggedOutFlag(true);
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
  
  // Get userId from session or localStorage if available
  let userId = null;
  try {
    // First try sessionStorage - faster and more reliable for same session
    const userDataString = sessionStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      userId = userData.id;
      console.log('Using userId from sessionStorage:', userId);
    } 
    // Fallback to localStorage if needed
    else {
      const localUserDataString = localStorage.getItem('userData');
      if (localUserDataString) {
        const localUserData = JSON.parse(localUserDataString);
        userId = localUserData.id;
        console.log('Using userId from localStorage:', userId);
      }
    }
  } catch (e) {
    console.error('Error retrieving user data from storage:', e);
  }
  
  // Check if user has logged out
  const userLoggedOut = isUserLoggedOut();
  
  // Set up request options with enhanced authentication headers
  const requestOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      // Always include these session-related headers for improved auth reliability
      'X-Use-Session': 'true',
      'X-Client-Auth': 'true',
      'X-Request-Time': new Date().toISOString(),
      // Disable auto-login to show proper login screen
      'X-Auto-Login': 'false',
      // Add logout header if user has logged out
      ...(userLoggedOut ? { 'X-Auth-Logged-Out': 'true' } : {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(userId && !userLoggedOut ? { 
        'X-Client-User-ID': userId.toString(), 
        'X-Test-User-ID': userId.toString() 
      } : {})
    } as HeadersInit,
    ...(typeof options === 'object' && options !== null ? options : {})
  };

  // For development: handle test user ID query parameter
  const urlObj = new URL(window.location.origin + url);
  const testUserID = urlObj.searchParams.get('test_user_id');
  const autoLogin = urlObj.searchParams.get('auto_login');
  
  if (testUserID) {
    console.log(`Development mode - using test user ID: ${testUserID}`);
    // Add test user ID to request for development/testing
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-Test-User-ID': testUserID
    };
  }
  
  if (autoLogin === 'true') {
    console.log('Development mode - auto login enabled');
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-Auto-Login': 'true'
    };
  }

  // Special handling for login/register routes to ensure we can login even when logged out flag is set
  if (url === '/api/login' || url === '/api/register' || url === '/api/auth/login' || url === '/api/auth/register' || url === '/api/auth/login-with-recaptcha') {
    // Clear the logged out flag for login/register attempts
    setLoggedOutFlag(false);
    // Remove logout headers for login attempts
    if (requestOptions.headers && typeof requestOptions.headers === 'object') {
      const headers = requestOptions.headers as Record<string, string>;
      delete headers['X-User-Logged-Out'];
      delete headers['X-Auth-Logged-Out'];
    }
  } 
  // Add headers for logout state - but not for login/register endpoints
  else if (isUserLoggedOut()) {
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
    // Use our offline-aware fetch implementation
    const res = await offlineAwareFetch(url, requestOptions);

    // Clear logout state on successful authentication
    if (res.ok && (url.includes('/auth/login') || url.includes('/auth/register'))) {
      console.log('Successful authentication - clearing logout state');
      setLoggedOutFlag(false);
    }

    await throwIfResNotOk(res);
    
    // If this was a successful mutation (non-GET request), invalidate related caches
    // This ensures we don't show stale data after mutations
    if (method !== 'GET' && res.ok && useOfflineStore.getState().isOnline) {
      // Extract the base path to invalidate related queries
      const basePath = url.split('?')[0].split('/').slice(0, -1).join('/');
      if (basePath) {
        // Clear cache for this endpoint pattern
        clearCache(basePath);
        
        // Invalidate related queries in React Query cache with refetchType:'all'
        queryClient.invalidateQueries({ 
          queryKey: [basePath],
          refetchType: 'all'
        });
        
        // Special case for posts - also invalidate all feed endpoints
        if (url.includes('/api/posts')) {
          console.log('Post created or modified - invalidating all feed endpoints');
          
          // Make sure we handle 401 errors gracefully for post creation
          if (res.status >= 200 && res.status < 300) {
            console.log('Post creation successful - refreshing feeds');
          } else if (res.status === 401) {
            console.warn('Authentication error detected during post creation. Attempting to refresh session...');
            // Try to refresh the session by fetching the user endpoint
            try {
              // Attempt to refresh auth session
              const refreshResponse = await fetch('/api/auth/me', { 
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Authorization': `Bearer ${getStoredAuthToken()}`,
                  'Cache-Control': 'no-cache',
                  'X-Auth-Refresh': 'true'
                }
              });
              
              // Look for WWW-Authenticate header for debugging
              const authHeader = refreshResponse.headers.get('WWW-Authenticate');
              if (authHeader) {
                console.log('WWW-Authenticate header received:', authHeader);
              }
              
              // If refresh succeeded, retry the original post request
              if (refreshResponse.ok) {
                console.log('Session refreshed successfully, retrying post creation...');
                
                // Retry the original request with fresh credentials
                const retryResponse = await fetch(url, {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getStoredAuthToken()}`,
                    'X-Retry-After-Auth-Refresh': 'true'
                  },
                  body: options?.body
                });
                
                if (retryResponse.ok) {
                  console.log('Post creation retry successful after auth refresh!');
                  return retryResponse; // Return the successful retry response instead
                } else {
                  console.error('Post creation retry failed after auth refresh:', await retryResponse.text());
                }
              }
            } catch (e) {
              console.error('Failed to refresh session:', e);
            }
          }
          
          // Invalidate feed queries to refresh data
          queryClient.invalidateQueries({ 
            queryKey: ['/api/feed/personal'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/feed/communities'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/feed/recommended'],
            refetchType: 'all'
          });
        }
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
      headers: {
        // Always include these session-related headers for improved auth reliability
        'X-Use-Session': 'true',
        'X-Client-Auth': 'true',
        'X-Auto-Login': 'false',
        'X-Request-Time': new Date().toISOString()
      }
    };

    // For development: handle test user ID query parameter
    const urlObj = new URL(window.location.origin + url);
    const testUserID = urlObj.searchParams.get('test_user_id');
    const autoLogin = urlObj.searchParams.get('auto_login');
    
    // Get user ID from sessionStorage if present - this helps with auth reliability
    let userId = null;
    try {
      const userDataString = sessionStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userId = userData.id;
      }
    } catch (e) {
      console.error('Error retrieving user data from sessionStorage:', e);
    }
    
    // If we're accessing the profile or user endpoints, always include user ID in headers
    if ((url.includes('/api/users/profile') || url.includes('/api/user')) && userId) {
      console.log(`Adding user ID ${userId} to headers for profile endpoint`);
      options.headers = {
        ...options.headers,
        'X-Client-User-ID': userId.toString(),
        'X-Test-User-ID': userId.toString()
      };
    }
    
    if (testUserID) {
      console.log(`Development mode - using test user ID: ${testUserID}`);
      // Add test user ID to request for development/testing
      options.headers = {
        ...options.headers,
        'X-Test-User-ID': testUserID
      };
    }
    
    if (autoLogin === 'true') {
      console.log('Development mode - auto login enabled');
      options.headers = {
        ...options.headers,
        'X-Auto-Login': 'true'
      };
    }

    // Special handling for login/register routes
    if (url.includes('/api/login') || url.includes('/api/register') || url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
      // Clear the logged out flag for login/register attempts
      setLoggedOutFlag(false);
    } 
    // Add headers for logout state - but not for login/register endpoints
    else if (isUserLoggedOut()) {
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
        'Authorization': `Bearer ${authToken}`
      };
    }

    // Use our offline-aware fetch implementation
    const res = await offlineAwareFetch(url, options);

    // Clear logout state on successful authentication
    if (res.ok && (url.includes('/auth/login') || url.includes('/auth/register'))) {
      console.log('Successful authentication - clearing logout state');
      setLoggedOutFlag(false);
    }

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
      refetchOnWindowFocus: true, // Enable refresh when the window regains focus
      staleTime: 0, // Always consider data stale immediately (instead of Infinity or 30s)
      retry: (failureCount, error: any) => {
        // Don't retry on 401 Unauthorized
        if (error?.message?.includes('401:')) return false;
        
        // Retry on 502 Bad Gateway (server temporarily unavailable)
        if (error?.message?.includes('502:')) {
          console.log(`Retrying 502 error (attempt ${failureCount}): ${error.message}`);
          // Retry up to 3 times with increasing delay for server availability issues
          return failureCount < 3;
        }
        
        // Default retry logic - retry once for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with jitter
        const baseDelay = 1000; // 1 second
        const jitter = Math.random() * 500; // Random value between 0-500ms
        return Math.min(
          30000, // Max 30 seconds
          baseDelay * Math.pow(2, attemptIndex) + jitter
        );
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Safely handle image URLs to prevent errors related to invalid or malformed URLs
 * 
 * This function handles various URL formats:
 * - Blob URLs (temporary in-memory objects that may become invalid)
 * - Data URLs (base64 encoded images)
 * - Relative paths to server resources
 * - Absolute URLs to external resources
 * 
 * @param url The URL to sanitize
 * @param fallback Optional fallback URL to use if the input URL is invalid
 * @returns A safe URL that won't cause errors or a fallback if needed
 */
export function sanitizeImageUrl(url: string | null | undefined, fallback?: string): string {
  const defaultFallback = '/assets/default-avatar.png';
  const effectiveFallback = fallback || defaultFallback;
  
  // If no URL or empty string, return fallback
  if (!url || url.trim() === '') {
    return effectiveFallback;
  }
  
  try {
    // Handle blob URLs (which can cause DOMException if no longer valid)
    if (url.startsWith('blob:')) {
      // Check if it's at least a properly formatted blob URL
      const isBlobUrl = url.match(/^blob:https?:\/\//i);
      if (!isBlobUrl) {
        console.warn('Detected invalid blob URL format, using fallback');
        return effectiveFallback;
      }
      
      // Even with valid format, blob URLs might be temporary
      // Browser behavior: If the blob is no longer available, the image will fail to load
      // but at least we won't throw an error
      return url;
    }
    
    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:image/')) {
      // Basic validation that it's a properly formatted data URL
      if (!url.includes(';base64,')) {
        console.warn('Detected invalid data URL format, using fallback');
        return effectiveFallback;
      }
      return url;
    }
    
    // Handle relative URLs: normalize them to always start with a slash
    if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
      return '/' + url;
    }
    
    // Handle absolute URLs
    if (url.startsWith('http')) {
      // Basic check for URLs that at least seem to point to image files
      const isLikelyImageUrl = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
      if (!isLikelyImageUrl) {
        // We still accept it, but log a warning
        console.warn('URL doesn\'t appear to be an image file:', url);
      }
      return url;
    }
    
    // For other URLs (like relative paths starting with /)
    return url;
  } catch (e) {
    // Handle any unexpected errors in URL processing
    console.error('Error processing image URL:', e);
    return effectiveFallback;
  }
}
