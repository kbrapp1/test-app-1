export interface NetworkCall {
  id: string;
  method: string;
  url: string;
  type: 'server-action' | 'api-route' | 'fetch' | 'xhr' | 'unknown';
  timestamp: number;
  status?: number;
  duration?: number;
  error?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  headers?: Record<string, string>;
  // Enhanced source tracking
  source?: {
    stack?: string;
    component?: string;
    hook?: string;
    file?: string;
    line?: number;
    trigger?: 'mount' | 'state-change' | 'user-action' | 'navigation' | 'unknown';
  };
}

export interface NetworkStats {
  totalCalls: number;
  redundantCalls: number;
  redundancyRate: number;
  sessionRedundancyRate: number;
  persistentRedundantCount: number;
  recentCalls: NetworkCall[];
  redundantPatterns: RedundantCall[];
  callsByType: Record<string, number>;
  persistentIssues?: import('../value-objects/NetworkIssue').NetworkIssue[];
}

export interface RedundantCall {
  pattern: string;
  originalCall: NetworkCall;
  duplicateCalls: NetworkCall[];
  timeWindow: number;
  detectedAt?: number; // When this redundancy was first detected
}

export class NetworkEfficiencyScore {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 100) {
      throw new Error('Network efficiency score must be between 0 and 100');
    }
  }

  static create(totalCalls: number, redundantCalls: number): NetworkEfficiencyScore {
    if (totalCalls === 0) return new NetworkEfficiencyScore(100);
    const efficiency = ((totalCalls - redundantCalls) / totalCalls) * 100;
    return new NetworkEfficiencyScore(Math.max(0, Math.round(efficiency)));
  }

  getValue(): number {
    return this.value;
  }

  getColor(): 'green' | 'yellow' | 'red' {
    if (this.value >= 90) return 'green';
    if (this.value >= 70) return 'yellow';
    return 'red';
  }
} 