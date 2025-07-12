"use client";

/**
 * Universal Feature Access Hook
 * 
 * AI INSTRUCTIONS:
 * - Shared hook for all features to check access
 * - Handles organization membership, feature flags, and role permissions
 * - Returns clear access state with reasons for denial
 * - Follows fail-secure principles
 */

import { useOrganizationContext } from '@/lib/organization/application/hooks/useOrganizationContext';
import { useFeatureFlag } from '@/lib/organization/presentation/hooks/useFeatureFlag';
import { useUser } from '@/lib/hooks/useUser';
import { UserRole, Permission } from '@/lib/auth';
import { useMemo } from 'react';

export interface FeatureAccessResult {
  // Access status
  hasAccess: boolean;
  isLoading: boolean;
  
  // Organization context
  organizationId: string | null;
  hasOrganization: boolean;
  
  // Feature flag status
  isFeatureEnabled: boolean;
  
  // Denial reasons (for debugging/UI)
  denialReason?: 'no_organization' | 'feature_disabled' | 'insufficient_permissions';
}

export interface UseFeatureAccessOptions {
  featureName: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireOrganization?: boolean;
}

/**
 * Universal hook for checking feature access
 * 
 * @param options - Feature access configuration
 * @returns Access result with detailed status
 */
export function useFeatureAccess({
  featureName,
  requiredRoles = [],
  requiredPermissions = [],
  requireOrganization = true
}: UseFeatureAccessOptions): FeatureAccessResult {
  // AI: Get organization context
  const { activeOrganizationId, isLoading: isLoadingOrg } = useOrganizationContext();
  
  // AI: Get user authentication and role information
  const { isLoading: isLoadingUser, hasAnyRole, hasAnyPermission } = useUser();
  
  // AI: Check feature flag
  const isFeatureEnabled = useFeatureFlag(featureName);
  
  // AI: Calculate access status
  const accessResult = useMemo((): FeatureAccessResult => {
    // AI: Handle loading state
    if (isLoadingOrg || isLoadingUser) {
      return {
        hasAccess: false,
        isLoading: true,
        organizationId: null,
        hasOrganization: false,
        isFeatureEnabled: false
      };
    }
    
    // AI: Check organization requirement
    if (requireOrganization && !activeOrganizationId) {
      return {
        hasAccess: false,
        isLoading: false,
        organizationId: null,
        hasOrganization: false,
        isFeatureEnabled,
        denialReason: 'no_organization'
      };
    }
    
    // AI: Check feature flag
    if (!isFeatureEnabled) {
      return {
        hasAccess: false,
        isLoading: false,
        organizationId: activeOrganizationId,
        hasOrganization: !!activeOrganizationId,
        isFeatureEnabled: false,
        denialReason: 'feature_disabled'
      };
    }
    
    // AI: Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRole = hasAnyRole(requiredRoles);
      if (!hasRequiredRole) {
        return {
          hasAccess: false,
          isLoading: false,
          organizationId: activeOrganizationId,
          hasOrganization: !!activeOrganizationId,
          isFeatureEnabled,
          denialReason: 'insufficient_permissions'
        };
      }
    }
    
    // AI: Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = hasAnyPermission(requiredPermissions);
      if (!hasRequiredPermissions) {
        return {
          hasAccess: false,
          isLoading: false,
          organizationId: activeOrganizationId,
          hasOrganization: !!activeOrganizationId,
          isFeatureEnabled,
          denialReason: 'insufficient_permissions'
        };
      }
    }
    
    // AI: All checks passed
    return {
      hasAccess: true,
      isLoading: false,
      organizationId: activeOrganizationId,
      hasOrganization: !!activeOrganizationId,
      isFeatureEnabled: true
    };
  }, [activeOrganizationId, isLoadingOrg, isLoadingUser, isFeatureEnabled, requireOrganization, requiredRoles, requiredPermissions, hasAnyRole, hasAnyPermission]);
  
  return accessResult;
} 