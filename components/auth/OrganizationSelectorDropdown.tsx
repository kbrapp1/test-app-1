'use client';

import React from 'react';
import { Check, ChevronDown, Building2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SuperAdminIcon } from './SuperAdminBadge';
import type { Organization } from '@/lib/auth/services/organization-service';
import type { Profile } from '@/lib/auth';

interface OrganizationSelectorDropdownProps {
  profile: Profile;
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAllOrgsMode: boolean;
  isSuperAdmin: boolean;
  isSwitching: boolean;
  size: 'sm' | 'md' | 'lg';
  showName: boolean;
  className?: string;
  onOrganizationSelect: (organizationId: string) => void;
  onAllOrganizationsSelect: () => void;
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2',
  md: 'h-9 text-sm px-3',
  lg: 'h-10 text-base px-4'
};

/**
 * Organization Selector Dropdown - Presentation Component
 * 
 * Single Responsibility: Render the dropdown UI for organization selection
 * Pure presentation component with no business logic
 */
export function OrganizationSelectorDropdown({
  profile,
  organizations,
  currentOrganization,
  isAllOrgsMode,
  isSuperAdmin,
  isSwitching,
  size,
  showName,
  className,
  onOrganizationSelect,
  onAllOrganizationsSelect
}: OrganizationSelectorDropdownProps) {
  const displayText = isAllOrgsMode 
    ? 'All Organizations'
    : currentOrganization?.name || 'Select Organization';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-between font-normal',
            sizeClasses[size],
            className
          )}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            {isSuperAdmin && isAllOrgsMode && (
              <SuperAdminIcon profile={profile} className="h-3 w-3" />
            )}
            {showName && (
              <span className="truncate">{displayText}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organizations
          {isSuperAdmin && (
            <SuperAdminIcon profile={profile} className="h-3 w-3" />
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Super Admin: All Organizations Option */}
        {isSuperAdmin && (
          <>
            <DropdownMenuItem
              onClick={onAllOrganizationsSelect}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>All Organizations</span>
                </div>
                {isAllOrgsMode && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Organization List */}
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => onOrganizationSelect(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{org.name}</span>
              </div>
              {!isAllOrgsMode && currentOrganization?.id === org.id && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {organizations.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No organizations</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 