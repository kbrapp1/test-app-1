import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { NetworkIssue } from '../../network-efficiency/value-objects/NetworkIssue';
import { RenderMetrics } from '../../entities/PerformanceMetrics';
import { NetworkStats } from '../../network-efficiency/entities/NetworkCall';

export interface CrossDomainInsight {
  type: 'correlation' | 'cascade' | 'optimization';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  domains: ('frontend' | 'network')[];
}

export class PerformanceCorrelationService {
  static generateInsights(
    frontendOptimizations: OptimizationGap[],
    networkIssues: NetworkIssue[],
    renderMetrics: RenderMetrics,
    networkStats: NetworkStats
  ): CrossDomainInsight[] {
    const insights: CrossDomainInsight[] = [];
    
    // High renders + redundant calls = performance bottleneck
    const hasMemoizationIssue = frontendOptimizations.some(opt => opt.type === 'memoization');
    const hasRedundancy = networkIssues.some(issue => issue.type === 'redundancy');
    
    if (hasMemoizationIssue && hasRedundancy) {
      insights.push({
        type: 'correlation',
        title: 'Cascade Performance Impact',
        description: `High re-renders (${renderMetrics.count}) + redundant API calls (${networkStats.redundantCalls}) are compounding performance issues`,
        severity: 'high',
        domains: ['frontend', 'network']
      });
    }
    
    // Network slowness causing render delays
    const hasSlowNetwork = networkIssues.some(issue => issue.type === 'slow-response');
    const hasHighRenders = renderMetrics.count > 20;
    
    if (hasSlowNetwork && hasHighRenders) {
      insights.push({
        type: 'cascade',
        title: 'Network Latency Cascade',
        description: 'Slow network responses may be triggering excessive re-renders',
        severity: 'medium',
        domains: ['frontend', 'network']
      });
    }
    
    // Cache misses causing redundant calls
    const hasCachingIssue = frontendOptimizations.some(opt => opt.type === 'caching');
    if (hasCachingIssue && hasRedundancy) {
      insights.push({
        type: 'optimization',
        title: 'Missing Cache Strategy',
        description: 'Implement React Query caching to prevent redundant API calls',
        severity: 'medium',
        domains: ['frontend', 'network']
      });
    }
    
    // Perfect efficiency correlation
    const goodFrontend = renderMetrics.count <= 10 && frontendOptimizations.length === 0;
    const goodNetwork = networkStats.redundancyRate < 5;
    
    // Only show "Optimal Performance" if there's been actual activity (not fresh reset)
    const hasActivity = renderMetrics.count > 0 || networkStats.totalCalls > 0;
    
    if (goodFrontend && goodNetwork && hasActivity) {
      insights.push({
        type: 'optimization',
        title: 'Optimal Performance',
        description: 'Both frontend and network performance are well optimized',
        severity: 'low',
        domains: ['frontend', 'network']
      });
    }
    
    return insights.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
} 