'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UsersIcon, XIcon } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useTeamMembers } from '@/lib/auth/providers/TeamMembersProvider';

interface OwnerFilterProps {
  selectedOwnerId: string | undefined;
  onOwnerChange: (ownerId: string | undefined) => void;
}

/**
 * OwnerFilter - Domain-Focused Asset Owner Filtering Component
 * 
 * Single Responsibility: Asset ownership filtering within organization context
 * Now uses centralized TeamMembersProvider to eliminate redundant API calls
 * Follows DDD principles with clean separation of concerns
 */
export const OwnerFilter: React.FC<OwnerFilterProps> = ({
  selectedOwnerId,
  onOwnerChange,
}) => {
  const { members, isLoading: loading } = useTeamMembers();

  const selectedMember = members.find(member => member.id === selectedOwnerId);
  const hasSelection = !!selectedOwnerId;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-8 ${hasSelection ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
              >
                <UsersIcon className="h-4 w-4 mr-1" />
                {hasSelection ? (
                  <span className="max-w-[100px] truncate">
                    {selectedMember?.name || 'Unknown User'}
                  </span>
                ) : (
                  'Owner'
                )}
                {hasSelection && (
                  <XIcon 
                    className="h-3 w-3 ml-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOwnerChange(undefined);
                    }}
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Filter by Owner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup 
                value={selectedOwnerId || ''} 
                onValueChange={(value) => onOwnerChange(value || undefined)}
              >
                <DropdownMenuRadioItem value="">All Owners</DropdownMenuRadioItem>
                {loading ? (
                  <DropdownMenuRadioItem value="" disabled>
                    Loading members...
                  </DropdownMenuRadioItem>
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <DropdownMenuRadioItem key={member.id} value={member.id}>
                      <span className="truncate">{member.name}</span>
                    </DropdownMenuRadioItem>
                  ))
                ) : (
                  <DropdownMenuRadioItem value="" disabled>
                    No members found
                  </DropdownMenuRadioItem>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Filter assets by owner</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 
