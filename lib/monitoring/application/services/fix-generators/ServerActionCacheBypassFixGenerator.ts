import { CacheAnalysisResult } from '../../../domain/value-objects/CacheAnalysisResult';

/**
 * Application Service: Server Action Cache Bypass Fix Generator
 * Single Responsibility: Generate fix recommendations for server action cache bypass issues
 * DDD Pattern: Specialized service with timing-based logic
 */
export class ServerActionCacheBypassFixGenerator {

  /**
   * Generate specific fix based on timing patterns
   */
  generateFix(analysis: CacheAnalysisResult): string {
    const timing = this.extractTimingFromAnalysis(analysis);
    
    if (timing < 1000) {
      return this.generateCriticalFix(analysis, timing);
    }
    
    if (timing < 5000) {
      return this.generateHighPriorityFix(analysis, timing);
    }
    
    if (timing < 30000) {
      return this.generateMediumPriorityFix(analysis, timing);
    }
    
    return this.generateLowPriorityFix(analysis, timing);
  }

  private extractTimingFromAnalysis(analysis: CacheAnalysisResult): number {
    const rootCause = analysis.rootCause || '';
    const timingMatch = rootCause.match(/(\d+)ms/);
    return timingMatch ? parseInt(timingMatch[1]) : 0;
  }

  private generateCriticalFix(analysis: CacheAnalysisResult, timing: number): string {
    return `
// CRITICAL FIX for ${analysis.issue}:
// Detected: Extremely rapid calls (${timing}ms) - likely race condition

// 1. Add request deduplication to prevent rapid-fire calls:
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash-es';

const pendingRequests = new Map();

const debouncedServerAction = useMemo(() => {
  return debounce(async (params) => {
    const key = JSON.stringify(params);
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    
    const promise = getGenerations(params);
    pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  }, 300); // 300ms debounce
}, []);

// 2. Fix component re-render issues:
const { data } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => debouncedServerAction(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }

  private generateHighPriorityFix(analysis: CacheAnalysisResult, timing: number): string {
    return `
// HIGH PRIORITY FIX for ${analysis.issue}:
// Detected: Rapid calls (${timing}ms) - cache configuration issue

// 1. Increase staleTime to prevent rapid refetches:
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => getGenerations(filters),
  staleTime: 3 * 60 * 1000, // 3 minutes - prevents rapid refetches
  gcTime: 5 * 60 * 1000,    // 5 minutes cache retention
  refetchOnWindowFocus: false, // Disable aggressive refetching
});

// 2. Add loading state management:
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => getGenerations(filters),
  staleTime: 3 * 60 * 1000,
  enabled: !isFetching, // Prevent overlapping requests
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }

  private generateMediumPriorityFix(analysis: CacheAnalysisResult, timing: number): string {
    return `
// MEDIUM PRIORITY FIX for ${analysis.issue}:
// Detected: Moderate timing (${timing}ms) - possible cache optimization opportunity

// 1. Optimize cache invalidation strategy:
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => getGenerations(filters),
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000,   // Longer garbage collection
  refetchOnMount: 'always', // Ensure fresh data when needed
});

// 2. Consider background refetching for better UX:
const { data } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => getGenerations(filters),
  staleTime: 2 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  refetchIntervalInBackground: false,
});

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }

  private generateLowPriorityFix(analysis: CacheAnalysisResult, timing: number): string {
    return `
// LOW PRIORITY OPTIMIZATION for ${analysis.issue}:
// Detected: Normal user timing (${timing}ms) - consider cache optimization

// 1. Standard React Query configuration:
import { useQuery, QueryClient } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['image-generations', filters],
  queryFn: () => getGenerations(filters),
  staleTime: 2 * 60 * 1000, // 2 minutes - standard setting
  gcTime: 5 * 60 * 1000,    // 5 minutes cache retention
});

// 2. Optional: Add cache persistence for better UX:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24 hour persistence
    },
  },
});

// 3. Monitor for patterns - this might be normal user behavior
// Consider adding analytics to track if this becomes frequent

// RESULT: ${analysis.getFormattedImpact()}
      `;
  }
} 