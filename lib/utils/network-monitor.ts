/**
 * Network Call Monitor
 * 
 * Production utility for monitoring and analyzing network calls
 * Separate from test utilities to avoid importing vitest in client components
 */

export interface NetworkCall {
  url: string;
  method: string;
  timestamp: number;
  body?: any;
  headers?: Record<string, string>;
  stackTrace?: string;
}

export interface CallAnalysis {
  totalCalls: number;
  uniqueCalls: number;
  redundantCalls: NetworkCall[];
  callsByEndpoint: Record<string, NetworkCall[]>;
  timeAnalysis: {
    duplicatesWithinMs: NetworkCall[][];
    rapidFireCalls: NetworkCall[][];
  };
}

export class NetworkCallMonitor {
  protected calls: NetworkCall[] = [];
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = fetch.bind(window);
  }

  startMonitoring() {
    this.calls = [];
    
    // Override global fetch
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const urlInput = args[0];
      const options = args[1] || {};
      
      // Handle different URL input types
      let url: string;
      if (typeof urlInput === 'string') {
        url = urlInput;
      } else if (urlInput instanceof URL) {
        url = urlInput.toString();
      } else if (urlInput instanceof Request) {
        url = urlInput.url;
      } else {
        url = String(urlInput);
      }
      
      // For Next.js Server Actions, extract action info from headers
      const headers = options.headers as Record<string, string> || {};
      const nextAction = headers['Next-Action'];
      if (nextAction && !url.startsWith('http')) {
        url = `[Server Action: ${nextAction.substring(0, 8)}...] ${url || window.location.pathname}`;
      }
      
      // Capture call details
      const call: NetworkCall = {
        url,
        method: options.method || 'GET',
        timestamp: Date.now(),
        body: options.body,
        headers,
        stackTrace: new Error().stack
      };
      
      this.calls.push(call);
      
      // Make the actual request
      return this.originalFetch(...args);
    };
  }

  stopMonitoring() {
    // Restore original fetch
    window.fetch = this.originalFetch;
  }

  getCalls(): NetworkCall[] {
    return [...this.calls];
  }

  analyzeRedundancy(timeWindowMs: number = 1000): CallAnalysis {
    const callsByEndpoint: Record<string, NetworkCall[]> = {};
    const duplicatesWithinMs: NetworkCall[][] = [];
    const rapidFireCalls: NetworkCall[][] = [];

    // Group calls by endpoint
    this.calls.forEach(call => {
      const key = `${call.method}:${call.url}`;
      if (!callsByEndpoint[key]) {
        callsByEndpoint[key] = [];
      }
      callsByEndpoint[key].push(call);
    });

    // Find redundant calls
    const redundantCalls: NetworkCall[] = [];
    Object.entries(callsByEndpoint).forEach(([endpoint, calls]) => {
      if (calls.length > 1) {
        // Check for exact duplicates within time window
        for (let i = 0; i < calls.length - 1; i++) {
          for (let j = i + 1; j < calls.length; j++) {
            const timeDiff = calls[j].timestamp - calls[i].timestamp;
            if (timeDiff <= timeWindowMs) {
              // Check if calls are identical
              if (this.areCallsIdentical(calls[i], calls[j])) {
                duplicatesWithinMs.push([calls[i], calls[j]]);
                redundantCalls.push(calls[j]); // Mark the later call as redundant
              }
            }
          }
        }

        // Check for rapid-fire calls (many calls to same endpoint quickly)
        if (calls.length >= 3) {
          const recentCalls = calls.filter(call => 
            calls[calls.length - 1].timestamp - call.timestamp <= timeWindowMs
          );
          if (recentCalls.length >= 3) {
            rapidFireCalls.push(recentCalls);
          }
        }
      }
    });

    return {
      totalCalls: this.calls.length,
      uniqueCalls: Object.keys(callsByEndpoint).length,
      redundantCalls,
      callsByEndpoint,
      timeAnalysis: {
        duplicatesWithinMs,
        rapidFireCalls
      }
    };
  }

  private areCallsIdentical(call1: NetworkCall, call2: NetworkCall): boolean {
    return (
      call1.url === call2.url &&
      call1.method === call2.method &&
      JSON.stringify(call1.body) === JSON.stringify(call2.body)
    );
  }

  // Helper methods for development monitoring
  expectNoRedundantCalls(timeWindowMs: number = 1000) {
    const analysis = this.analyzeRedundancy(timeWindowMs);
    if (analysis.redundantCalls.length > 0) {
      const message = `Found ${analysis.redundantCalls.length} redundant calls: ${
        analysis.redundantCalls.map(call => 
          `${call.method} ${call.url} at ${new Date(call.timestamp).toISOString()}`
        ).join(', ')
      }`;
      console.warn(message);
      throw new Error(message);
    }
    return true;
  }

  expectMaxCallsToEndpoint(endpoint: string, maxCalls: number) {
    const analysis = this.analyzeRedundancy();
    const endpointCalls = Object.entries(analysis.callsByEndpoint)
      .filter(([key]) => key.includes(endpoint))
      .reduce((total, [, calls]) => total + calls.length, 0);
    
    if (endpointCalls > maxCalls) {
      const message = `Expected max ${maxCalls} calls to ${endpoint}, but found ${endpointCalls}`;
      console.warn(message);
      throw new Error(message);
    }
    return true;
  }

  getCallsToEndpoint(endpoint: string): NetworkCall[] {
    return this.calls.filter(call => call.url.includes(endpoint));
  }
} 