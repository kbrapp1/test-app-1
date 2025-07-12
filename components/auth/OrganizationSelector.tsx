'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationSelector } from '@/lib/auth';
import { OrganizationSelectorDropdown } from './OrganizationSelectorDropdown';
import type { Profile } from '@/lib/auth';

/**
 * Organization Selector Component - Interface Layer
 * 
 * Single Responsibility: Orchestrate organization selection UI
 * 
 * Features:
 * - Display current organization for regular users
 * - Show "All Organizations" option for super admins
 * - Organization switching functionality
 * - Loading and error states
 * - Accessible design
 */

interface OrganizationSelectorProps {
  /** User profile containing super admin status */
  profile: Profile | null;
  
  /** Current active organization ID */
  activeOrganizationId: string | null;
  
  /** Size variant for the selector */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom className */
  className?: string;
  
  /** Whether to show the organization name or just icon */
  showName?: boolean;

  /** Callback when organization changes */
  onOrganizationChange?: (organizationId: string | null) => void;
}

/**
 * OrganizationSelector allows users to switch between organizations
 * Super admins get an additional "All Organizations" option
 */
export function OrganizationSelector({
  profile,
  activeOrganizationId,
  size = 'md',
  className,
  showName = true,
  onOrganizationChange
}: OrganizationSelectorProps) {
  const {
    organizations,
    currentOrganization,
    isLoading,
    isSwitching,
    isAllOrgsMode,
    isSuperAdmin,
    switchToOrganization,
    switchToAllOrganizations
  } = useOrganizationSelector(profile, activeOrganizationId, onOrganizationChange);

  // Size classes for responsive design
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-4'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className={`rounded-md ${sizeClasses[size]}`} />
      </div>
    );
  }

  // No organizations or profile
  if (!profile || organizations.length === 0) {
    return null;
  }

  return (
    <OrganizationSelectorDropdown
      profile={profile}
      organizations={organizations}
      currentOrganization={currentOrganization}
      isAllOrgsMode={isAllOrgsMode}
      isSuperAdmin={isSuperAdmin}
      isSwitching={isSwitching}
      size={size}
      showName={showName}
      className={className}
      onOrganizationSelect={switchToOrganization}
      onAllOrganizationsSelect={switchToAllOrganizations}
    />
  );
} 