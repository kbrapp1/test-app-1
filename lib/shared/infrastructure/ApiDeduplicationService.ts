/**
 * API Deduplication Service - Shared Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Prevent duplicate Server Action calls within time windows
 * - Domain-aware timeouts for different operation types
 * - Security-conscious deduplication with audit logging
 * - Used across all domains (auth, DAM, TTS, etc.)
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on deduplication logic
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  actionId: string;
  parameters: any[];
  deduplicationCount: number;
  domain?: string;
}

interface DeduplicationEvent {
  actionId: string;
  timestamp: number;
  key: string;
  timeoutMs: number;
  domain?: string;
}

export class ApiDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest>();
  private recentDeduplications: DeduplicationEvent[] = [];
  private readonly maxRecentEvents: number = 50;
  private static globalCallCount = 0;

  // Domain-aware timeout configuration
  private readonly domainTimeouts: Record<string, number> = {
    'getUser': 8000,           // 8 seconds for user validation
    'getActiveOrganizationId': 10000, // 10 seconds for org context
    'tts-operations': 1500,    // 1.5 seconds for TTS workflows (reduced from 5s)
    'dam-operations': 6000,    // 6 seconds for DAM operations
    'notes-operations': 3000,  // 3 seconds for Notes unified context (rapid refresh protection)
    'organization-switch': 2000, // 2 seconds for context switches (security-sensitive)
    'saveTtsAudioToDam': 800,  // 800ms for save operations (unique per asset name)
    'markTtsUrlProblematic': 500, // 500ms for marking operations
    'default': 1500           // Default for other operations
  };

  /**
   * Deduplicate Server Action calls with domain-aware timeouts
   */
  async deduplicateServerAction<T>(
    actionId: string,
    parameters: any[],
    action: () => Promise<T>,
    domain?: string
  ): Promise<T> {
    ApiDeduplicationService.globalCallCount++;
    
    // Track globally for monitoring
    (globalThis as any).__serverActionCallCount = ApiDeduplicationService.globalCallCount;
    
    // Determine timeout based on domain or action ID
    const timeout = this.getTimeoutForDomain(domain, actionId);
    
    const key = this.generateKey(actionId, parameters);
    const now = Date.now();

    // Check if there's a pending request
    const existing = this.pendingRequests.get(key);
    if (existing && (now - existing.timestamp) < timeout) {
      // Increment deduplication count
      existing.deduplicationCount++;
      
      // Track deduplication event with security logging
      this.addDeduplicationEvent({
        actionId,
        timestamp: now,
        key,
        timeoutMs: timeout,
        domain
      });
      
      // Security logging for high-frequency deduplication
      if (existing.deduplicationCount > 5) {
        this.logSecurityEvent(actionId, existing.deduplicationCount, domain);
      }
      
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
      deduplicationCount: 0,
      domain
    });

    return promise;
  }

  /**
   * Get timeout for domain or action ID
   */
  private getTimeoutForDomain(domain?: string, actionId?: string): number {
    // Check domain first
    if (domain && this.domainTimeouts[domain]) {
      return this.domainTimeouts[domain];
    }
    
    // Check if action ID matches known patterns
    if (actionId) {
      for (const [key, timeout] of Object.entries(this.domainTimeouts)) {
        if (actionId.includes(key)) {
          return timeout;
        }
      }
    }
    
    // Security-sensitive operations get shorter timeouts
    const securitySensitiveActions = ['organization-switch', 'role-change', 'permission-check'];
    if (actionId && securitySensitiveActions.some(action => actionId.includes(action))) {
      return this.domainTimeouts['organization-switch'];
    }
    
    return this.domainTimeouts.default;
  }

  /**
   * Add deduplication event with security context
   */
  private addDeduplicationEvent(event: DeduplicationEvent): void {
    this.recentDeduplications.unshift(event);
    
    // Keep only recent events
    if (this.recentDeduplications.length > this.maxRecentEvents) {
      this.recentDeduplications = this.recentDeduplications.slice(0, this.maxRecentEvents);
    }
  }

  /**
   * Security logging for suspicious deduplication patterns
   */
  private logSecurityEvent(actionId: string, deduplicationCount: number, domain?: string): void {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event: 'HIGH_DEDUPLICATION_FREQUENCY',
      actionId,
      deduplicationCount,
      domain,
      source: 'ApiDeduplicationService'
    };
    
    // Enhanced audit logging for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SECURITY_AUDIT]', securityEvent);
    } else {
      // Production: structured logging for monitoring systems
      console.log('[AUDIT]', JSON.stringify(securityEvent));
    }
  }

  /**
   * Generate unique key for request deduplication
   */
  private generateKey(actionId: string, parameters: any[]): string {
    // For save operations, include timestamp to make them more unique
    // This prevents legitimate save operations from being deduplicated
    const saveOperations = ['saveTtsAudioToDam', 'saveAsNewTextAsset', 'updateAssetText'];
    const shouldIncludeTimestamp = saveOperations.some(op => actionId.includes(op));
    
    let paramHash = JSON.stringify(parameters);
    
    // Add timestamp for save operations to prevent over-aggressive deduplication
    if (shouldIncludeTimestamp) {
      // Round to nearest 100ms to allow very rapid duplicate clicks to be caught
      // but allow legitimate saves with different asset names
      const roundedTimestamp = Math.floor(Date.now() / 100) * 100;
      paramHash += `:${roundedTimestamp}`;
    }
    
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
    domain?: string;
  }> {
    const now = Date.now();
    return Array.from(this.pendingRequests.entries()).map(([key, request]) => ({
      actionId: request.actionId,
      timestamp: request.timestamp,
      deduplicationCount: request.deduplicationCount,
      key,
      age: now - request.timestamp,
      domain: request.domain
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

  /**
   * Get domain timeout configuration (for monitoring)
   */
  getDomainTimeouts(): Record<string, number> {
    return { ...this.domainTimeouts };
  }
}

// Singleton instance for global use
export const apiDeduplicationService = new ApiDeduplicationService(); 