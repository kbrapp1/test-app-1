import { CacheAnalysisResult, ReactQueryCallAnalysis } from '../../value-objects/CacheAnalysisResult';

/**
 * Domain Service: Cache Pattern Detection
 * Single Responsibility: Detect various cache anti-patterns and timing issues
 * Business Rule: Cache patterns should follow React Query best practices
 */
export class CachePatternDetector {

  /**
   * Detect shared data anti-patterns
   */
  detectSharedDataAntiPattern(analyses: ReactQueryCallAnalysis[]): CacheAnalysisResult | null {
    const hasSharedIntent = analyses.some(a => a.hasSharedDataIntent);
    const hasInfiniteQuery = analyses.some(a => a.isInfiniteQuery);
    
    if (hasSharedIntent && hasInfiniteQuery && analyses.length > 1) {
      return CacheAnalysisResult.create({
        severity: 'medium',
        issue: 'SHARED_DATA_ANTI_PATTERN: Intended data sharing not implemented properly',
        rootCause: 'useInfiniteGenerations attempts to reuse shared data but different cache keys prevent sharing',
        specificFix: 'Implement initialData with shared cache check',
        estimatedImpact: 'Eliminate redundant server actions during panel operations'
      });
    }
    
    return null;
  }

  /**
   * Detect stale-while-revalidate timing issues
   */
  detectStaleWhileRevalidateIssues(analyses: ReactQueryCallAnalysis[]): CacheAnalysisResult | null {
    const sameDataTypeCalls = this.groupByDataType(analyses);
    
    for (const [dataType, typeCalls] of Object.entries(sameDataTypeCalls)) {
      if (typeCalls.length >= 2) {
        const timeDiff = this.calculateTimeDifference(typeCalls);
        
        if (timeDiff > 0 && timeDiff < 60000) { // Within 1 minute
          const isLegitimateInfiniteScroll = this.isLegitimateInfiniteScroll(typeCalls, timeDiff);
          
          if (isLegitimateInfiniteScroll) {
            continue;
          }
          
          return CacheAnalysisResult.create({
            severity: 'medium',
            issue: `Stale-while-revalidate timing mismatch for ${dataType}`,
            rootCause: `Cache expiring too quickly causing unnecessary refetches within ${timeDiff}ms`,
            specificFix: 'Increase staleTime to: 2 * 60 * 1000 // 2 minutes',
            estimatedImpact: 'Eliminates rapid refetches, improves UX'
          });
        }
      }
    }
    
    return null;
  }

  /**
   * Detect infinite query architecture issues
   */
  detectInfiniteQueryMisuse(analyses: ReactQueryCallAnalysis[]): CacheAnalysisResult | null {
    const infiniteQueries = analyses.filter(call => call.isInfiniteQuery);
    const regularQueries = analyses.filter(call => !call.isInfiniteQuery);
    
    for (const infiniteQuery of infiniteQueries) {
      for (const regularQuery of regularQueries) {
        if (infiniteQuery.dataType === regularQuery.dataType) {
          return CacheAnalysisResult.create({
            severity: 'high',
            issue: `Infinite query conflicts with regular query for ${infiniteQuery.dataType}`,
            rootCause: 'Different cache keys preventing data sharing between infinite and regular queries',
            specificFix: 'Use initialData pattern to share cache between queries',
            estimatedImpact: 'Eliminates redundant API calls, faster loading'
          });
        }
      }
    }
    
    return null;
  }

  /**
   * Detect polling/interval conflicts
   */
  detectPollingConflicts(analyses: ReactQueryCallAnalysis[]): CacheAnalysisResult | null {
    const rapidCalls = analyses.filter((call, index) => {
      if (index === 0) return false;
      const prevCall = analyses[index - 1];
      const timeDiff = this.calculateTimeDifference([prevCall, call]);
      return timeDiff < 5000; // Less than 5 seconds
    });
    
    if (rapidCalls.length > 0) {
      return CacheAnalysisResult.create({
        severity: 'medium',
        issue: 'Potential polling interval conflicts detected',
        rootCause: 'Multiple hooks polling same data with different intervals',
        specificFix: 'Consolidate polling logic or use refetchInterval coordination',
        estimatedImpact: 'Reduces server load and bandwidth usage'
      });
    }
    
    return null;
  }

  private groupByDataType(calls: ReactQueryCallAnalysis[]): Record<string, ReactQueryCallAnalysis[]> {
    return calls.reduce((groups, call) => {
      const type = call.dataType || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(call);
      return groups;
    }, {} as Record<string, ReactQueryCallAnalysis[]>);
  }

  private calculateTimeDifference(calls: ReactQueryCallAnalysis[]): number {
    if (calls.length < 2) return 0;
    const timestamps = calls.map(call => call.originalCall?.timestamp || 0).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private isLegitimateInfiniteScroll(calls: ReactQueryCallAnalysis[], timeDiff: number): boolean {
    // Use comprehensive infinite scroll detection
    const infiniteScrollPattern = this.detectInfiniteScrollPattern(calls);
    return infiniteScrollPattern !== null;
  }

  /**
   * Detect legitimate infinite scroll patterns to prevent false positives
   */
  private detectInfiniteScrollPattern(calls: ReactQueryCallAnalysis[]): { reason: string } | null {
    // Signal 1: Check for pagination parameters (offset progression)
    const hasPaginationParams = this.detectPaginationParameters(calls);
    if (hasPaginationParams) {
      return { reason: 'sequential pagination parameters detected (offset: 0, 20, 40...)' };
    }

    // Signal 2: Check for React Query infinite query context
    const isInfiniteQuery = calls.some(call => call.isInfiniteQuery);
    if (isInfiniteQuery) {
      return { reason: 'React Query useInfiniteQuery detected' };
    }

    // Signal 3: Check for pagination endpoints 
    const isPaginationEndpoint = calls.some(call => 
      call.dataType === 'generations' ||  // Image generator
      call.dataType === 'assets' ||       // DAM assets
      call.dataType === 'users' ||        // User management
      call.dataType === 'members' ||      // Team members
      call.dataType === 'documents' ||    // Documents/notes
      call.dataType === 'campaigns' ||    // Campaign management
      call.hookName?.includes('infinite') ||
      call.hookName?.includes('pagination') ||
      call.hookName?.includes('list') ||
      call.hookName?.includes('gallery')
    );
    if (isPaginationEndpoint) {
      // For pagination endpoints, be more lenient with timing
      return { reason: 'pagination endpoint detected' };
    }

    // Signal 4: Check call stack for scroll-related triggers
    const hasScrollContext = calls.some(call => {
      const stack = call.originalCall?.source?.stack || '';
      return stack.toLowerCase().includes('scroll') || 
             stack.toLowerCase().includes('intersection') ||
             stack.toLowerCase().includes('loadmore') ||
             stack.toLowerCase().includes('fetchnextpage');
    });
    if (hasScrollContext) {
      return { reason: 'scroll event context detected in call stack' };
    }

    return null;
  }

  /**
   * Detect pagination parameters in server action payloads
   */
  private detectPaginationParameters(calls: ReactQueryCallAnalysis[]): boolean {
    try {
      const payloads = calls
        .map(call => call.originalCall?.payload)
        .filter(payload => payload && typeof payload === 'object');

      if (payloads.length < 2) return false;

      // Check for increasing offset pattern
      for (let i = 1; i < payloads.length; i++) {
        const prev = payloads[i - 1];
        const curr = payloads[i];

        // Look for standard pagination pattern
        if (typeof prev.offset === 'number' && typeof curr.offset === 'number') {
          const expectedIncrement = prev.offset + (prev.limit || 20);
          if (curr.offset === expectedIncrement) {
            return true;
          }
        }

        // Look for page-based pagination
        if (typeof prev.page === 'number' && typeof curr.page === 'number') {
          if (curr.page === prev.page + 1) {
            return true;
          }
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return false;
  }
} 