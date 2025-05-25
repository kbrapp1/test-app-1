'use client';

import React from 'react';
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronLeftIcon } from 'lucide-react';
import { DateFilterService } from '../services/DateFilterService';

interface DateOptionsListProps {
  selectedOption: string | undefined;
  onOptionSelect: (value: string) => void;
  onCustomRangeSelect: () => void;
}

/**
 * DateOptionsList Component
 * Follows Single Responsibility Principle - handles predefined date options display
 */
export const DateOptionsList: React.FC<DateOptionsListProps> = ({
  selectedOption,
  onOptionSelect,
  onCustomRangeSelect,
}) => {
  return (
    <DropdownMenuRadioGroup 
      value={selectedOption || ''} 
      onValueChange={onOptionSelect}
      className="p-1"
    >
      {DateFilterService.DATE_OPTIONS.map(option => (
        <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
          {option.label}
        </DropdownMenuRadioItem>
      ))}
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault();
          onCustomRangeSelect();
        }}
        className="text-sm justify-between cursor-pointer"
      >
        Custom date range
        <ChevronLeftIcon className="h-4 w-4 rotate-180 text-muted-foreground" />
      </DropdownMenuItem>
    </DropdownMenuRadioGroup>
  );
}; 
