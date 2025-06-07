import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test-specific network call monitor that works independently
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
  private originalFetch?: typeof fetch;
  private isMonitoring = false;

  constructor() {
    // Store original fetch
    this.originalFetch = global.fetch || fetch;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.calls = [];
    this.isMonitoring = true;
    
    // Create our own fetch interceptor for testing
    const originalFetch = this.originalFetch!;
    const self = this;
    
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Handle different URL input types
      let url: string;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input instanceof Request) {
        url = input.url;
      } else {
        url = String(input);
      }
      
      // Extract headers
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }
      
      // Track the call
      const call: NetworkCall = {
        url,
        method: init?.method || 'GET',
        timestamp: Date.now(),
        body: init?.body,
        headers,
        stackTrace: new Error().stack
      };
      
      self.calls.push(call);
      
      // Make the actual request with original fetch
      return originalFetch(input, init);
    };
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    // Restore original fetch
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
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

// Global fetch mock for testing
const mockFetch = vi.fn();

describe('NetworkCallMonitor', () => {
  let monitor: NetworkCallMonitor;

  beforeEach(() => {
    // Setup global fetch mock
    vi.stubGlobal('fetch', mockFetch.mockImplementation(async (url: string, options: any = {}) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mock' }),
        text: () => Promise.resolve('mock'),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as ResponseType,
        url: url.toString(),
        clone: () => ({} as Response),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      } as Response);
    }));

    monitor = new NetworkCallMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
    mockFetch.mockClear();
    vi.unstubAllGlobals();
  });

  describe('Basic Monitoring', () => {
    it('should track fetch calls', async () => {
      monitor.startMonitoring();
      
      await fetch('/api/test');
      await fetch('/api/users');
      
      const calls = monitor.getCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].url).toBe('/api/test');
      expect(calls[1].url).toBe('/api/users');
    });

    it('should track call methods and timestamps', async () => {
      monitor.startMonitoring();
      
      await fetch('/api/test', { method: 'POST' });
      
      const calls = monitor.getCalls();
      expect(calls[0].method).toBe('POST');
      expect(calls[0].timestamp).toBeTypeOf('number');
    });
  });

  describe('Redundancy Detection', () => {
    it('should detect duplicate calls within time window', async () => {
      monitor.startMonitoring();
      
      // Make identical calls quickly
      await fetch('/api/test');
      await fetch('/api/test'); // Duplicate
      
      const analysis = monitor.analyzeRedundancy(1000);
      expect(analysis.redundantCalls).toHaveLength(1);
      expect(analysis.timeAnalysis.duplicatesWithinMs).toHaveLength(1);
    });

    it('should detect rapid-fire calls', async () => {
      monitor.startMonitoring();
      
      // Make many calls to same endpoint
      await fetch('/api/users');
      await fetch('/api/users');
      await fetch('/api/users');
      await fetch('/api/users');
      
      const analysis = monitor.analyzeRedundancy(1000);
      expect(analysis.timeAnalysis.rapidFireCalls).toHaveLength(1);
      expect(analysis.timeAnalysis.rapidFireCalls[0]).toHaveLength(4);
    });

    it('should not flag calls outside time window', async () => {
      monitor.startMonitoring();
      
      await fetch('/api/test');
      
      // Simulate time passing
      vi.setSystemTime(Date.now() + 2000);
      
      await fetch('/api/test');
      
      const analysis = monitor.analyzeRedundancy(1000);
      expect(analysis.redundantCalls).toHaveLength(0);
    });
  });

  describe('Test Helpers', () => {
    it('should provide expectNoRedundantCalls helper', async () => {
      monitor.startMonitoring();
      
      await fetch('/api/test');
      await fetch('/api/users');
      
      expect(monitor.expectNoRedundantCalls()).toBe(true);
    });

    it('should warn on redundant calls', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.startMonitoring();
      
      await fetch('/api/test');
      await fetch('/api/test'); // Duplicate
      
      expect(() => monitor.expectNoRedundantCalls()).toThrow(/Found 1 redundant calls/);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 redundant calls:')
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide endpoint-specific call counting', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.startMonitoring();
      
      await fetch('/api/users');
      await fetch('/api/users');
      await fetch('/api/posts');
      
      expect(() => monitor.expectMaxCallsToEndpoint('users', 1)).toThrow(/Expected max 1 calls to users, but found 2/);
      expect(monitor.expectMaxCallsToEndpoint('posts', 1)).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });
});

// NetworkCallMonitor is already exported above 