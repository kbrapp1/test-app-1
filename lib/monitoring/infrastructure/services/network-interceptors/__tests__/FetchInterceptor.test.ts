/**
 * FetchInterceptor Context Binding Tests
 * 
 * Tests to ensure fetch interceptor properly maintains context binding
 * and doesn't throw "Illegal invocation" errors.
 */

import { FetchInterceptor } from '../FetchInterceptor';
import { NetworkPerformanceThrottler } from '../../NetworkPerformanceThrottler';
import { RequestClassifier } from '../RequestClassifier';
import { PayloadParser } from '../PayloadParser';

// Mock dependencies
const mockThrottler = {
  shouldAllowRequest: vi.fn().mockReturnValue(true),
  trackProcessingTime: vi.fn(),
} as unknown as NetworkPerformanceThrottler;

const mockClassifier = {
  classifyRequestType: vi.fn().mockReturnValue('fetch' as const),
} as unknown as RequestClassifier;

const mockParser = {
  parseRequestPayload: vi.fn().mockReturnValue(undefined),
  parseHeaders: vi.fn().mockReturnValue({}),
} as unknown as PayloadParser;

// Mock global network monitor
const mockGlobalNetworkMonitor = {
  trackCall: () => 'test-call-id',
  completeCall: () => {},
};

// Mock the global network monitor import
vi.mock('../../../application/services/GlobalNetworkMonitor', () => ({
  globalNetworkMonitor: mockGlobalNetworkMonitor,
}));

describe('FetchInterceptor Context Binding', () => {
  let interceptor: FetchInterceptor;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;
    
    // Mock fetch for testing
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    // Mock window object
    Object.defineProperty(global, 'window', {
      value: {
        fetch: global.fetch,
        location: {
          href: 'http://localhost:3000',
          pathname: '/test',
          origin: 'http://localhost:3000',
        },
        performance: {
          now: () => Date.now(),
        },
      },
      writable: true,
    });

    interceptor = new FetchInterceptor(mockThrottler, mockClassifier, mockParser);
  });

  afterEach(() => {
    interceptor.uninstall();
    global.fetch = originalFetch;
  });

  it('should not throw "Illegal invocation" error when intercepting fetch calls', async () => {
    // Install the interceptor
    interceptor.install();

    // This should not throw an "Illegal invocation" error
    await expect(
      window.fetch('/api/test', { method: 'GET' })
    ).resolves.toBeDefined();
  });

  it('should handle string URLs without context errors', async () => {
    interceptor.install();

    // Test string URL that could cause context issues
    await expect(
      window.fetch('/api/string-url')
    ).resolves.toBeDefined();
  });

  it('should handle URL objects without context errors', async () => {
    interceptor.install();

    // Test URL object that could cause context issues
    await expect(
      window.fetch(new URL('http://localhost:3000/api/url-object'))
    ).resolves.toBeDefined();
  });

  it('should restore original fetch on uninstall', () => {
    const originalWindowFetch = window.fetch;
    
    interceptor.install();
    expect(window.fetch).not.toBe(originalWindowFetch);
    
    interceptor.uninstall();
    expect(window.fetch).toBe(originalWindowFetch);
  });
}); 