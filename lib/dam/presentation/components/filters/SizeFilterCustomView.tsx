'use client';

import React from 'react';
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeftIcon } from 'lucide-react';

interface SizeFilterCustomViewProps {
  tempMinSizeMB: string;
  tempMaxSizeMB: string;
  onTempMinChange: (value: string) => void;
  onTempMaxChange: (value: string) => void;
  onApplyCustomSize: () => void;
  onClearCustom: () => void;
  onBackToList: () => void;
}

export function SizeFilterCustomView({
  tempMinSizeMB,
  tempMaxSizeMB,
  onTempMinChange,
  onTempMaxChange,
  onApplyCustomSize,
  onClearCustom,
  onBackToList,
}: SizeFilterCustomViewProps) {
  return (
    <div className="p-2">
      <Button variant="ghost" size="sm" onClick={onBackToList} className="mb-2 w-full justify-start text-sm h-8">
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">
        Minimum size (MB)
      </DropdownMenuLabel>
      <Input
        type="number"
        min="0"
        step="0.1"
        placeholder="Min size"
        value={tempMinSizeMB}
        onChange={(e) => onTempMinChange(e.target.value)}
        className="w-full text-sm h-9 mb-2"
      />

      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">
        Maximum size (MB)
      </DropdownMenuLabel>
      <Input
        type="number"
        min="0"
        step="0.1"
        placeholder="Max size"
        value={tempMaxSizeMB}
        onChange={(e) => onTempMaxChange(e.target.value)}
        className="w-full text-sm h-9 mb-2"
      />
      
      <DropdownMenuSeparator className="my-2" />
      <div className="flex justify-end gap-2 px-1">
        <Button variant="ghost" size="sm" onClick={onClearCustom} className="text-sm h-8">
          Clear
        </Button>
        <Button size="sm" onClick={onApplyCustomSize} className="text-sm h-8">
          Apply
        </Button>
      </div>
    </div>
  );
} 
