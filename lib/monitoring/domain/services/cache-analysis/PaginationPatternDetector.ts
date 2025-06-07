import { ReactQueryCallAnalysis } from '../../value-objects/CacheAnalysisResult';

/**
 * Pagination Detection Result
 */
export interface PaginationDetectionResult {
  isDetected: boolean;
  pattern: 'offset' | 'page' | 'infinite-query' | 'scroll-context' | 'none';
  reason: string;
}

/**
 * Domain Service: Pagination Pattern Detection
 * 
 * Responsibility: Detect legitimate pagination patterns in React Query calls
 * Bounded Context: Performance Monitoring - Pattern Recognition
 * 
 * Single Responsibility: Focus solely on identifying pagination behavior
 * 
 * Business Rules:
 * - Sequential offset progression indicates pagination (0, 20, 40...)
 * - Page-based incrementation indicates pagination (1, 2, 3...)
 * - useInfiniteQuery context indicates legitimate pagination
 * - Scroll-related call stacks indicate user-driven pagination
 */
export class PaginationPatternDetector {

  /**
   * Detect pagination patterns in React Query calls
   * 
   * @param calls - Array of React Query call analyses to examine
   * @returns Pagination detection result with pattern type and reason
   */
  detect(calls: ReactQueryCallAnalysis[]): PaginationDetectionResult {
    // Pattern 1: Check for pagination parameters in payloads
    const paginationParams = this.detectPaginationParameters(calls);
    if (paginationParams.isDetected) {
      return paginationParams;
    }

    // Pattern 2: Check for React Query infinite query context
    const infiniteQuery = this.detectInfiniteQuery(calls);
    if (infiniteQuery.isDetected) {
      return infiniteQuery;
    }

    // Pattern 3: Check for scroll context in call stacks
    const scrollContext = this.detectScrollContext(calls);
    if (scrollContext.isDetected) {
      return scrollContext;
    }

    return {
      isDetected: false,
      pattern: 'none',
      reason: 'No pagination patterns detected'
    };
  }

  /**
   * Detect pagination parameters in server action payloads
   */
  private detectPaginationParameters(calls: ReactQueryCallAnalysis[]): PaginationDetectionResult {
    try {
      const payloads = calls
        .map(call => call.originalCall?.payload)
        .filter(payload => payload && typeof payload === 'object');

      if (payloads.length < 2) {
        return { isDetected: false, pattern: 'none', reason: 'Insufficient payloads for analysis' };
      }

      // Check for increasing offset pattern
      const offsetPattern = this.checkOffsetProgression(payloads);
      if (offsetPattern.isDetected) {
        return offsetPattern;
      }

      // Check for page-based pagination
      const pagePattern = this.checkPageProgression(payloads);
      if (pagePattern.isDetected) {
        return pagePattern;
      }

    } catch (error) {
      // Ignore parsing errors
    }

    return { isDetected: false, pattern: 'none', reason: 'No parameter-based pagination found' };
  }

  /**
   * Check for offset-based pagination progression
   */
  private checkOffsetProgression(payloads: any[]): PaginationDetectionResult {
    for (let i = 1; i < payloads.length; i++) {
      const prev = payloads[i - 1];
      const curr = payloads[i];

      if (typeof prev.offset === 'number' && typeof curr.offset === 'number') {
        const expectedIncrement = prev.offset + (prev.limit || 20);
        if (curr.offset === expectedIncrement) {
          return {
            isDetected: true,
            pattern: 'offset',
            reason: `sequential pagination parameters detected (offset: ${prev.offset} → ${curr.offset})`
          };
        }
      }
    }

    return { isDetected: false, pattern: 'none', reason: 'No offset progression found' };
  }

  /**
   * Check for page-based pagination progression
   */
  private checkPageProgression(payloads: any[]): PaginationDetectionResult {
    for (let i = 1; i < payloads.length; i++) {
      const prev = payloads[i - 1];
      const curr = payloads[i];

      if (typeof prev.page === 'number' && typeof curr.page === 'number') {
        if (curr.page === prev.page + 1) {
          return {
            isDetected: true,
            pattern: 'page',
            reason: `sequential page parameters detected (page: ${prev.page} → ${curr.page})`
          };
        }
      }
    }

    return { isDetected: false, pattern: 'none', reason: 'No page progression found' };
  }

  /**
   * Detect React Query infinite query context
   */
  private detectInfiniteQuery(calls: ReactQueryCallAnalysis[]): PaginationDetectionResult {
    const hasInfiniteQuery = calls.some(call => call.isInfiniteQuery);
    
    if (hasInfiniteQuery) {
      return {
        isDetected: true,
        pattern: 'infinite-query',
        reason: 'React Query useInfiniteQuery detected'
      };
    }

    return { isDetected: false, pattern: 'none', reason: 'No infinite query context found' };
  }

  /**
   * Detect scroll-related context in call stacks
   */
  private detectScrollContext(calls: ReactQueryCallAnalysis[]): PaginationDetectionResult {
    const scrollKeywords = ['scroll', 'intersection', 'loadmore', 'fetchnextpage'];
    
    for (const call of calls) {
      const stack = call.originalCall?.source?.stack || '';
      const lowerStack = stack.toLowerCase();
      
      for (const keyword of scrollKeywords) {
        if (lowerStack.includes(keyword)) {
          return {
            isDetected: true,
            pattern: 'scroll-context',
            reason: `scroll event context detected in call stack (${keyword})`
          };
        }
      }
    }

    return { isDetected: false, pattern: 'none', reason: 'No scroll context found' };
  }

  /**
   * Check if data type is typically paginated (helper method)
   */
  isPaginationDataType(dataType?: string): boolean {
    const paginationTypes = [
      'generations',  // Image generator
      'assets',       // DAM assets
      'users',        // User management
      'members',      // Team members
      'documents',    // Documents/notes
      'campaigns'     // Campaign management
    ];
    
    return paginationTypes.includes(dataType || '');
  }

  /**
   * Check if hook name suggests pagination (helper method)
   */
  isPaginationHookName(hookName?: string): boolean {
    const paginationKeywords = ['infinite', 'pagination', 'list', 'gallery'];
    return paginationKeywords.some(keyword => hookName?.includes(keyword));
  }
} 