/**
 * Provider Status Cache Service
 * Single Responsibility: Handle caching of provider status responses
 * Infrastructure Layer - Optimized caching for external API responses
 */
export class ProviderStatusCache {
  private readonly cache = new Map<string, {
    response: ProviderStatusResponse;
    timestamp: number;
    ttl: number;
  }>();

  private readonly DEFAULT_TTL_MS = 10000; // 10 seconds cache

  /**
   * Cache a provider response
   */
  cacheResponse(externalId: string, response: ProviderStatusResponse, ttl?: number): void {
    this.cache.set(externalId, {
      response,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL_MS
    });

    // Periodically cleanup expired entries
    if (this.cache.size % 100 === 0) {
      this.cleanupExpiredCache();
    }
  }

  /**
   * Get cached response if still valid
   */
  getCachedResponse(externalId: string): ProviderStatusResponse | null {
    const cached = this.cache.get(externalId);
    
    if (!cached) {
      return null;
    }

    const isExpired = (Date.now() - cached.timestamp) > cached.ttl;
    
    if (isExpired) {
      this.cache.delete(externalId);
      return null;
    }

    return cached.response;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached responses (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRatio?: number } {
    return {
      size: this.cache.size
    };
  }
}

/**
 * Provider Status Response
 * Standardized response format from all external providers
 */
export interface ProviderStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  imageUrl?: string;
  errorMessage?: string;
  progress?: number;
  metadata?: Record<string, unknown>;
} 