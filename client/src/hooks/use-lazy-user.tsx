import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useAuthToken } from "@/contexts/AuthTokenContext";

interface UseLazyUserOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
}

export function useLazyUser(options: UseLazyUserOptions = {}): UseQueryResult<SelectUser | undefined, Error> & { prefetch: () => void } {
  const { hasValidToken } = useAuthToken();
  const queryClient = useQueryClient();
  
  const enabled = options.enabled !== undefined ? options.enabled : hasValidToken;
  
  const query = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: options.refetchOnMount ?? false,
    refetchInterval: options.refetchInterval,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const prefetch = () => {
    if (hasValidToken) {
      queryClient.prefetchQuery({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return {
    ...query,
    prefetch,
  };
}

export function useEnsureUser(): SelectUser | null {
  const { hasValidToken } = useAuthToken();
  const { data: user, isLoading } = useLazyUser({ enabled: hasValidToken });
  
  if (!hasValidToken || isLoading) {
    return null;
  }
  
  return user ?? null;
}

export function usePrefetchUser() {
  const queryClient = useQueryClient();
  const { hasValidToken } = useAuthToken();
  
  return () => {
    if (hasValidToken) {
      queryClient.prefetchQuery({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };
}
