'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FilterIcon, XIcon } from 'lucide-react';

interface TypeFilterProps {
  selectedType: string | undefined;
  onTypeChange: (type: string | undefined) => void;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Any Type' },
  { value: 'folder', label: 'Folders' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
  { value: 'audio', label: 'Audio' },
  { value: 'archive', label: 'Archives' },
];

export function TypeFilter({ selectedType, onTypeChange }: TypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValueForGroup = selectedType === undefined ? '' : selectedType;
  const currentLabel = TYPE_OPTIONS.find(opt => opt.value === selectedValueForGroup)?.label || 'Any Type';

  const handleValueChange = (value: string) => {
    onTypeChange(value === '' ? undefined : value);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onTypeChange(undefined);
    setIsOpen(false); // Ensure dropdown is closed if it was somehow open
  };

  return (
    <div className="flex items-center"> {/* Removed gap-0.5 */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center justify-start gap-2 px-3 h-10 ${selectedType && selectedType !== '' ? 'rounded-r-none border-r-0' : ''}`}
          >
            <FilterIcon size={16} />
            Type: {currentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuRadioGroup value={selectedValueForGroup} onValueChange={handleValueChange}>
            {TYPE_OPTIONS.map(option => (
              <DropdownMenuRadioItem key={option.label} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {(selectedType && selectedType !== '') && (
        <Button
          variant="outline"
          className="h-10 w-10 p-0 rounded-l-none -ml-px flex items-center justify-center hover:bg-muted-foreground/10"
          onClick={handleClearFilter}
          aria-label="Clear type filter"
        >
          <XIcon size={16} className="text-muted-foreground" />
        </Button>
      )}
    </div>
  );
} 