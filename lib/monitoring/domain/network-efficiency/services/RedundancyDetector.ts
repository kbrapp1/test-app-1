/**
 * Redundancy Detector Service (Domain Layer)
 * 
 * Single Responsibility: Detect redundant network call patterns
 * Pure business logic - no external dependencies
 */

import { NetworkCall, RedundantCall } from '../entities/NetworkCall';

export class RedundancyDetector {
  private readonly redundancyWindow: number;

  constructor(redundancyWindowMs: number = 30000) {
    this.redundancyWindow = redundancyWindowMs;
  }

  /**
   * Detect redundant patterns in network calls
   */
  detectRedundancy(calls: NetworkCall[]): RedundantCall[] {
    const now = Date.now();
    const patterns: RedundantCall[] = [];
    
    // Group calls by URL+method within time window
    const callGroups = this.groupCallsByEndpoint(calls, now);
    
    // Find groups with multiple calls
    callGroups.forEach(calls => {
      if (calls.length > 1) {
        const [original, ...duplicates] = calls.sort((a, b) => a.timestamp - b.timestamp);
        
        patterns.push({
          originalCall: original,
          duplicateCalls: duplicates,
          timeWindow: Math.max(...duplicates.map(d => d.timestamp)) - original.timestamp,
          pattern: this.classifyPattern(calls),
          detectedAt: Date.now()
        });
      }
    });
    
    return patterns;
  }

  /**
   * Check if calls are redundant within the time window
   */
  areCallsRedundant(call1: NetworkCall, call2: NetworkCall): boolean {
    const timeDiff = Math.abs(call1.timestamp - call2.timestamp);
    const sameEndpoint = call1.method === call2.method && call1.url === call2.url;
    
    return sameEndpoint && timeDiff <= this.redundancyWindow;
  }

  /**
   * Group calls by endpoint within time window
   */
  private groupCallsByEndpoint(calls: NetworkCall[], currentTime: number): Map<string, NetworkCall[]> {
    const callGroups = new Map<string, NetworkCall[]>();
    
    calls
      .filter(call => currentTime - call.timestamp <= this.redundancyWindow)
      .forEach(call => {
        const key = `${call.method}:${call.url}`;
        if (!callGroups.has(key)) {
          callGroups.set(key, []);
        }
        callGroups.get(key)!.push(call);
      });
    
    return callGroups;
  }

  /**
   * Classify redundancy pattern based on timing and similarity
   */
  private classifyPattern(calls: NetworkCall[]): string {
    const maxTimeDiff = Math.max(...calls.map(c => c.timestamp)) - Math.min(...calls.map(c => c.timestamp));
    
    if (maxTimeDiff < 100) return 'rapid-fire'; // < 100ms apart
    if (maxTimeDiff < 1000) return 'burst'; // < 1s apart
    return 'repeated'; // Multiple calls over longer period
  }
} 