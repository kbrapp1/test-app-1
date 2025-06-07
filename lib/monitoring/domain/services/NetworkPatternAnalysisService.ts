export interface NetworkIssueAnalysis {
  issue: string;
  suggestedFix: string;
  pattern: 'rapid-fire' | 'identical' | 'burst' | 'unknown';
}

export class NetworkPatternAnalysisService {
  static analyzeNetworkPattern(pattern: any): NetworkIssueAnalysis | null {
    const duplicateCount = pattern.duplicateCalls.length;
    
    if (pattern.pattern === 'rapid-fire') {
      return {
        issue: `Rapid-fire calls: ${duplicateCount} duplicates in ${pattern.timeWindow}ms`,
        suggestedFix: 'Add debouncing or useCallback optimization',
        pattern: 'rapid-fire'
      };
    } else if (pattern.pattern === 'identical') {
      return {
        issue: `Identical requests: ${duplicateCount} exact duplicates`,
        suggestedFix: 'Implement React Query caching',
        pattern: 'identical'
      };
    } else if (pattern.pattern === 'burst') {
      return {
        issue: `Burst pattern: ${duplicateCount} call${duplicateCount === 1 ? '' : 's'} in quick succession`,
        suggestedFix: 'Review component lifecycle and mounting',
        pattern: 'burst'
      };
    }

    // ENHANCED DETECTION: Check if this looks like legitimate infinite scroll
    if (pattern.pattern === 'repeated') {
      // Check for pagination parameters in the calls
      const hasPaginationParams = this.detectPaginationInCalls(pattern);
      const hasReasonableTiming = pattern.timeWindow >= 3000; // 3+ seconds
      
      if (hasPaginationParams || (hasReasonableTiming && pattern.timeWindow >= 5000)) {
        const reason = hasPaginationParams 
          ? 'Pagination parameters detected' 
          : 'Manual interaction timing (5+ seconds)';
          
        return null; // No issue detected - legitimate infinite scroll
      }
    }

    return {
      issue: `${pattern.pattern.toUpperCase()} pattern: ${duplicateCount} call${duplicateCount === 1 ? '' : 's'} over ${pattern.timeWindow}ms`,
      suggestedFix: 'Implement request deduplication or caching',
      pattern: 'unknown'
    };
  }

  static generateQueryKey(call: any): string {
    if (call.url) {
      // Extract meaningful parts from URL
      const urlParts = call.url.split('/').filter((part: string) => part && !part.match(/^[a-f0-9-]{36}$/)); // Remove UUIDs
      return urlParts.slice(-2).join('-') || 'endpoint';
    }
    
    if (call.type === 'server-action') {
      return `server-action-${call.payload?.actionId?.substring(0, 8) || 'unknown'}`;
    }
    
    return 'unknown-endpoint';
  }

  /**
   * Detect pagination patterns in network calls
   */
  private static detectPaginationInCalls(pattern: any): boolean {
    try {
      const calls = [pattern.originalCall, ...pattern.duplicateCalls];
      const payloads = calls
        .map(call => call.payload)
        .filter(payload => payload && typeof payload === 'object');

      if (payloads.length < 2) return false;

      // Look for offset/limit patterns
      for (let i = 1; i < payloads.length; i++) {
        const prev = payloads[i - 1];
        const curr = payloads[i];

        // Check for offset increments (0, 20, 40...)
        if (typeof prev.offset === 'number' && typeof curr.offset === 'number') {
          const expectedIncrement = prev.offset + (prev.limit || 20);
          if (curr.offset === expectedIncrement) {
            return true; // Found pagination pattern
          }
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return false;
  }
} 