/**
 * Generic Network Monitor Service
 * 
 * Single Responsibility: Monitor ALL network requests for redundancy patterns
 * Can track any HTTP calls - Server Actions, API routes, fetch calls, etc.
 */

export interface NetworkCall {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  duration?: number;
  status?: number;
  type: 'server-action' | 'api-route' | 'fetch' | 'xhr' | 'unknown';
  payload?: any;
  response?: any;
  headers?: Record<string, string>;
  error?: string;
}

export interface RedundantCall {
  originalCall: NetworkCall;
  duplicateCalls: NetworkCall[];
  timeWindow: number;
  pattern: 'identical' | 'similar' | 'rapid-fire';
  detectedAt: number; // When this redundancy was first detected
}

export interface NetworkStats {
  totalCalls: number;
  redundantCalls: number;
  redundancyRate: number;
  avgCallDuration: number;
  callsByType: Record<string, number>;
  recentCalls: NetworkCall[];
  redundantPatterns: RedundantCall[];
  persistentRedundantCount: number; // Total redundant calls ever detected
  sessionRedundancyRate: number; // Overall session redundancy rate
}

export class GenericNetworkMonitor {
  private calls: NetworkCall[] = [];
  private detectedRedundancies: RedundantCall[] = []; // Persistent redundancy storage
  private readonly maxCallHistory = 1000;
  private readonly redundancyWindow = 30000; // Extended to 30 seconds for better detection
  private readonly maxRedundancyHistory = 100; // Keep last 100 redundancy patterns
  
  /**
   * Track any network call
   */
  trackCall(call: Omit<NetworkCall, 'id' | 'timestamp'>): string {
    const networkCall: NetworkCall = {
      ...call,
      id: this.generateCallId(),
      timestamp: Date.now(),
    };
    
    this.calls.unshift(networkCall);
    
    // Keep only recent calls
    if (this.calls.length > this.maxCallHistory) {
      this.calls = this.calls.slice(0, this.maxCallHistory);
    }
    
    // Check for new redundancies after adding the call
    this.detectAndStoreNewRedundancies();
    
    return networkCall.id;
  }
  
  /**
   * Update call with completion data
   */
  completeCall(callId: string, data: { duration?: number; status?: number; response?: any; error?: string }): void {
    const call = this.calls.find(c => c.id === callId);
    if (call) {
      Object.assign(call, data);
    }
  }
  
  /**
   * Detect and store new redundancies
   */
  private detectAndStoreNewRedundancies(): void {
    const now = Date.now();
    
    // Group calls by URL+method within time window
    const callGroups = new Map<string, NetworkCall[]>();
    
    this.calls
      .filter(call => now - call.timestamp <= this.redundancyWindow)
      .forEach(call => {
        const key = `${call.method}:${call.url}`;
        if (!callGroups.has(key)) {
          callGroups.set(key, []);
        }
        callGroups.get(key)!.push(call);
      });
    
    // Find groups with multiple calls that haven't been detected yet
    callGroups.forEach(calls => {
      if (calls.length > 1) {
        const [original, ...duplicates] = calls.sort((a, b) => a.timestamp - b.timestamp);
        
        // Check if this redundancy pattern already exists
        const patternKey = `${original.method}:${original.url}:${original.timestamp}`;
        const existingPattern = this.detectedRedundancies.find(r => 
          r.originalCall.id === original.id
        );
        
        if (!existingPattern) {
          const newRedundancy: RedundantCall = {
            originalCall: original,
            duplicateCalls: duplicates,
            timeWindow: Math.max(...duplicates.map(d => d.timestamp)) - original.timestamp,
            pattern: this.classifyPattern(calls),
            detectedAt: now,
          };
          
          this.detectedRedundancies.unshift(newRedundancy);
          
          // Keep only recent redundancies
          if (this.detectedRedundancies.length > this.maxRedundancyHistory) {
            this.detectedRedundancies = this.detectedRedundancies.slice(0, this.maxRedundancyHistory);
          }
          
          console.warn(`🔄 Redundant calls detected:`, {
            pattern: newRedundancy.pattern,
            url: original.url,
            duplicateCount: duplicates.length,
            timeWindow: newRedundancy.timeWindow,
          });
        }
      }
    });
  }
  
  /**
   * Get current redundancy patterns (within active window)
   */
  private getCurrentRedundancy(): RedundantCall[] {
    const now = Date.now();
    
    // Group calls by URL+method within time window
    const callGroups = new Map<string, NetworkCall[]>();
    
    this.calls
      .filter(call => now - call.timestamp <= this.redundancyWindow)
      .forEach(call => {
        const key = `${call.method}:${call.url}`;
        if (!callGroups.has(key)) {
          callGroups.set(key, []);
        }
        callGroups.get(key)!.push(call);
      });
    
    // Find groups with multiple calls
    const currentPatterns: RedundantCall[] = [];
    callGroups.forEach(calls => {
      if (calls.length > 1) {
        const [original, ...duplicates] = calls.sort((a, b) => a.timestamp - b.timestamp);
        
        currentPatterns.push({
          originalCall: original,
          duplicateCalls: duplicates,
          timeWindow: Math.max(...duplicates.map(d => d.timestamp)) - original.timestamp,
          pattern: this.classifyPattern(calls),
          detectedAt: now,
        });
      }
    });
    
    return currentPatterns;
  }
  
  /**
   * Classify redundancy pattern
   */
  private classifyPattern(calls: NetworkCall[]): 'identical' | 'similar' | 'rapid-fire' {
    const maxTimeDiff = Math.max(...calls.map(c => c.timestamp)) - Math.min(...calls.map(c => c.timestamp));
    
    if (maxTimeDiff < 100) return 'rapid-fire'; // < 100ms apart
    
    // Check if payloads are identical
    const payloads = calls.map(c => JSON.stringify(c.payload || {}));
    const uniquePayloads = new Set(payloads);
    
    return uniquePayloads.size === 1 ? 'identical' : 'similar';
  }
  
  /**
   * Get comprehensive network statistics
   */
  getStats(): NetworkStats {
    const currentRedundantPatterns = this.getCurrentRedundancy();
    const recentCalls = this.calls.slice(0, 50);
    
    const totalCalls = this.calls.length;
    const currentRedundantCalls = currentRedundantPatterns.reduce((sum, pattern) => sum + pattern.duplicateCalls.length, 0);
    
    // Calculate persistent redundancy metrics
    const persistentRedundantCount = this.detectedRedundancies.reduce((sum, pattern) => sum + pattern.duplicateCalls.length, 0);
    const sessionRedundancyRate = totalCalls > 0 ? (persistentRedundantCount / totalCalls) * 100 : 0;
    
    const callsByType = this.calls.reduce((acc, call) => {
      acc[call.type] = (acc[call.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const completedCalls = this.calls.filter(c => c.duration !== undefined);
    const avgCallDuration = completedCalls.length > 0 
      ? completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length 
      : 0;
    
    return {
      totalCalls,
      redundantCalls: currentRedundantCalls,
      redundancyRate: totalCalls > 0 ? (currentRedundantCalls / totalCalls) * 100 : 0,
      avgCallDuration,
      callsByType,
      recentCalls,
      redundantPatterns: currentRedundantPatterns,
      persistentRedundantCount,
      sessionRedundancyRate,
    };
  }
  
  /**
   * Get all detected redundancies (persistent history)
   */
  getAllRedundancies(): RedundantCall[] {
    return [...this.detectedRedundancies];
  }
  
  /**
   * Clear all tracked calls and redundancies
   */
  clear(): void {
    this.calls = [];
    this.detectedRedundancies = [];
  }
  
  /**
   * Clear only current call history (keep persistent redundancy history)
   */
  clearCalls(): void {
    this.calls = [];
  }
  
  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global singleton
export const globalNetworkMonitor = new GenericNetworkMonitor(); 