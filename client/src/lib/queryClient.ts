import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineFetch, useOfflineStore } from "./offline";

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
): Promise<Response> {
  // Use our offline-aware fetch implementation
  const res = await offlineFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use our offline-aware fetch implementation
    const res = await offlineFetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // If we're offline and have a 503 status, try to return cached data
    if (res.status === 503 && !useOfflineStore.getState().isOnline) {
      try {
        const data = await res.json();
        if (data.error === 'Currently offline') {
          // Return null or empty data structure based on the URL path
          // This is a simple approach - in a more complex app you might want to 
          // differentiate between different API endpoints
          if (queryKey[0].toString().includes('/api/products')) {
            return [];
          }
          return null;
        }
      } catch (e) {
        console.error('Error parsing offline response:', e);
      }
    }

    await throwIfResNotOk(res);
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
