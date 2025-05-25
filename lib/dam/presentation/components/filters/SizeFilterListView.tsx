'use client';

import React from 'react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronLeftIcon } from 'lucide-react';

interface SizeFilterListViewProps {
  selectedOption: string | undefined;
  sizeOptions: Array<{ value: string; label: string }>;
  onPredefinedOptionSelect: (value: string) => void;
  onNavigateToCustom: () => void;
}

export function SizeFilterListView({
  selectedOption,
  sizeOptions,
  onPredefinedOptionSelect,
  onNavigateToCustom,
}: SizeFilterListViewProps) {
  return (
    <DropdownMenuRadioGroup 
      value={selectedOption || ''} 
      onValueChange={onPredefinedOptionSelect}
      className="p-1"
    >
      {sizeOptions.map(option => (
        <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
          {option.label}
        </DropdownMenuRadioItem>
      ))}
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault();
          onNavigateToCustom();
        }}
        className="text-sm justify-between cursor-pointer"
      >
        Custom size range
        <ChevronLeftIcon className="h-4 w-4 rotate-180 text-muted-foreground" />
      </DropdownMenuItem>
    </DropdownMenuRadioGroup>
  );
} 
