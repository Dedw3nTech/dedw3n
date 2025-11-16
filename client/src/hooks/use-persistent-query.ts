import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { persistentCache } from '@/lib/persistent-cache';
import { useEffect } from 'react';

const DEFAULT_PERSIST_TIME = 24 * 60 * 60 * 1000;

export interface UsePersistentQueryOptions<TData = unknown, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  persistKey: string;
  persistTime?: number;
}

export function usePersistentQuery<TData = unknown, TError = Error>(
  queryKey: any[],
  options?: UsePersistentQueryOptions<TData, TError>
) {
  const { persistKey, persistTime = DEFAULT_PERSIST_TIME, ...queryOptions } = options || {};

  const query = useQuery<TData, TError>({
    queryKey,
    ...queryOptions,
    placeholderData: undefined,
  });

  useEffect(() => {
    if (query.data && persistKey && !query.isError) {
      persistentCache.set(persistKey, query.data, persistTime);
    }
  }, [query.data, persistKey, persistTime, query.isError]);

  useEffect(() => {
    if (!query.data && persistKey && !query.isLoading) {
      persistentCache.get<TData>(persistKey).then((cachedData) => {
        if (cachedData) {
          query.refetch();
        }
      });
    }
  }, [persistKey]);

  return query;
}

export function useInitialCachedData<TData>(persistKey: string): TData | null {
  const [cachedData, setCachedData] = React.useState<TData | null>(null);

  React.useEffect(() => {
    persistentCache.get<TData>(persistKey).then((data) => {
      if (data) {
        setCachedData(data);
      }
    });
  }, [persistKey]);

  return cachedData;
}

import React from 'react';
