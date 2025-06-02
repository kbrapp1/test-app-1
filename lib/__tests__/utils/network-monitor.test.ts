import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkCallMonitor, type NetworkCall, type CallAnalysis } from '@/lib/utils/network-monitor';

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

// Export for use in other tests
export { NetworkCallMonitor, type NetworkCall, type CallAnalysis }; 