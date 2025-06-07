import { ReactQueryCallAnalysis } from '../../domain/value-objects/CacheAnalysisResult';
import { ErrorHandlingService } from '../services/ErrorHandlingService';

/**
 * Infrastructure Service: React Query Call Analysis
 * Single Responsibility: Parse and analyze network calls for React Query patterns
 * Infrastructure Concern: Network call analysis and pattern extraction
 */
export class ReactQueryCallAnalyzer {
  // Precompiled regex and keyword lists to avoid re-creation on each call
  private static readonly HOOK_REGEX = /(use\w+Query|useInfinite\w+|use\w+Data|use\w+List|useSWR|useApollo)/i;
  private static readonly QUERY_KEY_REGEX = /queryKey.*?(\[.*?\])/;
  private static readonly DATA_KEYWORDS = ['generations?', 'users?', 'assets?', 'posts?', 'files?', 'images?', 'generation'];

  /**
   * Identify all cache-related calls from network calls
   */
  identifyAllCacheRelatedCalls(calls: any[]): ReactQueryCallAnalysis[] {
    return calls.map((call, index) => {
      const stack = call.source?.stack || '';
      const url = call.url || '';
      const hookMatch = ReactQueryCallAnalyzer.HOOK_REGEX.exec(stack);
      const serverActionMatch = call.type === 'server-action' && stack.includes('fetchServerAction');
      const queryKeyMatch = ReactQueryCallAnalyzer.QUERY_KEY_REGEX.exec(stack);
      
      const dataType = this.extractDataType(hookMatch?.[1] || '', url, call);
      const isReactQueryRelated = hookMatch || (serverActionMatch && dataType !== 'unknown');
      
      if (!isReactQueryRelated) return null;
      
      const hasSharedDataIntent = this.detectDataSharingIntent(stack, url);
      const isInfiniteQuery = this.detectInfinitePattern(stack, url);
      
      return {
        hookName: hookMatch?.[1] || `server-action-${dataType}`,
        queryKey: queryKeyMatch?.[1],
        cacheKeyPattern: this.extractCacheKeyPattern(queryKeyMatch?.[1]),
        isInfiniteQuery,
        hasSharedDataIntent,
        dataType,
        originalCall: call
      };
    }).filter(analysis => analysis !== null);
  }

  /**
   * Extract cache key pattern for comparison
   */
  extractCacheKeyPattern(queryKey?: string): string {
    if (!queryKey) return 'unknown';
    
    return queryKey
      .replace(/\{[^}]*\}/g, '{...}')
      .replace(/\d+/g, 'N')
      .toLowerCase();
  }

  /**
   * Detect data sharing intent from multiple signals
   */
  private detectDataSharingIntent(stack: string, url: string): boolean {
    const intentSignals = [
      'shared', 'reuse', 'combined', 'unified', 'merged',
      'initial', 'seed', 'prime', 'populate'
    ];
    return intentSignals.some(signal => 
      stack.toLowerCase().includes(signal) || url.toLowerCase().includes(signal)
    );
  }

  /**
   * Detect infinite/pagination patterns
   */
  private detectInfinitePattern(stack: string, url: string): boolean {
    const infiniteSignals = [
      'infinite', 'pagination', 'paged', 'scroll', 'loadmore',
      'offset', 'cursor', 'page', 'limit', 'fetchnextpage',
      'useinfinitegenerations', 'useinfinitequery', 'intersection'
    ];
    return infiniteSignals.some(signal => 
      stack.toLowerCase().includes(signal) || url.toLowerCase().includes(signal)
    );
  }

  /**
   * Extract data type from hook name, URL, or server action context
   */
  private extractDataType(hookName: string, url: string, call?: any): string {
    const hookTypeMatch = hookName.match(/use(\w+)/i);
    if (hookTypeMatch) {
      return hookTypeMatch[1].toLowerCase();
    }
    
    // Fallback: detect common URL-based data type
    const urlTypeMatch = url.match(/\/api\/(\w+)/);
    if (urlTypeMatch) {
      return urlTypeMatch[1].toLowerCase();
    }
    
    // Detect server-action patterns via stack keywords
    if (call?.type === 'server-action') {
      const stack = call.source?.stack || '';
      for (const keyword of ReactQueryCallAnalyzer.DATA_KEYWORDS) {
        const cleanKeyword = keyword.replace('?', '');
        if (stack.toLowerCase().includes(cleanKeyword)) {
          return cleanKeyword;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Detect pagination parameters in server action payloads
   */
  detectPaginationParameters(calls: ReactQueryCallAnalysis[]): boolean {
    try {
      const payloads = calls
        .map(call => call.originalCall?.payload)
        .filter(payload => payload && typeof payload === 'object');

      if (payloads.length < 2) return false;

      for (let i = 1; i < payloads.length; i++) {
        const prev = payloads[i - 1];
        const curr = payloads[i];

        if (typeof prev.offset === 'number' && typeof curr.offset === 'number') {
          const expectedIncrement = prev.offset + (prev.limit || 20);
          if (curr.offset === expectedIncrement) {
            return true;
          }
        }
      }
    } catch (error) {
      // Log parsing errors for debugging
      ErrorHandlingService.handleServiceError(
        'ReactQueryCallAnalyzer',
        'detectPaginationParameters',
        error,
        false
      );
    }

    return false;
  }

  /**
   * Detect scroll-related context in call stacks
   */
  detectScrollContext(calls: ReactQueryCallAnalysis[]): boolean {
    return calls.some(call => {
      const stack = call.originalCall?.source?.stack || '';
      return stack.toLowerCase().includes('scroll') || 
             stack.toLowerCase().includes('intersection') ||
             stack.toLowerCase().includes('onloadmore');
    });
  }
} 