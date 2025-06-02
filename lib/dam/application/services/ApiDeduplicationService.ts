/**
 * API Deduplication Service
 * 
 * Single Responsibility: Prevent duplicate Server Action calls within time windows
 * Used to resolve redundant call issues detected by NetworkCallMonitor
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  actionId: string;
  parameters: any[];
  deduplicationCount: number;
}

interface DeduplicationEvent {
  actionId: string;
  timestamp: number;
  key: string;
  timeoutMs: number;
}

export class ApiDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest>();
  private recentDeduplications: DeduplicationEvent[] = [];
  private readonly defaultTimeoutMs: number = 1000; // 1 second deduplication window
  private readonly maxRecentEvents: number = 50; // Keep last 50 deduplication events
  private static globalCallCount = 0; // Track all Server Action calls

  /**
   * Deduplicate Server Action calls by action ID and parameters
   */
  async deduplicateServerAction<T>(
    actionId: string,
    parameters: any[],
    action: () => Promise<T>,
    timeoutMs: number = this.defaultTimeoutMs
  ): Promise<T> {
    ApiDeduplicationService.globalCallCount++;
    
    // Track globally for monitoring
    (globalThis as any).__serverActionCallCount = ApiDeduplicationService.globalCallCount;
    const key = this.generateKey(actionId, parameters);
    const now = Date.now();

    // Check if there's a pending request
    const existing = this.pendingRequests.get(key);
    if (existing && (now - existing.timestamp) < timeoutMs) {
      // Increment deduplication count
      existing.deduplicationCount++;
      
      // Track deduplication event
      
      this.addDeduplicationEvent({
        actionId,
        timestamp: now,
        key,
        timeoutMs
      });
      
      return existing.promise;
    }

    // Execute new request
    
          const promise = action().finally(() => {
        // Clean up after completion
        this.pendingRequests.delete(key);
      });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
      actionId,
      parameters,
      deduplicationCount: 0
    });

    return promise;
  }

  /**
   * Add deduplication event to recent events list
   */
  private addDeduplicationEvent(event: DeduplicationEvent): void {
    this.recentDeduplications.unshift(event);
    
    // Keep only recent events
    if (this.recentDeduplications.length > this.maxRecentEvents) {
      this.recentDeduplications = this.recentDeduplications.slice(0, this.maxRecentEvents);
    }
  }

  /**
   * Generate unique key for request deduplication
   */
  private generateKey(actionId: string, parameters: any[]): string {
    const paramHash = JSON.stringify(parameters);
    return `${actionId}:${this.hashString(paramHash)}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear all pending requests (useful for testing)
   */
  clear(): void {
    this.pendingRequests.clear();
    this.recentDeduplications = [];
  }

  /**
   * Get current pending request count (for monitoring)
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get current pending requests with details (for monitoring)
   */
  getPendingRequests(): Array<{
    actionId: string;
    timestamp: number;
    deduplicationCount: number;
    key: string;
    age: number;
  }> {
    const now = Date.now();
    return Array.from(this.pendingRequests.entries()).map(([key, request]) => ({
      actionId: request.actionId,
      timestamp: request.timestamp,
      deduplicationCount: request.deduplicationCount,
      key,
      age: now - request.timestamp
    }));
  }

  /**
   * Get recent deduplication events (for monitoring)
   */
  getRecentDeduplications(limit: number = 10): DeduplicationEvent[] {
    return this.recentDeduplications.slice(0, limit);
  }

  /**
   * Clear recent deduplication events
   */
  clearRecentDeduplications(): void {
    this.recentDeduplications = [];
  }
}

// Singleton instance for global use
export const apiDeduplicationService = new ApiDeduplicationService(); 