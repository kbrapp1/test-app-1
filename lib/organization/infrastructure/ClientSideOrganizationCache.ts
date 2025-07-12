/**
 * Client-Side Organization Cache - Organization Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Accepts user context from shared AuthenticationProvider
 * - Provides single validation point for organization context
 * - Maintains security while optimizing performance
 * - Follows @golden-rule patterns exactly
 */

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { OrganizationPermission } from '../domain/services/PermissionValidationService';

interface OrganizationValidationResult {
  user: User | null;
  organizations: OrganizationPermission[];
  activeOrganizationId: string | null;
  isValid: boolean;
  fromCache: boolean;
  validationTimestamp: Date;
}

interface CachedOrganizationData {
  user: User;
  organizations: OrganizationPermission[];
  activeOrganizationId: string | null;
  timestamp: number;
  userId: string;
}

export class ClientSideOrganizationCache {
  private static instance: ClientSideOrganizationCache;
  private cache = new Map<string, CachedOrganizationData>();
  private readonly CACHE_TTL = 5000; // 5 seconds (matches server-side)
  private readonly MAX_CACHE_SIZE = 10; // Small cache for client-side

  static getInstance(): ClientSideOrganizationCache {
    if (!this.instance) {
      this.instance = new ClientSideOrganizationCache();
    }
    return this.instance;
  }

  /**
   * Get organization context with caching
   * Single validation point for all organization operations
   */
  async getOrganizationContext(user?: User | null): Promise<OrganizationValidationResult> {
    const supabase = createClient();
    
    if (!user) {
      return {
        user: null,
        organizations: [],
        activeOrganizationId: null,
        isValid: false,
        fromCache: false,
        validationTimestamp: new Date(),
      };
    }

    const cacheKey = `organization-context-${user.id}`;
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached, user.id)) {
        return {
          user: cached!.user,
          organizations: cached!.organizations,
          activeOrganizationId: cached!.activeOrganizationId,
          isValid: true,
          fromCache: true,
          validationTimestamp: new Date(),
        };
      }

      // Fresh organization data required (user already validated)
      const [orgsResult, activeOrgResult] = await Promise.all([
        supabase.rpc('get_user_accessible_organizations'),
        supabase.rpc('get_active_organization_id')
      ]);

      const organizations = orgsResult.data || [];
      const activeOrganizationId = activeOrgResult.data || null;

      // Cache the result
      this.cacheOrganizationData(cacheKey, user, organizations, activeOrganizationId);

      return {
        user,
        organizations,
        activeOrganizationId,
        isValid: true,
        fromCache: false,
        validationTimestamp: new Date(),
      };

    } catch (error) {
      console.error('[ClientSideOrganizationCache] Validation error:', error);
      return {
        user: null,
        organizations: [],
        activeOrganizationId: null,
        isValid: false,
        fromCache: false,
        validationTimestamp: new Date(),
      };
    }
  }

  /**
   * Get active organization ID with caching
   */
  async getActiveOrganizationId(user?: User | null): Promise<string | null> {
    const result = await this.getOrganizationContext(user);
    return result.activeOrganizationId;
  }

  /**
   * Check if user has access to organization with caching
   */
  async hasOrganizationAccess(organizationId: string, user?: User | null): Promise<boolean> {
    if (!organizationId?.trim() || !user) {
      return false;
    }

    try {
      const result = await this.getOrganizationContext(user);
      if (!result.isValid) {
        return false;
      }

      // Check if organization is in the user's accessible organizations
      return result.organizations.some(org => org.organization_id === organizationId);
    } catch (error) {
      console.error('[ClientSideOrganizationCache] Access check error:', error);
      return false;
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cached: CachedOrganizationData | undefined, userId: string): boolean {
    if (!cached) return false;
    
    const now = Date.now();
    const isWithinTTL = (now - cached.timestamp) < this.CACHE_TTL;
    
    // User ID validation for security
    const userIdMatches = cached.userId === userId;
    
    return isWithinTTL && userIdMatches;
  }

  /**
   * Cache organization data with memory management
   */
  private cacheOrganizationData(
    cacheKey: string, 
    user: User, 
    organizations: OrganizationPermission[], 
    activeOrganizationId: string | null
  ): void {
    // Prevent memory leaks
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(cacheKey, {
      user,
      organizations,
      activeOrganizationId,
      timestamp: Date.now(),
      userId: user.id,
    });
  }

  /**
   * Clear cache (for security events)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
    };
  }
} 