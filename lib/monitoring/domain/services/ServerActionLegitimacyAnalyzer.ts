import { ReactQueryCallAnalysis } from '../value-objects/CacheAnalysisResult';

/**
 * Legitimacy Analysis Result
 */
export interface LegitimacyAnalysisResult {
  isLegitimate: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  recommendedFix: string;
}

/**
 * Domain Service: Server Action Legitimacy Analysis
 * 
 * Responsibility: Determine if server action duplicates represent legitimate user behavior
 * Bounded Context: Performance Monitoring - Behavioral Analysis
 * 
 * Single Responsibility: Focus solely on legitimacy assessment using business rules
 * 
 * Business Rules:
 * - Very rapid calls (< 1s) indicate automation bugs
 * - Rapid calls (1-5s) suggest cache configuration issues  
 * - Medium timing (5-30s) may be legitimate with context analysis
 * - Long timing (30s+) is usually legitimate user behavior
 * - Infinite scroll patterns are always legitimate
 */
export class ServerActionLegitimacyAnalyzer {

  /**
   * Analyze if server action duplicates represent legitimate behavior
   * 
   * @param calls - Array of server action calls to analyze
   * @param timeDiff - Time difference between calls in milliseconds
   * @returns Legitimacy analysis result
   */
  analyze(calls: ReactQueryCallAnalysis[], timeDiff: number): LegitimacyAnalysisResult {
    // Business Rule 0: Check for infinite scroll patterns first (always legitimate)
    const infiniteScrollResult = this.checkInfiniteScrollPattern(calls);
    if (infiniteScrollResult.isLegitimate) {
      return infiniteScrollResult;
    }

    // Business Rule 1: Very rapid calls are automation bugs
    if (timeDiff < 1000) {
      return {
        isLegitimate: false,
        severity: 'critical',
        reason: 'extremely rapid automated calls indicate race condition or infinite loop',
        recommendedFix: 'Add request deduplication and fix component re-render issues'
      };
    }

    // Business Rule 2: Rapid calls are cache issues
    if (timeDiff < 5000) {
      return {
        isLegitimate: false,
        severity: 'high',
        reason: 'rapid calls suggest cache miss or staleTime too low',
        recommendedFix: 'Increase React Query staleTime to 2-5 minutes'
      };
    }

    // Business Rule 3: Medium timing needs context analysis
    if (timeDiff < 30000) {
      return this.analyzeMediumTimingContext(calls);
    }

    // Business Rule 4: Long timing analysis
    return this.analyzeLongTimingContext(calls);
  }

  /**
   * Check for infinite scroll patterns (always legitimate)
   */
  private checkInfiniteScrollPattern(calls: ReactQueryCallAnalysis[]): LegitimacyAnalysisResult {
    // Signal 1: React Query infinite query context
    const isInfiniteQuery = calls.some(call => call.isInfiniteQuery);
    if (isInfiniteQuery) {
      return {
        isLegitimate: true,
        severity: 'low',
        reason: 'React Query useInfiniteQuery detected',
        recommendedFix: 'No action needed - legitimate pagination behavior'
      };
    }

    // Signal 2: Pagination endpoints
    const isPaginationEndpoint = calls.some(call => 
      this.isPaginationDataType(call.dataType) ||
      this.isPaginationHookName(call.hookName)
    );
    if (isPaginationEndpoint) {
      return {
        isLegitimate: true,
        severity: 'low',
        reason: 'pagination endpoint detected',
        recommendedFix: 'No action needed - legitimate pagination behavior'
      };
    }

    // Signal 3: Scroll context in call stack
    const hasScrollContext = calls.some(call => {
      const stack = call.originalCall?.source?.stack || '';
      return this.hasScrollKeywords(stack);
    });
    if (hasScrollContext) {
      return {
        isLegitimate: true,
        severity: 'low',
        reason: 'scroll event context detected in call stack',
        recommendedFix: 'No action needed - legitimate pagination behavior'
      };
    }

    return { isLegitimate: false, severity: 'low', reason: '', recommendedFix: '' };
  }

  /**
   * Analyze medium timing context (5-30 seconds)
   */
  private analyzeMediumTimingContext(calls: ReactQueryCallAnalysis[]): LegitimacyAnalysisResult {
    const hasVariedPayloads = this.hasVariedPayloads(calls);
    const hasDifferentTriggers = this.hasDifferentTriggers(calls);
    
    if (hasVariedPayloads || hasDifferentTriggers) {
      return {
        isLegitimate: true,
        severity: 'low',
        reason: 'likely legitimate user actions with varied context',
        recommendedFix: 'Consider cache optimization if frequent'
      };
    }

    return {
      isLegitimate: false,
      severity: 'medium',
      reason: 'moderate timing suggests possible cache configuration issue',
      recommendedFix: 'Review cache invalidation and staleTime settings'
    };
  }

  /**
   * Analyze long timing context (30+ seconds)
   */
  private analyzeLongTimingContext(calls: ReactQueryCallAnalysis[]): LegitimacyAnalysisResult {
    const hasIdenticalPayloads = this.hasIdenticalPayloads(calls);
    
    if (hasIdenticalPayloads && calls.length > 2) {
      return {
        isLegitimate: false,
        severity: 'low',
        reason: 'multiple identical requests over time suggest cache misses',
        recommendedFix: 'Verify cache persistence and garbage collection settings'
      };
    }

    return {
      isLegitimate: true,
      severity: 'low',
      reason: 'normal user interaction timing',
      recommendedFix: 'No action needed - monitor for patterns'
    };
  }

  /**
   * Check if data type is typically paginated
   */
  private isPaginationDataType(dataType?: string): boolean {
    const paginationTypes = ['generations', 'assets', 'users', 'members', 'documents', 'campaigns'];
    return paginationTypes.includes(dataType || '');
  }

  /**
   * Check if hook name suggests pagination
   */
  private isPaginationHookName(hookName?: string): boolean {
    const paginationKeywords = ['infinite', 'pagination', 'list', 'gallery'];
    return paginationKeywords.some(keyword => hookName?.includes(keyword));
  }

  /**
   * Check for scroll-related keywords in call stack
   */
  private hasScrollKeywords(stack: string): boolean {
    const scrollKeywords = ['scroll', 'intersection', 'loadmore', 'fetchnextpage'];
    const lowerStack = stack.toLowerCase();
    return scrollKeywords.some(keyword => lowerStack.includes(keyword));
  }

  /**
   * Check if calls have varied payloads (indicates different user actions)
   */
  private hasVariedPayloads(calls: ReactQueryCallAnalysis[]): boolean {
    try {
      const payloads = calls.map(call => JSON.stringify(call.originalCall?.payload || {}));
      const uniquePayloads = new Set(payloads);
      return uniquePayloads.size > 1;
    } catch {
      return false;
    }
  }

  /**
   * Check if calls have different triggers (indicates different user actions)
   */
  private hasDifferentTriggers(calls: ReactQueryCallAnalysis[]): boolean {
    const triggers = calls.map(call => call.originalCall?.source?.trigger || 'unknown');
    const uniqueTriggers = new Set(triggers);
    return uniqueTriggers.size > 1;
  }

  /**
   * Check if all calls have identical payloads (indicates potential cache issues)
   */
  private hasIdenticalPayloads(calls: ReactQueryCallAnalysis[]): boolean {
    try {
      const payloads = calls.map(call => JSON.stringify(call.originalCall?.payload || {}));
      const uniquePayloads = new Set(payloads);
      return uniquePayloads.size === 1;
    } catch {
      return false;
    }
  }
} 