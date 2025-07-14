import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';

/**
 * Domain Service: Specific Cause Analyzer for Frontend Performance Issues
 * Responsibility: Analyze specific causes and provide detailed component-level insights
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Focus solely on root cause analysis
 */
export class SpecificCauseAnalyzerService {
  
  /**
   * Business Rule: Analyze specific cause for optimization issue
   * Returns detailed component and hook-level analysis
   */
  analyzeSpecificCause(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    _metrics: PerformanceMetrics,
    _index: number
  ): SpecificCauseAnalysis {
    switch (issue.type) {
      case 'memoization':
        return this.analyzeMemoizationCause(trackingState);
      case 'caching':
        return this.analyzeCachingCause(trackingState);
      default:
        return this.analyzeGenericCause(issue, trackingState);
    }
  }

  /**
   * Business Rule: Analyze memoization-specific causes
   */
  private analyzeMemoizationCause(trackingState: PerformanceTrackingState): SpecificCauseAnalysis {
    return {
      primaryComponent: `${trackingState.pageContext} components`,
      primaryComponentPath: `lib/${trackingState.pageContext}/presentation/components/`,
      componentIssue: 'Excessive re-renders detected',
      primaryHook: 'Component state hooks',
      primaryHookPath: `lib/${trackingState.pageContext}/presentation/hooks/`,
      hookIssue: 'Missing memoization optimization'
    };
  }

  /**
   * Business Rule: Analyze caching-specific causes
   */
  private analyzeCachingCause(trackingState: PerformanceTrackingState): SpecificCauseAnalysis {
    return {
      primaryComponent: 'React Query Provider',
      primaryComponentPath: 'app/layout.tsx or app/(protected)/layout.tsx',
      componentIssue: 'Missing QueryClientProvider or suboptimal cache configuration',
      problemQuery: `All API calls in ${trackingState.pageContext} context`,
      cacheIssue: 'No React Query cache configured, causing repeated identical requests',
      querySource: `${trackingState.pageContext} page components`
    };
  }

  /**
   * Business Rule: Analyze generic optimization causes
   */
  private analyzeGenericCause(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState
  ): SpecificCauseAnalysis {
    return {
      primaryComponent: `${trackingState.pageContext} components`,
      primaryComponentPath: `lib/${trackingState.pageContext}/presentation/components/`,
      componentIssue: `Performance optimization needed: ${issue.title}`
    };
  }
}

/**
 * Value Object: Specific cause analysis result
 */
export interface SpecificCauseAnalysis {
  readonly primaryComponent: string;
  readonly primaryComponentPath: string;
  readonly componentIssue: string;
  readonly primaryHook?: string;
  readonly primaryHookPath?: string;
  readonly hookIssue?: string;
  readonly problemQuery?: string;
  readonly cacheIssue?: string;
  readonly querySource?: string;
} 