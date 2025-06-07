import { ReactQueryCallAnalysis } from '../value-objects/CacheAnalysisResult';

/**
 * Domain Service: Server Action Duplicate Detection
 * 
 * Responsibility: Detect redundant server action calls that bypass React Query cache
 * Bounded Context: Performance Monitoring - Cache Analysis
 * 
 * Single Responsibility: Focus solely on identifying server action duplicates
 * 
 * Business Rules:
 * - Multiple server actions with same data type indicate cache bypass
 * - Time difference between calls affects severity assessment
 * - Payload analysis helps distinguish legitimate vs problematic patterns
 */
export class ServerActionDuplicateDetector {

  /**
   * Detect server action duplicates for the same data type
   * 
   * @param analyses - Array of React Query call analyses
   * @returns Duplicate detection result or null if no issues found
   */
  detectDuplicates(analyses: ReactQueryCallAnalysis[]): any | null {
    const serverActions = this.filterServerActions(analyses);
    const sameDataType = this.groupByDataType(serverActions);
    
    for (const [dataType, calls] of Object.entries(sameDataType)) {
      if (calls.length >= 2) {
        const timeDiff = this.calculateTimeDifference(calls);
        return this.buildDuplicateResult(calls, timeDiff, dataType);
      }
    }

    return null;
  }

  /**
   * Filter analyses to only include server actions
   */
  private filterServerActions(analyses: ReactQueryCallAnalysis[]): ReactQueryCallAnalysis[] {
    return analyses.filter(a => a.hookName?.includes('server-action'));
  }

  /**
   * Group server actions by data type
   */
  private groupByDataType(serverActions: ReactQueryCallAnalysis[]): Record<string, ReactQueryCallAnalysis[]> {
    const groups: Record<string, ReactQueryCallAnalysis[]> = {};
    
    serverActions.forEach(action => {
      const dataType = action.dataType || 'unknown';
      if (!groups[dataType]) groups[dataType] = [];
      groups[dataType].push(action);
    });

    return groups;
  }

  /**
   * Calculate time difference between first and last calls
   */
  private calculateTimeDifference(calls: ReactQueryCallAnalysis[]): number {
    if (calls.length < 2) return 0;
    const timestamps = calls.map(call => call.originalCall?.timestamp || 0).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  /**
   * Build the duplicate detection result
   */
  private buildDuplicateResult(calls: ReactQueryCallAnalysis[], timeDiff: number, dataType: string): any {
    return {
      severity: this.determineSeverity(timeDiff),
      issue: 'SERVER_ACTION_CACHE_BYPASS: React Query cache not preventing redundant server actions',
      rootCause: `Same ${dataType} server action called ${calls.length} times within ${timeDiff}ms`,
      specificFix: this.generateFix(timeDiff),
      codeLocation: this.inferCodeLocation(dataType),
      estimatedImpact: `${Math.round((calls.length - 1) / calls.length * 100)}% redundancy elimination`
    };
  }

  /**
   * Determine severity based on timing patterns
   */
  private determineSeverity(timeDiff: number): 'critical' | 'high' | 'medium' | 'low' {
    if (timeDiff < 1000) return 'critical';
    if (timeDiff < 5000) return 'high';
    if (timeDiff < 30000) return 'medium';
    return 'low';
  }

  /**
   * Generate appropriate fix recommendation based on timing
   */
  private generateFix(timeDiff: number): string {
    if (timeDiff < 1000) {
      return 'Add request deduplication and fix component re-render issues';
    }
    if (timeDiff < 5000) {
      return 'Increase React Query staleTime to 2-5 minutes';
    }
    if (timeDiff < 30000) {
      return 'Review cache invalidation and staleTime settings';
    }
    return 'Verify cache persistence and garbage collection settings';
  }

  /**
   * Infer likely code location based on data type
   */
  private inferCodeLocation(dataType: string): string {
    const locationMap: Record<string, string> = {
      'generations': 'lib/image-generator/presentation/hooks/queries/useGenerations.ts',
      'assets': 'lib/dam/presentation/hooks/queries/useAssets.ts',
      'users': 'lib/auth/presentation/hooks/queries/useUsers.ts',
      'members': 'lib/organization/presentation/hooks/queries/useMembers.ts'
    };

    return locationMap[dataType] || `lib/${dataType}/presentation/hooks/queries/use${dataType}.ts`;
  }
} 