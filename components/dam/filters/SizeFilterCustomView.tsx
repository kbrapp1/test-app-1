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

export const SizeFilterCustomView: React.FC<SizeFilterCustomViewProps> = ({
  tempMinSizeMB,
  tempMaxSizeMB,
  onTempMinChange,
  onTempMaxChange,
  onApplyCustomSize,
  onClearCustom,
  onBackToList,
}) => {
  return (
    <div className="p-2">
      <Button variant="ghost" size="sm" onClick={onBackToList} className="mb-2 w-full justify-start text-sm h-8">
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back
      </Button>
      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">Min size (MB)</DropdownMenuLabel>
      <Input 
        type="number" 
        placeholder="e.g., 5" 
        value={tempMinSizeMB}
        onChange={(e) => onTempMinChange(e.target.value)}
        className="h-9 mb-2 text-sm"
      />
      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">Max size (MB)</DropdownMenuLabel>
      <Input 
        type="number" 
        placeholder="e.g., 50" 
        value={tempMaxSizeMB}
        onChange={(e) => onTempMaxChange(e.target.value)}
        className="h-9 mb-2 text-sm"
      />
      <DropdownMenuSeparator className="my-2" />
      <div className="flex justify-end gap-2 px-1">
        <Button variant="ghost" size="sm" onClick={onClearCustom} className="text-sm h-8">Clear</Button>
        <Button size="sm" onClick={onApplyCustomSize} className="text-sm h-8">Apply</Button>
      </div>
    </div>
  );
}; 