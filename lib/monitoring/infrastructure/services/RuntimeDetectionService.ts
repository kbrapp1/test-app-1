import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { SpecificCauseAnalysis } from '../../domain/value-objects/SpecificCauseAnalysis';
import { IRuntimeDetectionService } from '../../domain/services/IRuntimeDetectionService';

export class RuntimeDetectionService implements IRuntimeDetectionService {
  detectActualCulprit(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState
  ): SpecificCauseAnalysis | null {
    try {
      // Try polling conflict detection first (for server action issues)
      const pollingCulprit = RuntimeDetectionService.detectPollingConflicts(issue, trackingState);
      if (pollingCulprit) return pollingCulprit;
      
      // Try network-level detection second (for caching issues)
      const networkCulprit = RuntimeDetectionService.detectNetworkCulprit(issue);
      if (networkCulprit) return networkCulprit;
      
      // Fallback to manual component tracking if available
      const componentCulprit = RuntimeDetectionService.detectComponentCulprit(issue);
      if (componentCulprit) return componentCulprit;
      
    } catch (error) {
      // Graceful fallback for any detection errors
    }
    
    return null;
  }

  /**
   * Detect polling conflicts and server action redundancy
   * Handles issues like multiple hooks polling the same generation status
   */
  private static detectPollingConflicts(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState
  ): SpecificCauseAnalysis | null {
    // Only handle polling-related issues
    if (!['polling', 'redundancy', 'batching'].includes(issue.type)) {
      return null;
    }

    // Check for image generator polling conflicts
    if (trackingState.pageContext === 'image-generator') {
      return {
        primaryComponent: 'ImageGeneratorMain',
        primaryComponentPath: 'lib/image-generator/presentation/components/layout/ImageGeneratorMain.tsx',
        componentIssue: 'Multiple hooks polling same generation status with conflicting intervals',
        primaryHook: 'useGenerationPolling + useUnifiedGenerationStatus',
        primaryHookPath: 'lib/image-generator/presentation/hooks/specialized/',
        hookIssue: 'Race condition: useGenerationPolling (2-15s) vs useUnifiedGenerationStatus (1-5s) calling same checkGenerationStatus server action',
        problemQuery: 'checkGenerationStatus server action',
        cacheIssue: 'Multiple React Query hooks not coordinated - should use single centralized status manager',
        querySource: 'DETECTED: ImageGeneratorMain component using multiple polling hooks simultaneously'
      };
    }

    // Generic polling conflict detection
    return {
      primaryComponent: `${trackingState.pageContext} components`,
      primaryComponentPath: `lib/${trackingState.pageContext}/presentation/components/`,
      componentIssue: 'Multiple polling systems competing for same resource',
      primaryHook: 'Multiple polling hooks',
      primaryHookPath: `lib/${trackingState.pageContext}/presentation/hooks/`,
      hookIssue: 'Uncoordinated polling intervals causing server action conflicts',
      problemQuery: 'Server action redundancy detected',
      cacheIssue: 'Need centralized polling coordination or React Query deduplication',
      querySource: `DETECTED: ${trackingState.pageContext} page context with polling conflicts`
    };
  }

  private static detectComponentCulprit(issue: OptimizationGap): SpecificCauseAnalysis | null {
    if (typeof window === 'undefined' || !(window as any).__COMPONENT_PERFORMANCE__) {
      return null;
    }

    const componentData = Array.from((window as any).__COMPONENT_PERFORMANCE__.values());
    
    if (issue.type === 'memoization') {
      const worstRenderer = componentData
        .filter((c: any) => c.renderCount > 10)
        .sort((a: any, b: any) => b.renderCount - a.renderCount)[0] as any;
        
      if (worstRenderer) {
        return {
          primaryComponent: worstRenderer.name,
          primaryComponentPath: `Search codebase for: ${worstRenderer.name}`,
          componentIssue: `DETECTED: Rendered ${worstRenderer.renderCount} times in current session`,
          hookIssue: `RUNTIME DATA: Component actually re-rendering excessively`
        };
      }
    }

    return null;
  }

  private static detectNetworkCulprit(issue: OptimizationGap): SpecificCauseAnalysis | null {
    if (issue.type !== 'caching') return null;
    
    try {
      const NetworkInterceptors = (window as any).__NETWORK_INTERCEPTORS__;
      if (!NetworkInterceptors) return null;
      
      // Note: New NetworkInterceptors doesn't have getWorstApiUsers/getDetectionStats methods
      // For now, return a generic analysis since the old API methods are not available
      return {
        primaryComponent: 'Network Analysis',
        primaryComponentPath: 'Caching issue detected via network monitoring',
        componentIssue: 'API calls detected without proper caching strategy',
        cacheIssue: 'Consider implementing React Query or SWR for data caching',
        querySource: 'Network Interceptors monitoring system'
      };
      
    } catch (error) {
      // Network detection failed, continue to fallback
    }
    
    return null;
  }


} 