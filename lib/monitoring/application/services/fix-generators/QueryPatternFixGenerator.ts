import { CacheAnalysisResult } from '../../../domain/value-objects/CacheAnalysisResult';

/**
 * Application Service: Query Pattern Fix Generator
 * Single Responsibility: Generate fix recommendations for query patterns (stale timing, infinite conflicts, polling)
 * DDD Pattern: Specialized service for query-specific issues
 */
export class QueryPatternFixGenerator {

  /**
   * Generate fix for stale timing issues
   */
  generateStaleTimingFix(analysis: CacheAnalysisResult): string {
    return `
// SPECIFIC FIX for ${analysis.issue}:

// Increase staleTime to prevent rapid refetches:
const { data } = useQuery({
  queryKey: ['your-data-key'],
  queryFn: yourQueryFunction,
  staleTime: 2 * 60 * 1000, // 2 minutes (recommended)
  gcTime: 5 * 60 * 1000,    // 5 minutes garbage collection
  refetchOnWindowFocus: false, // Optional: reduce aggressive refetching
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }

  /**
   * Generate fix for infinite query conflicts
   */
  generateInfiniteQueryConflictFix(analysis: CacheAnalysisResult): string {
    return `
// SPECIFIC FIX for ${analysis.issue}:

// Share cache between infinite and regular queries:
const regularData = useQuery({
  queryKey: ['data', filters],
  queryFn: () => getData(filters),
  staleTime: 2 * 60 * 1000,
});

const infiniteData = useInfiniteQuery({
  queryKey: ['data', filters, 'infinite'],
  queryFn: ({ pageParam = 0 }) => getData({ ...filters, offset: pageParam }),
  // Reuse regular query data as initial data
  initialData: regularData.data ? {
    pages: [regularData.data.slice(0, 20)],
    pageParams: [0]
  } : undefined,
  staleTime: 2 * 60 * 1000,
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }

  /**
   * Generate fix for polling conflicts
   */
  generatePollingConflictFix(analysis: CacheAnalysisResult): string {
    return `
// SPECIFIC FIX for ${analysis.issue}:

// Consolidate polling into a single hook:
const { data } = useQuery({
  queryKey: ['polled-data'],
  queryFn: fetchData,
  refetchInterval: 30000, // Single interval (30 seconds)
  staleTime: 25000,       // Slightly less than refetch interval
});

// Share this data across components instead of multiple polling hooks
// RESULT: ${analysis.getFormattedImpact()}
      `;
  }
} 