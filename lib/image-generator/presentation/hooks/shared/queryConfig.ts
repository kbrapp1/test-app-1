import { UseQueryOptions, UseInfiniteQueryOptions, QueryKey } from '@tanstack/react-query';

// Default retry logic: up to 2 retries, skip on 4xx errors
const defaultRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false;
  const message = (error as Error)?.message;
  if (message?.includes('401') || message?.includes('403')) return false;
  return true;
};

// Exponential backoff retry delay, capped at 10s
const defaultRetryDelay = (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 10000);

// Default options for useQuery hooks
export const defaultQueryOptions: Partial<UseQueryOptions<unknown, unknown, unknown, QueryKey>> = {
  staleTime: 60 * 1000,         // 1 minute
  gcTime: 5 * 60 * 1000,         // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: defaultRetry,
  retryDelay: defaultRetryDelay,
};

// Merge custom options with defaults for useQuery
export function withQueryDefaults<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  // Cast to UseQueryOptions to bypass type compatibility issues
  return { ...defaultQueryOptions, ...options } as UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >;
}

// Default options for useInfiniteQuery hooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultInfiniteQueryOptions: Partial<UseInfiniteQueryOptions<any, any, any, any, any[]>> = {
  staleTime: 2 * 60 * 1000,    // 2 minutes
  gcTime: 5 * 60 * 1000,        // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
  networkMode: 'online',
  retry: defaultRetry,
  retryDelay: defaultRetryDelay,
};

// Merge custom options with defaults for useInfiniteQuery
export function withInfiniteQueryDefaults<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
): UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> {
  // Cast to UseInfiniteQueryOptions to satisfy type compatibility
  return { ...defaultInfiniteQueryOptions, ...options } as UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >;
} 