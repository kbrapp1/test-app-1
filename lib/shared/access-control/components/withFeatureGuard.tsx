/**
 * Feature Guard Higher-Order Component
 * 
 * AI INSTRUCTIONS:
 * - Wrap any component with feature access control
 * - Automatically show appropriate guard components
 * - Handle loading states gracefully
 * - Follow fail-secure principles
 * - Support custom guard components
 */

import React from 'react';
import { useFeatureAccess, type UseFeatureAccessOptions } from '../hooks/useFeatureAccess';
import { NoOrganizationAccess } from '@/components/access-guards/NoOrganizationAccess';
import { FeatureNotAvailable } from '@/components/access-guards/FeatureNotAvailable';

interface FeatureGuardConfig extends UseFeatureAccessOptions {
  // Custom guard components
  LoadingComponent?: React.ComponentType;
  NoOrganizationComponent?: React.ComponentType;
  FeatureDisabledComponent?: React.ComponentType<{ feature: string }>;
  
  // Custom props for guards
  featureDisplayName?: string;
}

/**
 * Higher-order component that wraps features with access control
 * 
 * @param config - Feature guard configuration
 * @returns HOC function that wraps components with access control
 */
export function withFeatureGuard<P extends object>(config: FeatureGuardConfig) {
  return function FeatureGuardWrapper(WrappedComponent: React.ComponentType<P>) {
    const GuardedComponent = (props: P) => {
      // AI: Check feature access
      const access = useFeatureAccess({
        featureName: config.featureName,
        requiredRoles: config.requiredRoles,
        requireOrganization: config.requireOrganization
      });
      
      // AI: Handle loading state
      if (access.isLoading) {
        if (config.LoadingComponent) {
          return <config.LoadingComponent />;
        }
        
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full animate-pulse" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        );
      }
      
      // AI: Handle no organization access
      if (access.denialReason === 'no_organization') {
        if (config.NoOrganizationComponent) {
          return <config.NoOrganizationComponent />;
        }
        
        return <NoOrganizationAccess />;
      }
      
      // AI: Handle feature disabled
      if (access.denialReason === 'feature_disabled') {
        if (config.FeatureDisabledComponent) {
          return <config.FeatureDisabledComponent feature={config.featureDisplayName || config.featureName} />;
        }
        
        return <FeatureNotAvailable feature={config.featureDisplayName || config.featureName} />;
      }
      
      // AI: Handle insufficient permissions
      if (access.denialReason === 'insufficient_permissions') {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Insufficient Permissions</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have the required permissions to access {config.featureDisplayName || config.featureName}.
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact your organization administrator to request access.
                </p>
              </div>
            </div>
          </div>
        );
      }
      
      // AI: Access granted - render the wrapped component with organizationId guaranteed to be non-null
      if (access.hasAccess && access.organizationId) {
        return <WrappedComponent {...props} organizationId={access.organizationId} />;
      }
      
      // AI: Fallback - should not reach here in normal cases
      return <NoOrganizationAccess />;
    };
    
    // AI: Set display name for debugging
    GuardedComponent.displayName = `withFeatureGuard(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return GuardedComponent;
  };
}

/**
 * Convenience function for common feature guard patterns
 */
export const createFeatureGuard = (featureName: string, featureDisplayName?: string) => 
  withFeatureGuard({
    featureName,
    featureDisplayName: featureDisplayName || featureName,
    requireOrganization: true
  }); 