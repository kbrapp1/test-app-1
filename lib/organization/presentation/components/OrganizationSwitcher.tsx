// Presentation Component: Organization Switcher
// Single Responsibility: UI for switching between organizations
// DDD: Presentation layer that uses application hooks

'use client';

import React, { useState } from 'react';
import { ChevronDown, Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useOrganization, useOrganizationOptions } from '../../application/providers/OrganizationProvider';

interface OrganizationSwitcherProps {
  showRole?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function OrganizationSwitcher({
  showRole = true,
  variant = 'outline',
  size = 'default',
  className = ''
}: OrganizationSwitcherProps) {
  const { 
    switchOrganization, 
    getCurrentOrganizationName, 
    isSwitching,
    error 
  } = useOrganization();
  
  const { options, isLoading } = useOrganizationOptions();
  const [isOpen, setIsOpen] = useState(false);

  const currentOrgName = getCurrentOrganizationName() || 'No Organization';
  const activeOption = options.find(opt => opt.isActive);

  const handleSwitchOrganization = async (organizationId: string) => {
    setIsOpen(false);
    await switchOrganization(organizationId);
  };

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className="justify-between w-full max-w-full"
            disabled={isSwitching || isLoading}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full">
                  {currentOrgName}
                </span>
                {showRole && activeOption && (
                  <span className="text-xs text-muted-foreground capitalize truncate w-full">
                    {activeOption.role}
                  </span>
                )}
              </div>
            </div>
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]" align="start">
          <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading organizations...
            </DropdownMenuItem>
          ) : options.length === 0 ? (
            <DropdownMenuItem disabled>
              No organizations available
            </DropdownMenuItem>
          ) : (
            options.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSwitchOrganization(option.id)}
                disabled={isSwitching}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{option.name}</span>
                    {showRole && (
                      <span className="text-xs text-muted-foreground capitalize truncate">
                        {option.role}
                      </span>
                    )}
                  </div>
                  {option.isActive && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
          
          {error && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-destructive text-xs">
                Error: {error}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Organization Display Component (read-only)
interface OrganizationDisplayProps {
  showRole?: boolean;
  className?: string;
}

export function OrganizationDisplay({ 
  showRole = true, 
  className = '' 
}: OrganizationDisplayProps) {
  const { getCurrentOrganizationName } = useOrganization();
  const { options } = useOrganizationOptions();
  
  const currentOrgName = getCurrentOrganizationName() || 'No Organization';
  const activeOption = options.find(opt => opt.isActive);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{currentOrgName}</span>
        {showRole && activeOption && (
          <span className="text-xs text-muted-foreground capitalize">
            {activeOption.role}
          </span>
        )}
      </div>
    </div>
  );
}

// Organization Guard Component
interface OrganizationGuardProps {
  requiredOrganization?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function OrganizationGuard({ 
  requiredOrganization, 
  fallback = <div>Access denied</div>, 
  children 
}: OrganizationGuardProps) {
  const { hasAccessToOrganization, activeOrganizationId, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // If specific organization required, check access
  if (requiredOrganization) {
    if (!hasAccessToOrganization(requiredOrganization)) {
      return <>{fallback}</>;
    }
  }

  // If no specific org required but user has no active org
  if (!requiredOrganization && !activeOrganizationId) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 