/**
 * TTS Unified Context Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Consolidates existing services in single call
 * - Eliminates 3x API calls on TTS page load to 1x API call
 * - REUSES existing services instead of duplicating database queries
 * - Follows DRY principle and DDD composition patterns
 * - Compatible with existing TtsContextService interface
 * - Follow @golden-rule patterns exactly
 */

import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationContextService } from '@/lib/organization/domain/services/OrganizationContextService';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';
import { ClientSideOrganizationCache } from '@/lib/organization/infrastructure/ClientSideOrganizationCache';

// Internal interface for unified context result
export interface TtsUnifiedContextResult {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role_name: string;
    granted_at: string;
    role_id: string;
  }>;
  hasTtsAccess: boolean;
  featureFlags: Record<string, boolean>;
  error?: string;
}

// Compatible with existing TtsValidationResult interface
export interface TtsValidationResult {
  isValid: boolean;
  user: User;
  organizationId: string;
  error?: string;
  unifiedContext?: TtsUnifiedContext;
  securityContext: {
    fromCache: boolean;
    timestamp: Date;
    validationMethod: string;
    tokenHash?: string;
    securityVersion?: number;
  };
}

// Interface for unified context data expected by presentation layer
export interface TtsUnifiedContext {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  isTtsEnabled: boolean;
  fromCache: boolean;
}

export class TtsUnifiedContextService {
  private static instance: TtsUnifiedContextService;
  private cache = new Map<string, { data: TtsUnifiedContextResult; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds for security

  private constructor() {
    // Private constructor for singleton pattern
    
    // ✅ SECURITY: Listen for organization switch events to clear cache
    if (typeof window !== 'undefined') {
      window.addEventListener('organizationSwitched', this.handleOrganizationSwitch.bind(this) as EventListener);
      
      // Expose service instance for direct cache invalidation
      (window as any).ttsUnifiedContextService = this;
    }
  }

  static getInstance(): TtsUnifiedContextService {
    if (!this.instance) {
      this.instance = new TtsUnifiedContextService();
    }
    return this.instance;
  }

  /**
   * Get unified TTS context - combines user, organization, and TTS validation
   * Single API call replacing 3 separate calls
   */
  async getUnifiedTtsContext(): Promise<TtsValidationResult> {
    try {
      // Create server-side Supabase client for server actions
      const supabaseServer = createSupabaseServerClient();
      
      // Initialize services with server-side client
      const organizationService = new OrganizationContextService(supabaseServer);
      const permissionService = new PermissionValidationService(supabaseServer);
      const cacheService = new ClientSideOrganizationCache();

      // Execute all three services in parallel (was 3 separate API calls)
      const [
        currentUser,
        organizationContext,
        userOrganizations
      ] = await Promise.all([
        permissionService.getCurrentUser(),
        organizationService.getCurrentContext(),
        permissionService.getUserAccessibleOrganizations()
      ]);

      // Validate organization context
      if (!organizationContext || !organizationContext.active_organization_id) {
        throw new Error('Organization context not available');
      }

      // Extract organization data
      const organizationId = organizationContext.active_organization_id;
      const featureFlags = organizationContext.feature_flags || {};

      // Check TTS access via feature flags
      const hasTtsAccess = featureFlags.TTS_ENABLED !== false; // Default enabled
      
      if (!hasTtsAccess) {
        // Transform organizations to match expected interface
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        // Create unified context even when TTS is disabled
        const unifiedContext: TtsUnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          isTtsEnabled: false,
          fromCache: false
        };

        return {
          isValid: false,
          user: currentUser,
          organizationId,
          error: 'TTS feature disabled for this organization',
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_TTS_DISABLED'
          }
        };
      }

      // ✅ SECURITY FIX: Cache the internal result with organization ID
      // This prevents data leakage between organizations for super admin users
      const cacheKey = `tts-context-${currentUser?.id || 'anonymous'}-${organizationId}`;
      const internalResult: TtsUnifiedContextResult = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations,
        hasTtsAccess,
        featureFlags
      };

      this.cache.set(cacheKey, {
        data: internalResult,
        timestamp: Date.now()
      });

      // Transform organizations to match expected interface
      const transformedOrganizations = userOrganizations.map(org => ({
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        role: org.role_name
      }));

      // Create unified context for presentation layer
      const unifiedContext: TtsUnifiedContext = {
        user: currentUser,
        organizationId,
        organizations: transformedOrganizations,
        featureFlags,
        isTtsEnabled: hasTtsAccess,
        fromCache: false
      };

      // Return compatible TtsValidationResult
      return {
        isValid: true,
        user: currentUser,
        organizationId,
        unifiedContext,
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'UNIFIED_COMPOSED'
        }
      };

    } catch (error) {
      console.error('[TTS_UNIFIED_CONTEXT] UNIFIED_VALIDATION_ERROR:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return error state compatible with TtsValidationResult
      return {
        isValid: false,
        user: null as any, // Match existing interface pattern
        organizationId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        securityContext: {
          fromCache: false,
          timestamp: new Date(),
          validationMethod: 'UNIFIED_ERROR'
        }
      };
    }
  }

  /**
   * Get cached context for user and organization
   * ✅ SECURITY: Cache keys MUST include organization ID to prevent data leakage
   */
  getCachedContext(userId: string, organizationId: string): TtsUnifiedContextResult | null {
    // ✅ FIXED: Include organization ID in cache key
    const cacheKey = `tts-context-${userId}-${organizationId}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * ✅ SECURITY: Handle organization switch events
   * Called when user switches organizations to clear stale cache
   */
  private handleOrganizationSwitch(event: Event): void {
    const customEvent = event as CustomEvent;
    const { userId, newOrganizationId, previousOrganizationId } = customEvent.detail;
    
    if (userId && newOrganizationId) {
      this.clearCacheOnOrganizationSwitch(userId, newOrganizationId);
      
      console.log(`[TTS_SECURITY] Cache cleared due to org switch event: ${previousOrganizationId} → ${newOrganizationId}`);
    }
  }

  /**
   * Clear cache for specific user and organization
   * ✅ SECURITY: Organization-specific cache invalidation
   */
  clearCache(userId: string, organizationId: string): void {
    // ✅ FIXED: Include organization ID in cache key
    const cacheKey = `tts-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * ✅ SECURITY: Clear cache when organization switches
   * Prevents data leakage between organizations
   */
  clearCacheOnOrganizationSwitch(userId: string, newOrganizationId: string): void {
    // Clear all cache entries for this user (all organizations)
    // This ensures no stale data from previous organization
    for (const [key] of this.cache) {
      if (key.startsWith(`tts-context-${userId}-`)) {
        this.cache.delete(key);
      }
    }
    
    console.log(`[TTS_SECURITY] Cleared all cached TTS context for user ${userId} due to org switch to ${newOrganizationId}`);
  }

  /**
   * Clear all cached contexts
   */
  clearAllCache(): void {
    this.cache.clear();
  }
} 