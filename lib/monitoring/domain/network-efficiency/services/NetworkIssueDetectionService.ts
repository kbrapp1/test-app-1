import { NetworkStats, NetworkCall } from '../entities/NetworkCall';
import { NetworkIssue } from '../value-objects/NetworkIssue';

export class NetworkIssueDetectionService {
  static detectIssues(stats: NetworkStats): NetworkIssue[] {
    const issues: NetworkIssue[] = [];
    
    // Redundancy issues
    if (stats.redundantCalls > 0) {
      issues.push(NetworkIssue.createRedundancyIssue(stats.redundantCalls));
    }
    
    // Slow response issues
    const avgResponseTime = this.calculateAverageResponseTime(stats.recentCalls);
    if (avgResponseTime > 1000) {
      issues.push(NetworkIssue.createSlowResponseIssue(avgResponseTime));
    }
    
    // Failed request issues
    const failedCount = stats.recentCalls.filter(call => 
      call.status && call.status >= 400
    ).length;
    if (failedCount > 0) {
      issues.push(NetworkIssue.createFailedRequestIssue(failedCount));
    }
    
    // High volume issues (more than 15 calls in recent window)
    if (stats.recentCalls.length > 15) {
      issues.push(NetworkIssue.createHighVolumeIssue(stats.recentCalls.length));
    }
    
    return issues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  private static calculateAverageResponseTime(calls: NetworkCall[]): number {
    const callsWithDuration = calls.filter(call => call.duration !== undefined);
    if (callsWithDuration.length === 0) return 0;
    
    const totalTime = callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0);
    return Math.round(totalTime / callsWithDuration.length);
  }
} 