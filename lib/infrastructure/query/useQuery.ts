import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Infrastructure Layer - Basic Query Hook
 * Single Responsibility: Generic API data fetching with auth
 */

// Generic fetch function with Supabase auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Hook for standard API queries
export function useApiQuery<T = unknown>(
  queryKey: string | (string | number | boolean)[],
  url: string,
  options: RequestInit = {},
  queryOptions: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number;
  } = {}
) {
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: () => fetchWithAuth(url, options),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: queryOptions.gcTime ?? 10 * 60 * 1000, // 10 minutes default
    enabled: queryOptions.enabled,
    refetchInterval: queryOptions.refetchInterval,
  });
} 