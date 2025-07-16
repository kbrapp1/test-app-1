/**
 * API Deduplication Service
 * 
 * Single Responsibility: Prevent redundant API calls by caching and deduplicating requests
 * Use Cases: DAM asset loading, search queries, folder navigation
 */

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
  abortController: AbortController;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface DeduplicationConfig {
  cacheTTL: number; // Cache time-to-live in milliseconds
  debounceTime: number; // Debounce time for rapid calls
  maxPendingRequests: number; // Max concurrent requests to same endpoint
}

export class ApiDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest>();
  private cache = new Map<string, CacheEntry>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  private config: DeduplicationConfig = {
    cacheTTL: 5 * 60 * 1000, // 5 minutes default
    debounceTime: 300, // 300ms debounce
    maxPendingRequests: 3
  };

  constructor(config?: Partial<DeduplicationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Deduplicated fetch with caching and request merging
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const key = this.generateKey(url, options);
    
    // Check cache first
    const cached = this.getFromCache(key);
    if (cached) {
      return this.createMockResponse(cached);
    }

    // Check if same request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const requestOptions = {
      ...options,
      signal: abortController.signal
    };

    const promise = this.makeRequest(url, requestOptions)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          response.clone().json().then(data => {
            this.setCache(key, data);
          }).catch(() => {
            // Ignore JSON parsing errors for non-JSON responses
          });
        }
        return response;
      })
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      abortController
    });

    return promise;
  }

  /**
   * Debounced fetch for rapid successive calls (e.g., search as you type)
   */
  async debouncedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const key = this.generateKey(url, options);
    
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const response = await this.fetch(url, options);
          resolve(response);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, this.config.debounceTime);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Batch multiple requests efficiently
   */
  async batchFetch(requests: Array<{ url: string; options?: RequestInit }>): Promise<Response[]> {
    // Group by similar endpoints for potential optimization
    const batches = this.groupSimilarRequests(requests);
    
    const results: Response[] = [];
    
    for (const batch of batches) {
      // Execute batch with concurrency limit
      const batchPromises = batch.map(req => this.fetch(req.url, req.options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Clear cache for specific patterns
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Cancel pending requests for cleanup
   */
  cancelPendingRequests(pattern?: string): void {
    const requestsToCancel: string[] = [];
    
    // Abort any pending fetch requests
    for (const [key, request] of this.pendingRequests.entries()) {
      if (!pattern || key.includes(pattern)) {
        request.abortController.abort();
        requestsToCancel.push(key);
      }
    }
    requestsToCancel.forEach(key => this.pendingRequests.delete(key));

    // Clear any scheduled debounce timers to prevent orphaned fetch calls
    const debounceKeys: string[] = [];
    for (const [key, timer] of this.debounceTimers.entries()) {
      if (!pattern || key.includes(pattern)) {
        clearTimeout(timer);
        debounceKeys.push(key);
      }
    }
    debounceKeys.forEach(key => this.debounceTimers.delete(key));
  }

  /**
   * Get current statistics for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      debounceTimers: this.debounceTimers.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  // Private methods
  private generateKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.config.cacheTTL
    });
  }

  private createMockResponse(data: unknown): Response {
    return new Response(JSON.stringify(data), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    });
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    // Use native fetch
    return fetch(url, options);
  }

  private groupSimilarRequests(requests: Array<{ url: string; options?: RequestInit }>) {
    // Simple grouping - could be enhanced with smarter batching logic
    const groups: Array<Array<{ url: string; options?: RequestInit }>> = [];
    let currentGroup: Array<{ url: string; options?: RequestInit }> = [];
    
    for (const request of requests) {
      currentGroup.push(request);
      
      // Create new group every 5 requests (or based on endpoint similarity)
      if (currentGroup.length >= 5) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  private calculateCacheHitRate(): number {
    // This would need to track hits/misses in a real implementation
    return 0; // Placeholder
  }
}

// Singleton instance for app-wide use
export const apiDeduplication = new ApiDeduplicationService();