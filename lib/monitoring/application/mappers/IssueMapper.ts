import { OptimizationGap } from '../../domain/value-objects/OptimizationGap';
import { NetworkIssue } from '../../domain/network-efficiency/value-objects/NetworkIssue';
import { CrossDomainInsight } from '../../domain/cross-domain/services/PerformanceCorrelationService';
import { UnifiedIssueDto } from '../dto/UnifiedIssueDto';

export class IssueMapper {
  static mapToUnifiedIssues(
    frontendIssues: OptimizationGap[],
    networkIssues: NetworkIssue[],
    crossDomainInsights: CrossDomainInsight[]
  ): UnifiedIssueDto[] {
    const baseTimestamp = Date.now();
    let timestampOffset = 0;
    
    const allIssues: UnifiedIssueDto[] = [
      // Network issues get most recent timestamps
      ...networkIssues.map(issue => ({
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'Network' as const,
        icon: this.getNetworkIcon(issue.type),
        timestamp: baseTimestamp - (timestampOffset++ * 10)
      })),
      // Cross-domain insights (filter out positive ones)
      ...crossDomainInsights
        .filter(insight => !this.isPositiveInsight(insight))
        .map(insight => ({
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          category: 'Cross-Domain' as const,
          icon: this.getCrossDomainIcon(insight.type),
          timestamp: baseTimestamp - (timestampOffset++ * 10)
        })),
      // Frontend issues
      ...frontendIssues.map(issue => ({
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: 'Frontend' as const,
        icon: this.getFrontendIcon(issue.type),
        timestamp: baseTimestamp - (timestampOffset++ * 10)
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    return allIssues;
  }

  static getPositiveInsights(crossDomainInsights: CrossDomainInsight[]): CrossDomainInsight[] {
    return crossDomainInsights.filter(insight => this.isPositiveInsight(insight));
  }

  private static isPositiveInsight(insight: CrossDomainInsight): boolean {
    return insight.title === 'Optimal Performance' || 
           (insight.type === 'optimization' && insight.severity === 'low' && 
            insight.description.includes('well optimized'));
  }

  private static getNetworkIcon(type: string): string {
    switch (type) {
      case 'redundancy': return '🔄';
      case 'slow-response': return '🐌';
      default: return '❌';
    }
  }

  private static getCrossDomainIcon(type: string): string {
    switch (type) {
      case 'correlation': return '🔗';
      case 'cascade': return '⚡';
      default: return '🎯';
    }
  }

  private static getFrontendIcon(type: string): string {
    switch (type) {
      case 'memoization': return '⚡';
      case 'caching': return '💾';
      default: return '🚀';
    }
  }
} 