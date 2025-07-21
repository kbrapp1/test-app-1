"use client";

/**
 * Organization Context Hook - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Uses shared AuthenticationProvider (eliminates redundant auth calls)
 * - Single validation point for all organization operations
 * - Maintains all existing functionality with performance improvements
 * - Follows @golden-rule patterns exactly
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthentication } from '@/lib/auth';
import { OrganizationContext } from '../../domain/services/OrganizationContextService';
import { OrganizationPermission } from '../../domain/services/PermissionValidationService';
import { OrganizationContextFactory } from '../../infrastructure/composition/OrganizationContextFactory';
import { AuditTrailFactory } from '../../infrastructure/composition/AuditTrailFactory';
import { ClientSideOrganizationCache } from '../../infrastructure/ClientSideOrganizationCache';
import { toast } from 'sonner';

interface UseOrganizationContextResult {
  // Current State
  currentContext: OrganizationContext | null;
  accessibleOrganizations: OrganizationPermission[];
  activeOrganizationId: string | null;
  
  // Loading States
  isLoading: boolean;
  isSwitching: boolean;
  isLoadingOrganizations: boolean;
  
  // Actions
  switchOrganization: (organizationId: string) => Promise<boolean>;
  refreshContext: () => Promise<void>;
  clearContext: () => Promise<void>;
  checkAccess: (organizationId: string) => Promise<boolean>;
  
  // Error State
  error: string | null;
}

export function useOrganizationContext(): UseOrganizationContextResult {
  // Use shared authentication context
  const { user, isAuthenticated, isLoading: authLoading } = useAuthentication();
  
  // Services - memoized to prevent infinite re-renders
  const contextService = useMemo(() => OrganizationContextFactory.createClientSide(), []);
  const auditService = useMemo(() => AuditTrailFactory.createService(), []);
  const organizationCache = useMemo(() => ClientSideOrganizationCache.getInstance(), []);

  // State
  const [currentContext, setCurrentContext] = useState<OrganizationContext | null>(null);
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<OrganizationPermission[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingOrganizations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data when authentication is ready
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAccessibleOrganizations([]);
      setActiveOrganizationId(null);
      setCurrentContext(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use optimized cache for organization context (now with shared auth)
      const organizationResult = await organizationCache.getOrganizationContext(user);
      
      if (organizationResult.isValid) {
        setAccessibleOrganizations(organizationResult.organizations);
        setActiveOrganizationId(organizationResult.activeOrganizationId);
        
        // Get current context separately (this may not be as frequently called)
        try {
          const context = await contextService.getCurrentContext();
          setCurrentContext(context);
        } catch (contextError) {
          // Context is optional, don't fail the entire operation
          console.warn('Failed to load organization context:', contextError);
          setCurrentContext(null);
        }
      } else {
        setAccessibleOrganizations([]);
        setActiveOrganizationId(null);
        setCurrentContext(null);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, organizationCache, contextService]);

  // Switch organization with optimistic updates
  const switchOrganization = useCallback(async (organizationId: string): Promise<boolean> => {
    if (!organizationId?.trim()) {
      setError('Organization ID is required');
      return false;
    }

    try {
      setIsSwitching(true);
      setError(null);

      // Optimistic update
      const targetOrg = accessibleOrganizations.find(org => org.organization_id === organizationId);
      if (targetOrg) {
        setActiveOrganizationId(organizationId);
      }

      // Add timeout wrapper for the switch operation
      const switchWithTimeout = Promise.race([
        contextService.switchOrganization(organizationId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Organization switch timed out after 10 seconds')), 10000)
        )
      ]);

      // Perform the switch with timeout
      await switchWithTimeout;

      // ✅ SECURITY FIX: Clear unified context cache after org switch
      // This prevents stale organization data for super admin users
      try {
        // Clear all unified context caches for this user
        if (typeof window !== 'undefined') {
          // Dispatch custom event to notify unified context services
          window.dispatchEvent(new CustomEvent('organizationSwitched', {
            detail: { 
              userId: user?.id, 
              newOrganizationId: organizationId,
              previousOrganizationId: currentContext?.active_organization_id 
            }
          }));
          
          // ✅ SIMPLE & RELIABLE: Force page refresh after org switch
          // This ensures complete context reset and prevents any cache issues
          // Most enterprise apps do this for organization switches
          setTimeout(() => {
            window.location.reload();
          }, 500); // Small delay to show success toast first
        }
      } catch (cacheError) {
        console.warn('Unified context cache invalidation failed (non-critical):', cacheError);
        // Don't fail the org switch if cache invalidation fails
      }

      // Log the action for audit trail (with timeout)
      try {
        const auditWithTimeout = Promise.race([
          auditService.logAccess('organization_switch', organizationId, {
            previous_organization: currentContext?.active_organization_id,
            target_organization: organizationId,
            switch_method: 'manual'
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Audit logging timed out')), 5000)
          )
        ]);
        
        await auditWithTimeout;
      } catch (auditError) {
        console.warn('Audit logging failed:', auditError);
        // Don't fail the entire operation if audit fails
      }

      // Directly update context instead of calling refreshContext to avoid loops
      try {
        const [newContext, newActiveId] = await Promise.allSettled([
          Promise.race([
            contextService.getCurrentContext(),
            new Promise<OrganizationContext | null>((_, reject) => 
              setTimeout(() => reject(new Error('Get context timed out')), 5000)
            )
          ]),
          Promise.race([
            organizationCache.getActiveOrganizationId(user), // Use cache for active org ID
            new Promise<string | null>((_, reject) => 
              setTimeout(() => reject(new Error('Get active org timed out')), 5000)
            )
          ])
        ]);

        if (newContext.status === 'fulfilled' && newContext.value) {
          setCurrentContext(newContext.value);
        }
        if (newActiveId.status === 'fulfilled' && newActiveId.value) {
          setActiveOrganizationId(newActiveId.value);
        }
      } catch (refreshError) {
        console.warn('Context refresh failed after organization switch:', refreshError);
        // The switch succeeded, so don't fail the operation
      }

      // Show success toast notification
      const organizationName = targetOrg?.organization_name || organizationId;
      toast.success(`Switched to ${organizationName}`, {
        description: 'Organization context updated successfully',
        duration: 3000,
      });

      return true;
    } catch (err: unknown) {
      // Revert optimistic update on error
      setActiveOrganizationId(currentContext?.active_organization_id || null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMessage);
      
      // Show error toast notification
      toast.error('Failed to switch organization', {
        description: errorMessage || 'Please try again or contact support',
        duration: 5000,
      });
      
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [accessibleOrganizations, currentContext, auditService, contextService, organizationCache, user]);

  // Refresh context data
  const refreshContext = useCallback(async () => {
    try {
      setError(null);
      const [newContext, newActiveId] = await Promise.allSettled([
        contextService.getCurrentContext(),
        organizationCache.getActiveOrganizationId(user) // Use cache for active org ID
      ]);

      if (newContext.status === 'fulfilled') {
        setCurrentContext(newContext.value);
      }
      if (newActiveId.status === 'fulfilled') {
        setActiveOrganizationId(newActiveId.value);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh context';
      setError(errorMessage);
    }
  }, [contextService, organizationCache, user]);

  // Clear context
  const clearContext = useCallback(async () => {
    setCurrentContext(null);
    setActiveOrganizationId(null);
    setAccessibleOrganizations([]);
    setError(null);
  }, []);

  // Check access to organization
  const checkAccess = useCallback(async (organizationId: string): Promise<boolean> => {
    try {
      return await organizationCache.hasOrganizationAccess(organizationId, user);
    } catch (err) {
      console.warn('Failed to check organization access:', err);
      return false;
    }
  }, [organizationCache, user]);

  // Load data when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      loadInitialData();
    }
  }, [authLoading, loadInitialData]);

  return {
    currentContext,
    accessibleOrganizations,
    activeOrganizationId,
    isLoading: isLoading || authLoading,
    isSwitching,
    isLoadingOrganizations,
    switchOrganization,
    refreshContext,
    clearContext,
    checkAccess,
    error,
  };
} 