import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { PerformanceTrackingState } from '../../application/dto/PerformanceTrackingDTO';
import { SpecificCauseAnalysis } from '../../domain/value-objects/SpecificCauseAnalysis';

export class ContextDiscoveryService {
  static analyzePatternFromDiscovery(
    issue: OptimizationGap,
    trackingState: PerformanceTrackingState
  ): SpecificCauseAnalysis {
    const analysis: SpecificCauseAnalysis = {};
    const pageContext = trackingState.pageContext;
    
    // Get discovered components for this domain
    const domainAnalysis = this.analyzePageContext(pageContext, issue.type);
    if (domainAnalysis.likelyComponents.length === 0) {
      return analysis; // No components discovered
    }
    
    // Provide the discovered components without making assumptions
    const primaryComponent = domainAnalysis.likelyComponents[0];
    if (primaryComponent) {
      analysis.primaryComponent = `${primaryComponent} (domain-detected)`;
      analysis.primaryComponentPath = `Search codebase for: ${primaryComponent}`;
      analysis.componentIssue = `AUTO-DISCOVERED: Component found in ${pageContext} domain`;
    }
    
    const primaryHook = domainAnalysis.likelyHooks[0];
    if (primaryHook) {
      analysis.primaryHook = `${primaryHook} (domain-detected)`;
      analysis.primaryHookPath = `Search codebase for: ${primaryHook}`;
      analysis.hookIssue = `AUTO-DISCOVERED: Hook found in ${pageContext} domain`;
    }
    
    // Only provide factual information without assumptions
    if (issue.type === 'caching') {
      analysis.problemQuery = `API calls in ${pageContext} domain`;
      analysis.cacheIssue = `Domain ${pageContext} may benefit from React Query implementation`;
      analysis.querySource = `${pageContext} domain components`;
    }
    
    return analysis;
  }

  private static analyzePageContext(pageContext: string, _issueType: string): {
    likelyComponents: string[];
    likelyHooks: string[];
  } {
    // Use auto-discovered contexts from generated file
    try {
      // Import discovered contexts dynamically to avoid bundling in client
      // Dynamic import would be preferred, but using require for sync compatibility
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DISCOVERED_CONTEXTS } = require('../generated/DiscoveredContexts');
      const context = DISCOVERED_CONTEXTS.find((ctx: { domain: string; components?: string[]; queryKeys?: string[] }) => ctx.domain === pageContext);
      
      if (context) {
        return {
          likelyComponents: context.components || [],
          likelyHooks: context.queryKeys || [] // Query keys often match hook names
        };
      }
      
      return { likelyComponents: [], likelyHooks: [] };
    } catch {
      // Graceful fallback if generation hasn't run yet
      return { likelyComponents: [], likelyHooks: [] };
    }
  }
} 