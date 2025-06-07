// React Query Cache Analysis Service
// Single responsibility: Detect cache architecture issues in React Query patterns

import { CacheAnalysisResult, ReactQueryCallAnalysis } from '../../value-objects/CacheAnalysisResult';
import { CacheKeyMismatchDetector } from './CacheKeyMismatchDetector';
import { CachePatternDetector } from './CachePatternDetector';
import { ReactQueryCallAnalyzer } from '../../../infrastructure/analysis/ReactQueryCallAnalyzer';

/**
 * Domain Service: React Query Cache Analysis Orchestrator
 * Single Responsibility: Coordinate cache pattern analysis using focused detectors
 * Business Rule: Maintain separation of concerns while providing unified analysis
 */
export class ReactQueryCacheAnalysisService {
  
  constructor(
    private readonly callAnalyzer: ReactQueryCallAnalyzer,
    private readonly keyMismatchDetector: CacheKeyMismatchDetector,
    private readonly patternDetector: CachePatternDetector
  ) {}

  /**
   * Analyze React Query patterns for architectural issues
   * Main business logic: Orchestrate different types of cache analysis
   */
  analyzeReactQueryPattern(calls: any[]): CacheAnalysisResult | null {
    // Step 1: Extract React Query related calls (Infrastructure concern)
    const cacheRelatedCalls = this.callAnalyzer.identifyAllCacheRelatedCalls(calls);
    
    if (cacheRelatedCalls.length < 2) {
      return null;
    }
    
    // Step 1.5: CRITICAL - Check for legitimate infinite scroll patterns first
    // If infinite scroll is detected, skip all other analysis to prevent false positives
    const timeDiff = this.calculateTimeDifference(cacheRelatedCalls);
    const infiniteScrollPattern = this.detectInfiniteScrollPattern(cacheRelatedCalls, timeDiff);
    if (infiniteScrollPattern) {
      // Return null to indicate this is legitimate behavior, not an issue
      return null;
    }
    
    // Step 2: Run focused domain detectors (only if NOT infinite scroll)
    const detectors = [
      () => this.keyMismatchDetector.detectMismatch(cacheRelatedCalls),
      () => this.patternDetector.detectSharedDataAntiPattern(cacheRelatedCalls),
      () => this.patternDetector.detectStaleWhileRevalidateIssues(cacheRelatedCalls),
      () => this.patternDetector.detectInfiniteQueryMisuse(cacheRelatedCalls),
      () => this.patternDetector.detectPollingConflicts(cacheRelatedCalls),
    ];
    
    // Step 3: Return first issue found (priority order matters)
    for (const detector of detectors) {
      const result = detector();
      if (result) {
        return result;
      }
    }
    
    return null;
  }

  /**
   * Factory method for creating service with dependencies
   */
  static create(): ReactQueryCacheAnalysisService {
    return new ReactQueryCacheAnalysisService(
      new ReactQueryCallAnalyzer(),
      new CacheKeyMismatchDetector(),
      new CachePatternDetector()
    );
  }

  /**
   * Enhanced infinite scroll pattern detection
   * Business Rule: Legitimate infinite scroll should not be flagged as redundant
   */
  detectInfiniteScrollPattern(calls: ReactQueryCallAnalysis[], timeDiff: number): { reason: string } | null {
    // Signal 1: Check for pagination parameters
    const hasPaginationParams = this.callAnalyzer.detectPaginationParameters(calls);
    if (hasPaginationParams) {
      return { reason: 'Sequential pagination parameters detected (pageParam: 0, 1, 2...)' };
    }

    // Signal 2: Check for React Query infinite query context
    const isInfiniteQuery = calls.some(call => call.isInfiniteQuery);
    const hasReasonableTiming = timeDiff >= 3000; // 3+ seconds for user interaction
    if (isInfiniteQuery && hasReasonableTiming) {
      return { reason: 'React Query useInfiniteQuery with user-interaction timing' };
    }

    // Signal 3: Check for pagination endpoints with reasonable timing
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
    if (isPaginationEndpoint && timeDiff >= 5000) {
      return { reason: 'Pagination endpoint with manual interaction timing' };
    }

    // Signal 4: Check call stack for scroll-related triggers
    const hasScrollContext = this.callAnalyzer.detectScrollContext(calls);
    if (hasScrollContext && timeDiff >= 2000) {
      return { reason: 'Scroll event context detected with reasonable timing' };
    }

    return null;
  }

  /**
   * Calculate time difference between first and last calls
   */
  private calculateTimeDifference(calls: ReactQueryCallAnalysis[]): number {
    if (calls.length < 2) return 0;
    const timestamps = calls.map(call => call.originalCall?.timestamp || 0).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }
} 