/**
 * Organization Provider Component
 * 
 * AI INSTRUCTIONS:
 * - All hooks must be called unconditionally at the top level
 * - Use error boundaries for error handling, not try-catch around hooks
 * - Follow single responsibility principle for component logic
 * - Maintain proper React component lifecycle patterns
 * - Handle loading and error states explicitly
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useOrganizationContext } from '../hooks/useOrganizationContext';
import { type OrganizationPermission } from '../../domain/services/PermissionValidationService';

type UseOrganizationContextResult = ReturnType<typeof useOrganizationContext>;

interface OrganizationContextType extends UseOrganizationContextResult {
  // Helper methods
  hasAccessToOrganization: (organizationId: string) => boolean;
  getOrganizationName: (organizationId: string) => string | null;
  getCurrentOrganizationName: () => string | null;
  isCurrentOrganization: (organizationId: string) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function OrganizationProvider({ children, fallback }: OrganizationProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // AI: Always call hooks unconditionally at the top level
  const hookResult = useOrganizationContext();
  
  // Ensure component is mounted before rendering context
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render context until mounted
  if (!mounted) {
    return <>{fallback || null}</>;
  }

  // Handle error states from the hook
  if (hookResult.error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            {hookResult.error === 'Session expired' ? 'Session expired - please refresh' : 'Loading organization data...'}
          </div>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }
  
  // Helper methods that use the hook data
  const hasAccessToOrganization = (organizationId: string): boolean => {
    return hookResult?.accessibleOrganizations?.some(
      org => org.organization_id === organizationId
    ) || false;
  };

  const getOrganizationName = (organizationId: string): string | null => {
    const org = hookResult?.accessibleOrganizations?.find(
      org => org.organization_id === organizationId
    );
    return org?.organization_name || null;
  };

  const getCurrentOrganizationName = (): string | null => {
    if (!hookResult?.activeOrganizationId) return null;
    return getOrganizationName(hookResult.activeOrganizationId);
  };

  const isCurrentOrganization = (organizationId: string): boolean => {
    return hookResult?.activeOrganizationId === organizationId;
  };

  const contextValue: OrganizationContextType = {
    ...hookResult,
    hasAccessToOrganization,
    getOrganizationName,
    getCurrentOrganizationName,
    isCurrentOrganization,
  };

  // Show fallback while loading initial data
  if (hookResult.isLoading && fallback) {
    return <>{fallback}</>;
  }

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Hook to use the organization context
export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider. ' +
      'Make sure to wrap your component tree with <OrganizationProvider>.'
    );
  }
  
  return context;
}

// High-order component for organization access control
interface WithOrganizationAccessProps {
  organizationId?: string;
  requiredAccess?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function WithOrganizationAccess({ 
  organizationId, 
  requiredAccess = true, 
  fallback = null, 
  children 
}: WithOrganizationAccessProps) {
  const { hasAccessToOrganization, activeOrganizationId, isLoading } = useOrganization();
  
  // If loading, show nothing or fallback
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  // If no specific org required, check if user has any organization access
  if (!organizationId) {
    return <>{children}</>;
  }
  
  // SECURITY: Validate organization context - user must be operating within the target organization
  // This prevents privilege escalation across organizations
  if (requiredAccess && activeOrganizationId !== organizationId) {
    return <>{fallback}</>;
  }
  
  // Additional check: Ensure user has access to the organization
  const hasAccess = hasAccessToOrganization(organizationId);
  
  if (requiredAccess && !hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Organization selector component helper
interface OrganizationOption {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

export function useOrganizationOptions(): {
  options: OrganizationOption[];
  isLoading: boolean;
  error: string | null;
} {
  const { accessibleOrganizations, activeOrganizationId, isLoadingOrganizations, error } = useOrganization();
  
  const options: OrganizationOption[] = accessibleOrganizations.map((org: OrganizationPermission) => ({
    id: org.organization_id,
    name: org.organization_name,
    role: org.role_name,
    isActive: org.organization_id === activeOrganizationId,
  }));
  
  return {
    options,
    isLoading: isLoadingOrganizations,
    error,
  };
}

// Audit trail integration hook
export function useOrganizationAudit() {
  const { currentContext } = useOrganization();
  
  // This could be expanded to include audit-specific functionality
  return {
    currentOrganizationId: currentContext?.active_organization_id || null,
    lastAccessed: currentContext?.last_accessed_at || null,
  };
}

// Type exports for external use
export type { 
  OrganizationContextType, 
  OrganizationOption
}; 