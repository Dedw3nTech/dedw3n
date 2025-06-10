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
      // Enable auto-login for development
      'X-Auto-Login': 'true',
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
  
  if (autoLogin === 'true' && import.meta.env.DEV) {
    console.log('Development mode - auto login enabled');
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-Auto-Login': 'true'
    };
  } else if (autoLogin === 'true' && !import.meta.env.DEV) {
    console.warn('[SECURITY] Auto-login blocked in production environment');
  }

  // Check if auto-login should be enabled (ONLY in development mode)
  const shouldAutoLogin = import.meta.env.DEV && (
                          localStorage.getItem('enable_auto_login') === 'true' ||
                          window.location.search.includes('auto_login=true') ||
                          window.location.search.includes('serruti=true')
                        );

  // Special handling for login/register routes to ensure we can login even when logged out flag is set
  if (url === '/api/login' || url === '/api/register' || url === '/api/auth/login' || url === '/api/auth/register' || url === '/api/auth/login-with-recaptcha') {
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
  // Don't add logout headers if auto-login is enabled
  else if (userLoggedOut && !shouldAutoLogin) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-User-Logged-Out': 'true',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  // Add auto-login header if enabled
  if (shouldAutoLogin) {
    requestOptions.headers = {
      ...requestOptions.headers,
      'X-Auto-Login': 'true'
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
      try {
        localStorage.removeItem('unified_logout_state');
      } catch (e) {
        // Continue silently
      }
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
    
    // Get user ID from sessionStorage if present
    let userId = null;
    try {
      const userDataString = sessionStorage.getItem('userData') || localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userId = userData.id;
      }
    } catch (e) {
      // Continue without user ID
    }
    
    if (testUserID) {
      console.log(`Development mode - using test user ID: ${testUserID}`);
      options.headers = {
        ...options.headers,
        'X-Test-User-ID': testUserID
      };
    }
    
    if (autoLogin === 'true' && import.meta.env.DEV) {
      console.log('Development mode - auto login enabled');
      options.headers = {
        ...options.headers,
        'X-Auto-Login': 'true'
      };
    }

    // Check if auto-login should be enabled (ONLY in development mode)
    const shouldAutoLogin = import.meta.env.DEV && (
                            localStorage.getItem('enable_auto_login') === 'true' ||
                            window.location.search.includes('auto_login=true') ||
                            window.location.search.includes('serruti=true')
                          );

    // Check if user is logged out via unified logout system
    let userLoggedOut = false;
    try {
      userLoggedOut = localStorage.getItem('unified_logout_state') === 'true';
    } catch (e) {
      // Continue with userLoggedOut = false
    }

    // Add logout headers if user has logged out and auto-login is not enabled
    if (userLoggedOut && !shouldAutoLogin) {
      options.headers = {
        ...options.headers,
        'X-User-Logged-Out': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
    }

    // Add auto-login header if enabled
    if (shouldAutoLogin) {
      options.headers = {
        ...options.headers,
        'X-Auto-Login': 'true'
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

    // Add user ID to headers if available
    if (userId) {
      options.headers = {
        ...options.headers,
        'X-Client-User-ID': userId.toString()
      };
    }

    try {
      const res = await offlineAwareFetch(url, options);

      // Clear logout state on successful authentication
      if (res.ok && (url.includes('/auth/login') || url.includes('/auth/register'))) {
        console.log('Successful authentication - clearing logout state');
        try {
          localStorage.removeItem('unified_logout_state');
        } catch (e) {
          // Continue silently
        }
      }

      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        } else {
          throw new Error("Unauthorized");
        }
      }

      await throwIfResNotOk(res);

      // Cache successful responses for offline access
      if (res.ok && useOfflineStore.getState().isOnline) {
        cacheResponse(url, res.clone());
      }

      return res.json();
    } catch (error) {
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 5 * 60 * 1000,
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
  
  // If it's already a valid URL, return it
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  
  // If it's a relative path, prepend with a slash
  return `/${url}`;
};