import { NetworkStats } from '../../network-efficiency/entities/NetworkCall';

export class NetworkBusinessImpactService {
  static calculateBusinessImpact(stats: NetworkStats): string {
    const redundancyRate = stats.redundancyRate;
    
    if (redundancyRate >= 30) {
      return `🔴 **CRITICAL**: ${redundancyRate.toFixed(1)}% redundant calls causing significant user experience degradation`;
    } else if (redundancyRate >= 15) {
      return `🟡 **HIGH**: ${redundancyRate.toFixed(1)}% redundant calls impacting performance and increasing costs`;
    } else if (redundancyRate >= 5) {
      return `🟢 **MEDIUM**: ${redundancyRate.toFixed(1)}% redundant calls - optimization opportunity`;
    } else {
      return `✅ **LOW**: ${redundancyRate.toFixed(1)}% redundant calls - network efficiency is good`;
    }
  }

  static determineIssuePriority(duplicateCount: number, timeWindow: number): {
    priority: 'critical' | 'high' | 'medium' | 'low';
    timeToFix: string;
    businessImpact: string;
  } {
    if (duplicateCount >= 5 || timeWindow < 1000) {
      return {
        priority: 'critical',
        timeToFix: '30 minutes',
        businessImpact: 'User experience degradation'
      };
    } else if (duplicateCount >= 3) {
      return {
        priority: 'high',
        timeToFix: '1 hour',
        businessImpact: 'Increased server load'
      };
    }

    return {
      priority: 'medium',
      timeToFix: '1-2 hours',
      businessImpact: 'Performance optimization'
    };
  }
} 