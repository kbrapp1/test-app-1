import { NetworkCall } from '../entities/NetworkCall';
import { NetworkIssue } from '../value-objects/NetworkIssue';

/**
 * Domain Service: Network Issue Detection Service
 * Responsibility: Detect performance issues in network calls
 */
export class NetworkIssueDetectionService {
  
  static detectIssues(calls: NetworkCall[]): NetworkIssue[] {
    const issues: NetworkIssue[] = [];
    
    // Detect slow calls
    const slowCalls = calls.filter(call => call.duration && call.duration > 3000);
    if (slowCalls.length > 0) {
      issues.push(new NetworkIssue(
        'slow-response',
        'Slow Network Requests',
        `${slowCalls.length} slow network requests detected`,
        'high',
        slowCalls.length,
        false
      ));
    }
    
    // Detect failed calls
    const failedCalls = calls.filter(call => call.status && call.status >= 400);
    if (failedCalls.length > 0) {
      issues.push(new NetworkIssue(
        'failed-request',
        'Failed Network Requests',
        `${failedCalls.length} failed network requests detected`,
        'high',
        failedCalls.length,
        false
      ));
    }
    
    return issues;
  }
  
  static analyzeNetworkPatterns(_calls: NetworkCall[]): string[] {
    // TODO: Implement pattern analysis
    return [];
  }
}