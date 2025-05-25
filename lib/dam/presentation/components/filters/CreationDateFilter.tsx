'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, XIcon } from 'lucide-react';
import { useDateFilter } from './hooks/useDateFilter';
import { DateOptionsList } from './components/DateOptionsList';
import { CustomDateRangePicker } from './components/CustomDateRangePicker';

/**
 * CreationDateFilter - Domain-Driven Date Filter Component
 * 
 * This component demonstrates proper DDD presentation patterns:
 * - Clean interface with domain-specific props
 * - Handles complex date filtering logic with predefined ranges
 * - Custom date range picker with validation
 * - Proper state management and user interaction patterns
 * - Type-safe date handling with business rules
 */

interface CreationDateFilterProps {
  selectedOption: string | undefined;
  onOptionChange: (option: string | undefined, startDate?: string, endDate?: string) => void;
  selectedStartDate?: string | undefined;
  selectedEndDate?: string | undefined;
}

export function CreationDateFilter({
  selectedOption,
  onOptionChange,
  selectedStartDate,
  selectedEndDate,
}: CreationDateFilterProps) {
  // Use domain hook for state management and business logic
  const {
    isOpen,
    pickerMode,
    tempStartDate,
    tempEndDate,
    isStartDatePopoverOpen,
    isEndDatePopoverOpen,
    buttonLabel,
    setIsOpen,
    setTempStartDate,
    setTempEndDate,
    setIsStartDatePopoverOpen,
    setIsEndDatePopoverOpen,
    handlePredefinedOptionSelect,
    handleCustomRangeMenuItemSelect,
    handleApplyCustomDate,
    handleClearFilter,
    handleBackToList,
  } = useDateFilter({
    selectedOption,
    selectedStartDate,
    selectedEndDate,
    onOptionChange,
  });

  return (
    <div className="flex items-center group">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center justify-start gap-2 px-3 h-10 ${selectedOption && selectedOption !== '' ? 'rounded-r-none border-r-0' : ''} group-focus-within:border-primary focus-visible:ring-0 focus-visible:ring-offset-0`}
          >
            <CalendarDaysIcon size={16} />
            Date: {buttonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-0" align="start" onInteractOutside={(e) => {
            if (isStartDatePopoverOpen || isEndDatePopoverOpen) {
                e.preventDefault();
            }
        }}>
          {pickerMode === 'list' ? (
            <DateOptionsList
              selectedOption={selectedOption}
              onOptionSelect={handlePredefinedOptionSelect}
              onCustomRangeSelect={handleCustomRangeMenuItemSelect}
            />
          ) : (
            <CustomDateRangePicker
              tempStartDate={tempStartDate}
              tempEndDate={tempEndDate}
              isStartDatePopoverOpen={isStartDatePopoverOpen}
              isEndDatePopoverOpen={isEndDatePopoverOpen}
              onStartDateChange={setTempStartDate}
              onEndDateChange={setTempEndDate}
              onStartDatePopoverChange={setIsStartDatePopoverOpen}
              onEndDatePopoverChange={setIsEndDatePopoverOpen}
              onBackToList={handleBackToList}
              onClear={handleClearFilter}
              onApply={handleApplyCustomDate}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {(selectedOption && selectedOption !== '') && (
        <Button
          variant="outline"
          className="h-10 w-10 p-0 rounded-l-none -ml-px flex items-center justify-center hover:bg-muted-foreground/10 group-focus-within:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={handleClearFilter}
          aria-label="Clear date filter"
        >
          <XIcon size={16} className="text-muted-foreground group-focus-within:text-primary" />
        </Button>
      )}
    </div>
  );
} 
