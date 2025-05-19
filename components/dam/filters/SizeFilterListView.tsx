import React from 'react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronLeftIcon } from 'lucide-react';
import type { SIZE_OPTIONS as SizeOptionsType } from './SizeFilter'; // Assuming SIZE_OPTIONS is exported or moved

interface SizeFilterListViewProps {
  selectedOption: string | undefined;
  sizeOptions: typeof SizeOptionsType; // Prop for SIZE_OPTIONS
  onPredefinedOptionSelect: (value: string) => void;
  onNavigateToCustom: () => void;
}

export const SizeFilterListView: React.FC<SizeFilterListViewProps> = ({
  selectedOption,
  sizeOptions,
  onPredefinedOptionSelect,
  onNavigateToCustom,
}) => {
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
          event.preventDefault(); // Prevent dropdown from closing
          onNavigateToCustom();
        }}
        className="text-sm justify-between cursor-pointer"
      >
        Custom range...
        <ChevronLeftIcon className="h-4 w-4 rotate-180 text-muted-foreground" />
      </DropdownMenuItem>
    </DropdownMenuRadioGroup>
  );
}; 