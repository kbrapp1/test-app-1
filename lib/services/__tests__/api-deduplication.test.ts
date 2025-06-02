import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { ApiDeduplicationService } from '../api-deduplication';
import { server } from '@/lib/test/mocks/server';

// Mock fetch globally - this service tests the fetch wrapper itself
const mockFetch = vi.fn();

// Disable MSW for these tests since we're testing the service that wraps fetch
beforeAll(() => server.close());
afterAll(() => server.listen());

describe('ApiDeduplicationService', () => {
  let service: ApiDeduplicationService;

  beforeEach(() => {
    // Set up fresh fetch mock for each test
    global.fetch = mockFetch;
    
    service = new ApiDeduplicationService({
      cacheTTL: 1000, // 1 second for testing
      debounceTime: 100, // 100ms for testing
      maxPendingRequests: 2
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    service.cancelPendingRequests();
    service.invalidateCache();
  });

  describe('Basic Functionality', () => {
    it('should make a fetch request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      });

      const response = await service.fetch('/api/test');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
      expect(response.ok).toBe(true);
    });

    it('should pass through request options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      });

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      };

      await service.fetch('/api/test', options);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
        signal: expect.any(AbortSignal)
      }));
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical simultaneous requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Make two identical requests simultaneously
      const [response1, response2] = await Promise.all([
        service.fetch('/api/test'),
        service.fetch('/api/test')
      ]);

      // Should only make one actual fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1).toBe(response2); // Should be same promise result
    });

    it('should not deduplicate different requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await Promise.all([
        service.fetch('/api/test1'),
        service.fetch('/api/test2')
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should differentiate requests by method and body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await Promise.all([
        service.fetch('/api/test', { method: 'GET' }),
        service.fetch('/api/test', { method: 'POST' }),
        service.fetch('/api/test', { method: 'POST', body: JSON.stringify({ different: 'body' }) })
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'cached' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'cached' }) })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // First request
      const response1 = await service.fetch('/api/test');
      
      // Second request should come from cache
      const response2 = await service.fetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Second response should be from cache
      expect(await response2.json()).toEqual({ data: 'cached' });
      expect(response2.headers.get('X-Cache')).toBe('HIT');
    });

    it('should not cache failed responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
        clone: () => ({ json: () => Promise.resolve({ error: 'Server error' }) })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'success' }) })
      });

      // First request fails
      await service.fetch('/api/test');
      
      // Second request should make new call
      await service.fetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should expire cached entries', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // First request
      await service.fetch('/api/test');
      
      // Fast-forward time past cache TTL
      vi.setSystemTime(Date.now() + 2000);
      
      // Second request should make new call
      await service.fetch('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Debounced Fetch', () => {
    it('should debounce rapid successive calls', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'debounced' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'debounced' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Make multiple rapid calls (only await the last one)
      service.debouncedFetch('/api/search?q=test');
      service.debouncedFetch('/api/search?q=test');
      const finalResponse = await service.debouncedFetch('/api/search?q=test');

      // Wait a bit more for any pending timers
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only make one call due to debouncing
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/search?q=test', expect.any(Object));
      expect(await finalResponse.json()).toEqual({ data: 'debounced' });
    });
  });

  describe('Batch Fetch', () => {
    it('should handle batch requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'batch' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'batch' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const requests = [
        { url: '/api/test1' },
        { url: '/api/test2' },
        { url: '/api/test3' }
      ];

      const responses = await service.batchFetch(requests);

      expect(responses).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate all cache when no pattern provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Make requests to cache them
      await service.fetch('/api/test1');
      await service.fetch('/api/test2');

      // Clear cache
      service.invalidateCache();

      // Should make new requests
      await service.fetch('/api/test1');
      await service.fetch('/api/test2');

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should invalidate cache by pattern', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Make requests to cache them
      await service.fetch('/api/users');
      await service.fetch('/api/posts');

      // Clear only users cache
      service.invalidateCache('users');

      // Users should make new request, posts should be cached
      await service.fetch('/api/users');
      await service.fetch('/api/posts');

      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 initial + 1 users refetch
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel pending requests', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 200);
        })
      );

      // Start a slow request
      const requestPromise = service.fetch('/api/slow');

      // Cancel it
      service.cancelPendingRequests();

      // Should be rejected
      await expect(requestPromise).rejects.toThrow('Request aborted');
    });

    it('should cancel requests by pattern', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Start multiple requests
      service.fetch('/api/users');
      service.fetch('/api/posts');

      // Cancel only users requests
      service.cancelPendingRequests('users');

      const stats = service.getStats();
      expect(stats.pendingRequests).toBe(1); // Only posts request should remain
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        clone: () => ({ json: () => Promise.resolve({ data: 'test' }) })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Make some requests to populate stats
      await service.fetch('/api/test');
      service.debouncedFetch('/api/search');

      const stats = service.getStats();
      
      expect(stats.cacheSize).toBe(1);
      expect(stats.debounceTimers).toBe(1);
      expect(typeof stats.cacheHitRate).toBe('number');
    });
  });
}); 