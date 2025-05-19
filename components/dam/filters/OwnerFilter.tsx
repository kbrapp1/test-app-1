'use client';

import React, { useState } from 'react';
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

interface Member {
  id: string;
  name: string;
}

interface OwnerFilterProps {
  selectedOwnerId: string | undefined;
  onOwnerChange: (ownerId: string | undefined) => void;
  members?: Member[];
}

const DUMMY_MEMBERS: Member[] = [];

const OWNER_OPTIONS = [
  { value: '', label: 'Anyone' },
];

export function OwnerFilter({ selectedOwnerId, onOwnerChange, members = DUMMY_MEMBERS }: OwnerFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValueForGroup = selectedOwnerId === undefined ? '' : selectedOwnerId;
  
  let currentButtonLabel = 'Anyone';
  const staticOption = OWNER_OPTIONS.find(opt => opt.value === selectedValueForGroup);
  if (staticOption) {
    currentButtonLabel = staticOption.label;
  } else if (selectedValueForGroup) {
    const member = members.find(m => m.id === selectedValueForGroup);
    if (member) {
      currentButtonLabel = member.name.length > 25 ? member.name.substring(0, 22) + '...' : member.name;
    } else {
      currentButtonLabel = selectedValueForGroup.substring(0,8) + '...'; 
    }
  }

  const handleValueChange = (value: string) => {
    onOwnerChange(value === '' ? undefined : value);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onOwnerChange(undefined);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center justify-start gap-2 px-3 h-10 ${selectedOwnerId && selectedOwnerId !== '' ? 'rounded-r-none border-r-0' : ''}`}
          >
            <UsersIcon size={16} />
            <span className="truncate">Owner: {currentButtonLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuRadioGroup value={selectedValueForGroup} onValueChange={handleValueChange}>
            {OWNER_OPTIONS.map(option => (
              <DropdownMenuRadioItem key={option.value || 'anyone-key'} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
            { members && members.length > 0 && <DropdownMenuSeparator /> } 
            { members && members.length > 0 && <DropdownMenuLabel>Organization Members</DropdownMenuLabel>} 
            { members && members.map(member => (
              <TooltipProvider key={member.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuRadioItem value={member.id}>
                      <span className="block max-w-[calc(100%-1rem)] overflow-hidden text-ellipsis whitespace-nowrap">
                        {member.name}
                      </span>
                    </DropdownMenuRadioItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start">
                    <p>{member.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))} 
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {(selectedOwnerId && selectedOwnerId !== '') && (
        <Button
          variant="outline"
          className="h-10 w-10 p-0 rounded-l-none -ml-px flex items-center justify-center hover:bg-muted-foreground/10"
          onClick={handleClearFilter}
          aria-label="Clear owner filter"
        >
          <XIcon size={16} className="text-muted-foreground" />
        </Button>
      )}
    </div>
  );
} 