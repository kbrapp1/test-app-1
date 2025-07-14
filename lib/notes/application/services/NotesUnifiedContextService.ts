/**
 * Notes Unified Context Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Consolidates existing services in single call
 * - Eliminates 3x API calls on Notes page load to 1x API call
 * - REUSES existing services instead of duplicating database queries
 * - Follows DRY principle and DDD composition patterns
 * - Compatible with existing NotesContextService interface
 * - INCLUDES notes data in unified context for true single-call optimization
 * - Follow @golden-rule patterns exactly
 */

import { User } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { OrganizationContextService } from '@/lib/organization/domain/services/OrganizationContextService';
import { PermissionValidationService } from '@/lib/organization/domain/services/PermissionValidationService';

// Note interface matching database structure
export interface Note {
  id: string;
  user_id: string;
  organization_id: string;
  title: string | null;
  content: string | null;
  color_class: string;
  position: number;
  created_at: string;
  updated_at: string | null;
}

// Internal interface for unified context result
export interface NotesUnifiedContextResult {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role_name: string;
    granted_at: string;
    role_id: string;
  }>;
  hasNotesAccess: boolean;
  featureFlags: Record<string, boolean>;
  notes: Note[]; // ✅ CRITICAL: Include notes data
  error?: string;
}

// Compatible with existing NotesValidationResult interface
export interface NotesValidationResult {
  isValid: boolean;
  user: User | null;
  organizationId: string;
  error?: string;
  unifiedContext?: NotesUnifiedContext;
  securityContext: {
    fromCache: boolean;
    timestamp: Date;
    validationMethod: string;
    tokenHash?: string;
    securityVersion?: number;
  };
}

// Interface for unified context data expected by presentation layer
export interface NotesUnifiedContext {
  user: User | null;
  organizationId: string | null;
  organizations: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  featureFlags: Record<string, boolean>;
  isNotesEnabled: boolean;
  notes: Note[]; // ✅ CRITICAL: Include notes data
  fromCache: boolean;
}

export class NotesUnifiedContextService {
  private static instance: NotesUnifiedContextService;
  private cache = new Map<string, { data: NotesUnifiedContextResult; timestamp: number }>();
  private readonly CACHE_TTL = 5000; // 5 seconds for security

  private constructor() {
    // Private constructor for singleton pattern
    
    // ✅ SECURITY: Listen for organization switch events to clear cache
    if (typeof window !== 'undefined') {
      window.addEventListener('organizationSwitched', this.handleOrganizationSwitch.bind(this) as EventListener);
      
      // Expose service instance for direct cache invalidation
      (window as typeof window & { notesUnifiedContextService?: NotesUnifiedContextService }).notesUnifiedContextService = this;
    }
  }

  static getInstance(): NotesUnifiedContextService {
    if (!this.instance) {
      this.instance = new NotesUnifiedContextService();
    }
    return this.instance;
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
      
      console.log(`[NOTES_SECURITY] Cache cleared due to org switch event: ${previousOrganizationId} → ${newOrganizationId}`);
    }
  }

  /**
   * Get unified Notes context - combines user, organization, and Notes validation + data
   * Single API call replacing 3+ separate calls
   */
  async getUnifiedNotesContext(): Promise<NotesValidationResult> {
    try {
      // Create server-side Supabase client for server actions
      const supabaseServer = createSupabaseServerClient();
      
      // Initialize services with server-side client
      const organizationService = new OrganizationContextService(supabaseServer);
      const permissionService = new PermissionValidationService(supabaseServer);

      // Execute all services in parallel (was 3+ separate API calls)
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
      
      // ✅ OPTIMIZATION: Check cache before expensive operations
      const cachedResult = this.getCachedContext(currentUser?.id || 'anonymous', organizationId);
      if (cachedResult) {
        // Transform cached result to presentation format
        const transformedOrganizations = cachedResult.organizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        const unifiedContext: NotesUnifiedContext = {
          user: cachedResult.user,
          organizationId: cachedResult.organizationId,
          organizations: transformedOrganizations,
          featureFlags: cachedResult.featureFlags,
          isNotesEnabled: cachedResult.hasNotesAccess,
          notes: cachedResult.notes, // ✅ CRITICAL: Include cached notes
          fromCache: true // Mark as from cache
        };

        return {
          isValid: true,
          user: cachedResult.user as User,
          organizationId: cachedResult.organizationId as string,
          unifiedContext,
          securityContext: {
            fromCache: true,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_CACHED'
          }
        };
      }

      const featureFlags = organizationContext.feature_flags || {};

      // Check Notes access via feature flags AND user permissions
      // AI: Universal rule - all features default to enabled when flag missing
      const featureEnabled = featureFlags.NOTES_ENABLED !== false; // Default enabled
      
      // First check if feature is disabled at organization level
      if (!featureEnabled) {
        // Transform organizations to match expected interface
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        // Create unified context when feature is disabled
        const unifiedContext: NotesUnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          isNotesEnabled: false,
          notes: [], // Empty notes when disabled
          fromCache: false
        };

        return {
          isValid: false,
          user: currentUser,
          organizationId,
          error: 'Notes feature is not enabled for this organization',
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_FEATURE_DISABLED'
          }
        };
      }
      
      // Feature is enabled, now check user permissions
      let hasNotesAccess = false;
      let permissionError = '';
      
      if (currentUser && organizationId) {
        try {
          // Use application service to check permissions
          const { NotesCompositionRoot } = await import('../../infrastructure/composition/NotesCompositionRoot');
          const compositionRoot = NotesCompositionRoot.getInstance();
          const applicationService = compositionRoot.getNotesApplicationService();
          
          // Try to get notes - this will validate permissions
          await applicationService.getNotes(currentUser.id, organizationId);
          hasNotesAccess = true;
        } catch (error) {
          // If permission validation fails, user doesn't have access
          hasNotesAccess = false;
          permissionError = error instanceof Error ? error.message : 'Permission denied';
          console.log('[NOTES_UNIFIED_CONTEXT] Notes permission denied:', permissionError);
        }
      }
      
      if (!hasNotesAccess) {
        // Transform organizations to match expected interface
        const transformedOrganizations = userOrganizations.map(org => ({
          organization_id: org.organization_id,
          organization_name: org.organization_name,
          role: org.role_name
        }));

        // Create unified context when permissions are insufficient
        const unifiedContext: NotesUnifiedContext = {
          user: currentUser,
          organizationId,
          organizations: transformedOrganizations,
          featureFlags,
          isNotesEnabled: false,
          notes: [], // Empty notes when no access
          fromCache: false
        };

        return {
          isValid: false,
          user: currentUser,
          organizationId,
          error: permissionError.includes('permission') || permissionError.includes('access denied') 
            ? permissionError 
            : 'You do not have permission to access notes',
          unifiedContext,
          securityContext: {
            fromCache: false,
            timestamp: new Date(),
            validationMethod: 'UNIFIED_PERMISSION_DENIED'
          }
        };
      }

      // ✅ CRITICAL: Fetch notes data (already validated permissions above)
      let notes: Note[] = [];
      if (hasNotesAccess && currentUser && organizationId) {
        try {
          // Use application service for notes fetching (permissions already validated)
          const { NotesCompositionRoot } = await import('../../infrastructure/composition/NotesCompositionRoot');
          const compositionRoot = NotesCompositionRoot.getInstance();
          const applicationService = compositionRoot.getNotesApplicationService();
          
          const noteAggregates = await applicationService.getNotes(currentUser.id, organizationId);
          
          // Convert domain aggregates to presentation format
          notes = noteAggregates.map(aggregate => ({
            id: aggregate.id.value,
            user_id: aggregate.userId,
            organization_id: aggregate.organizationId,
            title: aggregate.title,
            content: aggregate.content,
            color_class: aggregate.colorClass,
            position: aggregate.position,
            created_at: aggregate.createdAt.toISOString(),
            updated_at: aggregate.updatedAt?.toISOString() || null
          }));
        } catch (notesError) {
          console.error('[NOTES_UNIFIED_CONTEXT] Notes fetch failed:', notesError);
          // Continue with empty notes rather than failing entire context
          notes = [];
        }
      }

      // ✅ SECURITY FIX: Cache the internal result with organization ID
      // This prevents data leakage between organizations for super admin users
      const cacheKey = `notes-context-${currentUser?.id || 'anonymous'}-${organizationId}`;
      const internalResult: NotesUnifiedContextResult = {
        user: currentUser,
        organizationId,
        organizations: userOrganizations,
        hasNotesAccess,
        featureFlags,
        notes // ✅ CRITICAL: Cache notes data
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
      const unifiedContext: NotesUnifiedContext = {
        user: currentUser,
        organizationId,
        organizations: transformedOrganizations,
        featureFlags,
        isNotesEnabled: hasNotesAccess,
        notes, // ✅ CRITICAL: Include notes data
        fromCache: false
      };

      // Return compatible NotesValidationResult
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
      console.error('[NOTES_UNIFIED_CONTEXT] UNIFIED_VALIDATION_ERROR:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return error state compatible with NotesValidationResult
      return {
        isValid: false,
        user: null, // Error case - no user available
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
  getCachedContext(userId: string, organizationId: string): NotesUnifiedContextResult | null {
    // ✅ FIXED: Include organization ID in cache key
    const cacheKey = `notes-context-${userId}-${organizationId}`;
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
   * Clear cache for specific user and organization
   * ✅ SECURITY: Organization-specific cache invalidation
   */
  clearCache(userId: string, organizationId: string): void {
    // ✅ FIXED: Include organization ID in cache key
    const cacheKey = `notes-context-${userId}-${organizationId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * ✅ SECURITY: Clear cache on organization switch (super admin)
   * This prevents stale organization data in unified context
   */
  clearCacheOnOrganizationSwitch(userId: string, newOrganizationId: string): void {
    // ✅ SECURITY FIX: Clear cache for ALL organizations this user might have cached
    // This is critical for super admin who can access multiple organizations
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`notes-context-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[NOTES_SECURITY] Cache cleared for user ${userId} org switch to ${newOrganizationId}`);
    console.log(`[NOTES_SECURITY] Cleared ${keysToDelete.length} cache entries for all organizations`);
  }

  /**
   * Clear cache on security events (role changes, permission changes)
   * ✅ SECURITY: Clear all organization caches for user on security events
   */
  clearCacheOnSecurityEvent(userId: string, event: 'org-switch' | 'role-change' | 'permission-change'): void {
    // Clear all organization caches for this user
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`notes-context-${userId}-`));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`[NOTES_SECURITY] Cache cleared for user ${userId} on security event: ${event}`);
    console.log(`[NOTES_SECURITY] Cleared ${keysToDelete.length} cache entries across all organizations`);
  }

  /**
   * Clear all cached contexts (admin function)
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * ✅ OPTIMIZATION: Invalidate cache after note mutations
   * Called after create/update/delete operations to ensure fresh data
   */
  invalidateCacheAfterMutation(userId: string, organizationId: string): void {
    this.clearCache(userId, organizationId);
    console.log(`[NOTES_OPTIMIZATION] Cache invalidated after mutation for user ${userId} org ${organizationId}`);
  }
} 