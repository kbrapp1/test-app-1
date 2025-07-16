/**
 * Organization Context Cache - Organization Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - 30-second TTL with security-triggered invalidation
 * - Singleton pattern with security version tracking
 * - Comprehensive audit logging for security monitoring
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on caching logic
 * - Fail-secure defaults with cache invalidation on security events
 */

import { OrganizationContext, OrganizationContextService } from '../domain/services/OrganizationContextService';

interface CachedOrganizationContext {
  context: OrganizationContext;
  timestamp: number;
  securityVersion: number;
  userId: string;
}

type SecurityEvent = 'org-switch' | 'role-change' | 'permission-change' | 'token-refresh' | 'session-expired';

export class OrganizationContextCache {
  private static instance: OrganizationContextCache;
  private cache = new Map<string, CachedOrganizationContext>();
  private readonly TTL = 30000; // 30 seconds
  private readonly MAX_CACHE_SIZE = 200; // Prevent memory leaks
  private securityVersion = 0;
  private contextService: OrganizationContextService;

  private constructor() {
    this.contextService = new OrganizationContextService();
  }

  static getInstance(): OrganizationContextCache {
    if (!this.instance) {
      this.instance = new OrganizationContextCache();
    }
    return this.instance;
  }

  /**
   * Get organization context with security-aware caching
   */
  async getOrganizationContext(userId: string): Promise<OrganizationContext | null> {
    const cached = this.cache.get(userId);
    const now = Date.now();
    
    // Security: Invalidate cache if security version changed
    if (this.isCacheValid(cached, now)) {
      this.logCacheEvent(userId, 'CACHE_HIT', {
        securityVersion: this.securityVersion,
        age: now - cached!.timestamp
      });
      
      return cached!.context;
    }

    // Cache miss or invalid - fetch fresh context
    try {
      const context = await this.contextService.getCurrentContext();
      
      if (context) {
        // Cache the fresh context
        this.cacheContext(userId, context, now);
        
        this.logCacheEvent(userId, 'CACHE_MISS_FRESH', {
          securityVersion: this.securityVersion,
          organizationId: context.active_organization_id
        });
      } else {
        this.logCacheEvent(userId, 'CACHE_MISS_NULL', {
          securityVersion: this.securityVersion
        });
      }
      
      return context;
    } catch (error) {
      this.logCacheEvent(userId, 'CACHE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Remove invalid cache entry on error
      this.cache.delete(userId);
      return null;
    }
  }

  /**
   * Invalidate cache on security events
   */
  invalidateOnSecurityEvent(userId: string, event: SecurityEvent): void {
    // Increment security version to invalidate all cached contexts
    this.securityVersion++;
    
    // Remove specific user's cache
    this.cache.delete(userId);
    
    // Log security event for audit trail
    this.logSecurityEvent(userId, event);
  }

  /**
   * Invalidate all cached contexts (global security event)
   */
  invalidateAllContexts(reason: string): void {
    this.securityVersion++;
    this.cache.clear();
    
    this.logSecurityEvent(null, 'global-invalidation', {
      reason,
      affectedUsers: this.cache.size
    });
  }

  /**
   * Check if cached context is still valid
   */
  private isCacheValid(cached: CachedOrganizationContext | undefined, now: number): boolean {
    if (!cached) return false;
    
    const isWithinTTL = (now - cached.timestamp) < this.TTL;
    const isSecurityVersionValid = cached.securityVersion === this.securityVersion;
    
    return isWithinTTL && isSecurityVersionValid;
  }

  /**
   * Cache organization context with memory management
   */
  private cacheContext(userId: string, context: OrganizationContext, timestamp: number): void {
    // Prevent memory leaks
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(userId, {
      context,
      timestamp,
      securityVersion: this.securityVersion,
      userId
    });
  }

  /**
   * Get oldest cache key for eviction
   */
  private getOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Number.MAX_SAFE_INTEGER;

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Log cache events for monitoring
   */
  private logCacheEvent(userId: string, event: string, context: Record<string, unknown> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event,
      context,
      source: 'OrganizationContextCache',
      cacheSize: this.cache.size,
      securityVersion: this.securityVersion
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORG_CACHE]', logEntry);
    } else {
      // Production: structured logging for monitoring systems
      console.log('[AUDIT]', JSON.stringify(logEntry));
    }
  }

  /**
   * Log security events for audit trail
   */
  private logSecurityEvent(userId: string | null, event: SecurityEvent | string, context: Record<string, unknown> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event: `SECURITY_${event.toUpperCase()}`,
      context,
      source: 'OrganizationContextCache',
      securityVersion: this.securityVersion,
      severity: 'HIGH'
    };
    
    // Enhanced audit logging for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SECURITY_AUDIT]', logEntry);
    } else {
      // Production: structured logging for monitoring systems
      console.log('[AUDIT]', JSON.stringify(logEntry));
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    securityVersion: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.TTL,
      securityVersion: this.securityVersion
    };
  }

  /**
   * Clear cache for testing
   */
  clearCache(): void {
    this.cache.clear();
    this.securityVersion = 0;
    this.logCacheEvent('system', 'CACHE_CLEARED', {
      reason: 'Manual cache clear'
    });
  }
} 