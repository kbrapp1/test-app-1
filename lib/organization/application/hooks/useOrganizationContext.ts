"use client";

// Application Hook: Organization Context Integration
// Single Responsibility: React state integration for organization context
// DDD: Application layer that coordinates domain services with UI state

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { OrganizationContextService, type OrganizationContext } from '../../domain/services/OrganizationContextService';
import { PermissionValidationService, type OrganizationPermission } from '../../domain/services/PermissionValidationService';
import { AuditTrailService } from '../../domain/services/AuditTrailService';

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
  // Services
  const contextService = useMemo(() => new OrganizationContextService(), []);
  const permissionService = useMemo(() => new PermissionValidationService(), []);
  const auditService = useMemo(() => new AuditTrailService(), []);

  // State
  const [currentContext, setCurrentContext] = useState<OrganizationContext | null>(null);
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<OrganizationPermission[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingOrganizations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [context, organizations, activeOrgId] = await Promise.allSettled([
        contextService.getCurrentContext(),
        permissionService.getUserAccessibleOrganizations(),
        permissionService.getActiveOrganizationId()
      ]);

      // Handle context result
      if (context.status === 'fulfilled') {
        setCurrentContext(context.value);
      }

      // Handle organizations result
      if (organizations.status === 'fulfilled') {
        setAccessibleOrganizations(organizations.value);
      } else {
        setAccessibleOrganizations([]);
      }

      // Handle active org ID result
      if (activeOrgId.status === 'fulfilled') {
        setActiveOrganizationId(activeOrgId.value);
      } else {
        setActiveOrganizationId(null);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  }, [contextService, permissionService]);

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
            permissionService.getActiveOrganizationId(),
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
        // The switch succeeded, so don't fail the operation
      }

      // Show success toast notification
      const organizationName = targetOrg?.organization_name || organizationId;
      toast.success(`Switched to ${organizationName}`, {
        description: 'Organization context updated successfully',
        duration: 3000,
      });

      return true;
    } catch (err: any) {
      // Revert optimistic update on error
      setActiveOrganizationId(currentContext?.active_organization_id || null);
      setError(err.message || 'Failed to switch organization');
      
      // Show error toast notification
      toast.error('Failed to switch organization', {
        description: err.message || 'Please try again or contact support',
        duration: 5000,
      });
      
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [accessibleOrganizations, currentContext, auditService, contextService, permissionService]);

  // Refresh context data
  const refreshContext = useCallback(async () => {
    try {
      setError(null);
      const [newContext, newActiveId] = await Promise.allSettled([
        contextService.getCurrentContext(),
        permissionService.getActiveOrganizationId()
      ]);

      if (newContext.status === 'fulfilled') {
        setCurrentContext(newContext.value);
      }

      if (newActiveId.status === 'fulfilled') {
        setActiveOrganizationId(newActiveId.value);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to refresh context');
    }
  }, [contextService, permissionService]);

  // Clear context
  const clearContext = useCallback(async () => {
    try {
      setError(null);
      await contextService.clearContext();
      
      // Update state
      setCurrentContext(null);
      setActiveOrganizationId(null);
      
      // Log the action
      await auditService.logAccess('context_clear', null, {
        action_type: 'manual_clear'
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to clear context');
    }
  }, [contextService, auditService]);

  // Check access to specific organization
  const checkAccess = useCallback(async (organizationId: string): Promise<boolean> => {
    try {
      return await permissionService.hasOrganizationAccess(organizationId);
    } catch (err: any) {
      return false;
    }
  }, [permissionService]);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Current State
    currentContext,
    accessibleOrganizations,
    activeOrganizationId,
    
    // Loading States
    isLoading,
    isSwitching,
    isLoadingOrganizations,
    
    // Actions
    switchOrganization,
    refreshContext,
    clearContext,
    checkAccess,
    
    // Error State
    error,
  };
} 