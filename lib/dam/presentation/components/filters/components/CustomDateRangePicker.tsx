'use client';

import React, { useCallback } from 'react';
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeftIcon } from 'lucide-react';
import { DateFilterService } from '../services/DateFilterService';

interface CustomDateRangePickerProps {
  tempStartDate: Date | undefined;
  tempEndDate: Date | undefined;
  isStartDatePopoverOpen: boolean;
  isEndDatePopoverOpen: boolean;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStartDatePopoverChange: (open: boolean) => void;
  onEndDatePopoverChange: (open: boolean) => void;
  onBackToList: () => void;
  onClear: () => void;
  onApply: () => void;
}

/**
 * CustomDateRangePicker Component
 * Follows Single Responsibility Principle - handles custom date range picker UI
 */
export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  tempStartDate,
  tempEndDate,
  isStartDatePopoverOpen,
  isEndDatePopoverOpen,
  onStartDateChange,
  onEndDateChange,
  onStartDatePopoverChange,
  onEndDatePopoverChange,
  onBackToList,
  onClear,
  onApply,
}) => {
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      onStartDateChange(date);
      onStartDatePopoverChange(false);
    }
  }, [onStartDateChange, onStartDatePopoverChange]);

  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      onEndDateChange(date);
      onEndDatePopoverChange(false);
    }
  }, [onEndDateChange, onEndDatePopoverChange]);

  return (
    <div className="p-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBackToList} 
        className="mb-2 w-full justify-start text-sm h-8"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Back
      </Button>
      
      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">
        Start date
      </DropdownMenuLabel>
      <Popover open={isStartDatePopoverOpen} onOpenChange={onStartDatePopoverChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-9 mb-2">
            {tempStartDate ? DateFilterService.formatDateForDisplay(tempStartDate) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={tempStartDate}
            onSelect={handleStartDateSelect}
            disabled={(date) => tempEndDate ? date > tempEndDate : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">
        End date
      </DropdownMenuLabel>
      <Popover open={isEndDatePopoverOpen} onOpenChange={onEndDatePopoverChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-9 mb-2">
            {tempEndDate ? DateFilterService.formatDateForDisplay(tempEndDate) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={tempEndDate}
            onSelect={handleEndDateSelect}
            disabled={(date) => tempStartDate ? date < tempStartDate : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <DropdownMenuSeparator className="my-2" />
      
      <div className="flex justify-end gap-2 px-1">
        <Button variant="ghost" size="sm" onClick={onClear} className="text-sm h-8">
          Clear
        </Button>
        <Button size="sm" onClick={onApply} className="text-sm h-8">
          Apply
        </Button>
      </div>
    </div>
  );
}; 
